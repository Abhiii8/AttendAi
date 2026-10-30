require('dotenv').config();
const mongoose = require('mongoose');

async function seedDemoData() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas!');

        const Department = require('../models/Department');
        const Course = require('../models/Course');
        const Subject = require('../models/Subject');
        const User = require('../models/User');
        const Class = require('../models/Class');
        const Attendance = require('../models/Attendance');

        // 1. Department: FCAIT
        let dept = await Department.findOne({ code: 'FCAIT' });
        if (!dept) {
            dept = await Department.create({
                name: 'Faculty of Computer Applications & Information Technology',
                code: 'FCAIT',
                description: 'GLS University - Premier Faculty of Computer Applications & IT'
            });
        }

        // 2. Courses: IMSCIT and BCA
        let imscit = await Course.findOne({ code: 'IMSCIT' });
        if (!imscit) {
            imscit = await Course.create({
                name: 'Integrated MSc in Information Technology',
                code: 'IMSCIT',
                department: dept._id,
                durationYears: 5,
                totalSemesters: 10,
                description: 'Dual-degree 5-year integrated program in Information Technology'
            });
        }

        let bca = await Course.findOne({ code: 'BCA' });
        if (!bca) {
            bca = await Course.create({
                name: 'Bachelor of Computer Applications',
                code: 'BCA',
                department: dept._id,
                durationYears: 3,
                totalSemesters: 6,
                description: 'Undergraduate degree program in Computer Applications and Software Development'
            });
        }

        // 3. Subjects
        const subjectsData = [
            { name: 'Artificial Intelligence', code: 'AI01', course: imscit._id, semester: 1, credits: 4 },
            { name: 'Database Management Systems', code: 'FC01', course: imscit._id, semester: 1, credits: 4 },
            { name: 'Cloud Computing & DevOps', code: 'CS05', course: imscit._id, semester: 2, credits: 4 },
            { name: 'Python Programming', code: 'FC03', course: bca._id, semester: 1, credits: 4 },
            { name: 'PHP & Web Development', code: 'FC02', course: bca._id, semester: 2, credits: 4 },
            { name: 'Data Structures & Algorithms', code: 'BCA02', course: bca._id, semester: 2, credits: 4 }
        ];

        const subjectMap = {};
        for (const s of subjectsData) {
            let sub = await Subject.findOne({ code: s.code });
            if (!sub) {
                sub = await Subject.create({
                    name: s.name,
                    code: s.code,
                    department: dept._id,
                    course: s.course,
                    semester: s.semester,
                    credits: s.credits
                });
            } else {
                sub.name = s.name;
                sub.department = dept._id;
                sub.course = s.course;
                await sub.save();
            }
            subjectMap[s.code] = sub;
        }

        // 4. Faculties
        // Faculty 1: Mahir Patel (AI01, FC01)
        let fac1 = await User.findOne({ email: 'mahir@gmail.com' });
        if (fac1) {
            fac1.department = dept._id;
            fac1.course = imscit._id;
            fac1.assignedSubjects = [subjectMap['AI01']._id, subjectMap['FC01']._id];
            await fac1.save();
        }

        // Faculty 2: Prof. Hiren Patel (FC03, FC02)
        let fac2 = await User.findOne({ email: 'hiren@gmail.com' });
        if (!fac2) {
            fac2 = await User.create({
                name: 'Prof. Hiren Patel',
                email: 'hiren@gmail.com',
                password: 'password123',
                role: 'faculty',
                idNumber: '002',
                department: dept._id,
                course: bca._id,
                assignedSubjects: [subjectMap['FC03']._id, subjectMap['FC02']._id]
            });
        } else {
            fac2.department = dept._id;
            fac2.course = bca._id;
            fac2.assignedSubjects = [subjectMap['FC03']._id, subjectMap['FC02']._id];
            await fac2.save();
        }

        // Faculty 3: Dr. Sneha Joshi (CS05, BCA02)
        let fac3 = await User.findOne({ email: 'sneha.joshi@gmail.com' });
        if (!fac3) {
            fac3 = await User.create({
                name: 'Dr. Sneha Joshi',
                email: 'sneha.joshi@gmail.com',
                password: 'password123',
                role: 'faculty',
                idNumber: '003',
                department: dept._id,
                course: imscit._id,
                assignedSubjects: [subjectMap['CS05']._id, subjectMap['BCA02']._id]
            });
        } else {
            fac3.department = dept._id;
            fac3.course = imscit._id;
            fac3.assignedSubjects = [subjectMap['CS05']._id, subjectMap['BCA02']._id];
            await fac3.save();
        }

        // 5. Students (IMSCIT and BCA)
        const demoStudents = [
            // IMSCIT Students (Batch A)
            { name: 'Patel Abhi Kiranbhai', email: 'abhikiranpatel@gmail.com', idNumber: '2026001', course: imscit._id, year: 'FY', rate: 0.92 },
            { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', idNumber: '2026002', course: imscit._id, year: 'FY', rate: 0.88 },
            { name: 'Priya Mehta', email: 'priya.mehta@gmail.com', idNumber: '2026003', course: imscit._id, year: 'FY', rate: 0.95 },
            { name: 'Aryan Dave', email: 'aryan.dave@gmail.com', idNumber: '2026004', course: imscit._id, year: 'FY', rate: 0.79 },
            { name: 'Devansh Shah', email: 'devansh.shah@gmail.com', idNumber: '2026005', course: imscit._id, year: 'FY', rate: 0.69 }, // Warning
            { name: 'Ananya Gupta', email: 'ananya.gupta@gmail.com', idNumber: '2026006', course: imscit._id, year: 'FY', rate: 0.94 },
            { name: 'Siddharth Varma', email: 'siddharth.v@gmail.com', idNumber: '2026007', course: imscit._id, year: 'FY', rate: 0.82 },
            { name: 'Kavita Trivedi', email: 'kavita.t@gmail.com', idNumber: '2026008', course: imscit._id, year: 'FY', rate: 0.87 },
            { name: 'Rohan Nair', email: 'rohan.nair@gmail.com', idNumber: '2026009', course: imscit._id, year: 'FY', rate: 0.55 }, // Shortage defaulter
            { name: 'Sneha K. Joshi', email: 'sneha.k.joshi@gmail.com', idNumber: '2026010', course: imscit._id, year: 'FY', rate: 0.91 },

            // BCA Students (Batch B)
            { name: 'Meet Soni', email: 'meet.soni@gmail.com', idNumber: '2026101', course: bca._id, year: 'FY', rate: 0.86 },
            { name: 'Riya Desai', email: 'riya.desai@gmail.com', idNumber: '2026102', course: bca._id, year: 'FY', rate: 0.93 },
            { name: 'Yash Vyas', email: 'yash.vyas@gmail.com', idNumber: '2026103', course: bca._id, year: 'FY', rate: 0.74 }, // Warning
            { name: 'Khushi Parmar', email: 'khushi.parmar@gmail.com', idNumber: '2026104', course: bca._id, year: 'FY', rate: 0.90 },
            { name: 'Harshil Panchal', email: 'harshil.panchal@gmail.com', idNumber: '2026105', course: bca._id, year: 'FY', rate: 0.58 }, // Shortage
            { name: 'Disha Patel', email: 'disha.patel@gmail.com', idNumber: '2026106', course: bca._id, year: 'FY', rate: 0.84 },
            { name: 'Aarav Chokshi', email: 'aarav.chokshi@gmail.com', idNumber: '2026107', course: bca._id, year: 'FY', rate: 0.89 },
            { name: 'Pooja Solanki', email: 'pooja.solanki@gmail.com', idNumber: '2026108', course: bca._id, year: 'FY', rate: 0.78 }
        ];

        const imscitStudentIds = [];
        const bcaStudentIds = [];
        const studentRateMap = {};

        for (const st of demoStudents) {
            let u = await User.findOne({ email: st.email });
            if (!u) {
                u = await User.create({
                    name: st.name,
                    email: st.email,
                    password: 'password123',
                    role: 'student',
                    idNumber: st.idNumber,
                    department: dept._id,
                    course: st.course,
                    year: st.year,
                    faceEmbeddings: Array.from({ length: 128 }, () => Math.round((Math.random() * 0.4 - 0.2) * 1000) / 1000)
                });
                console.log(`Created Student: ${st.name} (${st.idNumber})`);
            } else {
                u.department = dept._id;
                u.course = st.course;
                u.idNumber = st.idNumber;
                if (!u.faceEmbeddings || u.faceEmbeddings.length === 0) {
                    u.faceEmbeddings = Array.from({ length: 128 }, () => Math.round((Math.random() * 0.4 - 0.2) * 1000) / 1000);
                }
                await u.save();
            }

            studentRateMap[u._id.toString()] = st.rate;
            if (st.course.toString() === imscit._id.toString()) {
                imscitStudentIds.push(u._id);
            } else {
                bcaStudentIds.push(u._id);
            }
        }

        // 6. Ensure Classes and Enroll Students
        const classesData = [
            { name: 'FY-ImscIT-AI01', subject: subjectMap['AI01']._id, faculty: fac1._id, course: imscit._id, students: imscitStudentIds },
            { name: 'FY-ImscIT-FC01', subject: subjectMap['FC01']._id, faculty: fac1._id, course: imscit._id, students: imscitStudentIds },
            { name: 'FY-ImscIT-CS05', subject: subjectMap['CS05']._id, faculty: fac3._id, course: imscit._id, students: imscitStudentIds },
            { name: 'FY-BCA-FC03', subject: subjectMap['FC03']._id, faculty: fac2._id, course: bca._id, students: bcaStudentIds },
            { name: 'FY-BCA-FC02', subject: subjectMap['FC02']._id, faculty: fac2._id, course: bca._id, students: bcaStudentIds },
            { name: 'FY-BCA-BCA02', subject: subjectMap['BCA02']._id, faculty: fac3._id, course: bca._id, students: bcaStudentIds }
        ];

        const classMap = {};
        for (const c of classesData) {
            let cls = await Class.findOne({ name: c.name });
            if (!cls) {
                cls = await Class.create({
                    name: c.name,
                    subject: c.subject,
                    faculty: c.faculty,
                    course: c.course,
                    students: c.students,
                    schedule: [
                        { dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', room: 'Lab 101', type: 'Lecture' },
                        { dayOfWeek: 'Wednesday', startTime: '11:00', endTime: '12:00', room: 'Room 204', type: 'Lecture' }
                    ]
                });
            } else {
                cls.subject = c.subject;
                cls.faculty = c.faculty;
                cls.course = c.course;
                cls.students = c.students;
                await cls.save();
            }
            classMap[c.name] = cls;
        }

        // 7. Seed Realistic Attendance Sessions across the past 4 weeks
        console.log('Seeding attendance sessions across the past 30 days...');
        const daysAgoList = [0, 1, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28]; // 14 lecture days

        let sessionsCreated = 0;
        const now = new Date();

        for (const clsName of Object.keys(classMap)) {
            const cls = classMap[clsName];
            const isImscit = cls.course.toString() === imscit._id.toString();
            const studentRoster = isImscit ? imscitStudentIds : bcaStudentIds;

            for (const daysAgo of daysAgoList) {
                const sessionDate = new Date(now);
                sessionDate.setDate(now.getDate() - daysAgo);
                sessionDate.setHours(10, 30, 0, 0);

                // Check if session on this date already exists for this class
                const startOfDay = new Date(sessionDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(sessionDate);
                endOfDay.setHours(23, 59, 59, 999);

                const existing = await Attendance.findOne({
                    class: cls._id,
                    date: { $gte: startOfDay, $lte: endOfDay }
                });

                if (existing) continue;

                // Build attendance records for each enrolled student
                const records = studentRoster.map(sId => {
                    const sidStr = sId.toString();
                    const targetRate = studentRateMap[sidStr] || 0.85;
                    const isPresent = Math.random() < targetRate;

                    if (isPresent) {
                        const dist = Math.round((8 + Math.random() * 32) * 10) / 10; // 8m to 40m
                        const faceDist = Math.round((0.30 + Math.random() * 0.25) * 100) / 100; // 0.30 to 0.55
                        const markedTime = new Date(sessionDate);
                        markedTime.setMinutes(markedTime.getMinutes() + Math.floor(Math.random() * 8));

                        return {
                            student: sId,
                            status: 'Present',
                            distance: dist,
                            accuracy: Math.round((3 + Math.random() * 4) * 10) / 10,
                            faceDistance: faceDist,
                            deviceLocation: { lat: 23.0225 + (Math.random() * 0.0001), lng: 72.5714 + (Math.random() * 0.0001) },
                            markedAt: markedTime
                        };
                    } else {
                        return {
                            student: sId,
                            status: 'Absent',
                            distance: null,
                            accuracy: null,
                            faceDistance: null,
                            deviceLocation: null,
                            markedAt: null
                        };
                    }
                });

                const code = String(Math.floor(1000 + Math.random() * 9000));
                const token = require('crypto').randomBytes(16).toString('hex');

                await Attendance.create({
                    class: cls._id,
                    faculty: cls.faculty,
                    date: sessionDate,
                    sessionToken: token,
                    isActive: daysAgo === 0 ? true : false, // Today's session remains active
                    attendanceCode: code,
                    location: { lat: 23.0225, lng: 72.5714 },
                    radius: 100,
                    records: records
                });

                sessionsCreated++;
            }
        }

        console.log(`\n=======================================================`);
        console.log(`DEMO DATA SEEDED SUCCESSFULLY!`);
        console.log(`Total Students Enrolled: ${demoStudents.length}`);
        console.log(`  - IMSCIT: ${imscitStudentIds.length} students`);
        console.log(`  - BCA: ${bcaStudentIds.length} students`);
        console.log(`Total Classes: ${Object.keys(classMap).length}`);
        console.log(`New Attendance Sessions Created: ${sessionsCreated}`);
        console.log(`=======================================================\n`);

        process.exit(0);
    } catch (err) {
        console.error('Error seeding demo students & attendance:', err);
        process.exit(1);
    }
}

seedDemoData();
