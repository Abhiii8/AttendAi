// Institutional Demo Data for Academic & Faculty Reports
// Guarantees that the reports page is always fully populated with rich demo data

export const DEFAULT_COURSES = [
  {
    _id: 'course_imscit',
    name: 'Integrated MSc in Information Technology',
    code: 'IMSCIT',
    department: { name: 'Faculty of Computer Applications & Information Technology (FCAIT)', code: 'FCAIT' },
    durationYears: 5,
    totalSemesters: 10
  },
  {
    _id: 'course_bca',
    name: 'Bachelor of Computer Applications',
    code: 'BCA',
    department: { name: 'Faculty of Computer Applications & Information Technology (FCAIT)', code: 'FCAIT' },
    durationYears: 3,
    totalSemesters: 6
  },
  {
    _id: 'course_mca',
    name: 'Master of Computer Applications',
    code: 'MCA',
    department: { name: 'Faculty of Computer Applications & Information Technology (FCAIT)', code: 'FCAIT' },
    durationYears: 2,
    totalSemesters: 4
  }
];

export const DEFAULT_FACULTIES = [
  {
    _id: 'faculty_mahir',
    name: 'Prof. Mahir Patel',
    email: 'mahir@gmail.com',
    idNumber: 'FAC-001',
    department: { name: 'FCAIT', code: 'FCAIT' },
    course: { name: 'IMSCIT', code: 'IMSCIT' },
    assignedSubjects: [
      { name: 'Artificial Intelligence', code: 'AI01', credits: 4 },
      { name: 'Database Management Systems', code: 'FC01', credits: 4 }
    ]
  },
  {
    _id: 'faculty_hiren',
    name: 'Prof. Hiren Patel',
    email: 'hiren@gmail.com',
    idNumber: 'FAC-002',
    department: { name: 'FCAIT', code: 'FCAIT' },
    course: { name: 'BCA', code: 'BCA' },
    assignedSubjects: [
      { name: 'Python Programming', code: 'FC03', credits: 4 },
      { name: 'PHP & Web Development', code: 'FC02', credits: 4 }
    ]
  },
  {
    _id: 'faculty_sneha',
    name: 'Dr. Sneha Joshi',
    email: 'sneha.joshi@gmail.com',
    idNumber: 'FAC-003',
    department: { name: 'FCAIT', code: 'FCAIT' },
    course: { name: 'IMSCIT', code: 'IMSCIT' },
    assignedSubjects: [
      { name: 'Cloud Computing & DevOps', code: 'CS05', credits: 4 },
      { name: 'Data Structures & Algorithms', code: 'BCA02', credits: 4 }
    ]
  }
];

