/**
 * Sprint Capacity Toolset
 * Author: Eugen Rof
 * Year: 2026
 */

// 1. Restore Default Team
let team = [
    { name: 'Member Name 1', allocation: 100, daysOff: 0 },
    { name: 'Member Name 2', allocation: 100, daysOff: 0 },
    { name: 'Member Name 3', allocation: 100, daysOff: 0 },
    { name: 'Member Name 4', allocation: 100, daysOff: 0 },
    { name: 'Member Name 5', allocation: 100, daysOff: 0 }
];

document.addEventListener('DOMContentLoaded', () => {
    loadStateFromURL();
    renderTable(); // This will trigger the initial calculation
});

/**
 * Persistence Logic
 */
function updateURL() {
    const params = new URLSearchParams();
    params.set('s', document.getElementById('sprintDays').value);
    params.set('h', document.getElementById('publicHolidays').value);
    params.set('v', document.getElementById('avgVelocity').value);

    const teamData = team.map(m => `${encodeURIComponent(m.name)}|${m.allocation}|${m.daysOff}`).join(',');
    params.set('team', teamData);

    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params.toString();
    window.history.replaceState(null, null, newUrl);
}

function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('team')) return;

    try {
        document.getElementById('sprintDays').value = params.get('s') || 15;
        document.getElementById('publicHolidays').value = params.get('h') || 0;
        document.getElementById('avgVelocity').value = params.get('v') || 45;

        const teamParam = params.get('team');
        team = teamParam.split(',').map(str => {
            const [name, allocation, daysOff] = str.split('|');
            return {
                name: decodeURIComponent(name),
                allocation: parseFloat(allocation) || 100,
                daysOff: parseFloat(daysOff) || 0
            };
        });
    } catch (e) { console.error("URL Load Error", e); }
}

/**
 * UI Actions
 */
function resetToDefault() {
    if (confirm("Reset all team data and settings?")) {
        team = [
            { name: 'Member Name 1', allocation: 100, daysOff: 0 },
            { name: 'Member Name 2', allocation: 100, daysOff: 0 },
            { name: 'Member Name 3', allocation: 100, daysOff: 0 },
            { name: 'Member Name 4', allocation: 100, daysOff: 0 },
            { name: 'Member Name 5', allocation: 100, daysOff: 0 }
        ];
        document.getElementById('sprintDays').value = 15;
        document.getElementById('publicHolidays').value = 0;
        document.getElementById('avgVelocity').value = 45;

        window.history.replaceState(null, null, window.location.pathname);
        renderTable();
        showToast("Data reset successfully.");
    }
}

function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function addRow() {
    team.push({ name: 'New Member', allocation: 100, daysOff: 0 });
    renderTable();
}

function removeRow(index) {
    team.splice(index, 1);
    renderTable();
}

/**
 * Validation and Updates
 */
function validateGlobal(input) {
    let val = parseFloat(input.value);
    const sprintDaysInput = document.getElementById('sprintDays');
    const holidayInput = document.getElementById('publicHolidays');

    let currentSprintDays = parseFloat(sprintDaysInput.value) || 0;

    // 1. Basic negative value check
    if (isNaN(val) || val < 0) {
        showToast("⚠️ Values cannot be negative. Resetting to 0.");
        input.value = 0;
        val = 0;
    }

    // 2. Specific check for Public Holidays vs Sprint Days
    if (input.id === 'publicHolidays' && val > currentSprintDays) {
        showToast(`⚠️ Holidays cannot exceed Sprint Days (${currentSprintDays}).`);
        input.value = currentSprintDays;
    }

    // 3. If Sprint Days are lowered, re-validate Public Holidays
    if (input.id === 'sprintDays') {
        const hVal = parseFloat(holidayInput.value) || 0;

        // If holidays are greater than OR equal to the new sprint length
        if (hVal >= val) {
            showToast("⚠️ Holidays reset to 0 as they matched or exceeded sprint length.");
            holidayInput.value = 0;
        }
    }

    calculate();
}

function updateMember(index, field, value) {
    if (field === 'name') {
        team[index].name = value || "New Member";
        calculate();
    } else {
        let num = parseFloat(value);

        // 1. Basic negative value check
        if (isNaN(num) || num < 0) {
            showToast("⚠️ Values cannot be negative. Resetting to 0.");
            num = 0;
            team[index][field] = num;
            renderTable(); // Force UI to show the reset 0
        }
        // 2. Specific check for Allocation % (cannot exceed 100)
        else if (field === 'allocation' && num > 100) {
            showToast("⚠️ Allocation cannot exceed 100%. Reset to 100%.");
            num = 100;
            team[index][field] = num;
            renderTable(); // Force UI to show the 100 cap
        }
        // 3. Valid input
        else {
            team[index][field] = num;
            calculate();
        }
    }
}

