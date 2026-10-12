package com.university.model;

import java.io.Serializable;
import java.math.BigDecimal;

public class Instructor implements Serializable {
    private String instructorId;
    private String name;
    private String deptName;
    private BigDecimal salary;
    private String userId;

    public Instructor() {}

    public Instructor(String instructorId, String name, String deptName, BigDecimal salary, String userId) {
        this.instructorId = instructorId;
        this.name = name;
        this.deptName = deptName;
        this.salary = salary;
        this.userId = userId;
    }

    public String getInstructorId() { return instructorId; }
    public void setInstructorId(String instructorId) { this.instructorId = instructorId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDeptName() { return deptName; }
    public void setDeptName(String deptName) { this.deptName = deptName; }

    public BigDecimal getSalary() { return salary; }
    public void setSalary(BigDecimal salary) { this.salary = salary; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
