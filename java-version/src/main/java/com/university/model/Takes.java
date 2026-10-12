package com.university.model;

import java.io.Serializable;
import java.sql.Timestamp;

public class Takes implements Serializable {
    private String studentId;
    private String courseId;
    private String sectionId;
    private String semester;
    private int year;
    private String grade;
    private Timestamp registeredAt;

    public Takes() {}

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getSectionId() { return sectionId; }
    public void setSectionId(String sectionId) { this.sectionId = sectionId; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public Timestamp getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(Timestamp registeredAt) { this.registeredAt = registeredAt; }
}
