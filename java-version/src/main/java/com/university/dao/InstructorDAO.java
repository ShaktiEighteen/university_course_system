package com.university.dao;

import com.university.config.DBConnectionPool;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class InstructorDAO {

    public List<Map<String, Object>> getAssignedSections(String instructorId, String semester, int year) throws SQLException {
        List<Map<String, Object>> sections = new ArrayList<>();
        String sql = 
            "SELECT sec.course_id, c.title, sec.section_id, sec.semester, sec.year, " +
            "       sec.building, sec.room_number, ts.day, ts.start_time, ts.end_time, sec.capacity, " +
            "       COUNT(t.student_id) AS enrolled_count " +
            "FROM teaches tch " +
            "JOIN section sec ON tch.course_id = sec.course_id AND tch.section_id = sec.section_id AND tch.semester = sec.semester AND tch.year = sec.year " +
            "JOIN course c ON sec.course_id = c.course_id " +
            "JOIN time_slot ts ON sec.time_slot_id = ts.time_slot_id " +
            "LEFT JOIN takes t ON sec.course_id = t.course_id AND sec.section_id = t.section_id AND sec.semester = t.semester AND sec.year = t.year " +
            "WHERE tch.instructor_id = ? AND tch.semester = ? AND tch.year = ? " +
            "GROUP BY sec.course_id, c.title, sec.section_id, sec.semester, sec.year, sec.building, sec.room_number, ts.day, ts.start_time, ts.end_time, sec.capacity " +
            "ORDER BY sec.course_id";

        try (Connection conn = DBConnectionPool.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, instructorId);
            stmt.setString(2, semester);
            stmt.setInt(3, year);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> sec = new HashMap<>();
                    sec.put("course_id", rs.getString("course_id"));
                    sec.put("title", rs.getString("title"));
                    sec.put("section_id", rs.getString("section_id"));
                    sec.put("classroom", rs.getString("building") + " " + rs.getString("room_number"));
                    sec.put("time_slot", rs.getString("day") + " " + rs.getString("start_time").substring(0, 5) + "-" + rs.getString("end_time").substring(0, 5));
                    sec.put("capacity", rs.getInt("capacity"));
                    sec.put("enrolled_count", rs.getInt("enrolled_count"));
                    sections.add(sec);
                }
            }
        }
        return sections;
    }

    public List<Map<String, Object>> getRoster(String courseId, String sectionId, String semester, int year) throws SQLException {
        List<Map<String, Object>> roster = new ArrayList<>();
        String sql = 
            "SELECT s.student_id, s.name, s.dept_name, t.grade, t.registered_at " +
            "FROM takes t " +
            "JOIN student s ON t.student_id = s.student_id " +
            "WHERE t.course_id = ? AND t.section_id = ? AND t.semester = ? AND t.year = ? " +
            "ORDER BY s.student_id";

        try (Connection conn = DBConnectionPool.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, courseId);
            stmt.setString(2, sectionId);
            stmt.setString(3, semester);
            stmt.setInt(4, year);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("student_id", rs.getString("student_id"));
                    row.put("name", rs.getString("name"));
                    row.put("dept_name", rs.getString("dept_name"));
                    row.put("grade", rs.getString("grade"));
                    row.put("registered_at", rs.getString("registered_at"));
                    roster.add(row);
                }
            }
        }
        return roster;
    }

    public boolean updateGrade(String studentId, String courseId, String sectionId, String semester, int year, String grade) throws SQLException {
        String sql = "UPDATE takes SET grade = ? WHERE student_id = ? AND course_id = ? AND section_id = ? AND semester = ? AND year = ?";
        try (Connection conn = DBConnectionPool.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, grade);
            stmt.setString(2, studentId);
            stmt.setString(3, courseId);
            stmt.setString(4, sectionId);
            stmt.setString(5, semester);
            stmt.setInt(6, year);
            return stmt.executeUpdate() > 0;
        }
    }
}
