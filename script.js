/**
 * Sprint Capacity Planner
 * Author: Eugen Rof
 * Year: 2026
 * Description: Agile planning tool with LocalStorage persistence and on-demand Share Links.
 */

let team = [
    { name: 'Member 1', allocation: 100, daysOff: 0 },
    { name: 'Member 2', allocation: 100, daysOff: 0 },
    { name: 'Member 3', allocation: 100, daysOff: 0 },
    { name: 'Member 4', allocation: 100, daysOff: 0 },
    { name: 'Member 5', allocation: 100, daysOff: 0 }
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderTable();

    const teamNameInput = document.getElementById('teamName');
    teamNameInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value.length >= 50) {
            showToast("⚠️ Team name reached the 50 character limit");
        }
        updateMainHeader(value);
        saveState();
    });
});

/**
 * Persistence & State Management
 */
function saveState() {
    const rawName = document.getElementById('teamName').value;
    const stateToSave = {
        teamName: rawName.substring(0, 50),
        sprintDays: document.getElementById('sprintDays').value,
        holidays: document.getElementById('publicHolidays').value,
        velocity: document.getElementById('avgVelocity').value,
        team: team
    };
    localStorage.setItem('sprintPlannerState', JSON.stringify(stateToSave));
}

function loadState() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('t') || params.has('s')) {
        try {
            const teamName = (params.get('teamName') || "").substring(0, 50);
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
            saveState();
            window.history.replaceState(null, null, window.location.pathname);
            showToast("✅ Shared plan loaded and saved!");
            return; 
        } catch (e) {
            console.error("URL State Recovery Failed", e);
        }
    }

    const localData = localStorage.getItem('sprintPlannerState');
    if (localData) {
        try {
            const savedData = JSON.parse(localData);
            const teamName = (savedData.teamName || "").substring(0, 50);
            document.getElementById('teamName').value = teamName;
            updateMainHeader(teamName);
            document.getElementById('sprintDays').value = savedData.sprintDays || 15;
            document.getElementById('publicHolidays').value = savedData.holidays || 0;
            document.getElementById('avgVelocity').value = savedData.velocity || 45;
            team = savedData.team || team;
        } catch (e) {
            console.error("LocalStorage Recovery Failed", e);
        }
    }
}

/**
 * Generate Share Link
 */
