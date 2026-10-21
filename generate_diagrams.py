import matplotlib.pyplot as plt
import matplotlib.patches as patches

def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')

    # Background color
    fig.patch.set_facecolor('#ffffff')

    # Tier 1: Presentation Tier
    p_box = patches.FancyBboxPatch((1, 4.3), 8, 1.3, boxstyle="round,pad=0.1,rounding_size=0.15", 
                                  edgecolor="#2563eb", facecolor="#eff6ff", linewidth=2)
    ax.add_patch(p_box)
    ax.text(5, 5.25, "TIER 1: PRESENTATION TIER (CLIENT BROWSER)", ha='center', va='center', fontsize=12, fontweight='bold', color="#1e40af")
    ax.text(5, 4.75, "HTML5 • CSS3 Grid/Flexbox • Vanilla JavaScript (Fetch / AJAX)\nDynamic Seat Badges • Timetable Visual Grid • Role Dashboards • Toast Alerts", 
            ha='center', va='center', fontsize=9.5, color="#1e293b")

    # Arrow 1 <-> 2
    ax.annotate('', xy=(5, 3.8), xytext=(5, 4.3),
                arrowprops=dict(arrowstyle="<->", color="#475569", lw=2))
    ax.text(5.1, 4.05, "JSON REST API / HTTP(S)", ha='left', va='center', fontsize=8.5, fontweight='bold', color="#475569")

    # Tier 2: Application Tier
    a_box = patches.FancyBboxPatch((1, 2.3), 8, 1.4, boxstyle="round,pad=0.1,rounding_size=0.15", 
                                  edgecolor="#059669", facecolor="#ecfdf5", linewidth=2)
    ax.add_patch(a_box)
    ax.text(5, 3.35, "TIER 2: APPLICATION TIER (BUSINESS LOGIC ENGINE)", ha='center', va='center', fontsize=12, fontweight='bold', color="#065f46")
    ax.text(5, 2.75, "Primary: Python 3.11 + Django 5.2 | Alternate: Java Servlets + JSP\nACID Transaction Engine (SELECT FOR UPDATE) • RBAC Guards • Session Auth\nRules Engine: Prerequisite Verification • Time-Clash Prevention • Credit Limits", 
            ha='center', va='center', fontsize=9.5, color="#1e293b")

    # Arrow 2 <-> 3
    ax.annotate('', xy=(5, 1.8), xytext=(5, 2.3),
                arrowprops=dict(arrowstyle="<->", color="#475569", lw=2))
    ax.text(5.1, 2.05, "Parameterized SQL / ORM Pooling", ha='left', va='center', fontsize=8.5, fontweight='bold', color="#475569")

    # Tier 3: Data Tier
    d_box = patches.FancyBboxPatch((1, 0.3), 8, 1.4, boxstyle="round,pad=0.1,rounding_size=0.15", 
                                  edgecolor="#7c3aed", facecolor="#f5f3ff", linewidth=2)
    ax.add_patch(d_box)
    ax.text(5, 1.35, "TIER 3: DATA TIER (RELATIONAL DATABASE IN 3NF)", ha='center', va='center', fontsize=12, fontweight='bold', color="#5b21b6")
    ax.text(5, 0.75, "Relational DBMS: PostgreSQL (Primary) / MySQL / SQLite Engine\n11 Normalized 3NF Tables • Referential Integrity (FK Constraints, Cascades)\nTriggers (Capacity Enforcer) • Stored Views (Timetable, Section Summary) • Indexes", 
            ha='center', va='center', fontsize=9.5, color="#1e293b")

    plt.tight_layout()
    plt.savefig('architecture_diagram.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Architecture diagram created.")


def generate_er_diagram():
    fig, ax = plt.subplots(figsize=(14, 10), dpi=300)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    # Title
    ax.text(7, 9.6, "ENTITY-RELATIONSHIP (ER) DIAGRAM - 3NF SCHEMA", ha='center', va='center', fontsize=15, fontweight='bold', color="#0f172a")
    ax.text(7, 9.3, "University Course Registration & Management System (DBS Lab)", ha='center', va='center', fontsize=10.5, color="#475569")

    # Define entities: (x, y, width, height, title, fields, color_border, color_bg)
    entities = [
        # Top Row
        (0.6, 7.0, 3.2, 1.8, "DEPARTMENT", ["PK  dept_name (VARCHAR)", "building (VARCHAR)", "budget (DECIMAL >= 0)"], "#2563eb", "#eff6ff"),
        (5.4, 7.0, 3.2, 1.8, "CLASSROOM", ["PK  building (VARCHAR)", "PK  room_number (VARCHAR)", "capacity (INT > 0)"], "#059669", "#ecfdf5"),
        (10.2, 7.0, 3.2, 1.8, "TIME_SLOT", ["PK  time_slot_id (VARCHAR)", "day (VARCHAR)", "start_time (TIME)", "end_time (TIME)"], "#7c3aed", "#f5f3ff"),

        # Second Row
        (0.6, 4.4, 3.2, 2.0, "COURSE", ["PK  course_id (VARCHAR)", "title (VARCHAR)", "FK  dept_name -> department", "credits (INT 1-10)"], "#2563eb", "#eff6ff"),
        (5.4, 4.2, 3.2, 2.2, "SECTION", ["PK  id (INT AUTO_INCREMENT)", "FK  course_id -> course", "section_id (VARCHAR)", "semester, year", "FK  classroom (bldg, room)", "FK  time_slot_id -> time_slot", "capacity (INT > 0)"], "#d97706", "#fffbeb"),
        (10.2, 4.4, 3.2, 2.0, "PREREQ", ["PK,FK  course_id -> course", "PK,FK  prereq_id -> course", "CHECK: course_id != prereq_id"], "#db2777", "#fdf2f8"),

        # Third Row
        (0.6, 1.4, 3.2, 2.4, "INSTRUCTOR", ["PK  instructor_id (VARCHAR)", "name (VARCHAR)", "FK  dept_name -> department", "salary (DECIMAL >= 0)", "FK  user_id -> user_account"], "#059669", "#ecfdf5"),
        (5.4, 1.5, 3.2, 2.1, "TAKES (Registration)", ["PK,FK  student_id -> student", "PK,FK  section_id -> section", "grade (VARCHAR A..F, IP)", "registered_at (TIMESTAMP)"], "#dc2626", "#fef2f2"),
        (10.2, 1.4, 3.2, 2.4, "STUDENT", ["PK  student_id (VARCHAR)", "name (VARCHAR)", "FK  dept_name -> department", "tot_cred (INT >= 0)", "FK  user_id -> user_account"], "#2563eb", "#eff6ff"),

        # Bottom Row
        (0.6, 0.1, 3.2, 1.0, "TEACHES", ["PK,FK  instructor_id", "PK,FK  section_id"], "#059669", "#ecfdf5"),
        (5.4, 0.1, 3.2, 1.1, "USER_ACCOUNT", ["PK  user_id, username (UK)", "password_hash, email (UK)", "role: student | inst | admin"], "#475569", "#f1f5f9"),
    ]

    for (x, y, w, h, title, fields, border_c, bg_c) in entities:
        box = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.1", 
                                     edgecolor=border_c, facecolor=bg_c, linewidth=1.8)
        ax.add_patch(box)
        # Header line
        ax.text(x + w/2, y + h - 0.22, title, ha='center', va='center', fontsize=9.5, fontweight='bold', color=border_c)
        ax.plot([x + 0.1, x + w - 0.1], [y + h - 0.42, y + h - 0.42], color=border_c, lw=1)
        # Fields
        for idx, f in enumerate(fields):
            ax.text(x + 0.15, y + h - 0.65 - (idx * 0.26), f, ha='left', va='center', fontsize=7.2, color="#1e293b", family='monospace')

    # Draw Relationship Connectors
    # 1. Department -> Course
    ax.annotate('', xy=(2.2, 6.4), xytext=(2.2, 7.0), arrowprops=dict(arrowstyle="->", color="#2563eb", lw=1.5))
    ax.text(2.3, 6.7, "1:N offers", fontsize=7.5, color="#2563eb", fontweight='bold')

    # 2. Course -> Section
    ax.annotate('', xy=(5.4, 5.3), xytext=(3.8, 5.3), arrowprops=dict(arrowstyle="->", color="#d97706", lw=1.5))
    ax.text(4.6, 5.45, "1:N", fontsize=7.5, color="#d97706", fontweight='bold')

    # 3. Course -> Prereq
    ax.annotate('', xy=(10.2, 5.4), xytext=(3.8, 5.8), arrowprops=dict(arrowstyle="->", color="#db2777", lw=1.5, connectionstyle="arc3,rad=-0.15"))
    ax.text(7.0, 6.2, "M:N self-ref", fontsize=7.5, color="#db2777", fontweight='bold')

    # 4. Classroom -> Section
    ax.annotate('', xy=(7.0, 6.4), xytext=(7.0, 7.0), arrowprops=dict(arrowstyle="->", color="#059669", lw=1.5))
    ax.text(7.1, 6.7, "1:N hosts", fontsize=7.5, color="#059669", fontweight='bold')

    # 5. TimeSlot -> Section
    ax.annotate('', xy=(8.6, 5.5), xytext=(10.2, 7.2), arrowprops=dict(arrowstyle="->", color="#7c3aed", lw=1.5, connectionstyle="arc3,rad=0.15"))
    ax.text(9.2, 6.3, "1:N schedule", fontsize=7.5, color="#7c3aed", fontweight='bold')

    # 6. Student -> Takes
    ax.annotate('', xy=(8.6, 2.5), xytext=(10.2, 2.5), arrowprops=dict(arrowstyle="->", color="#dc2626", lw=1.5))
    ax.text(9.4, 2.65, "1:N", fontsize=7.5, color="#dc2626", fontweight='bold')

    # 7. Section -> Takes
    ax.annotate('', xy=(7.0, 3.6), xytext=(7.0, 4.2), arrowprops=dict(arrowstyle="->", color="#dc2626", lw=1.5))
    ax.text(7.1, 3.9, "1:N", fontsize=7.5, color="#dc2626", fontweight='bold')

    # 8. Instructor -> Teaches
    ax.annotate('', xy=(2.2, 1.1), xytext=(2.2, 1.4), arrowprops=dict(arrowstyle="->", color="#059669", lw=1.5))
    ax.text(2.3, 1.25, "1:N", fontsize=7.5, color="#059669", fontweight='bold')

    # 9. Section -> Teaches
    ax.annotate('', xy=(3.8, 0.6), xytext=(5.4, 4.2), arrowprops=dict(arrowstyle="->", color="#059669", lw=1.5, connectionstyle="arc3,rad=0.2"))
    ax.text(3.9, 2.3, "teaches", fontsize=7.5, color="#059669", fontweight='bold')

    # 10. UserAccount -> Student & Instructor
    ax.annotate('', xy=(9.0, 0.6), xytext=(8.6, 0.6), arrowprops=dict(arrowstyle="->", color="#475569", lw=1.5))
    ax.annotate('', xy=(10.5, 1.4), xytext=(9.0, 0.6), arrowprops=dict(arrowstyle="->", color="#475569", lw=1.5))
    ax.text(9.6, 0.8, "1:1 auth", fontsize=7.5, color="#475569", fontweight='bold')

    plt.tight_layout()
    plt.savefig('er_diagram.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("ER diagram created.")

if __name__ == '__main__':
    generate_architecture_diagram()
    generate_er_diagram()
