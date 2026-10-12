<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
    String role = (String) session.getAttribute("role");
    if (!"student".equals(role)) {
        response.sendRedirect("login.jsp");
        return;
    }
    String username = (String) session.getAttribute("username");
    String studentId = (String) session.getAttribute("studentId");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Portal (Java) - University Course Registration</title>
    <link rel="stylesheet" href="../static/css/style.css">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 1.5rem; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        .btn { padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block; }
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
            <h2 style="margin: 0;">☕ Java Servlets Student Portal</h2>
            <div style="font-size: 0.875rem; color: #64748b;">Logged in as: <strong><%= username %></strong> (<%= studentId %>) &bull; Backend: JDBC + HikariCP</div>
        </div>
        <form action="<%= request.getContextPath() %>/auth/logout" method="POST" style="margin: 0;">
            <button type="submit" class="btn btn-danger">Sign Out</button>
        </form>
    </div>

    <!-- Active Registered Courses -->
    <div class="card">
        <h3>My Registered Courses (Fall 2026)</h3>
        <table>
            <thead>
                <tr>
                    <th>Course Code</th>
                    <th>Title</th>
                    <th>Section</th>
                    <th>Credits</th>
                    <th>Classroom</th>
                    <th>Schedule</th>
                    <th>Instructor</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody id="student-schedule-body">
                <tr><td colspan="8" style="text-align: center;">Loading registered courses...</td></tr>
            </tbody>
        </table>
    </div>

    <!-- Available Catalog -->
    <div class="card">
        <h3>Course Catalog (Live JDBC Query)</h3>
        <table>
            <thead>
                <tr>
                    <th>Course</th>
                    <th>Title</th>
                    <th>Section</th>
                    <th>Time Slot</th>
                    <th>Room</th>
                    <th>Instructor</th>
                    <th>Seats Left</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody id="catalog-body">
                <tr><td colspan="8" style="text-align: center;">Loading catalog...</td></tr>
            </tbody>
        </table>
    </div>

    <script>
        async function loadData() {
            // Load Schedule
            const schedRes = await fetch('<%= request.getContextPath() %>/api/registration/timetable?semester=Fall&year=2026');
            const schedData = await schedRes.json();
            const schedBody = document.getElementById('student-schedule-body');
            if (schedData.success && schedData.schedule.length > 0) {
                schedBody.innerHTML = schedData.schedule.map(s => `
                    <tr>
                        <td><strong>\${s.course_id}</strong></td>
                        <td>\${s.title}</td>
                        <td>\${s.section_id}</td>
                        <td>\${s.credits}</td>
                        <td>\${s.building} \${s.room_number}</td>
                        <td>\${s.day} \${s.start_time}-\${s.end_time}</td>
                        <td>\${s.instructor}</td>
                        <td>
                            <button class="btn btn-danger" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;" onclick="dropCourse('\${s.course_id}', '\${s.section_id}')">Drop</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                schedBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8;">No courses currently registered.</td></tr>`;
            }

            // Load Catalog
            const catRes = await fetch('<%= request.getContextPath() %>/api/courses/catalog?semester=Fall&year=2026');
            const catData = await catRes.json();
            const catBody = document.getElementById('catalog-body');
            if (catData.success && catData.sections.length > 0) {
                catBody.innerHTML = catData.sections.map(sec => `
                    <tr>
                        <td><strong>\${sec.courseId}</strong></td>
                        <td>\${sec.courseTitle}</td>
                        <td>\${sec.sectionId}</td>
                        <td>\${sec.timeSlotDisplay}</td>
                        <td>\${sec.building} \${sec.roomNumber}</td>
                        <td>\${sec.instructorName}</td>
                        <td>\${sec.capacity - sec.enrolledCount} / \${sec.capacity}</td>
                        <td>
                            <button class="btn btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;" onclick="registerCourse('\${sec.courseId}', '\${sec.sectionId}')">Register</button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        async function registerCourse(courseId, secId) {
            const formData = new URLSearchParams();
            formData.append('course_id', courseId);
            formData.append('section_id', secId);
            formData.append('semester', 'Fall');
            formData.append('year', '2026');

            const res = await fetch('<%= request.getContextPath() %>/api/registration/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            const data = await res.json();
            alert(data.message || data.error);
            loadData();
        }

        async function dropCourse(courseId, secId) {
            if (!confirm('Drop course ' + courseId + '?')) return;
            const formData = new URLSearchParams();
            formData.append('course_id', courseId);
            formData.append('section_id', secId);
            formData.append('semester', 'Fall');
            formData.append('year', '2026');

            const res = await fetch('<%= request.getContextPath() %>/api/registration/drop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            const data = await res.json();
            alert(data.message || data.error);
            loadData();
        }

        loadData();
    </script>
</body>
</html>
