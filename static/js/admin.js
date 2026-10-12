/**
 * Admin Dashboard Controller: Real-time CRUD management for Courses,
 * Sections, Faculty, Students, Departments, Classrooms, and Time Slots.
 */

let helperMetadata = {};

document.addEventListener('DOMContentLoaded', () => {
    loadAdminOverview();
    loadHelpers();
    loadAdminCourses();
    loadAdminSections();
    loadAdminStudents();
    loadAdminInstructors();
    loadAdminDepartments();
});

async function loadAdminOverview() {
    try {
        const res = await fetch('/api/admin/overview/');
        const data = await res.json();
        if (data.success) {
            document.getElementById('stat-students').textContent = data.stats.total_students;
            document.getElementById('stat-instructors').textContent = data.stats.total_instructors;
            document.getElementById('stat-departments').textContent = data.stats.total_departments;
            document.getElementById('stat-courses').textContent = data.stats.total_courses;
            document.getElementById('stat-sections').textContent = data.stats.total_sections;
            document.getElementById('stat-enrollments').textContent = data.stats.total_enrollments;
        }
    } catch (err) {
        console.error('Failed to load admin stats:', err);
    }
}

async function loadHelpers() {
    try {
        const res = await fetch('/api/admin/helpers/');
        const data = await res.json();
        if (data.success) {
            helperMetadata = data;
            populateDropdowns();
        }
    } catch (err) {
        console.error('Failed to load metadata helpers:', err);
    }
}

function populateDropdowns() {
    // Populate Department dropdowns
    const deptSelects = document.querySelectorAll('.select-dept-populate');
    deptSelects.forEach(sel => {
        sel.innerHTML = `<option value="">Select Department</option>` + 
            helperMetadata.departments.map(d => `<option value="${d.dept_name}">${d.dept_name}</option>`).join('');
    });

    // Populate Course dropdowns
    const courseSelects = document.querySelectorAll('.select-course-populate');
    courseSelects.forEach(sel => {
        sel.innerHTML = `<option value="">Select Course</option>` + 
            helperMetadata.courses.map(c => `<option value="${c.course_id}">${c.course_id} - ${c.title}</option>`).join('');
    });

    // Populate Classroom dropdowns
    const roomSelects = document.querySelectorAll('.select-room-populate');
    roomSelects.forEach(sel => {
        sel.innerHTML = `<option value="">Select Classroom</option>` + 
            helperMetadata.classrooms.map(r => `<option value="${r.id}">${r.building} ${r.room_number} (Cap: ${r.capacity})</option>`).join('');
    });

    // Populate TimeSlot dropdowns
    const tsSelects = document.querySelectorAll('.select-timeslot-populate');
    tsSelects.forEach(sel => {
        sel.innerHTML = `<option value="">Select Time Slot</option>` + 
            helperMetadata.timeslots.map(t => `<option value="${t.time_slot_id}">${t.time_slot_id}: ${t.day} ${t.start_time.substring(0,5)}-${t.end_time.substring(0,5)}</option>`).join('');
    });

    // Populate Instructor dropdowns
    const instSelects = document.querySelectorAll('.select-inst-populate');
    instSelects.forEach(sel => {
        sel.innerHTML = `<option value="">Assign Instructor (Optional)</option>` + 
            helperMetadata.instructors.map(i => `<option value="${i.instructor_id}">${i.name} (${i.instructor_id})</option>`).join('');
    });

    // Populate Prerequisite multi-select checkboxes
    const prereqContainer = document.getElementById('prereq-options-container');
    if (prereqContainer) {
        prereqContainer.innerHTML = helperMetadata.courses.map(c => `
            <label style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; margin-right: 0.75rem;">
                <input type="checkbox" name="prereqs" value="${c.course_id}"> ${c.course_id}
            </label>
        `).join('');
    }
}

