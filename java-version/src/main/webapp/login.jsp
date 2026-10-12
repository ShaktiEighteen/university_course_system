<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Java Servlets Portal - University Course Registration</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2.25rem; width: 100%; max-width: 440px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 1.25rem; }
        .form-label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.35rem; color: #475569; }
        .form-control { width: 100%; box-sizing: border-box; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; }
        .btn { display: block; width: 100%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
        .btn:hover { background: #2563eb; }
        .chip { display: block; width: 100%; text-align: left; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.825rem; margin-bottom: 0.5rem; cursor: pointer; }
        .chip:hover { background: #e2e8f0; }
    </style>
</head>
<body>
    <div class="card">
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">☕</div>
            <h2 style="margin: 0; font-size: 1.4rem;">Java Servlets / JSP Backend</h2>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #64748b;">HikariCP Connection Pool &bull; MySQL JDBC</p>
        </div>

        <form action="<%= request.getContextPath() %>/auth/login" method="POST">
            <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" id="username" name="username" class="form-control" placeholder="Username" required>
            </div>
            <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="password" name="password" class="form-control" placeholder="Password" required>
            </div>
            <button type="submit" class="btn">Sign In to Java Portal</button>
        </form>

        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 0.6rem;">Quick Demo Fill</div>
            <button class="chip" onclick="fill('stud_cs01', 'pass123')">Student: Alice Johnson (stud_cs01 / pass123)</button>
            <button class="chip" onclick="fill('inst_cs101', 'teach123')">Instructor: Dr. Alan Turing (inst_cs101 / teach123)</button>
            <button class="chip" onclick="fill('admin', 'admin123')">Admin: System Admin (admin / admin123)</button>
        </div>
    </div>
    <script>
        function fill(u, p) {
            document.getElementById('username').value = u;
            document.getElementById('password').value = p;
        }
    </script>
</body>
</html>
