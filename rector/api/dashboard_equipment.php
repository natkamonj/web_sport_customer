<?php
session_start();
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../../database.php';


/* ==============================
   1. AUTH CHECK
============================== */
if (!isset($_SESSION["staff_id"])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$branchId = $conn->real_escape_string($_SESSION["branch_id"] ?? '');


/* ==============================
   2. GET FILTERS
============================== */
$range       = $_GET['range'] ?? 'all';
$bookingType = $_GET['booking_type'] ?? '';
$userType    = $_GET['user_type'] ?? '';
$facultyId   = $_GET['faculty'] ?? '';
$year        = $_GET['year'] ?? '';
$categoryId  = $_GET['category'] ?? '';
$startDate   = $_GET['start_date'] ?? '';
$endDate     = $_GET['endDate'] ?? '';


/* ==============================
   3. BUILD WHERE
============================== */
$whereClauses = [
    "b.branch_id = '$branchId'"
];

/* ----- BOOKING TYPE ----- */
if ($bookingType !== '') {
    $whereClauses[] = "b.booking_type_id = " . intval($bookingType);
}

/* ----- USER TYPE ----- */
if ($userType !== '') {

    if ($userType === 'student') {
        $whereClauses[] = "c.customer_type = 'student'";
        $whereClauses[] = "c.branch_id = b.branch_id";
    }
    elseif ($userType === 'general') {
        $whereClauses[] = "c.customer_type = 'general'";
        $whereClauses[] = "c.branch_id = b.branch_id";
    }
    elseif ($userType === 'external') {
        $whereClauses[] = "(c.branch_id != b.branch_id OR c.branch_id IS NULL)";
    }
}

/* ----- FACULTY ----- */
if ($facultyId !== '') {
    $whereClauses[] = "c.faculty_id = " . intval($facultyId);
    $whereClauses[] = "c.customer_type = 'student'";
    $whereClauses[] = "c.branch_id = '$branchId'";
}

/* ----- YEAR ----- */
if ($year !== '') {
    $whereClauses[] = "c.study_year = " . intval($year);
    $whereClauses[] = "c.customer_type = 'student'";
    $whereClauses[] = "c.branch_id = '$branchId'";
}

/* ----- DATE RANGE (ต่อท้ายเหมือนเดิม) ----- */
if ($range === '7days') {
    $whereClauses[] = "b.pickup_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
}
elseif ($range === '30days') {
    $whereClauses[] = "b.pickup_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
}
elseif ($range === '1year') {
    $whereClauses[] = "b.pickup_time >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
}
elseif ($range === 'custom' && $startDate && $endDate) {
    $whereClauses[] = "DATE(b.pickup_time) BETWEEN '" 
        . $conn->real_escape_string($startDate) . "' AND '" 
        . $conn->real_escape_string($endDate) . "'";
}

$whereSql = "WHERE " . implode(" AND ", $whereClauses);


/* ==============================
   4. CATEGORY CONDITION
============================== */
$categoryCondition = "";
if ($categoryId !== '') {
    $cat = intval($categoryId);
    $categoryCondition = " AND (e.category_id = $cat OR v.category_id = $cat)";
}


/* ==============================
   5. KPI - TOTAL ASSETS
============================== */
$totalEqRes = $conn->query("
    SELECT COUNT(ei.instance_code) as total 
    FROM equipment_instances ei
    JOIN equipment_master em ON ei.equipment_id = em.equipment_id
    WHERE ei.branch_id = '$branchId'
    " . ($categoryId !== '' ? " AND em.category_id = " . intval($categoryId) : "")
);

$totalEq = ($totalEqRes) ? $totalEqRes->fetch_assoc()['total'] : 0;

$totalVnRes = $conn->query("
    SELECT COUNT(*) as total 
    FROM venues v 
    WHERE v.branch_id = '$branchId'
    " . ($categoryId !== '' ? " AND v.category_id = " . intval($categoryId) : "")
);

$totalVn = ($totalVnRes) ? $totalVnRes->fetch_assoc()['total'] : 0;


/* ==============================
   6. KPI - UTILIZATION
============================== */
$utilRes = $conn->query("
    SELECT 
        COUNT(DISTINCT bd.equipment_id) as used_eq,
        COUNT(DISTINCT bd.venue_id) as used_vn
    FROM booking_details bd
    JOIN bookings b ON bd.booking_id = b.booking_id
    JOIN customers c ON b.customer_id = c.customer_id
    LEFT JOIN equipment_master e ON bd.equipment_id = e.equipment_id
    LEFT JOIN venues v ON bd.venue_id = v.venue_id
    $whereSql
    $categoryCondition
")->fetch_assoc();

$eqUtilRate = ($totalEq > 0) ? ($utilRes['used_eq'] / $totalEq) * 100 : 0;
$vnUtilRate = ($totalVn > 0) ? ($utilRes['used_vn'] / $totalVn) * 100 : 0;


/* ==============================
   7. TOP EQUIPMENT
============================== */
$topEqLabels = [];
$topEqData   = [];

$topEqRes = $conn->query("
    SELECT e.name, COUNT(bd.detail_id) as usage_count
    FROM booking_details bd
    JOIN bookings b ON bd.booking_id = b.booking_id
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN equipment_master e ON bd.equipment_id = e.equipment_id 
    LEFT JOIN venues v ON bd.venue_id = v.venue_id
    $whereSql
    $categoryCondition
    AND bd.equipment_id IS NOT NULL
    GROUP BY e.equipment_id 
    ORDER BY usage_count DESC 
    LIMIT 5
");

while ($r = $topEqRes->fetch_assoc()) {
    $topEqLabels[] = $r['name'];
    $topEqData[]   = (int)$r['usage_count'];
}


/* ==============================
   8. TOP VENUE
============================== */
$topVnLabels = [];
$topVnData   = [];

$topVnRes = $conn->query("
    SELECT v.name, COUNT(bd.detail_id) as usage_count
    FROM booking_details bd
    JOIN bookings b ON bd.booking_id = b.booking_id
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN venues v ON bd.venue_id = v.venue_id 
    LEFT JOIN equipment_master e ON bd.equipment_id = e.equipment_id 
    $whereSql
    $categoryCondition
    AND bd.venue_id IS NOT NULL
    GROUP BY v.venue_id 
    ORDER BY usage_count DESC 
    LIMIT 5
");

while ($r = $topVnRes->fetch_assoc()) {
    $topVnLabels[] = $r['name'];
    $topVnData[]   = (int)$r['usage_count'];
}


/* ==============================
   9. CATEGORY BY FACULTY
============================== */
$faculties = [];
$facRes = $conn->query("SELECT id, name FROM faculty ORDER BY name ASC");
while ($f = $facRes->fetch_assoc()) {
    $faculties[$f['id']] = $f['name'];
}

$catFacLabels = array_values($faculties);
$facIdToIndex = array_flip(array_keys($faculties));

$categories = [];
$catWhere = ($categoryId !== '') ? " WHERE category_id = " . intval($categoryId) : "";
$catRes = $conn->query("SELECT category_id, name FROM categories $catWhere ORDER BY name ASC");
while ($c = $catRes->fetch_assoc()) {
    $categories[$c['category_id']] = $c['name'];
}

/* ----- INIT MAP ----- */
$catMap = [];
foreach ($categories as $catId => $catName) {
    $catMap[$catName] = array_fill(0, count($catFacLabels), 0);
}

/* ----- QUERY DATA ----- */
$catDataRes = $conn->query("
    SELECT 
        c.faculty_id, 
        cat.name as cat_name, 
        COUNT(bd.detail_id) as count
    FROM bookings b
    JOIN booking_details bd ON b.booking_id = bd.booking_id
    JOIN customers c ON b.customer_id = c.customer_id
    AND c.customer_type = 'student'
    AND c.branch_id = b.branch_id
    LEFT JOIN equipment_master e ON bd.equipment_id = e.equipment_id
    LEFT JOIN venues v ON bd.venue_id = v.venue_id
    JOIN categories cat ON (COALESCE(e.category_id, v.category_id) = cat.category_id)
    $whereSql
    $categoryCondition
    GROUP BY c.faculty_id, cat.category_id
");

if ($catDataRes) {
    while ($d = $catDataRes->fetch_assoc()) {
        $cName = $d['cat_name'];
        $fId   = $d['faculty_id'];
        $count = (int)$d['count'];

        if (isset($facIdToIndex[$fId]) && isset($catMap[$cName])) {
            $catMap[$cName][$facIdToIndex[$fId]] = $count;
        }
    }
}

/* ----- FORMAT DATASET ----- */
$datasets = [];
foreach ($catMap as $catName => $dataValues) {
    $datasets[] = [
        "label" => $catName,
        "data"  => $dataValues
    ];
}


/* ==============================
   10. RESPONSE
============================== */
if (ob_get_length()) ob_clean();

echo json_encode([
    "success" => true,

    "branch_info" => [
        "id"   => $branchId,
        "name" => $_SESSION["branch_name"] ?? "Unknown"
    ],

    "kpi" => [
        "total_equipment"     => (int)$totalEq,
        "equipment_util_rate" => round($eqUtilRate, 2),
        "total_venue"         => (int)$totalVn,
        "venue_util_rate"     => round($vnUtilRate, 2)
    ],

    "top_equipment" => [
        "labels" => $topEqLabels,
        "data"   => $topEqData
    ],

    "top_venue" => [
        "labels" => $topVnLabels,
        "data"   => $topVnData
    ],

    "category_faculty" => [
        "labels"   => $catFacLabels,
        "datasets" => $datasets
    ]
]);