function shareConfiguration() {
    const teamName = document.getElementById('teamName').value;
    const sprintDays = document.getElementById('sprintDays').value;
    const holidays = document.getElementById('publicHolidays').value;
    const velocity = document.getElementById('avgVelocity').value;

    const params = new URLSearchParams();
    params.set('teamName', teamName);
    params.set('s', sprintDays);
    params.set('h', holidays);
    params.set('v', velocity);

    const teamData = team.map(m => `${encodeURIComponent(m.name)}|${m.allocation}|${m.daysOff}`).join(',');
    params.set('t', teamData);

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("🔗 Share link copied to clipboard!");
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

/**
 * UI Rendering & Logic
 */
function updateMainHeader(name) {
    const titleBase = "Sprint Capacity Planner";
    const h1 = document.querySelector('h1');
    const cleanName = name.trim().substring(0, 50);
    const newTitle = cleanName ? `${titleBase} | ${cleanName}` : titleBase;
    
    if (h1) h1.innerText = newTitle;
    document.title = newTitle; 
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
                class="w-full bg-transparent font-semibold border-none focus:ring-2 focus:ring-emerald-500 rounded px-1 transition-all text-center md:text-left">
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
        // parseFloat removes trailing .0
        if (cell) cell.innerText = parseFloat(available.toFixed(1));
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

    // parseFloat removes trailing .0
    document.getElementById('resTotalDays').innerText = parseFloat(totalDays.toFixed(1)) + ' Days';
    document.getElementById('resCapacity').innerText = (capacity * 100).toFixed(0) + '%';
    velocityText.innerText = parseFloat(plan.toFixed(1));

    const perc = capacity * 100;
    bar.style.width = Math.min(100, perc) + '%';

    let statusColor = "#ef4444"; 
    if (perc >= 75) statusColor = "#10b981"; 
    else if (perc >= 50) statusColor = "#f97316"; 

    bar.style.backgroundColor = statusColor;
    velocityText.style.color = statusColor;
}

/**
 * Member Management
 */
function updateMember(index, field, value) {
    if (field === 'name') {
        team[index].name = value || "New Member";
        saveState();
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
        // Limit Days Off to Sprint Length
        if (field === 'daysOff') {
            const sprintLength = parseFloat(document.getElementById('sprintDays').value) || 0;
            if (num > sprintLength) {
                showToast(`⚠️ Days off capped at Sprint Length (${sprintLength} days).`);
                num = sprintLength;
            }
        }
        team[index][field] = num;
        renderTable();
    }
}

function addRow() {
    team.push({ name: 'New Member', allocation: 100, daysOff: 0 });
    renderTable();
    saveState();
}

function removeRow(index) {
    if (team.length > 1) {
        team.splice(index, 1);
        renderTable();
        saveState();
    } else {
        showToast("⚠️ Team must have at least one member.");
    }
}

/**
 * Validation Logic
 */
function validateGlobal(input) {
    let val = parseFloat(input.value) || 0;
    const sprintDaysInput = document.getElementById('sprintDays');

    if (val < 0) {
        showToast("⚠️ Values cannot be negative.");
        input.value = 0;
    }

    // Clamp existing team daysOff if sprint length decreases
    if (input.id === 'sprintDays') {
        team.forEach(member => {
            if (member.daysOff > val) member.daysOff = val;
        });
        renderTable();
    }

    if (input.id === 'publicHolidays' && val > parseFloat(sprintDaysInput.value)) {
        showToast("⚠️ Holidays cannot exceed Sprint Days.");
        input.value = sprintDaysInput.value;
    }
    calculate();
}

/**
 * PDF Export logic
 */
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const teamNameInput = document.getElementById('teamName').value.trim().substring(0, 50);
    const teamDisplayName = teamNameInput || "Team";
    const primaryEmerald = [16, 185, 129]; 

    doc.setFontSize(22);
    doc.setTextColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
    const pdfTitle = teamNameInput ? `Sprint Capacity Planner | ${teamDisplayName}` : "Sprint Capacity Planner";
    doc.text(pdfTitle, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);

    doc.autoTable({
        startY: 35,
        head: [['Sprint Metric', 'Value']],
        body: [
            ['Sprint Length', document.getElementById('sprintDays').value + ' Days'],
            ['Public Holidays', document.getElementById('publicHolidays').value + ' Days'],
            ['Calculated Capacity', document.getElementById('resCapacity').innerText],
            ['Recommended Velocity', document.getElementById('resPlanVelocity').innerText + ' Story Points']
        ],
        headStyles: { fillColor: [241, 245, 249], textColor: primaryEmerald },
        theme: 'grid'
    });

    const sprintLength = parseFloat(document.getElementById('sprintDays').value) || 0;
    const holidayValue = parseFloat(document.getElementById('publicHolidays').value) || 0;
    const workingWindow = Math.max(0, sprintLength - holidayValue);
    
    const rows = team.map(m => [
        m.name,
        m.allocation + '%',
        m.daysOff,
        parseFloat((Math.max(0, workingWindow - m.daysOff) * (m.allocation / 100)).toFixed(1))
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Member Name", "Allocation", "Days Off", "Available Days"]],
        body: rows,
        headStyles: { fillColor: primaryEmerald, halign: 'center' },
        styles: { halign: 'center' },
        columnStyles: { 
            0: { halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' }
        }
    });

    doc.save(`Sprint_Capacity_Report_${teamDisplayName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Helper Utilities
 */
function resetToDefault() {
    if (confirm("Reset all data? This cannot be undone.")) {
        localStorage.removeItem('sprintPlannerState');
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
