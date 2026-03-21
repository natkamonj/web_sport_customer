var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _this = this;
/* ==============================
   GLOBAL
============================== */
var charts = {};
var dashboardTimer = null;
/* ==============================
   INIT
============================== */
document.addEventListener("DOMContentLoaded", function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, checkSession()];
            case 1:
                _a.sent();
                return [4 /*yield*/, loadFilterOptions()];
            case 2:
                _a.sent();
                initFilterEvents();
                toggleCustomDate();
                return [4 /*yield*/, loadDashboard()];
            case 3:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
/* ==============================
   SESSION
============================== */
function checkSession() {
    return __awaiter(this, void 0, void 0, function () {
        var res, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/sports_rental_system/rector/api/check_session.php")];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    if (!data.success) {
                        window.location.href = "login.html";
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error("Session check failed");
                    window.location.href = "login.html";
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/* ==============================
   FILTER - LOAD OPTIONS
============================== */
function loadFilterOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var res, data, facSelect_1, yearSelect_1, genSelect_1, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/sports_rental_system/rector/api/get_executive_overview.php")];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    facSelect_1 = document.getElementById("facultySelect");
                    if (facSelect_1 && data.faculty) {
                        facSelect_1.innerHTML = '<option value="">ทุกคณะ</option>';
                        data.faculty.forEach(function (f) { return facSelect_1.add(new Option(f.name, f.id)); });
                    }
                    yearSelect_1 = document.getElementById("yearSelect");
                    if (yearSelect_1 && data.year) {
                        yearSelect_1.innerHTML = '<option value="">ทุกชั้นปี</option>';
                        data.year.forEach(function (y) { return yearSelect_1.add(new Option("\u0E1B\u0E35 ".concat(y), y)); });
                    }
                    genSelect_1 = document.getElementById("genderSelect");
                    if (genSelect_1 && data.gender) {
                        genSelect_1.innerHTML = '<option value="">ทุกเพศ</option>';
                        data.gender.forEach(function (g) { return genSelect_1.add(new Option(g.name, g.id)); });
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    console.error("Filter options error:", err_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/* ==============================
   FILTER EVENTS
============================== */
function initFilterEvents() {
    var _a;
    var filterIds = [
        "rangeSelect",
        "bookingTypeSelect",
        "userTypeSelect",
        "facultySelect",
        "yearSelect",
        "genderSelect",
        "startDate",
        "endDate"
    ];
    // userType logic
    var userTypeEl = document.getElementById("userTypeSelect");
    if (userTypeEl) {
        userTypeEl.addEventListener("change", function () {
            var facultyEl = document.getElementById("facultySelect");
            var yearEl = document.getElementById("yearSelect");
            var isNotStudent = this.value === "general" || this.value === "external";
            if (facultyEl) {
                facultyEl.disabled = isNotStudent;
                if (isNotStudent)
                    facultyEl.value = "";
            }
            if (yearEl) {
                yearEl.disabled = isNotStudent;
                if (isNotStudent)
                    yearEl.value = "";
            }
        });
    }
    // filter change
    filterIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", function () {
                if (id === "rangeSelect")
                    toggleCustomDate();
                debounceLoad();
            });
        }
    });
    // reset
    (_a = document.getElementById("resetFilter")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () {
        resetFilters();
        loadDashboard();
    });
}
/* ==============================
   FILTER LOGIC
============================== */
function debounceLoad() {
    clearTimeout(dashboardTimer);
    dashboardTimer = setTimeout(function () { return loadDashboard(); }, 300);
}
function toggleCustomDate() {
    var rangeEl = document.getElementById("rangeSelect");
    var box = document.getElementById("customDateBox");
    if (rangeEl && box) {
        box.style.display = rangeEl.value === "custom" ? "block" : "none";
    }
}
function resetFilters() {
    var ids = [
        "rangeSelect",
        "bookingTypeSelect",
        "userTypeSelect",
        "facultySelect",
        "yearSelect",
        "genderSelect",
        "startDate",
        "endDate"
    ];
    ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
            if (id === "rangeSelect")
                el.value = "all";
            else
                el.value = "";
        }
    });
    toggleCustomDate();
}
function getFilters() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return {
        range: ((_a = document.getElementById("rangeSelect")) === null || _a === void 0 ? void 0 : _a.value) || "",
        start_date: ((_b = document.getElementById("startDate")) === null || _b === void 0 ? void 0 : _b.value) || "",
        end_date: ((_c = document.getElementById("endDate")) === null || _c === void 0 ? void 0 : _c.value) || "",
        booking_type: ((_d = document.getElementById("bookingTypeSelect")) === null || _d === void 0 ? void 0 : _d.value) || "",
        user_type: ((_e = document.getElementById("userTypeSelect")) === null || _e === void 0 ? void 0 : _e.value) || "",
        faculty_id: ((_f = document.getElementById("facultySelect")) === null || _f === void 0 ? void 0 : _f.value) || "",
        year: ((_g = document.getElementById("yearSelect")) === null || _g === void 0 ? void 0 : _g.value) || "",
        gender_id: ((_h = document.getElementById("genderSelect")) === null || _h === void 0 ? void 0 : _h.value) || ""
    };
}
/* ==============================
   LOAD DASHBOARD
============================== */
function loadDashboard() {
    return __awaiter(this, void 0, void 0, function () {
        var filters, query, res, contentType, text, data, err_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    filters = getFilters();
                    query = new URLSearchParams(filters).toString();
                    return [4 /*yield*/, fetch("/sports_rental_system/rector/api/get_executive_overview.php?" + query)];
                case 1:
                    res = _b.sent();
                    contentType = res.headers.get("content-type");
                    if (!(!contentType || !contentType.includes("application/json"))) return [3 /*break*/, 3];
                    return [4 /*yield*/, res.text()];
                case 2:
                    text = _b.sent();
                    console.error("Server returned non-JSON:", text);
                    return [2 /*return*/];
                case 3: return [4 /*yield*/, res.json()];
                case 4:
                    data = _b.sent();
                    if (!data.success)
                        return [2 /*return*/];
                    updateKPI((_a = data.kpi) !== null && _a !== void 0 ? _a : {});
                    updateCharts(data.charts);
                    return [3 /*break*/, 6];
                case 5:
                    err_3 = _b.sent();
                    console.error("Dashboard error:", err_3);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/* ==============================
   UPDATE KPI
============================== */
function updateKPI(kpi) {
    updateKpiUI("kpiUsers", kpi.total_users, "");
    updateKpiUI("kpiPenetration", kpi.student_pct, "%");
    updateKpiUI("kpiGeneral", kpi.general_pct, "%");
    updateKpiUI("kpiExternal", kpi.external_pct, "%");
}
/* ==============================
   UPDATE CHARTS
============================== */
function updateCharts(chartsData) {
    if (chartsData === void 0) { chartsData = {}; }
    renderTrendChart(chartsData.trend);
    renderTopFacultyChart(chartsData.top_faculty);
    renderGenderChart(chartsData.gender);
    renderYearChart(chartsData.year);
}
/* ==============================
   CHARTS
============================== */
function renderTrendChart(trend) {
    var _a, _b;
    if (trend === void 0) { trend = {}; }
    renderChart("trendUsersChart", {
        type: "line",
        data: {
            labels: ((_a = trend.labels) !== null && _a !== void 0 ? _a : []).map(function (label) {
                var date = new Date(label + "-01");
                return date.toLocaleString('en-US', { month: 'short' });
            }),
            datasets: [{
                    label: "จำนวนผู้เข้าใช้งาน (คน)",
                    data: (_b = trend.data) !== null && _b !== void 0 ? _b : [],
                    borderColor: "#339af0",
                    backgroundColor: "rgba(51, 154, 240, 0.1)",
                    fill: true,
                    tension: 0,
                    cubicInterpolationMode: 'monotone'
                }]
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        callback: function (value) { return value.toLocaleString() + " คน"; }
                    }
                }
            }
        }
    });
}
function renderTopFacultyChart(data) {
    var _a, _b;
    if (data === void 0) { data = {}; }
    var defaultFaculties = [
        "คณะเกษตรศาสตร์ ทรัพยากรธรรมชาติและสิ่งแวดล้อม",
        "คณะวิทยาศาสตร์",
        "คณะวิศวกรรมศาสตร์",
        "คณะบริหารธุรกิจ เศรษฐศาสตร์และการสื่อสาร",
        "คณะมนุษยศาสตร์"
    ];
    var apiLabels = (_a = data.labels) !== null && _a !== void 0 ? _a : [];
    var apiData = (_b = data.data) !== null && _b !== void 0 ? _b : [];
    var finalLabels = __spreadArray([], apiLabels, true);
    var finalData = __spreadArray([], apiData, true);
    if (finalLabels.length < 5) {
        defaultFaculties.forEach(function (fac) {
            if (!finalLabels.includes(fac) && finalLabels.length < 5) {
                finalLabels.push(fac);
                finalData.push(0);
            }
        });
    }
    renderChart("topFacultyChart", {
        type: "bar",
        data: {
            labels: finalLabels,
            datasets: [{
                    label: "จำนวนนิสิต",
                    data: finalData,
                    backgroundColor: "#51cf66",
                    barThickness: 20,
                    borderRadius: 4
                }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (ctx) { return "\u0E08\u0E33\u0E19\u0E27\u0E19: ".concat(ctx.raw.toLocaleString(), " \u0E04\u0E19"); }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    suggestedMax: 5,
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        callback: function (value) { return value + " คน"; }
                    }
                },
                y: {
                    ticks: {
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}
function renderGenderChart(data) {
    var _a, _b;
    if (data === void 0) { data = {}; }
    var labels = (_a = data.labels) !== null && _a !== void 0 ? _a : [];
    var colors = labels.map(function (label) {
        var clean = label.trim();
        if (clean === 'ชาย')
            return "#4dabf7";
        if (clean === 'หญิง')
            return "#ff69b4";
        return "#adb5bd";
    });
    renderChart("genderChart", {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                    data: (_b = data.data) !== null && _b !== void 0 ? _b : [],
                    backgroundColor: colors
                }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function (ctx) { return " ".concat(ctx.label, ": ").concat(ctx.raw, " \u0E04\u0E19"); }
                    }
                }
            }
        }
    });
}
function renderYearChart(data) {
    var _a, _b;
    if (data === void 0) { data = {}; }
    var defaultLabels = ["ปี 1", "ปี 2", "ปี 3", "ปี 4", "ปี 5", "ปี 6"];
    var apiLabels = (_a = data.labels) !== null && _a !== void 0 ? _a : [];
    var apiData = (_b = data.data) !== null && _b !== void 0 ? _b : [];
    var finalData = defaultLabels.map(function (label) {
        var index = apiLabels.indexOf(label);
        return index !== -1 ? apiData[index] : 0;
    });
    renderChart("yearChart", {
        type: "bar",
        data: {
            labels: defaultLabels,
            datasets: [{
                    label: "จำนวนนิสิต (คน)",
                    data: finalData,
                    backgroundColor: "#ff922b",
                    borderRadius: 4
                }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 5,
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        callback: function (value) { return value.toLocaleString() + " คน"; }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (ctx) { return "\u0E08\u0E33\u0E19\u0E27\u0E19: ".concat(ctx.parsed.y.toLocaleString(), " \u0E04\u0E19"); }
                    }
                }
            }
        }
    });
}
/* ==============================
   HELPERS
============================== */
function updateKpiUI(id, value, unit) {
    var el = document.getElementById(id);
    if (el) {
        var num = Number(value !== null && value !== void 0 ? value : 0);
        var isPercent = ["kpiPenetration", "kpiGeneral", "kpiExternal"].includes(id);
        el.innerText = isPercent
            ? num.toFixed(1) + unit
            : num.toLocaleString() + unit;
    }
}
function renderChart(id, config) {
    var canvas = document.getElementById(id);
    if (!canvas)
        return;
    if (charts[id])
        charts[id].destroy();
    Chart.defaults.font.family = "'Noto Sans Thai', sans-serif";
    var ctx = canvas.getContext("2d");
    if (ctx)
        charts[id] = new Chart(ctx, config);
}
