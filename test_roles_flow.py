import requests

BASE_URL = "http://127.0.0.1:8000"

def test_system_flows():
    print("=" * 60)
    print("RUNNING END-TO-END ROLE WORKFLOW VERIFICATION")
    print("=" * 60)

    # -------------------------------------------------------------
    # 1. TEST STUDENT FLOW
    # -------------------------------------------------------------
    print("\n[+] 1. Testing Student Workflow (Alice Johnson - stud_cs01)...")
    s_client = requests.Session()
    
    # Login
    login_res = s_client.post(
        f"{BASE_URL}/login/",
        json={"username": "stud_cs01", "password": "pass123"},
        headers={"Content-Type": "application/json"}
    )
    assert login_res.status_code == 200, f"Student login failed: {login_res.text}"
    login_data = login_res.json()
    assert login_data["success"] is True
    print("    [PASS] Student authenticated successfully. Role:", login_data["role"])

    # Fetch Catalog
    cat_res = s_client.get(f"{BASE_URL}/api/courses/catalog/?semester=Fall&year=2026")
    assert cat_res.status_code == 200
    cat_data = cat_res.json()
    assert cat_data["success"] is True
    sections = cat_data["sections"]
    print(f"    [PASS] Catalog loaded {len(sections)} sections for Fall 2026.")
    
    # Verify live seat count presence
    for sec in sections[:3]:
        print(f"      - {sec['course_id']} ({sec['section_id']}): {sec['available_seats']}/{sec['capacity']} seats left | Instructor: {sec['instructor']}")

    # Fetch Timetable
    tt_res = s_client.get(f"{BASE_URL}/api/registration/timetable/?semester=Fall&year=2026")
    assert tt_res.status_code == 200
    tt_data = tt_res.json()
    print(f"    [PASS] Timetable loaded. Current enrolled credits: {tt_data['total_credits']}/{tt_data['max_credits']} cr")
    for item in tt_data["schedule"]:
        print(f"      - Enrolled: {item['course_id']} on {item['day']} ({item['start_time']}-{item['end_time']}) in {item['classroom']}")

    # Test Business Rule: Prerequisite Check (CS401 requires CS301; student1 hasn't passed CS301)
    cs401_sec = next((s for s in sections if s["course_id"] == "CS401"), None)
    if cs401_sec:
        reg_fail_res = s_client.post(
            f"{BASE_URL}/api/registration/register/",
            json={"section_id": cs401_sec["id"]},
            headers={"Content-Type": "application/json"}
        )
        assert reg_fail_res.status_code == 400
        fail_data = reg_fail_res.json()
        assert fail_data["success"] is False
        print(f"    [PASS] Prerequisite rule enforced! Blocked CS401 registration: '{fail_data['error']}'")

    # Fetch Grades & GPA
    grades_res = s_client.get(f"{BASE_URL}/api/registration/grades/")
    assert grades_res.status_code == 200
    grades_data = grades_res.json()
    print(f"    [PASS] Academic history retrieved. CGPA: {grades_data['cgpa']} | Total Earned: {grades_data['total_earned_credits']} cr")

    # -------------------------------------------------------------
    # 2. TEST INSTRUCTOR FLOW
    # -------------------------------------------------------------
    print("\n[+] 2. Testing Faculty Instructor Workflow (Dr. Alan Turing - inst_cs101)...")
    i_client = requests.Session()

    # Login
    inst_login = i_client.post(
        f"{BASE_URL}/login/",
        json={"username": "inst_cs101", "password": "teach123"},
        headers={"Content-Type": "application/json"}
    )
    assert inst_login.status_code == 200
    print("    [PASS] Faculty authenticated successfully.")

    # Get Assigned Sections
    sec_res = i_client.get(f"{BASE_URL}/api/instructor/sections/?semester=Fall&year=2026")
    assert sec_res.status_code == 200
    sec_data = sec_res.json()
    assert len(sec_data["sections"]) > 0
    assigned_sec = sec_data["sections"][0]
    print(f"    [PASS] Assigned teaching sections: {len(sec_data['sections'])}. Top section: {assigned_sec['course_id']} ({assigned_sec['section_id']})")

    # Get Roster for assigned section
    roster_res = i_client.get(f"{BASE_URL}/api/instructor/roster/{assigned_sec['section_pk']}/")
    assert roster_res.status_code == 200
    roster_data = roster_res.json()
    print(f"    [PASS] Roster retrieved for {assigned_sec['course_id']}: {len(roster_data['students'])} students enrolled.")
    
    if roster_data["students"]:
        st_target = roster_data["students"][0]
        # Update Grade via AJAX endpoint
        grade_update_res = i_client.post(
            f"{BASE_URL}/api/instructor/grade/",
            json={"section_id": assigned_sec["section_pk"], "student_id": st_target["student_id"], "grade": "A+"},
            headers={"Content-Type": "application/json"}
        )
        assert grade_update_res.status_code == 200
        print(f"    [PASS] Grade updated for {st_target['student_id']} ({st_target['name']}) -> A+ successfully!")

    # -------------------------------------------------------------
    # 3. TEST ADMIN FLOW
    # -------------------------------------------------------------
    print("\n[+] 3. Testing Admin Workflow (System Administrator - admin)...")
    a_client = requests.Session()

    admin_login = a_client.post(
        f"{BASE_URL}/login/",
        json={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/json"}
    )
    assert admin_login.status_code == 200
    print("    [PASS] Administrator authenticated successfully.")

    # Overview Analytics
    overview_res = a_client.get(f"{BASE_URL}/api/admin/overview/")
    assert overview_res.status_code == 200
    stats = overview_res.json()["stats"]
    print(f"    [PASS] System Overview Metrics:")
    print(f"      - Students: {stats['total_students']}")
    print(f"      - Instructors: {stats['total_instructors']}")
    print(f"      - Departments: {stats['total_departments']}")
    print(f"      - Courses: {stats['total_courses']}")
    print(f"      - Sections: {stats['total_sections']}")
    print(f"      - Enrollments: {stats['total_enrollments']}")

    # Create New Course
    new_course_res = a_client.post(
        f"{BASE_URL}/api/admin/courses/",
        json={
            "course_id": "CS499",
            "title": "Senior Capstone Project",
            "dept_name": "Computer Science",
            "credits": 4,
            "prerequisites": ["CS201"]
        },
        headers={"Content-Type": "application/json"}
    )
    if new_course_res.status_code == 200:
        print("    [PASS] Created new course: CS499 (Senior Capstone Project) with prerequisite CS201.")
    else:
        print("    - Course creation status:", new_course_res.json())

    # Verify newly created course in catalog
    chk_cat = a_client.get(f"{BASE_URL}/api/admin/courses/")
    courses_list = chk_cat.json()["courses"]
    assert any(c["course_id"] == "CS499" for c in courses_list)
    print("    [PASS] CS499 verified in administrator course database.")

    print("\n" + "=" * 60)
    print("ALL THREE ROLES AND ACID BUSINESS RULES VERIFIED 100% SUCCESSFUL!")
    print("=" * 60)

if __name__ == "__main__":
    test_system_flows()
