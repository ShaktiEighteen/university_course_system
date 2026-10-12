package com.university.model;

import java.io.Serializable;

public class Student implements Serializable {
    private String studentId;
    private String name;
    private String deptName;
    private int totCred;
    private String userId;

    public Student() {}

    public Student(String studentId, String name, String deptName, int totCred, String userId) {
        this.studentId = studentId;
        this.name = name;
        this.deptName = deptName;
        this.totCred = totCred;
        this.userId = userId;
    }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDeptName() { return deptName; }
    public void setDeptName(String deptName) { this.deptName = deptName; }

    public int getTotCred() { return totCred; }
    public void setTotCred(int totCred) { this.totCred = totCred; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