export const MOCK_COURSE_REPORTS = {
  course_imscit: {
    course: {
      _id: 'course_imscit',
      name: 'Integrated MSc in Information Technology',
      code: 'IMSCIT',
      department: 'Faculty of Computer Applications & IT (FCAIT)',
      durationYears: 5,
      totalSemesters: 10
    },
    summary: {
      totalStudents: 10,
      totalLectures: 72,
      overallPercentage: 78.4,
      eligibleCount: 7,
      warningCount: 2,
      shortageCount: 1
    },
    subjects: [
      {
        subjectId: 'sub_ai',
        name: 'Artificial Intelligence',
        code: 'AI01',
        facultyName: 'Prof. Mahir Patel',
        totalLectures: 24,
        attendanceRate: 83.3
      },
      {
        subjectId: 'sub_dbms',
        name: 'Database Management Systems',
        code: 'FC01',
        facultyName: 'Prof. Mahir Patel',
        totalLectures: 24,
        attendanceRate: 75.0
      },
      {
        subjectId: 'sub_cloud',
        name: 'Cloud Computing & DevOps',
        code: 'CS05',
        facultyName: 'Dr. Sneha Joshi',
        totalLectures: 24,
        attendanceRate: 77.0
      }
    ],
    students: [
      {
        student: { _id: 's1', name: 'Aarav Patel', email: 'aarav.patel@gmail.com', idNumber: '2024-IMSCIT-001', year: 'FY' },
        totalClasses: 72, attended: 68, absent: 4, percentage: 94.4, eligibility: 'Eligible'
      },
      {
        student: { _id: 's2', name: 'Diya Shah', email: 'diya.shah@gmail.com', idNumber: '2024-IMSCIT-002', year: 'FY' },
        totalClasses: 72, attended: 64, absent: 8, percentage: 88.9, eligibility: 'Eligible'
      },
      {
        student: { _id: 's3', name: 'Tanvi Trivedi', email: 'tanvi.trivedi@gmail.com', idNumber: '2024-IMSCIT-003', year: 'FY' },
        totalClasses: 72, attended: 62, absent: 10, percentage: 86.1, eligibility: 'Eligible'
      },
      {
        student: { _id: 's4', name: 'Yashraj Solanki', email: 'yashraj.solanki@gmail.com', idNumber: '2024-IMSCIT-004', year: 'FY' },
        totalClasses: 72, attended: 59, absent: 13, percentage: 81.9, eligibility: 'Eligible'
      },
      {
        student: { _id: 's5', name: 'Rohan Mehta', email: 'rohan.mehta@gmail.com', idNumber: '2024-IMSCIT-005', year: 'FY' },
        totalClasses: 72, attended: 58, absent: 14, percentage: 80.6, eligibility: 'Eligible'
      },
      {
        student: { _id: 's6', name: 'Khushi Dave', email: 'khushi.dave@gmail.com', idNumber: '2024-IMSCIT-006', year: 'FY' },
        totalClasses: 72, attended: 57, absent: 15, percentage: 79.2, eligibility: 'Eligible'
      },
      {
        student: { _id: 's7', name: 'Ananya Joshi', email: 'ananya.joshi@gmail.com', idNumber: '2024-IMSCIT-007', year: 'FY' },
        totalClasses: 72, attended: 55, absent: 17, percentage: 76.4, eligibility: 'Eligible'
      },
      {
        student: { _id: 's8', name: 'Harshil Desai', email: 'harshil.desai@gmail.com', idNumber: '2024-IMSCIT-008', year: 'FY' },
        totalClasses: 72, attended: 50, absent: 22, percentage: 69.4, eligibility: 'Warning'
      },
      {
        student: { _id: 's9', name: 'Priyanshi Patel', email: 'priyanshi.patel@gmail.com', idNumber: '2024-IMSCIT-009', year: 'FY' },
        totalClasses: 72, attended: 48, absent: 24, percentage: 66.7, eligibility: 'Warning'
      },
      {
        student: { _id: 's10', name: 'Manan Vora', email: 'manan.vora@gmail.com', idNumber: '2024-IMSCIT-010', year: 'FY' },
        totalClasses: 72, attended: 42, absent: 30, percentage: 58.3, eligibility: 'Critical Shortage'
      }
    ],
    recentSessions: [
      { sessionId: 'rs1', date: new Date(Date.now() - 1 * 86400000).toISOString(), className: 'IMSCIT Div-A (AI)', subjectName: 'Artificial Intelligence', subjectCode: 'AI01', facultyName: 'Prof. Mahir Patel', presentCount: 9, totalStudents: 10, attendanceRate: 90, radius: 25 },
      { sessionId: 'rs2', date: new Date(Date.now() - 2 * 86400000).toISOString(), className: 'IMSCIT Div-A (DBMS)', subjectName: 'Database Management Systems', subjectCode: 'FC01', facultyName: 'Prof. Mahir Patel', presentCount: 8, totalStudents: 10, attendanceRate: 80, radius: 25 },
      { sessionId: 'rs3', date: new Date(Date.now() - 3 * 86400000).toISOString(), className: 'IMSCIT Div-A (Cloud)', subjectName: 'Cloud Computing & DevOps', subjectCode: 'CS05', facultyName: 'Dr. Sneha Joshi', presentCount: 8, totalStudents: 10, attendanceRate: 80, radius: 25 },
      { sessionId: 'rs4', date: new Date(Date.now() - 4 * 86400000).toISOString(), className: 'IMSCIT Div-A (AI)', subjectName: 'Artificial Intelligence', subjectCode: 'AI01', facultyName: 'Prof. Mahir Patel', presentCount: 9, totalStudents: 10, attendanceRate: 90, radius: 25 },
      { sessionId: 'rs5', date: new Date(Date.now() - 5 * 86400000).toISOString(), className: 'IMSCIT Div-A (DBMS)', subjectName: 'Database Management Systems', subjectCode: 'FC01', facultyName: 'Prof. Mahir Patel', presentCount: 7, totalStudents: 10, attendanceRate: 70, radius: 25 }
    ]
  },
  course_bca: {
    course: {
      _id: 'course_bca',
      name: 'Bachelor of Computer Applications',
      code: 'BCA',
      department: 'Faculty of Computer Applications & IT (FCAIT)',
      durationYears: 3,
      totalSemesters: 6
    },
    summary: {
      totalStudents: 8,
      totalLectures: 48,
      overallPercentage: 81.5,
      eligibleCount: 6,
      warningCount: 1,
      shortageCount: 1
    },
    subjects: [
      {
        subjectId: 'sub_py',
        name: 'Python Programming',
        code: 'FC03',
        facultyName: 'Prof. Hiren Patel',
        totalLectures: 24,
        attendanceRate: 84.5
      },
      {
        subjectId: 'sub_php',
        name: 'PHP & Web Development',
        code: 'FC02',
        facultyName: 'Prof. Hiren Patel',
        totalLectures: 24,
        attendanceRate: 78.5
      }
    ],
    students: [
      {
        student: { _id: 'sb1', name: 'Jayesh Parmar', email: 'jayesh.parmar@gmail.com', idNumber: '2024-BCA-101', year: 'FY' },
        totalClasses: 48, attended: 43, absent: 5, percentage: 89.6, eligibility: 'Eligible'
      },
      {
        student: { _id: 'sb2', name: 'Riddhi Kothari', email: 'riddhi.kothari@gmail.com', idNumber: '2024-BCA-104', year: 'FY' },
        totalClasses: 48, attended: 42, absent: 6, percentage: 87.5, eligibility: 'Eligible'
      },
      {
        student: { _id: 'sb3', name: 'Meera Vyas', email: 'meera.vyas@gmail.com', idNumber: '2024-BCA-102', year: 'FY' },
        totalClasses: 48, attended: 41, absent: 7, percentage: 85.4, eligibility: 'Eligible'
      },
      {
        student: { _id: 'sb4', name: 'Vidhi Soni', email: 'vidhi.soni@gmail.com', idNumber: '2024-BCA-106', year: 'FY' },
        totalClasses: 48, attended: 39, absent: 9, percentage: 81.3, eligibility: 'Eligible'
      },
      {
        student: { _id: 'sb5', name: 'Bhavin Panchal', email: 'bhavin.panchal@gmail.com', idNumber: '2024-BCA-103', year: 'FY' },
        totalClasses: 48, attended: 38, absent: 10, percentage: 79.2, eligibility: 'Eligible'
      },
      {
        student: { _id: 'sb6', name: 'Payal Rawal', email: 'payal.rawal@gmail.com', idNumber: '2024-BCA-108', year: 'FY' },
        totalClasses: 48, attended: 37, absent: 11, percentage: 77.1, eligibility: 'Eligible'
      },
      {
        student: { _id: 'sb7', name: 'Deep Patel', email: 'deep.patel@gmail.com', idNumber: '2024-BCA-105', year: 'FY' },
        totalClasses: 48, attended: 34, absent: 14, percentage: 70.8, eligibility: 'Warning'
      },
      {
        student: { _id: 'sb8', name: 'Kevin Christian', email: 'kevin.christian@gmail.com', idNumber: '2024-BCA-107', year: 'FY' },
        totalClasses: 48, attended: 29, absent: 19, percentage: 60.4, eligibility: 'Critical Shortage'
      }
    ],
    recentSessions: [
      { sessionId: 'rsb1', date: new Date(Date.now() - 1 * 86400000).toISOString(), className: 'BCA Div-A (Python)', subjectName: 'Python Programming', subjectCode: 'FC03', facultyName: 'Prof. Hiren Patel', presentCount: 7, totalStudents: 8, attendanceRate: 87.5, radius: 25 },
      { sessionId: 'rsb2', date: new Date(Date.now() - 2 * 86400000).toISOString(), className: 'BCA Div-A (PHP)', subjectName: 'PHP & Web Development', subjectCode: 'FC02', facultyName: 'Prof. Hiren Patel', presentCount: 6, totalStudents: 8, attendanceRate: 75.0, radius: 25 }
    ]
  },
  course_mca: {
    course: {
      _id: 'course_mca',
      name: 'Master of Computer Applications',
      code: 'MCA',
      department: 'Faculty of Computer Applications & IT (FCAIT)',
      durationYears: 2,
      totalSemesters: 4
    },
    summary: {
      totalStudents: 6,
      totalLectures: 36,
      overallPercentage: 83.3,
      eligibleCount: 5,
      warningCount: 1,
      shortageCount: 0
    },
    subjects: [
      {
        subjectId: 'sub_mca1',
        name: 'Advanced Software Architecture',
        code: 'MCA01',
        facultyName: 'Prof. Mahir Patel',
        totalLectures: 18,
        attendanceRate: 85.0
      },
      {
        subjectId: 'sub_mca2',
        name: 'Machine Learning & Neural Networks',
        code: 'MCA02',
        facultyName: 'Dr. Sneha Joshi',
        totalLectures: 18,
        attendanceRate: 81.6
      }
    ],
    students: [
      {
        student: { _id: 'sm1', name: 'Siddharth Shah', email: 'siddharth@gmail.com', idNumber: '2024-MCA-001', year: 'SY' },
        totalClasses: 36, attended: 33, absent: 3, percentage: 91.7, eligibility: 'Eligible'
      },
      {
        student: { _id: 'sm2', name: 'Nidhi Raval', email: 'nidhi.raval@gmail.com', idNumber: '2024-MCA-002', year: 'SY' },
        totalClasses: 36, attended: 31, absent: 5, percentage: 86.1, eligibility: 'Eligible'
      },
      {
        student: { _id: 'sm3', name: 'Pranav Joshi', email: 'pranav.joshi@gmail.com', idNumber: '2024-MCA-003', year: 'SY' },
        totalClasses: 36, attended: 30, absent: 6, percentage: 83.3, eligibility: 'Eligible'
      },
      {
        student: { _id: 'sm4', name: 'Devanshi Mehta', email: 'devanshi@gmail.com', idNumber: '2024-MCA-004', year: 'SY' },
        totalClasses: 36, attended: 29, absent: 7, percentage: 80.6, eligibility: 'Eligible'
      },
      {
        student: { _id: 'sm5', name: 'Chirag Barot', email: 'chirag.barot@gmail.com', idNumber: '2024-MCA-005', year: 'SY' },
        totalClasses: 36, attended: 28, absent: 8, percentage: 77.8, eligibility: 'Eligible'
      },
      {
        student: { _id: 'sm6', name: 'Bhumika Parmar', email: 'bhumika@gmail.com', idNumber: '2024-MCA-006', year: 'SY' },
        totalClasses: 36, attended: 25, absent: 11, percentage: 69.4, eligibility: 'Warning'
      }
    ],
    recentSessions: [
      { sessionId: 'rsm1', date: new Date(Date.now() - 1 * 86400000).toISOString(), className: 'MCA Div-A (Arch)', subjectName: 'Advanced Software Architecture', subjectCode: 'MCA01', facultyName: 'Prof. Mahir Patel', presentCount: 5, totalStudents: 6, attendanceRate: 83.3, radius: 25 }
    ]
  }
};

