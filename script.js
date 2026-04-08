/**
 * Sprint Capacity Planner
 * Author: Eugen Rof
 * Year: 2026
 * Description: Fixed Share Link logic to ensure all parameters (Team Name, Holidays, etc.) persist.
 */

let team = [
    { name: 'Member 1', allocation: 100, daysOff: 0 },
    { name: 'Member 2', allocation: 100, daysOff: 0 },
    { name: 'Member 3', allocation: 100, daysOff: 0 },
    { name: 'Member 4', allocation: 100, daysOff: 0 },
    { name: 'Member 5', allocation: 100, daysOff: 0 }
];

let startPicker, endPicker;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Flatpickr
    startPicker = flatpickr("#startDate", {
        altInput: true,
        altFormat: "F j, Y",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr) {
            const currentEnd = document.getElementById('endDate').value;
            if (currentEnd && new Date(dateStr) > new Date(currentEnd)) {
                showToast("⚠️ Start date cannot be after end date");
                startPicker.clear();
            } else {
                if (endPicker) endPicker.set('minDate', dateStr);
                calculate();
                saveState();
            }
        }
    });

    endPicker = flatpickr("#endDate", {
        altInput: true,
        altFormat: "F j, Y",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr) {
            const currentStart = document.getElementById('startDate').value;
            if (currentStart && new Date(dateStr) < new Date(currentStart)) {
                showToast("⚠️ End date cannot be before start date");
                endPicker.clear();
            } else {
                if (startPicker) startPicker.set('maxDate', dateStr);
                calculate();
                saveState();
            }
        }
    });

    // LOAD STATE FIRST - This now correctly prioritizes URL over LocalStorage
    loadState();
    renderTable();

    // 2. Team Name Validation
    const teamNameInput = document.getElementById('teamName');
    if (teamNameInput) {
        teamNameInput.addEventListener('input', (e) => {
            const titleValue = e.target.value;
            if (titleValue.length >= 25) {
                if (titleValue.length > 25) {
                    e.target.value = titleValue.substring(0, 25);
                }
                showToast("⚠️ Team name reached the 25 character limit");
            }
            updateMainHeader(e.target.value);
            saveState();
        });
    }

    // Global Input Listeners
    ['sprintDays', 'publicHolidays', 'avgVelocity'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                if (parseFloat(el.value) < 0) {
                    el.value = 0;
                    showToast("⚠️ Values cannot be negative");
                }
                calculate();
            });
        }
    });

    calculate(); 
});

/**
 * Persistence & Sharing Logic
 */
