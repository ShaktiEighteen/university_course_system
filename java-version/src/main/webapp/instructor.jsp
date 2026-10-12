<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
    String role = (String) session.getAttribute("role");
    if (!"instructor".equals(role)) {
        response.sendRedirect("login.jsp");
        return;
    }
    String username = (String) session.getAttribute("username");
    String instructorId = (String) session.getAttribute("instructorId");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty Portal (Java) - University Course Registration</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 1.5rem; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        .btn { padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; text-decoration: none; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-danger { background: #ef4444; color: white; }
        .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th, td { padding: 0.75rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
        th { background: #f1f5f9; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h2 style="margin: 0;">☕ Java Servlets Faculty Portal</h2>
            <div style="font-size: 0.875rem; color: #64748b;">Logged in as: <strong><%= username %></strong> (<%= instructorId %>) &bull; MySQL JDBC</div>
        </div>
        <form action="<%= request.getContextPath() %>/auth/logout" method="POST" style="margin: 0;">
            <button type="submit" class="btn btn-danger">Sign Out</button>
        </form>
    </div>

    <!-- Assigned Sections -->
    <div class="card">
        <h3>My Assigned Sections</h3>
        <table>
            <thead>
                <tr>
                    <th>Course Code</th>
                    <th>Course Title</th>
                    <th>Section</th>
                    <th>Room</th>
                    <th>Schedule</th>
                    <th>Enrolled / Capacity</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody id="instructor-sections-body">
                <tr><td colspan="7" style="text-align: center;">Loading assigned teaching sections...</td></tr>
            </tbody>
        </table>
    </div>

    <!-- Enrolled Students Roster & Grades -->
    <div id="roster-card" class="card" style="display: none;">
        <h3 id="roster-title">Section Roster &amp; Grades</h3>
        <table>
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th>Current Grade</th>
                    <th>Update Grade</th>
                </tr>
            </thead>
            <tbody id="roster-body"></tbody>
        </table>
    </div>

    <script>
        let currentCourse = '', currentSec = '';

        async function loadSections() {
            const res = await fetch('<%= request.getContextPath() %>/api/instructor/sections?semester=Fall&year=2026');
            const data = await res.json();
            const body = document.getElementById('instructor-sections-body');

            if (data.success && data.sections.length > 0) {
                body.innerHTML = data.sections.map(s => `
                    <tr>
                        <td><strong>\${s.course_id}</strong></td>
                        <td>\${s.title}</td>
                        <td>\${s.section_id}</td>
                        <td>\${s.classroom}</td>
                        <td>\${s.time_slot}</td>
                        <td>\${s.enrolled_count} / \${s.capacity}</td>
                        <td>
                            <button class="btn btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;" onclick="viewRoster('\${s.course_id}', '\${s.section_id}')">View Roster</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                body.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8;">No teaching sections assigned.</td></tr>`;
            }
        }

        async function viewRoster(courseId, secId) {
            currentCourse = courseId;
            currentSec = secId;
            const res = await fetch(`<%= request.getContextPath() %>/api/instructor/roster?course_id=\${courseId}&section_id=\${secId}&semester=Fall&year=2026`);
            const data = await res.json();

            document.getElementById('roster-card').style.display = 'block';
            document.getElementById('roster-title').textContent = `Roster for \${courseId} (\${secId})`;
            const body = document.getElementById('roster-body');

            if (data.success && data.roster.length > 0) {
                body.innerHTML = data.roster.map(st => `
                    <tr>
                        <td><strong>\${st.student_id}</strong></td>
                        <td>\${st.name}</td>
                        <td>\${st.dept_name}</td>
                        <td>\${st.grade}</td>
                        <td>
                            <select id="grade-\${st.student_id}" style="padding: 0.25rem; border-radius: 4px;">
                                <option value="A" \${st.grade === 'A' ? 'selected' : ''}>A</option>
                                <option value="B" \${st.grade === 'B' ? 'selected' : ''}>B</option>
                                <option value="C" \${st.grade === 'C' ? 'selected' : ''}>C</option>
                                <option value="D" \${st.grade === 'D' ? 'selected' : ''}>D</option>
                                <option value="F" \${st.grade === 'F' ? 'selected' : ''}>F</option>
                                <option value="IP" \${st.grade === 'IP' ? 'selected' : ''}>IP</option>
                            </select>
                            <button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="saveGrade('\${st.student_id}')">Save</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                body.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No enrolled students.</td></tr>`;
            }
        }

        async function saveGrade(studentId) {
            const grade = document.getElementById(`grade-\${studentId}`).value;
            const formData = new URLSearchParams();
            formData.append('student_id', studentId);
            formData.append('course_id', currentCourse);
            formData.append('section_id', currentSec);
            formData.append('semester', 'Fall');
            formData.append('year', '2026');
            formData.append('grade', grade);

            const res = await fetch('<%= request.getContextPath() %>/api/instructor/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            const data = await res.json();
            alert(data.message || data.error);
            viewRoster(currentCourse, currentSec);
        }

        loadSections();
    </script>
</body>
</html>
