package com.university.servlet;

import com.google.gson.Gson;
import com.university.dao.UserDAO;
import com.university.model.UserAccount;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/auth/*")
public class AuthServlet extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        if ("/login".equals(path)) {
            String username = req.getParameter("username");
            String password = req.getParameter("password");

            try {
                UserAccount user = userDAO.authenticate(username, password);
                if (user != null) {
                    HttpSession session = req.getSession(true);
                    session.setAttribute("user", user);
                    session.setAttribute("username", user.getUsername());
                    session.setAttribute("role", user.getRole());

                    if ("student".equals(user.getRole())) {
                        String studentId = userDAO.getStudentIdByUserId(user.getUserId());
                        session.setAttribute("studentId", studentId);
                    } else if ("instructor".equals(user.getRole())) {
                        String instructorId = userDAO.getInstructorIdByUserId(user.getUserId());
                        session.setAttribute("instructorId", instructorId);
                    }

                    Map<String, Object> res = new HashMap<>();
                    res.put("success", true);
                    res.put("role", user.getRole());
                    res.put("redirect_url", user.getRole().equals("student") ? "student.jsp" : (user.getRole().equals("instructor") ? "instructor.jsp" : "admin.jsp"));
                    out.print(gson.toJson(res));
                } else {
                    resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    Map<String, Object> res = new HashMap<>();
                    res.put("success", false);
                    res.put("error", "Invalid username or password.");
                    out.print(gson.toJson(res));
                }
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                Map<String, Object> res = new HashMap<>();
                res.put("success", false);
                res.put("error", e.getMessage());
                out.print(gson.toJson(res));
            }
        } else if ("/logout".equals(path)) {
            HttpSession session = req.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            resp.sendRedirect(req.getContextPath() + "/login.jsp");
        }
    }
}
