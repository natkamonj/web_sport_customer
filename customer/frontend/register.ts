document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("register-form") as HTMLFormElement;

    const customerType = document.getElementById("customerType") as HTMLSelectElement;
    const studentRow = document.getElementById("student-row") as HTMLDivElement;

    const faculty = document.getElementById("faculty") as HTMLSelectElement;
    const gender = document.getElementById("gender") as HTMLSelectElement;

    const branch = document.getElementById("branch") as HTMLSelectElement;

    // -------------------------
    // show / hide student row
    // -------------------------
    customerType.addEventListener("change", () => {
        if (customerType.value === "student") {
            studentRow.style.display = "flex";
        } else {
            studentRow.style.display = "none";
        }
    });

    // -------------------------
    // load faculties from DB
    // -------------------------
    async function loadFaculties() {
        try {
            const res = await fetch("/sports_rental_system/customer/api/get_faculty.php");
            const data = await res.json();

            faculty.innerHTML = `<option value="">-- เลือกคณะ --</option>`;

            data.forEach((f: any) => {
                const opt = document.createElement("option");
                opt.value = f.id;
                opt.textContent = f.name;
                faculty.appendChild(opt);
            });

        } catch (err) {
            console.error("โหลดคณะไม่สำเร็จ", err);
        }
    }

    // -------------------------
    // load genders from DB
    // -------------------------
    async function loadGenders() {
        try {
            const res = await fetch("/sports_rental_system/customer/api/get_gender.php");
            const data = await res.json();

            gender.innerHTML = `<option value="">-- เลือกเพศ --</option>`;

            data.forEach((g: any) => {
                const opt = document.createElement("option");
                opt.value = g.gender_id;
                opt.textContent = g.name_th;
                gender.appendChild(opt);
            });

        } catch (err) {
            console.error("โหลดเพศไม่สำเร็จ", err);
        }
    }

    async function loadBranches() {
        try {
            const res = await fetch("/sports_rental_system/customer/api/get_branches.php");
            const data = await res.json();

            branch.innerHTML = `<option value="">-- เลือกมหาวิทยาลัย --</option>`;

            data.forEach((b: any) => {
                const opt = document.createElement("option");
                opt.value = b.branch_id;
                opt.textContent = b.name;
                branch.appendChild(opt);
            });

        } catch (err) {
            console.error("โหลดมหาลัยไม่สำเร็จ", err);
        }
    }

    loadFaculties();
    loadGenders();
    loadBranches();

    // -------------------------
    // submit register
    // -------------------------
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            email: (document.getElementById("email") as HTMLInputElement).value,
            fullname: (document.getElementById("fullname") as HTMLInputElement).value,
            phone: (document.getElementById("phone") as HTMLInputElement).value,

            birthday: (document.getElementById("birthday") as HTMLInputElement).value,
            gender_id: gender.value,
            customerType: customerType.value,

            branch_id: branch.value || null,

            faculty_id: faculty.value || null,
            year: (document.getElementById("year") as HTMLSelectElement).value || null,

            password: (document.getElementById("password") as HTMLInputElement).value,
            confirmPassword: (document.getElementById("confirmPassword") as HTMLInputElement).value,
        };

        if (payload.password !== payload.confirmPassword) {
            alert("รหัสผ่านไม่ตรงกัน");
            return;
        }

        try {
            const res = await fetch("/sports_rental_system/customer/api/register.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            alert(data.message);

            if (data.success) {
                window.location.href = "login.html";
            }

        } catch (err) {
            alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
            console.error(err);
        }

    });

});

document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", () => {

        const targetId = btn.getAttribute("data-target");
        if (!targetId) return;

        const input = document.getElementById(targetId) as HTMLInputElement;
        const icon = btn.querySelector("i")!;

        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    });
});
