package com.university.dao;

import com.university.config.DBConnectionPool;
import com.university.model.Section;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CourseDAO {

    public List<Section> getAvailableSections(String search, String dept, String semester, int year) throws SQLException {
        List<Section> sections = new ArrayList<>();

        StringBuilder sql = new StringBuilder(
            "SELECT sec.course_id, c.title, sec.section_id, sec.semester, sec.year, " +
            "       sec.building, sec.room_number, sec.time_slot_id, sec.capacity, " +
            "       ts.day, ts.start_time, ts.end_time, " +
            "       COALESCE(i.name, 'TBA') AS instructor_name, " +
            "       COUNT(t.student_id) AS enrolled_count " +
            "FROM section sec " +
            "JOIN course c ON sec.course_id = c.course_id " +
            "JOIN time_slot ts ON sec.time_slot_id = ts.time_slot_id " +
            "LEFT JOIN teaches tch ON sec.course_id = tch.course_id AND sec.section_id = tch.section_id AND sec.semester = tch.semester AND sec.year = tch.year " +
            "LEFT JOIN instructor i ON tch.instructor_id = i.instructor_id " +
            "LEFT JOIN takes t ON sec.course_id = t.course_id AND sec.section_id = t.section_id AND sec.semester = t.semester AND sec.year = t.year " +
            "WHERE sec.semester = ? AND sec.year = ? "
        );

        if (dept != null && !dept.trim().isEmpty()) {
            sql.append(" AND c.dept_name = ? ");
        }
        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (sec.course_id LIKE ? OR c.title LIKE ? OR i.name LIKE ?) ");
        }

        sql.append("GROUP BY sec.course_id, c.title, sec.section_id, sec.semester, sec.year, sec.building, sec.room_number, sec.time_slot_id, sec.capacity, ts.day, ts.start_time, ts.end_time, i.name ");
        sql.append("ORDER BY sec.course_id, sec.section_id");

        try (Connection conn = DBConnectionPool.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {

            int paramIndex = 1;
            stmt.setString(paramIndex++, semester);
            stmt.setInt(paramIndex++, year);

            if (dept != null && !dept.trim().isEmpty()) {
                stmt.setString(paramIndex++, dept);
            }
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search + "%";
                stmt.setString(paramIndex++, pattern);
                stmt.setString(paramIndex++, pattern);
                stmt.setString(paramIndex++, pattern);
            }

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Section s = new Section();
                    s.setCourseId(rs.getString("course_id"));
                    s.setCourseTitle(rs.getString("title"));
                    s.setSectionId(rs.getString("section_id"));
                    s.setSemester(rs.getString("semester"));
                    s.setYear(rs.getInt("year"));
                    s.setBuilding(rs.getString("building"));
                    s.setRoomNumber(rs.getString("room_number"));
                    s.setTimeSlotId(rs.getString("time_slot_id"));
                    s.setTimeSlotDisplay(rs.getString("day") + " " + rs.getString("start_time").substring(0, 5) + "-" + rs.getString("end_time").substring(0, 5));
                    s.setCapacity(rs.getInt("capacity"));
                    s.setEnrolledCount(rs.getInt("enrolled_count"));
                    s.setInstructorName(rs.getString("instructor_name"));
                    sections.add(s);
                }
            }
        }
        return sections;
    }
}
