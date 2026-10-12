<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
    String role = (String) session.getAttribute("role");
    if ("student".equals(role)) {
        response.sendRedirect("student.jsp");
    } else if ("instructor".equals(role)) {
        response.sendRedirect("instructor.jsp");
    } else if ("admin".equals(role)) {
        response.sendRedirect("admin.jsp");
    } else {
        response.sendRedirect("login.jsp");
    }
%>
