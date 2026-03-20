let charts = {};
let dashboardTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
	await checkSession();
	await loadFilterOptions();
	initFilterEvents();
	toggleCustomDate();
	await loadDashboard();
});

/* ================= SESSION CHECK ================= */
async function checkSession() {
	try {
		const res = await fetch("/sports_rental_system/rector/api/check_session.php");
		const data = await res.json();
		if (!data.success) {
			window.location.href = "login.html";
		}
	} catch (err) {
		console.error("Session check failed");
		window.location.href = "login.html";
	}
}

/* ================= LOAD FILTER OPTIONS ================= */
async function loadFilterOptions() {
	try {
		const res = await fetch("/sports_rental_system/rector/api/get_executive_overview.php");
		const data = await res.json();

		const facSelect = document.getElementById("facultySelect");
		if (facSelect && data.faculty) {
			facSelect.innerHTML = '<option value="">ทุกคณะ</option>';
			data.faculty.forEach(f => facSelect.add(new Option(f.name, f.id)));
		}

		const yearSelect = document.getElementById("yearSelect");
		if (yearSelect && data.year) {
			yearSelect.innerHTML = '<option value="">ทุกชั้นปี</option>';
			data.year.forEach(y => yearSelect.add(new Option(`ปี ${y}`, y)));
		}

		const genSelect = document.getElementById("genderSelect");
		if (genSelect && data.gender) {
			genSelect.innerHTML = '<option value="">ทุกเพศ</option>';
			data.gender.forEach(g => genSelect.add(new Option(g.name, g.id)));
		}
	} catch (err) {
		console.error("Filter options error:", err);
	}
}

/* ================= INIT FILTER EVENTS ================= */
function initFilterEvents() {
	const filterIds = [
		"rangeSelect", "bookingTypeSelect", "userTypeSelect",
		"facultySelect", "yearSelect", "genderSelect", "startDate", "endDate"
	];

	const userTypeEl = document.getElementById("userTypeSelect");
	if (userTypeEl) {
		userTypeEl.addEventListener("change", function () {
			const facultyEl = document.getElementById("facultySelect");
			const yearEl = document.getElementById("yearSelect");

			const isNotStudent = this.value === "general" || this.value === "external";

			if (facultyEl) {
				facultyEl.disabled = isNotStudent;
				if (isNotStudent) facultyEl.value = "";
			}
			if (yearEl) {
				yearEl.disabled = isNotStudent;
				if (isNotStudent) yearEl.value = "";
			}
		});
	}

	filterIds.forEach(id => {
		const el = document.getElementById(id);
		if (el) {
			el.addEventListener("change", () => {
				if (id === "rangeSelect") toggleCustomDate();
				debounceLoad();
			});
		}
	});

	document.getElementById("resetFilter")?.addEventListener("click", () => {
		resetFilters();
		loadDashboard();
	});
}

function debounceLoad() {
	clearTimeout(dashboardTimer);
	dashboardTimer = setTimeout(() => loadDashboard(), 300);
}

function toggleCustomDate() {
	const rangeEl = document.getElementById("rangeSelect");
	const box = document.getElementById("customDateBox");
	if (rangeEl && box) {
		box.style.display = rangeEl.value === "custom" ? "flex" : "none";
	}
}

function resetFilters() {
	const ids = ["rangeSelect", "bookingTypeSelect", "userTypeSelect", "facultySelect", "yearSelect", "genderSelect", "startDate", "endDate"];
	ids.forEach(id => {
		const el = document.getElementById(id);
		if (el) {
			if (id === "rangeSelect") el.value = "all";
			else el.value = "";
		}
	});
	toggleCustomDate();
}

function getFilters() {
	return {
		range: document.getElementById("rangeSelect")?.value || "",
		start_date: document.getElementById("startDate")?.value || "",
		end_date: document.getElementById("endDate")?.value || "",
		booking_type: document.getElementById("bookingTypeSelect")?.value || "",
		user_type: document.getElementById("userTypeSelect")?.value || "",
		faculty_id: document.getElementById("facultySelect")?.value || "",
		year: document.getElementById("yearSelect")?.value || "",
		gender_id: document.getElementById("genderSelect")?.value || ""
	};
}