export const MOCK_FACULTY_REPORTS = {
  faculty_mahir: {
    faculty: {
      _id: 'faculty_mahir',
      name: 'Prof. Mahir Patel',
      email: 'mahir@gmail.com',
      idNumber: 'FAC-001',
      department: 'FCAIT',
      course: 'IMSCIT'
    },
    summary: {
      totalLectures: 59,
      totalSubjects: 2,
      totalVerifiedCheckIns: 229,
      averageAttendanceRate: 85.8
    },
    subjects: [
      {
        subjectId: 'sub_ai',
        name: 'Artificial Intelligence',
        code: 'AI01',
        credits: 4,
        totalLectures: 35,
        attendanceRate: 87.2
      },
      {
        subjectId: 'sub_dbms',
        name: 'Database Management Systems',
        code: 'FC01',
        credits: 4,
        totalLectures: 24,
        attendanceRate: 83.8
      }
    ],
    sessions: [
      { sessionId: 'fs1', date: new Date(Date.now() - 1 * 86400000).toISOString(), className: 'IMSCIT Div-A (AI)', subjectName: 'Artificial Intelligence', presentCount: 9, totalCount: 10, attendanceRate: 90, radius: 25 },
      { sessionId: 'fs2', date: new Date(Date.now() - 2 * 86400000).toISOString(), className: 'IMSCIT Div-A (DBMS)', subjectName: 'Database Management Systems', presentCount: 8, totalCount: 10, attendanceRate: 80, radius: 25 },
      { sessionId: 'fs3', date: new Date(Date.now() - 3 * 86400000).toISOString(), className: 'IMSCIT Div-A (AI)', subjectName: 'Artificial Intelligence', presentCount: 10, totalCount: 10, attendanceRate: 100, radius: 25 },
      { sessionId: 'fs4', date: new Date(Date.now() - 4 * 86400000).toISOString(), className: 'IMSCIT Div-A (DBMS)', subjectName: 'Database Management Systems', presentCount: 8, totalCount: 10, attendanceRate: 80, radius: 25 },
      { sessionId: 'fs5', date: new Date(Date.now() - 5 * 86400000).toISOString(), className: 'IMSCIT Div-A (AI)', subjectName: 'Artificial Intelligence', presentCount: 9, totalCount: 10, attendanceRate: 90, radius: 25 }
    ]
  },
  faculty_hiren: {
    faculty: {
      _id: 'faculty_hiren',
      name: 'Prof. Hiren Patel',
      email: 'hiren@gmail.com',
      idNumber: 'FAC-002',
      department: 'FCAIT',
      course: 'BCA'
    },
    summary: {
      totalLectures: 48,
      totalSubjects: 2,
      totalVerifiedCheckIns: 184,
      averageAttendanceRate: 81.5
    },
    subjects: [
      {
        subjectId: 'sub_py',
        name: 'Python Programming',
        code: 'FC03',
        credits: 4,
        totalLectures: 24,
        attendanceRate: 84.5
      },
      {
        subjectId: 'sub_php',
        name: 'PHP & Web Development',
        code: 'FC02',
        credits: 4,
        totalLectures: 24,
        attendanceRate: 78.5
      }
    ],
    sessions: [
      { sessionId: 'fsh1', date: new Date(Date.now() - 1 * 86400000).toISOString(), className: 'BCA Div-A (Python)', subjectName: 'Python Programming', presentCount: 7, totalCount: 8, attendanceRate: 87.5, radius: 25 },
      { sessionId: 'fsh2', date: new Date(Date.now() - 2 * 86400000).toISOString(), className: 'BCA Div-A (PHP)', subjectName: 'PHP & Web Development', presentCount: 6, totalCount: 8, attendanceRate: 75.0, radius: 25 },
      { sessionId: 'fsh3', date: new Date(Date.now() - 3 * 86400000).toISOString(), className: 'BCA Div-A (Python)', subjectName: 'Python Programming', presentCount: 7, totalCount: 8, attendanceRate: 87.5, radius: 25 }
    ]
  },
  faculty_sneha: {
    faculty: {
      _id: 'faculty_sneha',
      name: 'Dr. Sneha Joshi',
      email: 'sneha.joshi@gmail.com',
      idNumber: 'FAC-003',
      department: 'FCAIT',
      course: 'IMSCIT'
    },
    summary: {
      totalLectures: 28,
      totalSubjects: 2,
      totalVerifiedCheckIns: 112,
      averageAttendanceRate: 82.5
    },
    subjects: [
      {
        subjectId: 'sub_cloud',
        name: 'Cloud Computing & DevOps',
        code: 'CS05',
        credits: 4,
        totalLectures: 14,
        attendanceRate: 82.0
      },
      {
        subjectId: 'sub_dsa',
        name: 'Data Structures & Algorithms',
        code: 'BCA02',
        credits: 4,
        totalLectures: 14,
        attendanceRate: 83.0
      }
    ],
    sessions: [
      { sessionId: 'fss1', date: new Date(Date.now() - 1 * 86400000).toISOString(), className: 'IMSCIT Div-A (Cloud)', subjectName: 'Cloud Computing & DevOps', presentCount: 8, totalCount: 10, attendanceRate: 80, radius: 25 },
      { sessionId: 'fss2', date: new Date(Date.now() - 3 * 86400000).toISOString(), className: 'BCA Div-B (DSA)', subjectName: 'Data Structures & Algorithms', presentCount: 7, totalCount: 8, attendanceRate: 87.5, radius: 25 }
    ]
  }
};
