<?php
require_once "../../database.php";
header("Content-Type: application/json; charset=utf-8");

try {

$data = json_decode(file_get_contents("php://input"), true) ?? [];

/* ==============================
   FILTER
============================== */

$region_id       = $data["region_id"] ?? "";
$province_id     = $data["province_id"] ?? "";
$branch_id       = $data["branch_id"] ?? "";
$booking_type_id = $data["booking_type_id"] ?? "";
$range           = $data["range"] ?? "";
$start           = $data["start"] ?? "";
$end             = $data["end"] ?? "";

/* ==============================
   JOIN (BOOKING BASE)
============================== */

$join = "
JOIN branches b ON bk.branch_id = b.branch_id
JOIN provinces p ON b.province_id = p.province_id
JOIN region r ON p.region_id = r.region_id
";

/* ==============================
   WHERE (BOOKING BASE)
============================== */

$where = [];
$params = [];
$types = "";

if ($region_id !== "") {
    $where[] = "r.region_id = ?";
    $params[] = (int)$region_id;
    $types .= "i";
}

if ($province_id !== "") {
    $where[] = "p.province_id = ?";
    $params[] = (int)$province_id;
    $types .= "i";
}

if ($branch_id !== "") {
    $where[] = "bk.branch_id = ?";
    $params[] = $branch_id;
    $types .= "s";
}

/* DATE */

if ($range === "7days")
    $where[] = "bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
elseif ($range === "30days")
    $where[] = "bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
elseif ($range === "1year")
    $where[] = "bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
elseif ($range === "custom" && $start && $end) {
    $where[] = "DATE(bk.pickup_time) BETWEEN ? AND ?";
    $params[] = $start;
    $params[] = $end;
    $types .= "ss";
}

$whereSQL = count($where) ? "WHERE " . implode(" AND ", $where) : "";

/* ==============================
   HELPER
============================== */

function runQuery($conn, $sql, $types, $params) {
    $stmt = $conn->prepare($sql);
    if ($types) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

/* ==============================
   KPI
============================== */

$sqlTotal = "SELECT COUNT(*) total_bookings FROM bookings bk $join $whereSQL";

$sqlRevenue = "
SELECT COALESCE(SUM(bk.net_amount),0) total_revenue
FROM bookings bk
$join
$whereSQL
" . ($whereSQL ? " AND" : " WHERE") . " bk.booking_status_id = 5";

$sqlAvg = "
SELECT COALESCE(SUM(bk.net_amount),0) / NULLIF(COUNT(*),0) revenue_per_booking
FROM bookings bk
$join
$whereSQL
" . ($whereSQL ? " AND" : " WHERE") . " bk.booking_status_id = 5";

$sqlCancel = "
SELECT 
(SUM(CASE WHEN bk.booking_status_id = 6 THEN 1 ELSE 0 END) * 100.0 
 / NULLIF(SUM(CASE WHEN bk.booking_status_id IN (5,6) THEN 1 ELSE 0 END),0)) 
AS cancellation_rate
FROM bookings bk
$join
$whereSQL
";

$total  = runQuery($conn, $sqlTotal, $types, $params);
$rev    = runQuery($conn, $sqlRevenue, $types, $params);
$avg    = runQuery($conn, $sqlAvg, $types, $params);
$cancel = runQuery($conn, $sqlCancel, $types, $params);

/* ==============================
   TREND
============================== */

$sqlTrend = "
SELECT 
DATE(bk.pickup_time) d,
COUNT(*) bookings,
COALESCE(SUM(bk.net_amount),0) revenue
FROM bookings bk
$join
$whereSQL
" . ($whereSQL ? " AND" : " WHERE") . " bk.booking_status_id = 5
GROUP BY d
ORDER BY d
";

$stmtTrend = $conn->prepare($sqlTrend);
if ($types) $stmtTrend->bind_param($types, ...$params);
$stmtTrend->execute();
$resTrend = $stmtTrend->get_result();

$labels=[]; 
$bookings=[]; 
$revenue=[];

while($row=$resTrend->fetch_assoc()){
    $labels[]   = $row["d"];
    $bookings[] = (int)$row["bookings"];
    $revenue[]  = (float)$row["revenue"];
}

/* ==============================
   CHANNEL
============================== */

$sqlChannel = "
SELECT bt.name_th, SUM(bk.net_amount) revenue
FROM bookings bk
JOIN booking_types bt ON bk.booking_type_id = bt.id
$join
$whereSQL
" . ($whereSQL ? " AND" : " WHERE") . " bk.booking_status_id = 5
GROUP BY bt.name_th
";

$stmtC = $conn->prepare($sqlChannel);
if ($types) $stmtC->bind_param($types, ...$params);
$stmtC->execute();

$channelLabels=[]; 
$channelData=[];

$resC = $stmtC->get_result();
while($row=$resC->fetch_assoc()){
    $channelLabels[] = $row["name_th"];
    $channelData[]   = (float)$row["revenue"];
}

/* ==============================
   BOOKING RATIO
============================== */

$sqlRatio = "
SELECT 
CASE 
    WHEN bk.booking_status_id = 5 THEN 'สำเร็จ'
    WHEN bk.booking_status_id = 6 THEN 'ยกเลิก'
END AS status,
COUNT(*) total
FROM bookings bk
$join
$whereSQL
" . ($whereSQL ? " AND" : " WHERE") . " bk.booking_status_id IN (5,6)
GROUP BY bk.booking_status_id
";

$stmtR = $conn->prepare($sqlRatio);
if ($types) $stmtR->bind_param($types, ...$params);
$stmtR->execute();

$ratioLabels=[]; 
$ratioData=[];

$resR = $stmtR->get_result();
while($row=$resR->fetch_assoc()){
    $ratioLabels[] = $row["status"];
    $ratioData[]   = (int)$row["total"];
}

/* ==============================
   ALL BRANCHES (สำคัญสุด)
============================== */

$joinBranch = "
LEFT JOIN provinces p ON b.province_id = p.province_id
LEFT JOIN region r ON p.region_id = r.region_id
";

$whereBranch = [];
$paramsBranch = [];
$typesBranch = "";

/* FILTER LOCATION */

if ($region_id !== "") {
    $whereBranch[] = "r.region_id = ?";
    $paramsBranch[] = (int)$region_id;
    $typesBranch .= "i";
}

if ($province_id !== "") {
    $whereBranch[] = "p.province_id = ?";
    $paramsBranch[] = (int)$province_id;
    $typesBranch .= "i";
}

if ($branch_id !== "") {
    $whereBranch[] = "b.branch_id = ?";
    $paramsBranch[] = $branch_id;
    $typesBranch .= "s";
}

/* ==============================
   BASE SQL
============================== */

$sqlBranch = "
SELECT 
    b.name,
    COUNT(bk.booking_id) AS total
FROM branches b
LEFT JOIN bookings bk 
    ON bk.branch_id = b.branch_id
    AND bk.booking_status_id = 5
";

/* ==============================
   👉 ADD DATE FILTER IN JOIN (สำคัญมาก)
============================== */

if ($range === "7days") {
    $sqlBranch .= " AND bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
}
elseif ($range === "30days") {
    $sqlBranch .= " AND bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
}
elseif ($range === "1year") {
    $sqlBranch .= " AND bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
}
elseif ($range === "custom" && $start && $end) {
    $sqlBranch .= " AND DATE(bk.pickup_time) BETWEEN ? AND ?";
    $paramsBranch[] = $start;
    $paramsBranch[] = $end;
    $typesBranch .= "ss";
}

/* ==============================
   JOIN + WHERE
============================== */

$whereSQLBranch = count($whereBranch) ? "WHERE " . implode(" AND ", $whereBranch) : "";

$sqlBranch .= "
$joinBranch
$whereSQLBranch
GROUP BY b.branch_id
ORDER BY total DESC
";

/* ==============================
   EXECUTE
============================== */

$stmtBranch = $conn->prepare($sqlBranch);
if ($typesBranch) $stmtBranch->bind_param($typesBranch, ...$paramsBranch);
$stmtBranch->execute();

$resBranch = $stmtBranch->get_result();

$branchLabels=[]; 
$branchData=[];

while($row=$resBranch->fetch_assoc()){
    $branchLabels[] = $row["name"];
    $branchData[]   = (int)$row["total"];
}
/* ==============================
   RESPONSE
============================== */

echo json_encode([
    "kpi"=>[
        "total_bookings"=>(int)$total["total_bookings"],
        "total_revenue"=>(float)$rev["total_revenue"],
        "revenue_per_booking"=>(float)$avg["revenue_per_booking"],
        "cancellation_rate"=>(float)$cancel["cancellation_rate"]
    ],
    "trend"=>[
        "labels"=>$labels,
        "bookings"=>$bookings,
        "revenue"=>$revenue
    ],
    "channel"=>[
        "labels"=>$channelLabels,
        "data"=>$channelData
    ],
    "booking_ratio"=>[
        "labels"=>$ratioLabels,
        "data"=>$ratioData
    ],
    "branches"=>[
        "labels"=>$branchLabels,
        "data"=>$branchData
    ]
]);

} catch (Throwable $e) {

echo json_encode([
    "error" => true,
    "message" => $e->getMessage()
]);

}