function renderTable() {
    const body = document.getElementById('teamBody');
    if (!body) return;
    body.innerHTML = '';

    team.forEach((member, index) => {
        const row = document.createElement('tr');
        row.className = "row-hover transition-colors group";
        row.innerHTML = `
            <td class="px-6 py-4">
                <input type="text" value="${member.name}" onchange="updateMember(${index}, 'name', this.value)" 
                class="w-full bg-transparent font-semibold border-none focus:ring-2 focus:ring-indigo-500 rounded px-1">
            </td>
            <td class="px-6 py-4 text-center">
                <input type="number" value="${member.allocation}" onchange="updateMember(${index}, 'allocation', this.value)" 
                class="w-16 text-center bg-slate-50 rounded-lg p-1 border-none text-sm font-medium focus:ring-2 focus:ring-indigo-500">
            </td>
            <td class="px-6 py-4 text-center">
                <input type="number" value="${member.daysOff}" onchange="updateMember(${index}, 'daysOff', this.value)" 
                class="w-16 text-center bg-slate-50 rounded-lg p-1 border-none text-sm font-medium focus:ring-2 focus:ring-indigo-500">
            </td>
            <td class="px-6 py-4 text-center font-bold text-slate-600" id="avail-${index}">0</td>
            <td class="px-6 py-4 text-right">
                <button onclick="removeRow(${index})" class="text-slate-300 hover:text-red-500">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        `;
        body.appendChild(row);
    });
    calculate();
}

/**
 * CALCULATION ENGINE
 * Baseline = Members * Sprint Days
 * Available = (Sprint Days - Holidays - Personal Days) * Allocation
 */
function calculate() {
    const sprintDays = Math.max(0, parseFloat(document.getElementById('sprintDays').value) || 0);
    const holidays = Math.max(0, parseFloat(document.getElementById('publicHolidays').value) || 0);
    const avgVelocity = Math.max(0, parseFloat(document.getElementById('avgVelocity').value) || 0);

    const workingWindow = Math.max(0, sprintDays - holidays);
    let totalAvailableDays = 0;

    team.forEach((member, index) => {
        const available = Math.max(0, (workingWindow - member.daysOff) * (member.allocation / 100));
        const cell = document.getElementById(`avail-${index}`);
        if (cell) cell.innerText = Number(available.toFixed(1));
        totalAvailableDays += available;
    });

    // Baseline is total team capacity for the full duration (ignoring holidays initially)
    // This ensures holidays correctly drop the percentage and velocity.
    const baselinePotential = team.length * sprintDays;
    const capacityPerc = baselinePotential > 0 ? (totalAvailableDays / baselinePotential) : 0;
    const planVelocity = avgVelocity * capacityPerc;

    updateDashboard(totalAvailableDays, capacityPerc, planVelocity);
    updateURL();
}

function updateDashboard(totalDays, capacity, plan) {
    document.getElementById('resTotalDays').innerText = Number(totalDays.toFixed(1)) + ' Days';
    document.getElementById('resCapacity').innerText = (capacity * 100).toFixed(0) + '%';
    document.getElementById('resPlanVelocity').innerText = Number(plan.toFixed(1));

    const bar = document.getElementById('capacityBar');
    const perc = capacity * 100;
    bar.style.width = Math.min(100, perc) + '%';

    if (perc >= 75) bar.style.backgroundColor = "#22c55e";
    else if (perc >= 50) bar.style.backgroundColor = "#f97316";
    else bar.style.backgroundColor = "#ef4444";
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const sDays = document.getElementById('sprintDays').value;
    const hDays = document.getElementById('publicHolidays').value;
    const velocity = document.getElementById('resPlanVelocity').innerText;
    const cap = document.getElementById('resCapacity').innerText;

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text("Sprint Capacity Report", 14, 22);

    doc.autoTable({
        startY: 30,
        head: [['Sprint Metric', 'Value']],
        body: [
            ['Sprint Duration', sDays + ' Days'],
            ['Public Holidays', hDays + ' Days'],
            ['Plan Velocity', velocity + ' Story Points'],
            ['Calculated Capacity', cap]
        ],
        theme: 'grid',
        headStyles: { fillColor: [241, 245, 249], textColor: [79, 70, 229] }
    });

    const workingWindow = Math.max(0, sDays - hDays);
    const tableRows = team.map(m => [
        m.name,
        m.allocation + "%",
        m.daysOff,
        Number(((workingWindow - m.daysOff) * (m.allocation / 100)).toFixed(1))
    ]);

    doc.autoTable({
        head: [["Member Name", "Alloc %", "Days Off", "Avail. Days"]],
        body: tableRows,
        startY: doc.lastAutoTable.finalY + 10,
        headStyles: { fillColor: [79, 70, 229], halign: 'center' },
        styles: { halign: 'center' },
        columnStyles: { 0: { halign: 'left' } }
    });

    doc.save(`Sprint_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
