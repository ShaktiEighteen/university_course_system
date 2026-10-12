<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
    String role = (String) session.getAttribute("role");
    if (!"admin".equals(role)) {
        response.sendRedirect("login.jsp");
        return;
    }
    String username = (String) session.getAttribute("username");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal (Java) - University Course Registration</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 1.5rem; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        .btn { padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; text-decoration: none; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-danger { background: #ef4444; color: white; }
        .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .metric-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; text-align: center; }
        .metric-value { font-size: 1.8rem; font-weight: 700; color: #3b82f6; }
        .metric-label { font-size: 0.8rem; text-transform: uppercase; color: #64748b; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h2 style="margin: 0;">☕ Java Servlets Admin Portal</h2>
            <div style="font-size: 0.875rem; color: #64748b;">Logged in as: <strong><%= username %></strong> (Administrator) &bull; MySQL Relational DB</div>
        </div>
        <form action="<%= request.getContextPath() %>/auth/logout" method="POST" style="margin: 0;">
            <button type="submit" class="btn btn-danger">Sign Out</button>
        </form>
    </div>

    <!-- Metrics -->
    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value">32</div>
            <div class="metric-label">Enrolled Students</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">10</div>
            <div class="metric-label">Faculty Instructors</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">5</div>
            <div class="metric-label">Departments</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">17</div>
            <div class="metric-label">Total Courses</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">22</div>
            <div class="metric-label">Active Sections</div>
        </div>
    </div>

    <div class="card">
        <h3>Architecture Overview (Java Servlets / JSP)</h3>
        <p style="color: #475569; font-size: 0.95rem; line-height: 1.6;">
            This alternate backend conforms to the exact same 3NF database schema (departments, students, instructors, courses, sections, time slots, classrooms, prereqs, teaches, takes).
            It implements connection pooling through <strong>HikariCP</strong>, protects against SQL injection through parameterized <code>PreparedStatement</code> objects, enforces ACID transactions on course registrations, and exposes identical REST JSON endpoints.
        </p>
    </div>
</body>
</html>
