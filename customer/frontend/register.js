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
var _this = this;
document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("register-form");
    var customerType = document.getElementById("customerType");
    var studentRow = document.getElementById("student-row");
    var faculty = document.getElementById("faculty");
    var gender = document.getElementById("gender");
    var branch = document.getElementById("branch");
    // -------------------------
    // show / hide student row
    // -------------------------
    customerType.addEventListener("change", function () {
        if (customerType.value === "student") {
            studentRow.style.display = "flex";
        }
        else {
            studentRow.style.display = "none";
        }
    });
    // -------------------------
    // load faculties from DB
    // -------------------------
    function loadFaculties() {
        return __awaiter(this, void 0, void 0, function () {
            var res, data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/sports_rental_system/customer/api/get_faculty.php")];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        faculty.innerHTML = "<option value=\"\">-- \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E04\u0E13\u0E30 --</option>";
                        data.forEach(function (f) {
                            var opt = document.createElement("option");
                            opt.value = f.id;
                            opt.textContent = f.name;
                            faculty.appendChild(opt);
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        console.error("โหลดคณะไม่สำเร็จ", err_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // -------------------------
    // load genders from DB
    // -------------------------
    function loadGenders() {
        return __awaiter(this, void 0, void 0, function () {
            var res, data, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/sports_rental_system/customer/api/get_gender.php")];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        gender.innerHTML = "<option value=\"\">-- \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E1E\u0E28 --</option>";
                        data.forEach(function (g) {
                            var opt = document.createElement("option");
                            opt.value = g.gender_id;
                            opt.textContent = g.name_th;
                            gender.appendChild(opt);
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        err_2 = _a.sent();
                        console.error("โหลดเพศไม่สำเร็จ", err_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function loadBranches() {
        return __awaiter(this, void 0, void 0, function () {
            var res, data, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/sports_rental_system/customer/api/get_branches.php")];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        branch.innerHTML = "<option value=\"\">-- \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E21\u0E2B\u0E32\u0E27\u0E34\u0E17\u0E22\u0E32\u0E25\u0E31\u0E22 --</option>";
                        data.forEach(function (b) {
                            var opt = document.createElement("option");
                            opt.value = b.branch_id;
                            opt.textContent = b.name;
                            branch.appendChild(opt);
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        err_3 = _a.sent();
                        console.error("โหลดมหาลัยไม่สำเร็จ", err_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    loadFaculties();
    loadGenders();
    loadBranches();
    // -------------------------
    // submit register
    // -------------------------
    form.addEventListener("submit", function (e) { return __awaiter(_this, void 0, void 0, function () {
        var payload, res, data, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    payload = {
                        email: document.getElementById("email").value,
                        fullname: document.getElementById("fullname").value,
                        phone: document.getElementById("phone").value,
                        birthday: document.getElementById("birthday").value,
                        gender_id: gender.value,
                        customerType: customerType.value,
                        branch_id: branch.value || null,
                        faculty_id: faculty.value || null,
                        year: document.getElementById("year").value || null,
                        password: document.getElementById("password").value,
                        confirmPassword: document.getElementById("confirmPassword").value,
                    };
                    if (payload.password !== payload.confirmPassword) {
                        alert("รหัสผ่านไม่ตรงกัน");
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("/sports_rental_system/customer/api/register.php", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(payload),
                        })];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    alert(data.message);
                    if (data.success) {
                        window.location.href = "login.html";
                    }
                    return [3 /*break*/, 5];
                case 4:
                    err_4 = _a.sent();
                    alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
                    console.error(err_4);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
});
document.querySelectorAll(".toggle-password").forEach(function (btn) {
    btn.addEventListener("click", function () {
        var targetId = btn.getAttribute("data-target");
        if (!targetId)
            return;
        var input = document.getElementById(targetId);
        var icon = btn.querySelector("i");
        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        }
        else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    });
});
