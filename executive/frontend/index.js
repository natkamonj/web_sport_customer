var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var bookingTrendChart;
var revenueTrendChart;
var channelChart;
var bookingRatioChart;
var branchChart;
/* ==============================
   INIT
============================== */
document.addEventListener("DOMContentLoaded", function () {
    initCharts();
    loadRegions();
    loadProvinces();
    loadBranches();
    bindFilters();
    loadAll();
});
/* ==============================
   FILTER EVENTS
============================== */
function bindFilters() {
    var _a;
    var ids = [
        "rangeSelect",
        "regionSelect",
        "provinceSelect",
        "branchSelect",
        "startDate",
        "endDate"
    ];
    ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el)
            return;
        el.addEventListener("change", function () {
            if (id === "rangeSelect")
                toggleCustomDate();
            loadAll();
        });
    });
    (_a = document.getElementById("resetFilter")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", resetFilter);
}
/* ==============================
   FILTER LOGIC
============================== */
function getFilter() {
    var _a, _b, _c, _d, _e, _f;
    return {
        range: ((_a = document.getElementById("rangeSelect")) === null || _a === void 0 ? void 0 : _a.value) || "",
        start: ((_b = document.getElementById("startDate")) === null || _b === void 0 ? void 0 : _b.value) || "",
        end: ((_c = document.getElementById("endDate")) === null || _c === void 0 ? void 0 : _c.value) || "",
        region_id: ((_d = document.getElementById("regionSelect")) === null || _d === void 0 ? void 0 : _d.value) || "",
        province_id: ((_e = document.getElementById("provinceSelect")) === null || _e === void 0 ? void 0 : _e.value) || "",
        branch_id: ((_f = document.getElementById("branchSelect")) === null || _f === void 0 ? void 0 : _f.value) || ""
    };
}
function toggleCustomDate() {
    var range = document.getElementById("rangeSelect").value;
    var box = document.getElementById("customDateBox");
    box.style.display = range === "custom" ? "block" : "none";
}
function resetFilter() {
    document.getElementById("rangeSelect").value = "30days";
    document.getElementById("regionSelect").value = "";
    document.getElementById("provinceSelect").value = "";
    document.getElementById("branchSelect").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    loadAll();
}
/* ==============================
   LOAD DASHBOARD
============================== */
function loadAll() {
    fetch("/sports_rental_system/executive/api/dashboard_summary.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getFilter())
    })
        .then(function (res) { return res.json(); })
        .then(function (result) {
        updateKPI(result.kpi);
        updateBookingTrend(result.trend);
        updateRevenueTrend(result.trend);
        updateChannel(result.channel);
        // ✅ FIX: ต้องเรียกอันนี้
        updateBookingRatio(result.booking_ratio);
        updateBranches(result.branches);
    })
        .catch(function (err) { return console.error("โหลด Dashboard ไม่สำเร็จ", err); });
}
/* ==============================
   KPI
============================== */
function updateKPI(kpi) {
    var _a, _b, _c, _d;
    document.getElementById("kpiBookings").textContent =
        Number((_a = kpi === null || kpi === void 0 ? void 0 : kpi.total_bookings) !== null && _a !== void 0 ? _a : 0).toLocaleString() + " ครั้ง";
    document.getElementById("kpiRevenue").textContent =
        Number((_b = kpi === null || kpi === void 0 ? void 0 : kpi.total_revenue) !== null && _b !== void 0 ? _b : 0).toLocaleString() + " บาท";
    document.getElementById("kpiAvg").textContent =
        Number((_c = kpi === null || kpi === void 0 ? void 0 : kpi.revenue_per_booking) !== null && _c !== void 0 ? _c : 0)
            .toLocaleString(undefined, { maximumFractionDigits: 2 }) + " บาท/ครั้ง";
    document.getElementById("kpiCancel").textContent =
        Number((_d = kpi === null || kpi === void 0 ? void 0 : kpi.cancellation_rate) !== null && _d !== void 0 ? _d : 0).toFixed(2) + " %";
}
/* ==============================
   UPDATE CHARTS
============================== */
function updateBookingTrend(data) {
    bookingTrendChart.data.labels = (data === null || data === void 0 ? void 0 : data.labels) || [];
    bookingTrendChart.data.datasets[0].data = (data === null || data === void 0 ? void 0 : data.bookings) || [];
    bookingTrendChart.update();
}
function updateRevenueTrend(data) {
    revenueTrendChart.data.labels = (data === null || data === void 0 ? void 0 : data.labels) || [];
    revenueTrendChart.data.datasets[0].data = (data === null || data === void 0 ? void 0 : data.revenue) || [];
    revenueTrendChart.update();
}
function updateChannel(data) {
    channelChart.data.labels = (data === null || data === void 0 ? void 0 : data.labels) || [];
    channelChart.data.datasets[0].data = (data === null || data === void 0 ? void 0 : data.data) || [];
    channelChart.update();
}
// ✅ FIX หลักอยู่ตรงนี้
function updateBookingRatio(data) {
    var labels = (data === null || data === void 0 ? void 0 : data.labels) || [];
    var values = (data === null || data === void 0 ? void 0 : data.data) || [];
    // 🎨 สีตาม label
    var colors = labels.map(function (label) {
        if (label === "สำเร็จ")
            return "#22c55e";
        if (label === "ยกเลิก")
            return "#ef4444";
        return "#9ca3af";
    });
    bookingRatioChart.data.labels = labels;
    bookingRatioChart.data.datasets[0].data = values;
    bookingRatioChart.data.datasets[0].backgroundColor = colors;
    bookingRatioChart.update();
}
function updateBranches(data) {
    branchChart.data.labels = (data === null || data === void 0 ? void 0 : data.labels) || [];
    branchChart.data.datasets[0].data = (data === null || data === void 0 ? void 0 : data.data) || [];
    branchChart.update();
}
/* ==============================
   DROPDOWNS
============================== */
function loadRegions() {
    fetch("/sports_rental_system/executive/api/get_regions.php")
        .then(function (res) { return res.json(); })
        .then(function (res) {
        var data = res.data || []; // ✅ FIX
        var select = document.getElementById("regionSelect");
        select.innerHTML = "<option value=\"\">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>";
        data.forEach(function (r) {
            select.innerHTML += "<option value=\"".concat(r.region_id, "\">").concat(r.region_name, "</option>");
        });
    });
}
function loadProvinces() {
    var _a;
    var regionId = ((_a = document.getElementById("regionSelect")) === null || _a === void 0 ? void 0 : _a.value) || "";
    fetch("/sports_rental_system/executive/api/get_provinces.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region_id: regionId }) // ✅ ส่งค่า
    })
        .then(function (res) { return res.json(); })
        .then(function (res) {
        var data = res.data || []; // ✅ FIX
        var select = document.getElementById("provinceSelect");
        select.innerHTML = "<option value=\"\">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>";
        data.forEach(function (p) {
            select.innerHTML += "<option value=\"".concat(p.province_id, "\">").concat(p.name, "</option>");
        });
    });
}
function loadBranches() {
    var _a, _b;
    var regionId = ((_a = document.getElementById("regionSelect")) === null || _a === void 0 ? void 0 : _a.value) || "";
    var provinceId = ((_b = document.getElementById("provinceSelect")) === null || _b === void 0 ? void 0 : _b.value) || "";
    fetch("/sports_rental_system/executive/api/get_branches.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            region_id: regionId,
            province_id: provinceId
        }) // ✅ ส่งค่า
    })
        .then(function (res) { return res.json(); })
        .then(function (res) {
        var data = res.data || []; // ✅ FIX
        var select = document.getElementById("branchSelect");
        select.innerHTML = "<option value=\"\">\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>";
        data.forEach(function (b) {
            select.innerHTML += "<option value=\"".concat(b.branch_id, "\">").concat(b.name, "</option>");
        });
    });
}
/* ==============================
   INIT CHARTS
============================== */
function initCharts() {
    var baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom"
            }
        }
    };
    bookingTrendChart = new Chart(document.getElementById("bookingTrendChart"), {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                    label: "จำนวนการจอง",
                    data: [],
                    borderColor: "#ff7a00",
                    backgroundColor: "rgba(255,122,0,0.15)",
                    fill: true,
                    tension: 0.4
                }]
        },
        options: baseOptions
    });
    revenueTrendChart = new Chart(document.getElementById("revenueTrendChart"), {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                    label: "รายได้",
                    data: [],
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,0.15)",
                    fill: true,
                    tension: 0.4
                }]
        },
        options: baseOptions
    });
    channelChart = new Chart(document.getElementById("channelChart"), {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                    label: "รายได้",
                    data: [],
                    backgroundColor: ["#3b82f6", "#22c55e"]
                }]
        },
        options: baseOptions
    });
    bookingRatioChart = new Chart(document.getElementById("bookingRatioChart"), {
        type: "doughnut",
        data: {
            labels: [],
            datasets: [{
                    data: [],
                    backgroundColor: []
                }]
        },
        options: __assign(__assign({}, baseOptions), { cutout: "65%" })
    });
    branchChart = new Chart(document.getElementById("topChart"), {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                    label: "จำนวนการจอง",
                    data: [],
                    backgroundColor: "#ff7a00"
                }]
        },
        options: baseOptions
    });
}
