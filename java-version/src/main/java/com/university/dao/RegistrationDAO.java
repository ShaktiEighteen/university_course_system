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

public class RegistrationDAO {

    /**
     * ACID Transactional Registration enforcing all DBS mini-project business rules.
     */
    public String registerStudent(String studentId, String courseId, String sectionId, String semester, int year) throws SQLException {
        Connection conn = null;
        try {
            conn = DBConnectionPool.getConnection();
            conn.setAutoCommit(false); // Begin ACID Transaction

            // 1. Check if course exists and get its credits
            int courseCredits = 0;
            String checkCourseSql = "SELECT credits FROM course WHERE course_id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(checkCourseSql)) {
                stmt.setString(1, courseId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        courseCredits = rs.getInt("credits");
                    } else {
                        conn.rollback();
                        return "Error: Course does not exist.";
                    }
                }
            }

            // 2. Check Duplicate Registration
            String checkDupSql = "SELECT 1 FROM takes WHERE student_id = ? AND course_id = ? AND semester = ? AND year = ?";
            try (PreparedStatement stmt = conn.prepareStatement(checkDupSql)) {
                stmt.setString(1, studentId);
                stmt.setString(2, courseId);
                stmt.setString(3, semester);
                stmt.setInt(4, year);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        conn.rollback();
                        return "Error: You are already registered for this course in the current semester.";
                    }
                }
            }

            // 3. Check Prerequisite Completion
            String checkPrereqSql = 
                "SELECT p.prereq_id FROM prereq p " +
                "WHERE p.course_id = ? " +
                "  AND NOT EXISTS ( " +
                "      SELECT 1 FROM takes past " +
                "      WHERE past.student_id = ? " +
                "        AND past.course_id = p.prereq_id " +
                "        AND past.grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'P') " +
                "  )";
            try (PreparedStatement stmt = conn.prepareStatement(checkPrereqSql)) {
                stmt.setString(1, courseId);
                stmt.setString(2, studentId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        String missingPrereq = rs.getString("prereq_id");
                        conn.rollback();
                        return "Error: Prerequisite not satisfied. Must pass " + missingPrereq + " first.";
                    }
                }
            }

            // 4. Check Credit Limit (Max 18 credits)
            String sumCreditsSql = 
                "SELECT COALESCE(SUM(c.credits), 0) AS total_cr " +
                "FROM takes t JOIN course c ON t.course_id = c.course_id " +
                "WHERE t.student_id = ? AND t.semester = ? AND t.year = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sumCreditsSql)) {
                stmt.setString(1, studentId);
                stmt.setString(2, semester);
                stmt.setInt(3, year);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        int currentCredits = rs.getInt("total_cr");
                        if (currentCredits + courseCredits > 18) {
                            conn.rollback();
                            return "Error: Credit limit exceeded. Current: " + currentCredits + " cr, Adding: " + courseCredits + " cr (Max: 18 cr).";
                        }
                    }
                }
            }

            // 5. Check Time Slot Conflict
            String checkClashSql = 
                "SELECT t_ex.course_id " +
                "FROM takes t_ex " +
                "JOIN section s_ex ON t_ex.course_id = s_ex.course_id AND t_ex.section_id = s_ex.section_id AND t_ex.semester = s_ex.semester AND t_ex.year = s_ex.year " +
                "JOIN time_slot ts_ex ON s_ex.time_slot_id = ts_ex.time_slot_id " +
                "JOIN section s_tgt ON s_tgt.course_id = ? AND s_tgt.section_id = ? AND s_tgt.semester = ? AND s_tgt.year = ? " +
                "JOIN time_slot ts_tgt ON s_tgt.time_slot_id = ts_tgt.time_slot_id " +
                "WHERE t_ex.student_id = ? AND t_ex.semester = ? AND t_ex.year = ? " +
                "  AND ts_ex.day = ts_tgt.day " +
                "  AND (ts_ex.start_time < ts_tgt.end_time AND ts_ex.end_time > ts_tgt.start_time)";
            try (PreparedStatement stmt = conn.prepareStatement(checkClashSql)) {
                stmt.setString(1, courseId);
                stmt.setString(2, sectionId);
                stmt.setString(3, semester);
                stmt.setInt(4, year);
                stmt.setString(5, studentId);
                stmt.setString(6, semester);
                stmt.setInt(7, year);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        String clashCourse = rs.getString("course_id");
                        conn.rollback();
                        return "Error: Schedule conflict detected with enrolled course " + clashCourse + ".";
                    }
                }
            }

            // 6. Check Capacity with Row-Level Lock
            int capacity = 0;
            String lockSectionSql = "SELECT capacity FROM section WHERE course_id = ? AND section_id = ? AND semester = ? AND year = ? FOR UPDATE";
            try (PreparedStatement stmt = conn.prepareStatement(lockSectionSql)) {
                stmt.setString(1, courseId);
                stmt.setString(2, sectionId);
                stmt.setString(3, semester);
                stmt.setInt(4, year);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        capacity = rs.getInt("capacity");
                    } else {
                        conn.rollback();
                        return "Error: Section not found.";
                    }
                }
            }

            int enrolledCount = 0;
            String countSql = "SELECT COUNT(*) AS total FROM takes WHERE course_id = ? AND section_id = ? AND semester = ? AND year = ?";
            try (PreparedStatement stmt = conn.prepareStatement(countSql)) {
                stmt.setString(1, courseId);
                stmt.setString(2, sectionId);
                stmt.setString(3, semester);
                stmt.setInt(4, year);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        enrolledCount = rs.getInt("total");
                    }
                }
            }

            if (enrolledCount >= capacity) {
                conn.rollback();
                return "Error: Section is full (" + enrolledCount + " / " + capacity + " seats).";
            }

            // 7. Insert Registration
            String insertSql = "INSERT INTO takes (student_id, course_id, section_id, semester, year, grade) VALUES (?, ?, ?, ?, ?, 'IP')";
            try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                stmt.setString(1, studentId);
                stmt.setString(2, courseId);
                stmt.setString(3, sectionId);
                stmt.setString(4, semester);
                stmt.setInt(5, year);
                stmt.executeUpdate();
            }

            conn.commit(); // Transaction Committed!
            return "SUCCESS";

        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) {}
            }
            throw e;
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ex) {}
            }
        }
    }

    public boolean dropStudent(String studentId, String courseId, String sectionId, String semester, int year) throws SQLException {
        String sql = "DELETE FROM takes WHERE student_id = ? AND course_id = ? AND section_id = ? AND semester = ? AND year = ?";
        try (Connection conn = DBConnectionPool.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, studentId);
            stmt.setString(2, courseId);
            stmt.setString(3, sectionId);
            stmt.setString(4, semester);
            stmt.setInt(5, year);
            return stmt.executeUpdate() > 0;
        }
    }

    public List<Map<String, Object>> getStudentTimetable(String studentId, String semester, int year) throws SQLException {
        List<Map<String, Object>> schedule = new ArrayList<>();
        String sql = 
            "SELECT t.course_id, c.title, t.section_id, c.credits, " +
            "       sec.building, sec.room_number, ts.day, ts.start_time, ts.end_time, " +
            "       COALESCE(i.name, 'TBA') AS instructor_name " +
            "FROM takes t " +
            "JOIN course c ON t.course_id = c.course_id " +
            "JOIN section sec ON t.course_id = sec.course_id AND t.section_id = sec.section_id AND t.semester = sec.semester AND t.year = sec.year " +
            "JOIN time_slot ts ON sec.time_slot_id = ts.time_slot_id " +
            "LEFT JOIN teaches tch ON sec.course_id = tch.course_id AND sec.section_id = tch.section_id AND sec.semester = tch.semester AND sec.year = tch.year " +
            "LEFT JOIN instructor i ON tch.instructor_id = i.instructor_id " +
            "WHERE t.student_id = ? AND t.semester = ? AND t.year = ? " +
            "ORDER BY ts.day, ts.start_time";

        try (Connection conn = DBConnectionPool.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, studentId);
            stmt.setString(2, semester);
            stmt.setInt(3, year);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("course_id", rs.getString("course_id"));
                    item.put("title", rs.getString("title"));
                    item.put("section_id", rs.getString("section_id"));
                    item.put("credits", rs.getInt("credits"));
                    item.put("building", rs.getString("building"));
                    item.put("room_number", rs.getString("room_number"));
                    item.put("day", rs.getString("day"));
                    item.put("start_time", rs.getString("start_time").substring(0, 5));
                    item.put("end_time", rs.getString("end_time").substring(0, 5));
                    item.put("instructor", rs.getString("instructor_name"));
                    schedule.add(item);
                }
            }
        }
        return schedule;
    }
}
