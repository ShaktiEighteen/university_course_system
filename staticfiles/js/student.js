/**
 * Student Dashboard Controller: Catalog browsing, dynamic AJAX registration, 
 * live seat updates, weekly timetable rendering, and grade history.
 */

document.addEventListener('DOMContentLoaded', () => {
    loadCatalog();
    loadTimetable();
    loadGrades();

    // Hook up filter listeners
    const searchInput = document.getElementById('search-input');
    const deptFilter = document.getElementById('dept-filter');
    const creditsFilter = document.getElementById('credits-filter');

    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(loadCatalog, 300);
        });
    }

    if (deptFilter) deptFilter.addEventListener('change', loadCatalog);
    if (creditsFilter) creditsFilter.addEventListener('change', loadCatalog);
});

async function loadCatalog(page = 1) {
    const container = document.getElementById('catalog-container');
    if (!container) return;

    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">Loading course catalog...</div>`;

    const search = document.getElementById('search-input')?.value || '';
    const dept = document.getElementById('dept-filter')?.value || '';
    const credits = document.getElementById('credits-filter')?.value || '';

    const url = `/api/courses/catalog/?search=${encodeURIComponent(search)}&dept=${encodeURIComponent(dept)}&credits=${encodeURIComponent(credits)}&page=${page}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.success || data.sections.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No course sections found matching your criteria.</div>`;
            return;
        }

        container.innerHTML = data.sections.map(sec => {
            let seatBadgeClass = 'seat-available';
            if (sec.available_seats === 0) seatBadgeClass = 'seat-full';
            else if (sec.available_seats <= 5) seatBadgeClass = 'seat-low';

            // Button status
            let buttonHtml = '';
            if (sec.is_registered) {
                buttonHtml = `<button class="btn btn-secondary btn-sm" disabled style="opacity: 0.8;">✓ Enrolled</button>`;
            } else if (!sec.prereqs_met) {
                buttonHtml = `<button class="btn btn-secondary btn-sm" disabled title="Requires: ${sec.missing_prereqs.join(', ')}">🔒 Prereq Needed</button>`;
            } else if (sec.is_full) {
                buttonHtml = `<button class="btn btn-danger btn-sm" disabled>Full</button>`;
            } else if (sec.has_clash) {
                buttonHtml = `<button class="btn btn-warning btn-sm" onclick="registerCourse(${sec.id})" title="${sec.clash_reason}">⚠ Time Clash</button>`;
            } else {
                buttonHtml = `<button class="btn btn-primary btn-sm" onclick="registerCourse(${sec.id})">Register</button>`;
            }

            const prereqDisplay = sec.prerequisites.length > 0 
                ? `<div class="course-meta-item" style="color: ${sec.prereqs_met ? 'var(--text-muted)' : 'var(--danger)'};">
                     <span>Prereqs:</span> <strong>${sec.prerequisites.join(', ')}</strong>
                   </div>` 
                : `<div class="course-meta-item"><span>Prereqs:</span> <em>None</em></div>`;

            const clashWarning = sec.has_clash && !sec.is_registered
                ? `<div style="margin-top: 0.5rem; font-size: 0.775rem; color: var(--warning); display: flex; align-items: center; gap: 0.3rem;">
                     <span>⚠ ${sec.clash_reason}</span>
                   </div>`
                : '';

            return `
                <div class="course-card">
                    <div>
                        <div class="course-card-header">
                            <div>
                                <span class="course-code">${sec.course_id}</span>
                                <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.4rem;">(${sec.section_id})</span>
                            </div>
                            <span class="seat-badge ${seatBadgeClass}">
                                ${sec.available_seats} / ${sec.capacity} seats left
                            </span>
                        </div>
                        <h3 class="course-title">${sec.title}</h3>
                        <div class="course-meta">
                            <div class="course-meta-item">
                                <span>Dept:</span> <strong>${sec.dept_name}</strong>
                                <span style="margin-left: auto;">Credits: <strong>${sec.credits}</strong></span>
                            </div>
                            <div class="course-meta-item">
                                <span>Time:</span> <span>${sec.time_slot}</span>
                            </div>
                            <div class="course-meta-item">
                                <span>Room:</span> <span>${sec.classroom}</span>
                            </div>
                            <div class="course-meta-item">
                                <span>Instructor:</span> <strong>${sec.instructor}</strong>
                            </div>
                            ${prereqDisplay}
                            ${clashWarning}
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                        ${buttonHtml}
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 2rem;">Error loading course catalog: ${err.message}</div>`;
    }
}

