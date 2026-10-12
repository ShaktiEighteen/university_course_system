/**
 * Instructor Dashboard Controller: Section assignments, enrolled student rosters,
 * and real-time AJAX grade submissions.
 */

let currentActiveSectionPk = null;

document.addEventListener('DOMContentLoaded', () => {
    loadInstructorSections();
});

async function loadInstructorSections() {
    const container = document.getElementById('instructor-sections-grid');
    if (!container) return;

    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">Loading assigned teaching sections...</div>`;

    try {
        const res = await fetch('/api/instructor/sections/');
        const data = await res.json();

        if (!data.success || data.sections.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No sections currently assigned for this semester.</div>`;
            return;
        }

        container.innerHTML = data.sections.map(sec => {
            const occupancyPct = Math.round((sec.enrolled_count / sec.capacity) * 100);
            return `
                <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span class="course-code">${sec.course_id}</span>
                            <span class="role-tag role-instructor">${sec.section_id}</span>
                        </div>
                        <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem;">${sec.title}</h3>
                        
                        <div class="course-meta">
                            <div class="course-meta-item">
                                <span>Schedule:</span> <strong>${sec.time_slot}</strong>
                            </div>
                            <div class="course-meta-item">
                                <span>Room:</span> <span>${sec.classroom}</span>
                            </div>
                            <div class="course-meta-item">
                                <span>Credits:</span> <span>${sec.credits}</span>
                            </div>
                        </div>

                        <div style="margin-top: 1rem;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.825rem; margin-bottom: 0.25rem;">
                                <span>Enrolled Students</span>
                                <strong>${sec.enrolled_count} / ${sec.capacity} (${occupancyPct}%)</strong>
                            </div>
                            <div class="progress-container">
                                <div class="progress-bar" style="width: ${occupancyPct}%; background-color: ${occupancyPct >= 90 ? 'var(--warning)' : 'var(--success)'};"></div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 1rem; display: flex; justify-content: flex-end;">
                        <button class="btn btn-primary btn-sm" onclick="openRoster(${sec.section_pk}, '${sec.course_id}', '${sec.section_id}')">
                            Manage Roster & Grades →
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 2rem;">Error loading sections: ${err.message}</div>`;
    }
}

async function openRoster(sectionPk, courseCode, secId) {
    currentActiveSectionPk = sectionPk;
    const modalTitle = document.getElementById('roster-modal-title');
    const rosterBody = document.getElementById('roster-table-body');
    if (modalTitle) modalTitle.textContent = `Course Roster: ${courseCode} (${secId})`;

    if (rosterBody) rosterBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">Loading student roster...</td></tr>`;
    openModal('roster-modal');

    try {
        const res = await fetch(`/api/instructor/roster/${sectionPk}/`);
        const data = await res.json();

        if (!data.success) {
            if (rosterBody) rosterBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 2rem;">${data.error}</td></tr>`;
            return;
        }

        if (data.students.length === 0) {
            if (rosterBody) rosterBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No students enrolled yet.</td></tr>`;
            return;
        }

        const validGrades = ['IP', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'P', 'W'];

        rosterBody.innerHTML = data.students.map(st => `
            <tr>
                <td><strong>${st.student_id}</strong></td>
                <td>${st.name}</td>
                <td>${st.dept_name}</td>
                <td>
                    <select class="form-control" id="grade-select-${st.student_id}" style="padding: 0.3rem 0.5rem; font-size: 0.85rem; width: 100px;">
                        ${validGrades.map(g => `<option value="${g}" ${st.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="saveGrade(${sectionPk}, '${st.student_id}')">
                        Save
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        if (rosterBody) rosterBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 2rem;">Network error loading roster.</td></tr>`;
    }
}

async function saveGrade(sectionPk, studentId) {
    const selectElem = document.getElementById(`grade-select-${studentId}`);
    if (!selectElem) return;

    const selectedGrade = selectElem.value;

    try {
        const res = await fetch('/api/instructor/grade/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRF_TOKEN
            },
            body: JSON.stringify({
                section_id: sectionPk,
                student_id: studentId,
                grade: selectedGrade
            })
        });
        const data = await res.json();

        if (data.success) {
            showToast(data.message, 'success');
        } else {
            showToast(data.error || 'Failed to update grade.', 'error');
        }
    } catch (err) {
        showToast('Network error while saving grade.', 'error');
    }
}
