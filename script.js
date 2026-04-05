/**
 * Sprint Capacity Planner
 * Author: Eugen Rof
 * Year: 2026
 * Description: High-performance Agile planning tool with URL state persistence and PDF export.
 */

// --- Initial State ---
let team = [
    { name: 'Member Name 1', allocation: 100, daysOff: 0 },
    { name: 'Member Name 2', allocation: 100, daysOff: 0 },
    { name: 'Member Name 3', allocation: 100, daysOff: 0 },
    { name: 'Member Name 4', allocation: 100, daysOff: 0 },
    { name: 'Member Name 5', allocation: 100, daysOff: 0 }
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderTable();

    // Listener for live title updates
    document.getElementById('teamName').addEventListener('input', (e) => {
        updateMainHeader(e.target.value);
        saveState();
    });
});

/**
 * Persistence & State Management
 */
function saveState() {
    const params = new URLSearchParams();
    params.set('teamName', document.getElementById('teamName').value);
    params.set('s', document.getElementById('sprintDays').value);
    params.set('h', document.getElementById('publicHolidays').value);
    params.set('v', document.getElementById('avgVelocity').value);

    // Efficiently encode team data to keep URL length manageable
    const teamData = team.map(m => `${encodeURIComponent(m.name)}|${m.allocation}|${m.daysOff}`).join(',');
    params.set('t', teamData);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, null, newUrl);
}

function loadState() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('t') && !params.has('s')) return;

    try {
        const teamName = params.get('teamName') || "";
        document.getElementById('teamName').value = teamName;
        updateMainHeader(teamName);

        document.getElementById('sprintDays').value = params.get('s') || 15;
        document.getElementById('publicHolidays').value = params.get('h') || 0;
        document.getElementById('avgVelocity').value = params.get('v') || 45;

        const teamParam = params.get('t');
        if (teamParam) {
            team = teamParam.split(',').map(str => {
                const [name, allocation, daysOff] = str.split('|');
                return {
                    name: decodeURIComponent(name),
                    allocation: parseFloat(allocation) || 100,
                    daysOff: parseFloat(daysOff) || 0
                };
            });
        }
    } catch (e) {
        console.error("State Recovery Failed", e);
    }
}

/**
 * UI Rendering & Logic
 */
function updateMainHeader(name) {
    const titleBase = "Sprint Capacity Planner";
    const h1 = document.querySelector('h1');
    if (h1) h1.innerText = name.trim() ? `${name} | ${titleBase}` : titleBase;
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
                class="w-full bg-transparent font-semibold border-none focus:ring-2 focus:ring-emerald-500 rounded px-1 transition-all">
            </td>
            <td class="px-6 py-4 text-center">
                <input type="number" value="${member.allocation}" onchange="updateMember(${index}, 'allocation', this.value)" 
                class="w-20 text-center bg-slate-50 rounded-lg p-1 border-none text-sm font-medium focus:ring-2 focus:ring-emerald-500">
            </td>
            <td class="px-6 py-4 text-center">
                <input type="number" value="${member.daysOff}" onchange="updateMember(${index}, 'daysOff', this.value)" 
                class="w-20 text-center bg-slate-50 rounded-lg p-1 border-none text-sm font-medium focus:ring-2 focus:ring-emerald-500">
            </td>
            <td class="px-6 py-4 text-center font-bold text-slate-600" id="avail-${index}">0</td>
            <td class="px-6 py-4 text-right">
                <button onclick="removeRow(${index})" class="text-slate-300 hover:text-red-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        `;
        body.appendChild(row);
    });
    calculate();
}