/* ================= LOAD DASHBOARD ================= */
async function loadDashboard() {
	try {
		const filters = getFilters();
		const query = new URLSearchParams(filters).toString();

		const res = await fetch("/sports_rental_system/rector/api/get_executive_overview.php?" + query);

		const contentType = res.headers.get("content-type");
		if (!contentType || !contentType.includes("application/json")) {
			const text = await res.text();
			console.error("Server returned non-JSON:", text);
			return;
		}

		const data = await res.json();
		if (!data.success) return;

		// อัปเดต KPI
		const kpi = data.kpi ?? {};
		updateKpiUI("kpiUsers", kpi.total_users, "");
		updateKpiUI("kpiPenetration", kpi.student_pct, "%");
		updateKpiUI("kpiGeneral", kpi.general_pct, "%");
		updateKpiUI("kpiExternal", kpi.external_pct, "%");

		const chartsData = data.charts;

		// 1. แนวโน้มการจอง
		renderChart("trendUsersChart", {
			type: "line",
			data: {
				labels: (chartsData.trend?.labels ?? []).map(label => {
					const date = new Date(label + "-01");
					return date.toLocaleString('en-US', { month: 'short' });
				}),
				datasets: [{
					label: "จำนวนผู้เข้าใช้งาน (คน)",
					data: chartsData.trend?.data ?? [],
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
							callback: function (value) {
								return value.toLocaleString() + " คน";
							}
						}
					}
				}
			}
		});

		// 2. อันดับคณะ
		renderChart("topFacultyChart", {
			type: "bar",
			data: {
				labels: chartsData.top_faculty?.labels ?? [],
				datasets: [{
					label: "จำนวนนิสิต (คน)",
					data: chartsData.top_faculty?.data ?? [],
					backgroundColor: "#51cf66",
					barThickness: 25,
					maxBarThickness: 30,
					categoryPercentage: 0.8
				}]
			},
			options: {
				indexAxis: "y",
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false }
				},
				scales: {
					x: {
						beginAtZero: true,
						suggestedMax: 1,
						ticks: {
							stepSize: 1,
							precision: 0,
							callback: function (value) {
								return value + " คน";
							}
						}
					},
					y: {
						ticks: {
							padding: 10,
							font: { size: 12 }
						}
					}
				}
			}
		});

		// --- 3. สัดส่วนเพศ ---
		const genderLabels = chartsData.gender?.labels ?? [];
		const genderColors = genderLabels.map(label => {
			const cleanLabel = label.trim();

			if (cleanLabel === 'ชาย') return "#4dabf7";   
			if (cleanLabel === 'หญิง') return "#ff69b4";  

			return "#adb5bd"; 
		});

		renderChart("genderChart", {
			type: "doughnut",
			data: {
				labels: genderLabels,
				datasets: [{
					data: chartsData.gender?.data ?? [],
					backgroundColor: genderColors
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
							label: function (context) {
								let label = context.label || '';
								let value = context.raw || 0;
								return ` ${label}: ${value} คน`;
							}
						}
					}
				}
			}
		});

		// 4. สถิติตามชั้นปี
		renderChart("yearChart", {
			type: "bar",
			data: {
				labels: chartsData.year?.labels ?? [],
				datasets: [{
					label: "จำนวนนิสิต (คน)",
					data: chartsData.year?.data ?? [],
					backgroundColor: "#ff922b"
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							stepSize: 1,
							precision: 0,
							callback: function (value) {
								return value.toLocaleString() + " คน";
							}
						}
					}
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: function (context) {
								return `จำนวน: ${context.parsed.y.toLocaleString()} คน`;
							}
						}
					}
				}
			}
		});

	} catch (err) {
		console.error("Dashboard error:", err);
	}
}

/* ================= HELPERS ================= */
function updateKpiUI(id, value, unit) {
	const el = document.getElementById(id);
	if (el) {
		const num = Number(value ?? 0);
		const isPercent = ["kpiPenetration", "kpiGeneral", "kpiExternal"].includes(id);

		el.innerText = isPercent
			? num.toFixed(1) + unit
			: num.toLocaleString() + unit;
	}
}

function renderChart(id, config) {
	const canvas = document.getElementById(id);
	if (!canvas) return;

	if (charts[id]) charts[id].destroy();
	Chart.defaults.font.family = "'Noto Sans Thai', sans-serif";
	const ctx = canvas.getContext("2d");
	if (ctx) charts[id] = new Chart(ctx, config);
}