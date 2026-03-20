<?php
require_once "../../database.php";
header("Content-Type: application/json; charset=utf-8");

try {

$data = json_decode(file_get_contents("php://input"), true) ?? [];

$region_id   = $data["region_id"] ?? "";
$province_id = $data["province_id"] ?? "";
$branch_id   = $data["branch_id"] ?? "";
$range       = $data["range"] ?? "";
$start       = $data["start"] ?? "";
$end         = $data["end"] ?? "";

/* ==============================
   FILTER
============================== */

$where = [];

if ($region_id)   $where[] = "r.region_id = '$region_id'";
if ($province_id) $where[] = "p.province_id = '$province_id'";
if ($branch_id)   $where[] = "bk.branch_id = '$branch_id'";

/* DATE */

$dataeCondition = "";

if ($range === "7days")
    $where[] = "bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
elseif ($range === "30days")
    $where[] = "bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
elseif ($range === "1year")
    $where[] = "bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
elseif ($range === "custom" && $start && $end)
    $where[] = "DATE(bk.pickup_time) BETWEEN '$start' AND '$end'";

$whereSQL = $where ? "WHERE " . implode(" AND ", $where) : "";

/* ==============================
   JOIN
============================== */

$join = "
JOIN branches b ON bk.branch_id = b.branch_id
JOIN provinces p ON b.province_id = p.province_id
JOIN region r ON p.region_id = r.region_id
";

/* ==============================
   KPI (แยก query ชัด)
============================== */

// 🔹 total
$sqlTotal = "SELECT COUNT(*) total FROM bookings bk $join $whereSQL";
$total = $conn->query($sqlTotal)->fetch_assoc();

// 🔹 revenue (เฉพาะสำเร็จ)
$sqlRevenue = "
SELECT COALESCE(SUM(bk.net_amount),0) total_revenue
FROM bookings bk
$join
$whereSQL
" . ($whereSQL ? " AND" : " WHERE") . " bk.booking_status_id = 5
";
$rev = $conn->query($sqlRevenue)->fetch_assoc();

// 🔹 success count
$sqlSuccess = "
SELECT COUNT(*) total_success
FROM bookings bk
$join
$whereSQL
" . ($whereSQL ? " AND" : " WHERE") . " bk.booking_status_id = 5
";
$success = $conn->query($sqlSuccess)->fetch_assoc();

// 🔹 cancel count
$sqlCancel = "
SELECT COUNT(*) total_cancel
FROM bookings bk
$join
$whereSQL
" . ($whereSQL ? " AND" : " WHERE") . " bk.booking_status_id = 6
";
$cancel = $conn->query($sqlCancel)->fetch_assoc();

// 🔹 avg revenue (ถูกต้อง)
$avg_revenue = ($success["total_success"] > 0)
    ? $rev["total_revenue"] / $success["total_success"]
    : 0;

// 🔹 cancel rate (เฉพาะที่จบแล้ว)
$total_done = $success["total_success"] + $cancel["total_cancel"];
$cancel_rate = ($total_done > 0)
    ? ($cancel["total_cancel"] * 100.0 / $total_done)
    : 0;

/* ==============================
   TREND FINANCE
============================== */

$sqlFinance = "
SELECT 
DATE(bk.pickup_time) d,

COALESCE(SUM(CASE 
    WHEN bk.booking_status_id = 5 THEN bk.net_amount 
    ELSE 0 END),0) revenue,

COALESCE(SUM(
    CASE 
        WHEN bia.return_condition_id > 1 THEN bd.price_at_booking
        ELSE 0
    END
),0) expense

FROM bookings bk
LEFT JOIN booking_details bd 
    ON bd.booking_id = bk.booking_id 
    AND bd.item_type = 'Equipment'
LEFT JOIN booking_item_assignments bia 
    ON bd.detail_id = bia.detail_id

$join
$whereSQL

GROUP BY d
ORDER BY d
";

$resF = $conn->query($sqlFinance);

$financeLabels=[]; 
$financeRevenue=[]; 
$financeExpense=[]; 
$financeProfit=[];

while($row=$resF->fetch_assoc()){
    $revv = (float)$row["revenue"];
    $exp  = (float)$row["expense"];

    $financeLabels[]  = $row["d"];
    $financeRevenue[] = $revv;
    $financeExpense[] = $exp;
    $financeProfit[]  = $revv - $exp;
}

/* ==============================
   BOOKING TREND
============================== */

$sqlBooking = "
SELECT DATE(bk.pickup_time) d, COUNT(*) total
FROM bookings bk
$join
$whereSQL
GROUP BY d
ORDER BY d
";

$resB = $conn->query($sqlBooking);

$bookingLabels=[]; 
$bookingData=[];

while($row=$resB->fetch_assoc()){
    $bookingLabels[] = $row["d"];
    $bookingData[]   = (int)$row["total"];
}

/* ==============================
   CHANNEL
============================== */

$whereChannel = $whereSQL ? $whereSQL . " AND bk.booking_status_id = 5"
                         : "WHERE bk.booking_status_id = 5";

$sqlChannel = "
SELECT bt.name_th, SUM(bk.net_amount) revenue
FROM bookings bk
JOIN booking_types bt ON bk.booking_type_id = bt.id
$join
$whereChannel
GROUP BY bt.name_th
";

$resC = $conn->query($sqlChannel);

$channelLabels=[]; 
$channelData=[];

while($row=$resC->fetch_assoc()){
    $channelLabels[] = $row["name_th"];
    $channelData[]   = (float)$row["revenue"];
}

/* ==============================
   STATUS
============================== */

$sqlRatio = "
SELECT 
CASE 
    WHEN bk.booking_status_id = 5 THEN 'สำเร็จ'
    WHEN bk.booking_status_id = 6 THEN 'ยกเลิก'
    ELSE 'รอดำเนินการ'
END AS status,
COUNT(*) total
FROM bookings bk
$join
$whereSQL
GROUP BY status
";

$resR = $conn->query($sqlRatio);

$ratioLabels=[]; 
$ratioData=[];

while($row=$resR->fetch_assoc()){
    $ratioLabels[] = $row["status"];
    $ratioData[]   = (int)$row["total"];
}

/* ==============================
   BRANCH
============================== */

/* ==============================
   BRANCH
============================== */

// 🔹 filter location
$whereBranch = [];

if ($region_id)   $whereBranch[] = "r.region_id = '$region_id'";
if ($province_id) $whereBranch[] = "p.province_id = '$province_id'";
if ($branch_id)   $whereBranch[] = "b.branch_id = '$branch_id'";

$whereBranchSQL = $whereBranch ? "WHERE " . implode(" AND ", $whereBranch) : "";


// 🔹 date condition (ต้องอยู่ใน JOIN เท่านั้น!)
$dateCondition = "";

if ($range === "7days") {
    $dateCondition = "AND bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
}
elseif ($range === "30days") {
    $dateCondition = "AND bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
}
elseif ($range === "1year") {
    $dateCondition = "AND bk.pickup_time >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
}
elseif ($range === "custom" && $start && $end) {
    $dateCondition = "AND DATE(bk.pickup_time) BETWEEN '$start' AND '$end'";
}


// 🔹 SQL (แสดงทุกสาขาแม้ไม่มีรายได้)
$sqlBranch = "
SELECT 
    b.name,
    COALESCE(SUM(bk.net_amount),0) AS total

FROM branches b

LEFT JOIN bookings bk 
    ON bk.branch_id = b.branch_id
    AND bk.booking_status_id = 5
    $dateCondition

LEFT JOIN provinces p ON b.province_id = p.province_id
LEFT JOIN region r ON p.region_id = r.region_id

$whereBranchSQL

GROUP BY b.branch_id, b.name
ORDER BY total DESC
";


// 🔹 execute + กัน error
$resBranch = $conn->query($sqlBranch);

if(!$resBranch){
    throw new Exception("Branch Query Error: " . $conn->error);
}


// 🔹 map data ไปใช้ใน chart
$branchLabels = [];
$branchData   = [];

while($row = $resBranch->fetch_assoc()){
    $branchLabels[] = $row["name"];
    $branchData[]   = (float)$row["total"];
}
/* ==============================
   RESPONSE
============================== */

echo json_encode([
    "kpi"=>[
        "total_bookings" => (int)$total["total"],
        "total_revenue"  => (float)$rev["total_revenue"],
        "revenue_per_booking" => round($avg_revenue,2),
        "cancellation_rate"   => round($cancel_rate,2)
    ],

    "trend_finance"=>[
        "labels"=>$financeLabels,
        "revenue"=>$financeRevenue,
        "expense"=>$financeExpense,
        "profit"=>$financeProfit
    ],

    "trend_booking"=>[
        "labels"=>$bookingLabels,
        "data"=>$bookingData
    ],

    "trend_revenue"=>[
        "labels"=>$financeLabels,
        "data"=>$financeRevenue
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
    "error"=>true,
    "message"=>$e->getMessage()
]);

}