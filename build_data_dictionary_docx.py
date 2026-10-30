import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=70, bottom=70, left=110, right=110):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def set_table_borders(table, color="94A3B8", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="none"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def build_data_dictionary_doc():
    doc = docx.Document()

    # Page setup: A4 with 0.8 inch margins so every table comfortably fits on one single page
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)

    # Styles
    normal = doc.styles['Normal']
    normal.font.name = 'Calibri'
    normal.font.size = Pt(12)
    normal.font.color.rgb = RGBColor(30, 41, 59)

    def add_h14(text, space_before=0, space_after=4):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def add_desc(text, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(12)
        r.font.color.rgb = RGBColor(71, 85, 105)
        return p

    def add_bullet_12(bold_txt, norm_txt):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        r1 = p.add_run(bold_txt)
        r1.font.name = 'Calibri'
        r1.font.size = Pt(12)
        r1.font.bold = True
        r2 = p.add_run(norm_txt)
        r2.font.name = 'Calibri'
        r2.font.size = Pt(12)
        return p

    def create_schema_table(headers, rows, col_widths=None):
        table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        set_table_borders(table)

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            set_cell_background(hdr_cells[i], "0F172A") # Slate 900
            set_cell_margins(hdr_cells[i], top=90, bottom=90, left=110, right=110)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = 'Calibri'
                run.font.size = Pt(11)
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)

        # Body Rows
        for r_idx, row_data in enumerate(rows):
            row_cells = table.rows[r_idx + 1].cells
            bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, cell_value in enumerate(row_data):
                row_cells[c_idx].text = str(cell_value)
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_margins(row_cells[c_idx], top=70, bottom=70, left=110, right=110)
                p = row_cells[c_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for run in p.runs:
                    run.font.name = 'Calibri'
                    run.font.size = Pt(11)
                    run.font.color.rgb = RGBColor(51, 65, 85)

        if col_widths:
            for row in table.rows:
                for idx, w in enumerate(col_widths):
                    row.cells[idx].width = Inches(w)
        return table

    # ==================== PAGE 1: USER SCHEMA ====================
    add_h14("Dataset 1: User Schema (users collection)", space_before=0)
    add_desc("Stores all system actors (Students, Faculty Professors, and Administrators) including institutional IDs, authentication credentials, referential foreign keys to Department and Course, assigned teaching subjects, and numeric facial recognition embeddings.")
    
    user_rows = [
        ["_id", "ObjectId", "Primary Key", "Unique document identifier generated by MongoDB."],
        ["name", "String", "Required, Trimmed", "Full legal name of the user."],
        ["email", "String", "Required, Unique", "Login identifier (email or unique username, e.g., Arcenix)."],
        ["password", "String", "Required, select: false", "Bcrypt salted hash (10 salt rounds); omitted from queries."],
        ["role", "String", "Enum: student, faculty, admin", "Role-based access level (defaults to student)."],
        ["idNumber", "String", "Unique, Sparse", "Enrollment number (students) or Employee ID (faculty)."],
        ["department", "ObjectId", "Ref: Department, Optional", "Foreign key linking user to Department (e.g., FCAIT)."],
        ["course", "ObjectId", "Ref: Course, Optional", "Foreign key linking student to enrolled Course (e.g., IMSCIT, BCA)."],
        ["assignedSubjects", "[ObjectId]", "Ref: Subject Array", "Multiple subjects taught by faculty (1 Faculty -> Multiple Subjects)."],
        ["year", "String", "Optional", "Academic year or semester of the student (e.g., 2026-2027)."],
        ["faceEmbeddings", "[Number]", "Default: []", "128-dimensional floating-point vector extracted via face-api.js."],
        ["createdAt", "Date", "Auto (timestamps)", "Account creation timestamp."],
        ["updatedAt", "Date", "Auto (timestamps)", "Account last modification timestamp."]
    ]
    create_schema_table(["Field Name", "Data Type", "Constraints", "Field Description"], user_rows, [1.3, 1.0, 1.5, 2.8])

    doc.add_page_break()

    # ==================== PAGE 2: DEPARTMENT SCHEMA ====================
    add_h14("Dataset 2: Department Schema (departments collection)", space_before=0)
    add_desc("Represents university faculties, institutes, and academic divisions (such as FCAIT - Faculty of Computer Applications & IT). Serves as the top-level parent entity for Degree Courses, Faculty Members, and Academic Subjects.")

    dept_rows = [
        ["_id", "ObjectId", "Primary Key", "Unique department identifier generated by MongoDB."],
        ["name", "String", "Required, Unique, Trimmed", "Official institutional department name (e.g., Faculty of Computer Applications & Information Technology)."],
        ["code", "String", "Required, Unique, Uppercase", "Short institutional code (e.g., FCAIT, FoT, FoM)."],
        ["description", "String", "Max 500 characters", "Administrative description of the faculty/department."],
        ["createdAt", "Date", "Auto (timestamps)", "Department record creation timestamp."],
        ["updatedAt", "Date", "Auto (timestamps)", "Department record last modification timestamp."]
    ]
    create_schema_table(["Field Name", "Data Type", "Constraints", "Field Description"], dept_rows, [1.3, 1.0, 1.5, 2.8])

    doc.add_page_break()

    # ==================== PAGE 3: COURSE / BRANCH SCHEMA ====================
    add_h14("Dataset 3: Course / Branch Schema (courses collection - NEW)", space_before=0)
    add_desc("Represents degree programs and curriculum branches offered under academic departments (e.g., IMSCIT, BCA, MCA under FCAIT). Implements referential foreign keys linking courses to departments, and linking students, classes, and subjects to courses.")

    course_rows = [
        ["_id", "ObjectId", "Primary Key", "Unique degree course identifier generated by MongoDB."],
        ["name", "String", "Required, Trimmed", "Full formal degree program title (e.g., Integrated Master of Science (IT), Bachelor of Computer Applications)."],
        ["code", "String", "Required, Unique, Uppercase", "Standard degree branch code (e.g., IMSCIT, BCA, MCA)."],
        ["department", "ObjectId", "Ref: Department, Required", "Foreign key referencing parent Department (FCAIT)."],
        ["durationYears", "Number", "Default: 3, Min: 1", "Total duration of degree program in academic years."],
        ["totalSemesters", "Number", "Default: 6, Min: 1", "Total number of academic semesters in curriculum."],
        ["createdAt", "Date", "Auto (timestamps)", "Course record creation timestamp."],
        ["updatedAt", "Date", "Auto (timestamps)", "Course record last modification timestamp."]
    ]
    create_schema_table(["Field Name", "Data Type", "Constraints", "Field Description"], course_rows, [1.3, 1.0, 1.5, 2.8])

    doc.add_page_break()

    # ==================== PAGE 4: SUBJECT SCHEMA ====================
    add_h14("Dataset 4: Subject Schema (subjects collection)", space_before=0)
    add_desc("Represents the catalog of accredited academic subjects taught within degree courses. References both parent Department and Degree Course, specifying credits, semester allocation, and unique subject code.")

    subj_rows = [
        ["_id", "ObjectId", "Primary Key", "Unique subject identifier generated by MongoDB."],
        ["name", "String", "Required, Trimmed", "Official course subject title (e.g., Artificial Intelligence, Python Programming, Database Management Systems)."],
        ["code", "String", "Required, Unique, Uppercase", "Standard curriculum subject code (e.g., AI01, FC01, FC02)."],
        ["department", "ObjectId", "Ref: Department, Optional", "Foreign key linking subject to owning Department."],
        ["course", "ObjectId", "Ref: Course, Optional", "Foreign key linking subject to specific Degree Course."],
        ["semester", "Number", "Default: 1, Min: 1", "Academic semester during which the subject is delivered."],
        ["credits", "Number", "Required, Default: 3", "University credit weighting for semester GPA calculation."],
        ["createdAt", "Date", "Auto (timestamps)", "Subject record creation timestamp."],
        ["updatedAt", "Date", "Auto (timestamps)", "Subject record last modification timestamp."]
    ]
    create_schema_table(["Field Name", "Data Type", "Constraints", "Field Description"], subj_rows, [1.3, 1.0, 1.5, 2.8])

    doc.add_page_break()

    # ==================== PAGE 5: CLASS SCHEMA ====================
    add_h14("Dataset 5: Class Schema (classes collection)", space_before=0)
    add_desc("Links Degree Course, Subject, assigned Faculty Member, enrolled Students, and weekly classroom timetable schedule slots into an operational classroom division.")

    class_rows = [
        ["_id", "ObjectId", "Primary Key", "Unique class division identifier generated by MongoDB."],
        ["name", "String", "Required, Trimmed", "Class division / batch designation (e.g., FY-ImscIT-AI01)."],
        ["course", "ObjectId", "Ref: Course, Optional", "Foreign key linking class division to Degree Course."],
        ["subject", "ObjectId", "Ref: Subject, Required", "Foreign key linking class division to taught Subject."],
        ["faculty", "ObjectId", "Ref: User, Required", "Foreign key linking class division to responsible Faculty."],
        ["students", "[ObjectId]", "Ref: User Array", "Array of enrolled student ObjectIds (Many-to-Many)."],
        ["schedule", "[Object]", "Sub-document Array", "Weekly timetable slots for lectures and laboratories."],
        ["schedule[].dayOfWeek", "String", "Required, Enum", "Day of the week (Monday through Sunday)."],
        ["schedule[].startTime", "String", "Required, HH:MM", "Lecture start time (24-hour format)."],
        ["schedule[].endTime", "String", "Required, HH:MM", "Lecture end time (24-hour format)."],
        ["schedule[].room", "String", "Optional", "Assigned classroom, lecture hall, or lab room."],
        ["schedule[].type", "String", "Default: Lecture", "Session pedagogical category (Lecture, Lab, Seminar)."],
        ["createdAt", "Date", "Auto (timestamps)", "Class division creation timestamp."],
        ["updatedAt", "Date", "Auto (timestamps)", "Class division last update timestamp."]
    ]
    create_schema_table(["Field Name", "Data Type", "Constraints", "Field Description"], class_rows, [1.3, 1.0, 1.5, 2.8])

    doc.add_page_break()

    # ==================== PAGE 6: ATTENDANCE SCHEMA ====================
    add_h14("Dataset 6: Attendance Schema (attendances collection)", space_before=0)
    add_desc("Captures live biometric attendance sessions launched by faculty professors. Stores rotating QR session tokens, secret passcode, instructor coordinates, geofence radius, and embedded student check-in telemetry.")

    att_rows = [
        ["_id", "ObjectId", "Primary Key", "Unique attendance session identifier generated by MongoDB."],
        ["class", "ObjectId", "Ref: Class, Required", "Foreign key referencing Class division."],
        ["faculty", "ObjectId", "Ref: User, Required", "Foreign key referencing Faculty professor who launched session."],
        ["date", "Date", "Required, Default: now", "Date and start timestamp of attendance session."],
        ["sessionToken", "String", "Required, Unique", "Cryptographically random 32-byte hex QR validation token."],
        ["isActive", "Boolean", "Default: true", "True while session is open; set false upon session stop."],
        ["attendanceCode", "String", "Required, 4 Digits", "Secret security code entered by instructor on launch."],
        ["location.lat", "Number", "Required", "Instructor device latitude coordinate."],
        ["location.lng", "Number", "Required", "Instructor device longitude coordinate."],
        ["radius", "Number", "Required, Default: 100", "Maximum permissible geofence distance in meters."],
        ["records", "[Object]", "Sub-document Array", "Embedded student attendance and biometric check-in log."],
        ["records[].student", "ObjectId", "Ref: User, Required", "Foreign key to student User document."],
        ["records[].status", "String", "Enum: Present, Absent", "Final attendance verification status."],
        ["records[].distance", "Number", "Optional", "Measured Haversine geofence distance from teacher (meters)."],
        ["records[].accuracy", "Number", "Optional", "Reported student GPS accuracy radius (meters)."],
        ["records[].faceDistance", "Number", "Optional", "Biometric Euclidean distance from neural network (< 0.68)."],
        ["records[].markedAt", "Date", "Optional", "Exact timestamp when biometric verification passed."]
    ]
    create_schema_table(["Field Name", "Data Type", "Constraints", "Field Description"], att_rows, [1.3, 1.0, 1.5, 2.8])

    doc.add_page_break()

    # ==================== PAGE 7: RELATIONAL FOREIGN KEY ARCHITECTURE ====================
    add_h14("Dataset 7: Database Relational Model & Foreign Key Architecture", space_before=0)
    add_desc("Summary of Mongoose ObjectId foreign key relationships and cardinalities enforcing institutional referential integrity across MongoDB collections.")

    rel_rows = [
        ["Department -> Course", "1 : N (One-to-Many)", "Course.department", "1 Department (FCAIT) oversees Multiple Degree Courses (IMSCIT, BCA, MCA)."],
        ["Department -> User", "1 : N (One-to-Many)", "User.department", "Links faculty professors and students to their parent academic department."],
        ["Faculty -> Subject", "1 : N (One-to-Many)", "User.assignedSubjects", "1 Faculty professor teaches Multiple Subjects across semesters (e.g. DBMS + AI)."],
        ["Course -> Subject", "1 : N (One-to-Many)", "Subject.course", "Ensures academic subjects belong strictly to their degree curriculum branch."],
        ["Course -> Class", "1 : N (One-to-Many)", "Class.course", "Enforces class divisions to adhere to degree programs."],
        ["Subject -> Class", "1 : N (One-to-Many)", "Class.subject", "Each active class division teaches 1 accredited subject."],
        ["Faculty -> Class", "1 : N (One-to-Many)", "Class.faculty", "1 Faculty professor is assigned as the primary instructor for the class division."],
        ["Class <-> Student", "M : N (Many-to-Many)", "Class.students", "Class stores array of student ObjectIds; students enroll in multiple classes."],
        ["Class -> Attendance", "1 : N (One-to-Many)", "Attendance.class", "Each lecture conducted produces 1 Attendance session record."],
        ["Faculty -> Attendance", "1 : N (One-to-Many)", "Attendance.faculty", "Every attendance session permanently records the faculty member who started it."]
    ]
    create_schema_table(["Relationship", "Cardinality", "Foreign Key Path", "Academic Referential Rule"], rel_rows, [1.5, 1.1, 1.6, 2.4])

    p_conc = doc.add_paragraph()
    p_conc.paragraph_format.space_before = Pt(12)
    p_conc.paragraph_format.line_spacing = 1.15
    r_c = p_conc.add_run(
        "Conclusion on Referential Integrity: By using Mongoose ObjectId references across all schemas, AttendAI guarantees relational foreign key constraints, eliminates data redundancy, and enables dynamic Mongoose populate() joins across multi-level institutional queries."
    )
    r_c.font.size = Pt(11)
    r_c.font.italic = True
    r_c.font.color.rgb = RGBColor(71, 85, 105)

    # Save to both destinations
    out_path_1 = r"C:\Users\Abhi\Downloads\Documents\AttendAi_Database_Data_Dictionary.docx"
    out_path_2 = r"c:\xampp\htdocs\Attendai\AttendAi_Database_Data_Dictionary.docx"

    doc.save(out_path_1)
    doc.save(out_path_2)
    print(f"Separate Data Dictionary document saved successfully:\n1. {out_path_1}\n2. {out_path_2}")

if __name__ == "__main__":
    build_data_dictionary_doc()