async function registerCourse(sectionId) {
    try {
        const res = await fetch('/api/registration/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRF_TOKEN
            },
            body: JSON.stringify({ section_id: sectionId })
        });
        const data = await res.json();

        if (data.success) {
            showToast(data.message, 'success');
            loadCatalog();
            loadTimetable();
        } else {
            showToast(data.error || 'Registration failed.', 'error');
        }
    } catch (err) {
        showToast('Network error during registration.', 'error');
    }
}

async function dropCourse(sectionId, courseCode) {
    if (!confirm(`Are you sure you want to drop course ${courseCode}? This will immediately release your seat.`)) {
        return;
    }

    try {
        const res = await fetch('/api/registration/drop/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRF_TOKEN
            },
            body: JSON.stringify({ section_id: sectionId })
        });
        const data = await res.json();

        if (data.success) {
            showToast(data.message, 'success');
            loadTimetable();
            loadCatalog();
        } else {
            showToast(data.error || 'Failed to drop course.', 'error');
        }
    } catch (err) {
        showToast('Network error while dropping course.', 'error');
    }
}

async function loadTimetable() {
    const listContainer = document.getElementById('enrolled-courses-list');
    const creditCountElem = document.getElementById('enrolled-credits-count');
    const creditProgressBar = document.getElementById('credit-progress-bar');
    if (!listContainer) return;

    try {
        const res = await fetch('/api/registration/timetable/');
        const data = await res.json();

        if (!data.success) return;

        // Update Credits Meter
        if (creditCountElem) {
            creditCountElem.textContent = `${data.total_credits} / ${data.max_credits} cr`;
        }
        if (creditProgressBar) {
            const pct = Math.min(100, Math.round((data.total_credits / data.max_credits) * 100));
            creditProgressBar.style.width = `${pct}%`;
            creditProgressBar.style.backgroundColor = pct > 90 ? 'var(--warning)' : 'var(--primary)';
        }

        // Render List
        if (data.schedule.length === 0) {
            listContainer.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">You are not currently registered for any courses this semester.</td></tr>`;
            renderTimetableGrid([]);
            return;
        }

        listContainer.innerHTML = data.schedule.map(item => `
            <tr>
                <td><strong>${item.course_id}</strong> (${item.sec_code})</td>
                <td>${item.title}</td>
                <td>${item.credits}</td>
                <td>${item.time_slot}</td>
                <td>${item.classroom}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="dropCourse(${item.section_id}, '${item.course_id}')">Drop</button>
                </td>
            </tr>
        `).join('');

        renderTimetableGrid(data.schedule);

    } catch (err) {
        console.error('Failed to load timetable:', err);
    }
}

function renderTimetableGrid(schedule) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const gridContainer = document.getElementById('timetable-weekly-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = days.map(day => {
        const dayItems = schedule.filter(s => s.day === day);
        const itemsHtml = dayItems.length > 0 
            ? dayItems.map(item => `
                <div class="schedule-item">
                    <h4>${item.course_id} (${item.sec_code})</h4>
                    <div style="color: var(--text-secondary); font-size: 0.775rem;">${item.start_time} - ${item.end_time}</div>
                    <div style="color: var(--text-muted); font-size: 0.75rem;">${item.classroom}</div>
                    <div style="color: var(--text-muted); font-size: 0.75rem;">${item.instructor}</div>
                </div>
              `).join('')
            : `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1.5rem 0;">No classes</div>`;

        return `
            <div class="day-column">
                <div class="day-header">${day}</div>
                ${itemsHtml}
            </div>
        `;
    }).join('');
}

async function loadGrades() {
    const gradesBody = document.getElementById('grades-table-body');
    const cgpaBadge = document.getElementById('student-cgpa-badge');
    const earnedCreditsBadge = document.getElementById('student-earned-credits');
    if (!gradesBody) return;

    try {
        const res = await fetch('/api/registration/grades/');
        const data = await res.json();

        if (!data.success) return;

        if (cgpaBadge) cgpaBadge.textContent = data.cgpa.toFixed(2);
        if (earnedCreditsBadge) earnedCreditsBadge.textContent = `${data.total_earned_credits} cr`;

        if (data.records.length === 0) {
            gradesBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No grade history recorded yet.</td></tr>`;
            return;
        }

        gradesBody.innerHTML = data.records.map(rec => {
            const gradeClass = ['A+', 'A', 'A-'].includes(rec.grade) ? 'seat-available' : (rec.grade === 'F' ? 'seat-full' : 'seat-low');
            return `
                <tr>
                    <td><strong>${rec.course_id}</strong></td>
                    <td>${rec.title}</td>
                    <td>${rec.semester} ${rec.year}</td>
                    <td>${rec.credits}</td>
                    <td>
                        <span class="seat-badge ${gradeClass}">${rec.grade}</span>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('Failed to load grades:', err);
    }
}
