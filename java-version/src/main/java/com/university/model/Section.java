package com.university.model;

import java.io.Serializable;

public class Section implements Serializable {
    private int id;
    private String courseId;
    private String courseTitle;
    private String sectionId;
    private String semester;
    private int year;
    private String building;
    private String roomNumber;
    private String timeSlotId;
    private String timeSlotDisplay;
    private int capacity;
    private int enrolledCount;
    private String instructorName;

    public Section() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getSectionId() { return sectionId; }
    public void setSectionId(String sectionId) { this.sectionId = sectionId; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getTimeSlotId() { return timeSlotId; }
    public void setTimeSlotId(String timeSlotId) { this.timeSlotId = timeSlotId; }

    public String getTimeSlotDisplay() { return timeSlotDisplay; }
    public void setTimeSlotDisplay(String timeSlotDisplay) { this.timeSlotDisplay = timeSlotDisplay; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public int getEnrolledCount() { return enrolledCount; }
    public void setEnrolledCount(int enrolledCount) { this.enrolledCount = enrolledCount; }

    public int getAvailableSeats() { return Math.max(0, capacity - enrolledCount); }

    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }
}
