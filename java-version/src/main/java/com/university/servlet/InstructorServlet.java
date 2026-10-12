package com.university.servlet;

import com.google.gson.Gson;
import com.university.dao.InstructorDAO;
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

@WebServlet("/api/instructor/*")
public class InstructorServlet extends HttpServlet {

    private final InstructorDAO instructorDAO = new InstructorDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null || !"instructor".equals(session.getAttribute("role"))) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Unauthorized: Faculty login required.");
            out.print(gson.toJson(res));
            return;
        }

        String instructorId = (String) session.getAttribute("instructorId");
        String semester = req.getParameter("semester") != null ? req.getParameter("semester") : "Fall";
        int year = req.getParameter("year") != null ? Integer.parseInt(req.getParameter("year")) : 2026;

        try {
            if ("/sections".equals(path)) {
                List<Map<String, Object>> sections = instructorDAO.getAssignedSections(instructorId, semester, year);
                Map<String, Object> res = new HashMap<>();
                res.put("success", true);
                res.put("sections", sections);
                out.print(gson.toJson(res));
            } else if ("/roster".equals(path)) {
                String courseId = req.getParameter("course_id");
                String sectionId = req.getParameter("section_id");
                List<Map<String, Object>> roster = instructorDAO.getRoster(courseId, sectionId, semester, year);
                Map<String, Object> res = new HashMap<>();
                res.put("success", true);
                res.put("roster", roster);
                out.print(gson.toJson(res));
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", e.getMessage());
            out.print(gson.toJson(res));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null || !"instructor".equals(session.getAttribute("role"))) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Unauthorized: Faculty login required.");
            out.print(gson.toJson(res));
            return;
        }

        if ("/grade".equals(path)) {
            String studentId = req.getParameter("student_id");
            String courseId = req.getParameter("course_id");
            String sectionId = req.getParameter("section_id");
            String semester = req.getParameter("semester") != null ? req.getParameter("semester") : "Fall";
            int year = req.getParameter("year") != null ? Integer.parseInt(req.getParameter("year")) : 2026;
            String grade = req.getParameter("grade");

            try {
                boolean success = instructorDAO.updateGrade(studentId, courseId, sectionId, semester, year, grade);
                Map<String, Object> res = new HashMap<>();
                res.put("success", success);
                res.put("message", success ? "Grade updated to " + grade : "Failed to update grade.");
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
