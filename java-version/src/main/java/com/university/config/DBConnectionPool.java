package com.university.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Singleton database connection pool manager using HikariCP.
 * Provides high-performance, robust connection pooling for Java Servlets.
 */
public class DBConnectionPool {

    private static HikariDataSource dataSource;

    static {
        try {
            Properties props = new Properties();
            try (InputStream input = DBConnectionPool.class.getClassLoader().getResourceAsStream("db.properties")) {
                if (input != null) {
                    props.load(input);
                }
            }

            HikariConfig config = new HikariConfig();
            
            // Allow environment variables to override properties
            String dbUrl = System.getenv("DB_URL");
            String dbUser = System.getenv("DB_USER");
            String dbPass = System.getenv("DB_PASSWORD");
            String dbDriver = System.getenv("DB_DRIVER");

            config.setJdbcUrl(dbUrl != null ? dbUrl : props.getProperty("db.url", "jdbc:mysql://localhost:3306/university_db"));
            config.setUsername(dbUser != null ? dbUser : props.getProperty("db.user", "root"));
            config.setPassword(dbPass != null ? dbPass : props.getProperty("db.password", "root"));
            config.setDriverClassName(dbDriver != null ? dbDriver : props.getProperty("db.driver", "com.mysql.cj.jdbc.Driver"));

            config.setMaximumPoolSize(Integer.parseInt(props.getProperty("hikari.maximumPoolSize", "15")));
            config.setMinimumIdle(Integer.parseInt(props.getProperty("hikari.minimumIdle", "5")));
            config.setIdleTimeout(Long.parseLong(props.getProperty("hikari.idleTimeout", "30000")));
            config.setConnectionTimeout(Long.parseLong(props.getProperty("hikari.connectionTimeout", "20000")));
            config.setMaxLifetime(Long.parseLong(props.getProperty("hikari.maxLifetime", "1800000")));

            // Cache prepared statements for high throughput
            config.addDataSourceProperty("cachePrepStmts", "true");
            config.addDataSourceProperty("prepStmtCacheSize", "250");
            config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

            dataSource = new HikariDataSource(config);
        } catch (Exception e) {
            System.err.println("CRITICAL: Failed to initialize HikariCP connection pool: " + e.getMessage());
        }
    }

    private DBConnectionPool() {}

    public static Connection getConnection() throws SQLException {
        if (dataSource == null) {
            throw new SQLException("HikariCP DataSource is not initialized.");
        }
        return dataSource.getConnection();
    }

    public static void shutdown() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }
}