// 1. COURSES CRUD
async function loadAdminCourses() {
    const tableBody = document.getElementById('admin-courses-table-body');
    if (!tableBody) return;

    try {
        const res = await fetch('/api/admin/courses/');
        const data = await res.json();
        if (!data.success) return;

        tableBody.innerHTML = data.courses.map(c => `
            <tr>
                <td><strong>${c.course_id}</strong></td>
                <td>${c.title}</td>
                <td>${c.dept_name}</td>
                <td>${c.credits}</td>
                <td>${c.prerequisites.length > 0 ? c.prerequisites.join(', ') : '<em>None</em>'}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteCourse('${c.course_id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="6" style="color: var(--danger); text-align: center;">Error loading courses.</td></tr>`;
    }
}

async function handleCreateCourse(e) {
    e.preventDefault();
    const courseId = document.getElementById('new-course-id').value.trim().toUpperCase();
    const title = document.getElementById('new-course-title').value.trim();
    const deptName = document.getElementById('new-course-dept').value;
    const credits = document.getElementById('new-course-credits').value;

    const prereqBoxes = document.querySelectorAll('input[name="prereqs"]:checked');
    const prereqs = Array.from(prereqBoxes).map(b => b.value);

    try {
        const res = await fetch('/api/admin/courses/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
            body: JSON.stringify({ course_id: courseId, title, dept_name: deptName, credits, prerequisites: prereqs })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Course ${courseId} created successfully!`, 'success');
            closeModal('create-course-modal');
            document.getElementById('form-create-course').reset();
            loadAdminCourses();
            loadHelpers();
            loadAdminOverview();
        } else {
            showToast(data.error || 'Failed to create course.', 'error');
        }
    } catch (err) {
        showToast('Network error creating course.', 'error');
    }
}

async function deleteCourse(courseId) {
    if (!confirm(`Delete course ${courseId}? This will remove associated prerequisites and cannot be undone.`)) return;
    try {
        const res = await fetch(`/api/admin/courses/${courseId}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': CSRF_TOKEN }
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            loadAdminCourses();
            loadHelpers();
            loadAdminOverview();
        } else {
            showToast(data.error || 'Failed to delete course.', 'error');
        }
    } catch (err) {
        showToast('Error deleting course.', 'error');
    }
}

// 2. SECTIONS CRUD
async function loadAdminSections() {
    const tableBody = document.getElementById('admin-sections-table-body');
    if (!tableBody) return;

    try {
        const res = await fetch('/api/admin/sections/');
        const data = await res.json();
        if (!data.success) return;

        tableBody.innerHTML = data.sections.map(s => `
            <tr>
                <td><strong>${s.course_id}</strong></td>
                <td>${s.section_id}</td>
                <td>${s.course_title}</td>
                <td>${s.time_slot}</td>
                <td>${s.classroom}</td>
                <td>${s.instructor}</td>
                <td>${s.enrolled_count} / ${s.capacity}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteSection(${s.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="8" style="color: var(--danger); text-align: center;">Error loading sections.</td></tr>`;
    }
}

async function handleCreateSection(e) {
    e.preventDefault();
    const courseId = document.getElementById('new-section-course').value;
    const sectionId = document.getElementById('new-section-code').value.trim().toUpperCase();
    const semester = document.getElementById('new-section-semester').value;
    const year = document.getElementById('new-section-year').value;
    const roomId = document.getElementById('new-section-room').value;
    const tsId = document.getElementById('new-section-timeslot').value;
    const capacity = document.getElementById('new-section-capacity').value;
    const instId = document.getElementById('new-section-instructor').value;

    try {
        const res = await fetch('/api/admin/sections/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
            body: JSON.stringify({
                course_id: courseId,
                section_id: sectionId,
                semester,
                year,
                classroom_id: roomId,
                time_slot_id: tsId,
                capacity,
                instructor_id: instId || null
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Section scheduled successfully!', 'success');
            closeModal('create-section-modal');
            document.getElementById('form-create-section').reset();
            loadAdminSections();
            loadAdminOverview();
        } else {
            showToast(data.error || 'Failed to schedule section.', 'error');
        }
    } catch (err) {
        showToast('Network error creating section.', 'error');
    }
}

async function deleteSection(sectionId) {
    if (!confirm('Are you sure you want to delete this section? All enrollments will be removed.')) return;
    try {
        const res = await fetch(`/api/admin/sections/${sectionId}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': CSRF_TOKEN }
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            loadAdminSections();
            loadAdminOverview();
        } else {
            showToast(data.error, 'error');
        }
    } catch (err) {
        showToast('Error deleting section.', 'error');
    }
}

// 3. STUDENTS CRUD
async function loadAdminStudents() {
    const tableBody = document.getElementById('admin-students-table-body');
    if (!tableBody) return;

    try {
        const res = await fetch('/api/admin/students/');
        const data = await res.json();
        if (!data.success) return;

        tableBody.innerHTML = data.students.map(st => `
            <tr>
                <td><strong>${st.student_id}</strong></td>
                <td>${st.name}</td>
                <td>${st.dept_name}</td>
                <td>${st.tot_cred} cr</td>
                <td>${st.username}</td>
                <td>${st.email}</td>
            </tr>
        `).join('');
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="6" style="color: var(--danger); text-align: center;">Error loading students.</td></tr>`;
    }
}

async function handleCreateStudent(e) {
    e.preventDefault();
    const studentId = document.getElementById('new-student-id').value.trim().toUpperCase();
    const name = document.getElementById('new-student-name').value.trim();
    const dept = document.getElementById('new-student-dept').value;
    const username = document.getElementById('new-student-username').value.trim().toLowerCase();
    const password = document.getElementById('new-student-password').value || 'pass123';

    try {
        const res = await fetch('/api/admin/students/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
            body: JSON.stringify({ student_id: studentId, name, dept_name: dept, username, password })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Student ${studentId} added!`, 'success');
            closeModal('create-student-modal');
            document.getElementById('form-create-student').reset();
            loadAdminStudents();
            loadAdminOverview();
        } else {
            showToast(data.error || 'Failed to add student.', 'error');
        }
    } catch (err) {
        showToast('Error creating student.', 'error');
    }
}

// 4. INSTRUCTORS CRUD
async function loadAdminInstructors() {
    const tableBody = document.getElementById('admin-instructors-table-body');
    if (!tableBody) return;

    try {
        const res = await fetch('/api/admin/instructors/');
        const data = await res.json();
        if (!data.success) return;

        tableBody.innerHTML = data.instructors.map(i => `
            <tr>
                <td><strong>${i.instructor_id}</strong></td>
                <td>${i.name}</td>
                <td>${i.dept_name}</td>
                <td>$${parseFloat(i.salary).toLocaleString()}</td>
                <td>${i.username}</td>
                <td>${i.email}</td>
            </tr>
        `).join('');
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="6" style="color: var(--danger); text-align: center;">Error loading instructors.</td></tr>`;
    }
}

async function handleCreateInstructor(e) {
    e.preventDefault();
    const instId = document.getElementById('new-inst-id').value.trim().toUpperCase();
    const name = document.getElementById('new-inst-name').value.trim();
    const dept = document.getElementById('new-inst-dept').value;
    const salary = document.getElementById('new-inst-salary').value;
    const username = document.getElementById('new-inst-username').value.trim().toLowerCase();
    const password = document.getElementById('new-inst-password').value || 'teach123';

    try {
        const res = await fetch('/api/admin/instructors/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
            body: JSON.stringify({ instructor_id: instId, name, dept_name: dept, salary, username, password })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Instructor ${name} added!`, 'success');
            closeModal('create-instructor-modal');
            document.getElementById('form-create-instructor').reset();
            loadAdminInstructors();
            loadHelpers();
            loadAdminOverview();
        } else {
            showToast(data.error || 'Failed to add instructor.', 'error');
        }
    } catch (err) {
        showToast('Error creating instructor.', 'error');
    }
}

// 5. DEPARTMENTS CRUD
async function loadAdminDepartments() {
    const tableBody = document.getElementById('admin-departments-table-body');
    if (!tableBody) return;

    try {
        const res = await fetch('/api/admin/departments/');
        const data = await res.json();
        if (!data.success) return;

        tableBody.innerHTML = data.departments.map(d => `
            <tr>
                <td><strong>${d.dept_name}</strong></td>
                <td>${d.building}</td>
                <td>$${parseFloat(d.budget).toLocaleString()}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteDepartment('${d.dept_name}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="4" style="color: var(--danger); text-align: center;">Error loading departments.</td></tr>`;
    }
}

async function handleCreateDepartment(e) {
    e.preventDefault();
    const deptName = document.getElementById('new-dept-name').value.trim();
    const building = document.getElementById('new-dept-bldg').value.trim();
    const budget = document.getElementById('new-dept-budget').value;

    try {
        const res = await fetch('/api/admin/departments/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': CSRF_TOKEN },
            body: JSON.stringify({ dept_name: deptName, building, budget })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Department ${deptName} created!`, 'success');
            closeModal('create-dept-modal');
            document.getElementById('form-create-dept').reset();
            loadAdminDepartments();
            loadHelpers();
            loadAdminOverview();
        } else {
            showToast(data.error || 'Failed to create department.', 'error');
        }
    } catch (err) {
        showToast('Error creating department.', 'error');
    }
}

async function deleteDepartment(deptName) {
    if (!confirm(`Delete department ${deptName}? Courses and faculty must not be attached.`)) return;
    try {
        const res = await fetch(`/api/admin/departments/${encodeURIComponent(deptName)}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': CSRF_TOKEN }
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            loadAdminDepartments();
            loadHelpers();
            loadAdminOverview();
        } else {
            showToast(data.error, 'error');
        }
    } catch (err) {
        showToast('Error deleting department.', 'error');
    }
}