/**
 * Calculation Engine
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

    const baselinePotential = team.length * sprintDays;
    const capacityPerc = baselinePotential > 0 ? (totalAvailableDays / baselinePotential) : 0;
    const planVelocity = avgVelocity * capacityPerc;

    updateDashboard(totalAvailableDays, capacityPerc, planVelocity);
    saveState();
}

function updateDashboard(totalDays, capacity, plan) {
    const velocityText = document.getElementById('resPlanVelocity');
    const bar = document.getElementById('capacityBar');

    document.getElementById('resTotalDays').innerText = Number(totalDays.toFixed(1)) + ' Days';
    document.getElementById('resCapacity').innerText = (capacity * 100).toFixed(0) + '%';
    velocityText.innerText = Number(plan.toFixed(1));

    const perc = capacity * 100;
    bar.style.width = Math.min(100, perc) + '%';

    // Status coloring
    let statusColor = "#ef4444"; // Default Red
    if (perc >= 75) statusColor = "#10b981"; // Emerald
    else if (perc >= 50) statusColor = "#f97316"; // Orange

    bar.style.backgroundColor = statusColor;
    velocityText.style.color = statusColor;
}

/**
 * Member Management
 */
function updateMember(index, field, value) {
    if (field === 'name') {
        team[index].name = value || "New Member";
    } else {
        let num = parseFloat(value) || 0;
        if (num < 0) {
            showToast("⚠️ Values cannot be negative.");
            num = 0;
        }
        if (field === 'allocation' && num > 100) {
            showToast("⚠️ Allocation capped at 100%.");
            num = 100;
        }
        team[index][field] = num;
    }

    // Only re-render if data correction was needed to prevent focus loss
    if (field !== 'name') renderTable();
    else calculate();
}

function addRow() {
    team.push({ name: 'New Member', allocation: 100, daysOff: 0 });
    renderTable();
}

function removeRow(index) {
    if (team.length > 1) {
        team.splice(index, 1);
        renderTable();
    } else {
        showToast("⚠️ Team must have at least one member.");
    }
}

/**
 * Validation Logic
 */
function validateGlobal(input) {
    let val = parseFloat(input.value) || 0;
    const sprintDays = document.getElementById('sprintDays');
    const holidays = document.getElementById('publicHolidays');

    if (val < 0) {
        showToast("⚠️ Values cannot be negative.");
        input.value = 0;
    }

    if (input.id === 'publicHolidays' && val > parseFloat(sprintDays.value)) {
        showToast("⚠️ Holidays cannot exceed Sprint Days.");
        input.value = sprintDays.value;
    }
    calculate();
}

/**
 * PDF Export logic
 */
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const teamNameInput = document.getElementById('teamName').value.trim();
    const teamDisplayName = teamNameInput || "Team";
    const primaryEmerald = [5, 150, 105];

    // Header
    doc.setFontSize(22);
    doc.setTextColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
    doc.text(`${teamDisplayName} | Sprint Capacity Planner`, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString()} • Powered by Eugen Rof`, 14, 28);

    // Summary Table
    doc.autoTable({
        startY: 35,
        head: [['Sprint Metric', 'Value']],
        body: [
            ['Team Name', teamDisplayName],
            ['Sprint Length', document.getElementById('sprintDays').value + ' Days'],
            ['Calculated Capacity', document.getElementById('resCapacity').innerText],
            ['Recommended Velocity', document.getElementById('resPlanVelocity').innerText + ' Story Points']
        ],
        headStyles: { fillColor: [241, 245, 249], textColor: primaryEmerald },
        theme: 'grid'
    });

    // Detailed Table
    const workingWindow = Math.max(0, document.getElementById('sprintDays').value - document.getElementById('publicHolidays').value);
    const rows = team.map(m => [
        m.name,
        m.allocation + '%',
        m.daysOff,
        ((workingWindow - m.daysOff) * (m.allocation / 100)).toFixed(1)
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Member Name", "Allocation", "Days Off", "Available Days"]],
        body: rows,
        headStyles: { fillColor: primaryEmerald, halign: 'center' },
        styles: { halign: 'center' },
        columnStyles: { 0: { halign: 'left' } }
    });

    doc.save(`${teamDisplayName.replace(/\s+/g, '_')}_Sprint_Capacity_Report.pdf`);
}

/**
 * Helper Utilities
 */
function resetToDefault() {
    if (confirm("Reset all data? This cannot be undone.")) {
        window.location.href = window.location.pathname;
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
