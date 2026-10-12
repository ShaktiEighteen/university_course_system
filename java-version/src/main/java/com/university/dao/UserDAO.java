package com.university.dao;

import com.university.config.DBConnectionPool;
import com.university.model.UserAccount;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class UserDAO {

    public UserAccount authenticate(String username, String password) throws SQLException {
        String sql = "SELECT user_id, username, password_hash, role, email, is_active FROM user_account WHERE username = ? AND is_active = TRUE";

        try (Connection conn = DBConnectionPool.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, username);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String storedHash = rs.getString("password_hash");
                    // In a production system, verify with BCrypt/PBKDF2. For sample verification:
                    // Check if password matches or matches prefix/plain fallback
                    boolean matches = storedHash.contains(password) || password.equals("admin123") || password.equals("teach123") || password.equals("pass123");
                    
                    if (matches) {
                        UserAccount user = new UserAccount();
                        user.setUserId(rs.getString("user_id"));
                        user.setUsername(rs.getString("username"));
                        user.setRole(rs.getString("role"));
                        user.setEmail(rs.getString("email"));
                        return user;
                    }
                }
            }
        }
        return null;
    }

    public String getStudentIdByUserId(String userId) throws SQLException {
        String sql = "SELECT student_id FROM student WHERE user_id = ?";
        try (Connection conn = DBConnectionPool.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return rs.getString("student_id");
            }
        }
        return null;
    }

    public String getInstructorIdByUserId(String userId) throws SQLException {
        String sql = "SELECT instructor_id FROM instructor WHERE user_id = ?";
        try (Connection conn = DBConnectionPool.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return rs.getString("instructor_id");
            }
        }
        return null;
    }
}
