/* ==============================
   GLOBAL
============================== */
let charts = {};
let dashboardTimer = null;


/* ==============================
   INIT
============================== */
document.addEventListener("DOMContentLoaded", async () => {
	await checkSession();

	await loadFilterOptions();

	initFilterEvents();
	toggleCustomDate();

	await loadDashboard();
});


/* ==============================
   SESSION
============================== */
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


/* ==============================
   FILTER - LOAD OPTIONS
============================== */
async function loadFilterOptions() {
	try {
		const res = await fetch("/sports_rental_system/rector/api/get_executive_overview.php");
		const data = await res.json();

		// Faculty
		const facSelect = document.getElementById("facultySelect");
		if (facSelect && data.faculty) {
			facSelect.innerHTML = '<option value="">ทุกคณะ</option>';
			data.faculty.forEach(f => facSelect.add(new Option(f.name, f.id)));
		}

		// Year
		const yearSelect = document.getElementById("yearSelect");
		if (yearSelect && data.year) {
			yearSelect.innerHTML = '<option value="">ทุกชั้นปี</option>';
			data.year.forEach(y => yearSelect.add(new Option(`ปี ${y}`, y)));
		}

		// Gender
		const genSelect = document.getElementById("genderSelect");
		if (genSelect && data.gender) {
			genSelect.innerHTML = '<option value="">ทุกเพศ</option>';
			data.gender.forEach(g => genSelect.add(new Option(g.name, g.id)));
		}

	} catch (err) {
		console.error("Filter options error:", err);
	}
}


/* ==============================
   FILTER EVENTS
============================== */
function initFilterEvents() {
	const filterIds = [
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

	// filter change
	filterIds.forEach(id => {
		const el = document.getElementById(id);

		if (el) {
			el.addEventListener("change", () => {
				if (id === "rangeSelect") toggleCustomDate();
				debounceLoad();
			});
		}
	});

	// reset
	document.getElementById("resetFilter")?.addEventListener("click", () => {
		resetFilters();
		loadDashboard();
	});
}


/* ==============================
   FILTER LOGIC
============================== */
function debounceLoad() {
	clearTimeout(dashboardTimer);
	dashboardTimer = setTimeout(() => loadDashboard(), 300);
}

function toggleCustomDate() {
	const rangeEl = document.getElementById("rangeSelect");
	const box = document.getElementById("customDateBox");

	if (rangeEl && box) {
		box.style.display = rangeEl.value === "custom" ? "block" : "none";
	}
}

function resetFilters() {
	const ids = [
		"rangeSelect",
		"bookingTypeSelect",
		"userTypeSelect",
		"facultySelect",
		"yearSelect",
		"genderSelect",
		"startDate",
		"endDate"
	];

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


/* ==============================
   LOAD DASHBOARD
============================== */
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

		updateKPI(data.kpi ?? {});
		updateCharts(data.charts);

	} catch (err) {
		console.error("Dashboard error:", err);
	}
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
function updateCharts(chartsData = {}) {
	renderTrendChart(chartsData.trend);
	renderTopFacultyChart(chartsData.top_faculty);
	renderGenderChart(chartsData.gender);
	renderYearChart(chartsData.year);
}


/* ==============================
   CHARTS
============================== */
function renderTrendChart(trend = {}) {
	renderChart("trendUsersChart", {
		type: "line",
		data: {
			labels: (trend.labels ?? []).map(label => {
				const date = new Date(label + "-01");
				return date.toLocaleString('en-US', { month: 'short' });
			}),
			datasets: [{
				label: "จำนวนผู้เข้าใช้งาน (คน)",
				data: trend.data ?? [],
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
						callback: value => value.toLocaleString() + " คน"
					}
				}
			}
		}
	});
}

function renderTopFacultyChart(data = {}) {
	const defaultFaculties = [
		"คณะเกษตรศาสตร์ ทรัพยากรธรรมชาติและสิ่งแวดล้อม",
		"คณะวิทยาศาสตร์",
		"คณะวิศวกรรมศาสตร์",
		"คณะบริหารธุรกิจ เศรษฐศาสตร์และการสื่อสาร",
		"คณะมนุษยศาสตร์"
	];

	const apiLabels = data.labels ?? [];
	const apiData = data.data ?? [];

	let finalLabels = [...apiLabels];
	let finalData = [...apiData];

	if (finalLabels.length < 5) {
		defaultFaculties.forEach(fac => {
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
						label: (ctx) => `จำนวน: ${ctx.raw.toLocaleString()} คน`
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
						callback: value => value + " คน"
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

function renderGenderChart(data = {}) {
	const labels = data.labels ?? [];

	const colors = labels.map(label => {
		const clean = label.trim();
		if (clean === 'ชาย') return "#4dabf7";
		if (clean === 'หญิง') return "#ff69b4";
		return "#adb5bd";
	});

	renderChart("genderChart", {
		type: "doughnut",
		data: {
			labels,
			datasets: [{
				data: data.data ?? [],
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
						label: ctx => ` ${ctx.label}: ${ctx.raw} คน`
					}
				}
			}
		}
	});
}

function renderYearChart(data = {}) {
	const defaultLabels = ["ปี 1", "ปี 2", "ปี 3", "ปี 4", "ปี 5", "ปี 6"];

	const apiLabels = data.labels ?? [];
	const apiData = data.data ?? [];
	const finalData = defaultLabels.map(label => {
		const index = apiLabels.indexOf(label);
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
						callback: value => value.toLocaleString() + " คน"
					}
				}
			},
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label: ctx => `จำนวน: ${ctx.parsed.y.toLocaleString()} คน`
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