function shareConfiguration() {
    const state = {
        n: document.getElementById('teamName').value,
        sd: document.getElementById('startDate').value,
        ed: document.getElementById('endDate').value,
        s: document.getElementById('sprintDays').value,
        h: document.getElementById('publicHolidays').value,
        v: document.getElementById('avgVelocity').value,
        t: team.map(m => `${encodeURIComponent(m.name)}|${m.allocation}|${m.daysOff}`)
    };
    // Base64 encoding for a clean URL
    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    const shareUrl = `${window.location.origin}${window.location.pathname}?plan=${encodedData}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("🔗 Clean share link copied!");
    });
}

function loadState() {
    const params = new URLSearchParams(window.location.search);
    
    // PRIORITY 1: URL Share Link
    if (params.has('plan')) {
        try {
            const decodedData = JSON.parse(decodeURIComponent(escape(atob(params.get('plan')))));
            
            // Set all inputs
            document.getElementById('teamName').value = decodedData.n || "";
            if (decodedData.sd) startPicker.setDate(decodedData.sd);
            if (decodedData.ed) endPicker.setDate(decodedData.ed);
            document.getElementById('sprintDays').value = decodedData.s || 15;
            document.getElementById('publicHolidays').value = decodedData.h || 0;
            document.getElementById('avgVelocity').value = decodedData.v || 45;
            
            if (decodedData.t) {
                team = decodedData.t.map(str => {
                    const [name, allocation, daysOff] = str.split('|');
                    return { 
                        name: decodeURIComponent(name), 
                        allocation: parseFloat(allocation), 
                        daysOff: parseFloat(daysOff) 
                    };
                });
            }

            updateMainHeader(decodedData.n || "");
            saveState(); // Overwrite local storage with the shared plan
            
            // Clean URL and show confirmation
            window.history.replaceState(null, null, window.location.pathname);
            showToast("✅ Shared plan loaded!");
            return; // Stop here so LocalStorage doesn't overwrite URL data
        } catch (e) { 
            console.error("Failed to parse shared plan", e); 
        }
    }

    // PRIORITY 2: Local Storage
    const localData = localStorage.getItem('sprintPlannerState');
    if (localData) {
        try {
            const savedData = JSON.parse(localData);
            document.getElementById('teamName').value = savedData.teamName || "";
            updateMainHeader(savedData.teamName || "");
            if (savedData.startDate) startPicker.setDate(savedData.startDate);
            if (savedData.endDate) endPicker.setDate(savedData.endDate);
            document.getElementById('sprintDays').value = savedData.sprintDays || 15;
            document.getElementById('publicHolidays').value = savedData.holidays || 0;
            document.getElementById('avgVelocity').value = savedData.velocity || 45;
            team = savedData.team || team;
        } catch(e) { 
            console.error("Failed to load local state", e); 
        }
    }
}

function saveState() {
    const stateToSave = {
        teamName: document.getElementById('teamName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        sprintDays: document.getElementById('sprintDays').value,
        holidays: document.getElementById('publicHolidays').value,
        velocity: document.getElementById('avgVelocity').value,
        team: team
    };
    localStorage.setItem('sprintPlannerState', JSON.stringify(stateToSave));
}

/**
 * UI & Calculation
 */
function updateMainHeader(name) {
    const cleanName = name.trim().substring(0, 25);
    const newTitle = cleanName ? `Sprint Planner | ${cleanName}` : "Sprint Capacity Planner";
    const h1 = document.querySelector('h1');
    if (h1) h1.innerText = newTitle;
    document.title = newTitle; 
}

function calculate() {
    const sprintDaysInput = document.getElementById('sprintDays');
    const holidaysInput = document.getElementById('publicHolidays');
    const avgVelocity = Math.max(0, parseFloat(document.getElementById('avgVelocity').value) || 0);

    let sprintDays = Math.max(0, parseFloat(sprintDaysInput.value) || 0);
    let holidays = Math.max(0, parseFloat(holidaysInput.value) || 0);

    if (holidays > sprintDays) {
        showToast("⚠️ Holidays cannot exceed total sprint days");
        holidays = sprintDays;
        holidaysInput.value = holidays;
    }

    const workingWindow = Math.max(0, sprintDays - holidays);
    let totalAvailableDays = 0;

    team.forEach((member, index) => {
        const available = Math.max(0, (workingWindow - member.daysOff) * (member.allocation / 100));
        const cell = document.getElementById(`avail-${index}`);
        if (cell) cell.innerText = formatNum(available);
        totalAvailableDays += available;
    });

    const baselinePotential = team.length * (sprintDays || 1);
    const capacityRatio = totalAvailableDays / (baselinePotential || 1);
    const capacityPerc = capacityRatio * 100;
    const planVelocity = avgVelocity * capacityRatio;

    document.getElementById('resTotalDays').innerText = `${formatNum(totalAvailableDays)} Days`;
    document.getElementById('resCapacity').innerText = Math.round(capacityPerc) + '%';
    
    const velocityEl = document.getElementById('resPlanVelocity');
    velocityEl.innerText = Math.round(planVelocity);

    let statusColor = "#ef4444"; 
    if (capacityPerc >= 75) statusColor = "#10b981";
    else if (capacityPerc >= 50) statusColor = "#f97316";

    const bar = document.getElementById('capacityBar');
    if (bar) {
        bar.style.width = Math.min(100, capacityPerc) + '%';
        bar.style.backgroundColor = statusColor;
    }
    velocityEl.style.color = statusColor;
    
    saveState();
}

function renderTable() {
    const body = document.getElementById('teamBody');
    if (!body) return;
    body.innerHTML = '';

    team.forEach((member, index) => {
        const row = document.createElement('tr');
        row.className = "row-hover transition-colors";
        row.innerHTML = `
            <td class="px-6 py-4">
                <input type="text" value="${member.name}" maxlength="25" onchange="updateMember(${index}, 'name', this.value)" 
                class="w-full bg-transparent font-semibold border-none focus:ring-0 px-1">
            </td>
            <td class="px-6 py-4 text-center">
                <input type="number" step="1" value="${member.allocation}" onchange="updateMember(${index}, 'allocation', this.value)" 
                class="w-24 text-center bg-slate-50 rounded-lg p-1 border-none focus:ring-1 focus:ring-emerald-500">
            </td>
            <td class="px-6 py-4 text-center">
                <input type="number" step="1" value="${member.daysOff}" onchange="updateMember(${index}, 'daysOff', this.value)" 
                class="w-24 text-center bg-slate-50 rounded-lg p-1 border-none focus:ring-1 focus:ring-emerald-500">
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

function updateMember(index, field, value) {
    if (field === 'name') {
        team[index].name = value.trim() ? value.substring(0, 25) : "Member " + (index + 1);
    } else if (field === 'allocation') {
        team[index].allocation = Math.min(100, Math.max(0, parseFloat(value) || 0));
    } else if (field === 'daysOff') {
        const sprintDays = parseFloat(document.getElementById('sprintDays').value) || 0;
        let val = parseFloat(value) || 0;
        if (val < 0) val = 0;
        else if (val > sprintDays) val = sprintDays;
        team[index].daysOff = val;
    }
    renderTable();
}

function formatNum(num) {
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
}

function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function addRow() { team.push({ name: 'New Member', allocation: 100, daysOff: 0 }); renderTable(); }

function removeRow(index) {
    if (team.length > 1) { team.splice(index, 1); renderTable(); } 
    else { showToast("⚠️ Team must have at least one member"); }
}

function resetToDefault() { 
    if (confirm("Reset all data?")) { 
        localStorage.removeItem('sprintPlannerState'); 
        window.location.reload(); 
    } 
}

// PDF Logic kept as per previous version
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const teamNameInput = document.getElementById('teamName').value.trim().substring(0, 25);
    const teamDisplayName = teamNameInput || "Team";
    const primaryEmerald = [52, 211, 153]; 
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    doc.setFontSize(22);
    doc.setTextColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
    const pdfTitle = teamNameInput ? `Sprint Capacity Planner | ${teamDisplayName}` : "Sprint Capacity Planner";
    doc.text(pdfTitle, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const dateRange = (startDate && endDate) ? ` (${startDate} to ${endDate})` : "";
    doc.text(`Generated on ${new Date().toLocaleDateString()}${dateRange}`, 14, 28);

    doc.autoTable({
        startY: 35,
        head: [['Sprint Metric', 'Value']],
        body: [
            ['Sprint Duration', (startDate && endDate) ? `${startDate} - ${endDate}` : 'Not Specified'],
            ['Sprint Working Days', document.getElementById('sprintDays').value + ' Days'],
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
        formatNum(Math.max(0, workingWindow - m.daysOff) * (m.allocation / 100))
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
