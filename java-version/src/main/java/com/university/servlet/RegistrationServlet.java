package com.university.servlet;

import com.google.gson.Gson;
import com.university.dao.RegistrationDAO;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/registration/*")
public class RegistrationServlet extends HttpServlet {

    private final RegistrationDAO regDAO = new RegistrationDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null || !"student".equals(session.getAttribute("role"))) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Unauthorized: Student login required.");
            out.print(gson.toJson(res));
            return;
        }

        String studentId = (String) session.getAttribute("studentId");

        if ("/register".equals(path)) {
            String courseId = req.getParameter("course_id");
            String sectionId = req.getParameter("section_id");
            String semester = req.getParameter("semester") != null ? req.getParameter("semester") : "Fall";
            int year = req.getParameter("year") != null ? Integer.parseInt(req.getParameter("year")) : 2026;

            try {
                String result = regDAO.registerStudent(studentId, courseId, sectionId, semester, year);
                Map<String, Object> res = new HashMap<>();
                if ("SUCCESS".equals(result)) {
                    res.put("success", true);
                    res.put("message", "Successfully registered for " + courseId + " (" + sectionId + ")!");
                } else {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    res.put("success", false);
                    res.put("error", result);
                }
                out.print(gson.toJson(res));
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                Map<String, Object> res = new HashMap<>();
                res.put("success", false);
                res.put("error", e.getMessage());
                out.print(gson.toJson(res));
            }
        } else if ("/drop".equals(path)) {
            String courseId = req.getParameter("course_id");
            String sectionId = req.getParameter("section_id");
            String semester = req.getParameter("semester") != null ? req.getParameter("semester") : "Fall";
            int year = req.getParameter("year") != null ? Integer.parseInt(req.getParameter("year")) : 2026;

            try {
                boolean success = regDAO.dropStudent(studentId, courseId, sectionId, semester, year);
                Map<String, Object> res = new HashMap<>();
                res.put("success", success);
                res.put("message", success ? "Course dropped successfully." : "Course enrollment not found.");
                out.print(gson.toJson(res));
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                Map<String, Object> res = new HashMap<>();
                res.put("success", false);
                res.put("error", e.getMessage());
                out.print(gson.toJson(res));
            }
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null || !"student".equals(session.getAttribute("role"))) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Unauthorized: Student login required.");
            out.print(gson.toJson(res));
            return;
        }

        String studentId = (String) session.getAttribute("studentId");

        if ("/timetable".equals(path)) {
            String semester = req.getParameter("semester") != null ? req.getParameter("semester") : "Fall";
            int year = req.getParameter("year") != null ? Integer.parseInt(req.getParameter("year")) : 2026;

            try {
                List<Map<String, Object>> schedule = regDAO.getStudentTimetable(studentId, semester, year);
                Map<String, Object> res = new HashMap<>();
                res.put("success", true);
                res.put("schedule", schedule);
                out.print(gson.toJson(res));
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                Map<String, Object> res = new HashMap<>();
                res.put("success", false);
                res.put("error", e.getMessage());
                out.print(gson.toJson(res));
            }
        }
    }
}
