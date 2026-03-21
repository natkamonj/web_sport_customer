<?php
session_start();
header('Content-Type: application/json');

error_reporting(0);
ini_set('display_errors', 0);

require_once '../../database.php';


/* ==============================
   1. AUTH CHECK
============================== */
if (!isset($_SESSION["staff_id"])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$branchIdRaw = $_SESSION["branch_id"] ?? '';
$branchId = $conn->real_escape_string($branchIdRaw);


/* ==============================
   2. GET FILTERS
============================== */
$range       = $_GET['range'] ?? 'all';
$bookingType = $_GET['booking_type'] ?? '';
$userType    = $_GET['user_type'] ?? '';
$facultyId   = $_GET['faculty_id'] ?? '';
$year        = $_GET['year'] ?? '';
$genderId    = $_GET['gender_id'] ?? '';
$startDate   = $_GET['start_date'] ?? '';
$endDate     = $_GET['end_date'] ?? '';


/* ==============================
   3. BUILD WHERE (BOOKING)
============================== */
$whereBooking = [
    "b.branch_id = '$branchId'",
    "b.booking_status_id != 6"
];

/* ----- BOOKING TYPE ----- */
if ($bookingType === 'online') {
    $whereBooking[] = "b.booking_type_id = 1";
}
elseif ($bookingType === 'walkin') {
    $whereBooking[] = "b.booking_type_id = 2";
}

/* ----- DATE RANGE ----- */
if ($range === '7days') {
    $whereBooking[] = "b.pickup_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
}
elseif ($range === '30days') {
    $whereBooking[] = "b.pickup_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
}
elseif ($range === '1year') {
    $whereBooking[] = "b.pickup_time >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
}
elseif ($range === 'custom' && $startDate && $endDate) {
    $s = $conn->real_escape_string($startDate);
    $e = $conn->real_escape_string($endDate);
    $whereBooking[] = "DATE(b.pickup_time) BETWEEN '$s' AND '$e'";
}


/* ==============================
   4. BUILD WHERE (CUSTOMER)
============================== */
$whereCustomer = [];

/* ----- USER TYPE ----- */
if ($userType !== '') {

    if ($userType === 'student') {
        $whereCustomer[] = "c.customer_type = 'student'";
        $whereCustomer[] = "c.branch_id = b.branch_id";
    }
    elseif ($userType === 'general') {
        $whereCustomer[] = "c.customer_type = 'general'";
        $whereCustomer[] = "c.branch_id = b.branch_id";
    }
    elseif ($userType === 'external') {
        $whereCustomer[] = "(c.branch_id != b.branch_id OR c.branch_id IS NULL)";
    }
}

/* ----- FACULTY ----- */
if ($facultyId !== '') {
    $whereCustomer[] = "c.faculty_id = " . intval($facultyId);
    $whereCustomer[] = "c.branch_id = '$branchId'";
    $whereCustomer[] = "c.customer_type = 'student'";
}

/* ----- YEAR ----- */
if ($year !== '') {
    $whereCustomer[] = "c.study_year = " . intval($year);
    $whereCustomer[] = "c.branch_id = '$branchId'";
    $whereCustomer[] = "c.customer_type = 'student'";
}

/* ----- GENDER ----- */
if ($genderId !== '') {
    $whereCustomer[] = "c.gender_id = " . intval($genderId);
}


/* ==============================
   5. COMBINE WHERE
============================== */
$combinedWhere = array_merge($whereBooking, $whereCustomer);
$whereJoinSql = "WHERE " . implode(" AND ", $combinedWhere);


/* ==============================
   6. KPI
============================== */
$allUsersRes = $conn->query("
    SELECT 
        COUNT(DISTINCT b.customer_id) AS total_all,
        COUNT(DISTINCT CASE WHEN c.customer_type = 'student' AND c.branch_id = b.branch_id THEN b.customer_id END) AS total_std,
        COUNT(DISTINCT CASE WHEN c.customer_type = 'general' AND c.branch_id = b.branch_id THEN b.customer_id END) AS total_gen,
        COUNT(DISTINCT CASE 
            WHEN (c.branch_id != b.branch_id OR c.branch_id IS NULL) 
            THEN b.customer_id 
        END) AS total_out
    FROM bookings b
    JOIN customers c ON b.customer_id = c.customer_id
    $whereJoinSql
")->fetch_assoc();

/* ----- KPI CALC ----- */
$totalAll = (int)($allUsersRes['total_all'] ?? 0);

$stdPct = $totalAll > 0 ? ($allUsersRes['total_std'] / $totalAll) * 100 : 0;
$genPct = $totalAll > 0 ? ($allUsersRes['total_gen'] / $totalAll) * 100 : 0;
$outPct = $totalAll > 0 ? ($allUsersRes['total_out'] / $totalAll) * 100 : 0;


/* ==============================
   7. TOTAL BOOKINGS
============================== */
$totalBookingsRes = $conn->query("
    SELECT COUNT(b.booking_id) AS total 
    FROM bookings b 
    JOIN customers c ON b.customer_id = c.customer_id 
    $whereJoinSql
")->fetch_assoc();


/* ==============================
   8. CHARTS
============================== */

/* ----- TREND ----- */
$trendLabels = [];
$trendData = [];

$trendRes = $conn->query("
    SELECT DATE_FORMAT(b.pickup_time,'%Y-%m') AS m, COUNT(DISTINCT b.customer_id) AS total_users 
    FROM bookings b 
    JOIN customers c ON b.customer_id = c.customer_id 
    $whereJoinSql 
    GROUP BY m 
    ORDER BY m
");

while ($r = $trendRes->fetch_assoc()) {
    $trendLabels[] = $r['m'];
    $trendData[]   = (int)$r['total_users'];
}


/* ----- TOP FACULTY ----- */
$topFacLabels = [];
$topFacData   = [];

if ($userType !== 'general' && $userType !== 'external') {

    $topFacRes = $conn->query("
        SELECT f.name, COUNT(DISTINCT b.customer_id) AS total 
        FROM faculty f 
        JOIN customers c ON f.id = c.faculty_id 
        JOIN bookings b ON c.customer_id = b.customer_id 
        $whereJoinSql 
        AND c.customer_type = 'student' 
        AND c.branch_id = '$branchId' 
        GROUP BY f.id 
        ORDER BY total DESC 
        LIMIT 5
    ");

    while ($r = $topFacRes->fetch_assoc()) {
        $topFacLabels[] = $r['name'];
        $topFacData[]   = (int)$r['total'];
    }
}


/* ----- GENDER ----- */
$genLabels = [];
$genData   = [];

$genRes = $conn->query("
    SELECT g.name_th, COUNT(DISTINCT b.customer_id) AS total_people 
    FROM bookings b
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN genders g ON c.gender_id = g.gender_id
    $whereJoinSql
    GROUP BY g.gender_id
    ORDER BY g.gender_id ASC
");

while ($r = $genRes->fetch_assoc()) {
    $genLabels[] = $r['name_th'];
    $genData[]   = (int)$r['total_people'];
}


/* ----- YEAR ----- */
$yearLabels = [];
$yearData   = [];

if ($userType !== 'general' && $userType !== 'external') {

    $yRes = $conn->query("
        SELECT c.study_year, COUNT(DISTINCT b.customer_id) AS total_users
        FROM customers c
        JOIN bookings b ON c.customer_id = b.customer_id
        $whereJoinSql
        AND c.customer_type = 'student' 
        AND c.branch_id = '$branchId'  
        AND c.study_year BETWEEN 1 AND 6
        GROUP BY c.study_year 
        ORDER BY c.study_year
    ");

    while ($r = $yRes->fetch_assoc()) {
        $yearLabels[] = "ปี " . $r['study_year'];
        $yearData[]   = (int)$r['total_users'];
    }
}


/* ==============================
   9. FILTER OPTIONS
============================== */
$facultyFilter = [];
$fRes = $conn->query("SELECT id, name FROM faculty ORDER BY name");
while ($r = $fRes->fetch_assoc()) {
    $facultyFilter[] = $r;
}

$genderFilter = [];
$gRes = $conn->query("SELECT gender_id AS id, name_th AS name FROM genders");
while ($r = $gRes->fetch_assoc()) {
    $genderFilter[] = $r;
}


/* ==============================
   10. RESPONSE
============================== */
echo json_encode([
    "success" => true,

    "kpi" => [
        "total_users"   => $totalAll,
        "student_pct"   => round($stdPct, 1),
        "general_pct"   => round($genPct, 1),
        "external_pct"  => round($outPct, 1)
    ],

    "charts" => [
        "trend"       => ["labels" => $trendLabels, "data" => $trendData],
        "top_faculty" => ["labels" => $topFacLabels, "data" => $topFacData],
        "gender"      => ["labels" => $genLabels, "data" => $genData],
        "year"        => ["labels" => $yearLabels, "data" => $yearData]
    ],

    "faculty" => $facultyFilter,
    "year"    => [1, 2, 3, 4, 5, 6],
    "gender"  => $genderFilter
]);