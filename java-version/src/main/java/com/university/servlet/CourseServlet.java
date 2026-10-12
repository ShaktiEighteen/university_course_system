package com.university.servlet;

import com.google.gson.Gson;
import com.university.dao.CourseDAO;
import com.university.model.Section;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/courses/*")
public class CourseServlet extends HttpServlet {

    private final CourseDAO courseDAO = new CourseDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        if ("/catalog".equals(path)) {
            String search = req.getParameter("search");
            String dept = req.getParameter("dept");
            String semester = req.getParameter("semester") != null ? req.getParameter("semester") : "Fall";
            int year = req.getParameter("year") != null ? Integer.parseInt(req.getParameter("year")) : 2026;

            try {
                List<Section> sections = courseDAO.getAvailableSections(search, dept, semester, year);
                Map<String, Object> res = new HashMap<>();
                res.put("success", true);
                res.put("sections", sections);
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
