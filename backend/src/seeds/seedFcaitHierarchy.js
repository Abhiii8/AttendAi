require('dotenv').config();
const mongoose = require('mongoose');

async function seedFcaitHierarchy() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas');

        const Department = require('../models/Department');
        const Course = require('../models/Course');
        const Subject = require('../models/Subject');
        const User = require('../models/User');
        const Class = require('../models/Class');

        // 1. Department: FCAIT
        let dept = await Department.findOne({ code: 'FCAIT' });
        if (!dept) {
            dept = await Department.create({
                name: 'Faculty of Computer Applications & Information Technology',
                code: 'FCAIT',
                description: 'GLS University - Premier institute for Computer Applications and IT'
            });
            console.log('Created Department: FCAIT');
        } else {
            dept.name = 'Faculty of Computer Applications & Information Technology';
            await dept.save();
            console.log('Updated Department: FCAIT');
        }

        // 2. Courses (Branches) under FCAIT (1 Department -> Multiple Courses)
        let imscitCourse = await Course.findOne({ code: 'IMSCIT' });
        if (!imscitCourse) {
            imscitCourse = await Course.create({
                name: 'Integrated MSc in Information Technology',
                code: 'IMSCIT',
                department: dept._id,
                durationYears: 5,
                totalSemesters: 10,
                description: 'Dual-degree 5-year integrated program in Information Technology'
            });
            console.log('Created Course/Branch: iMSc(IT)');
        } else {
            imscitCourse.department = dept._id;
            await imscitCourse.save();
        }

        let bcaCourse = await Course.findOne({ code: 'BCA' });
        if (!bcaCourse) {
            bcaCourse = await Course.create({
                name: 'Bachelor of Computer Applications',
                code: 'BCA',
                department: dept._id,
                durationYears: 3,
                totalSemesters: 6,
                description: 'Undergraduate degree program in Computer Applications and Software Development'
            });
            console.log('Created Course/Branch: BCA');
        } else {
            bcaCourse.department = dept._id;
            await bcaCourse.save();
        }

        // 3. Subjects linked to Course & Department
        const subjectsData = [
            { name: 'Artificial Inteligence', code: 'AI01', course: imscitCourse._id, semester: 1, credits: 4 },
            { name: 'Database Management Systems', code: 'FC01', course: imscitCourse._id, semester: 1, credits: 4 },
            { name: 'Python Programming', code: 'FC03', course: bcaCourse._id, semester: 1, credits: 4 },
            { name: 'PHP & Web Development', code: 'FC02', course: bcaCourse._id, semester: 2, credits: 4 }
        ];

        const subjectDocMap = {};
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
                console.log(`Created Subject: ${s.name} (${s.code}) -> Course: ${s.course === imscitCourse._id ? 'iMScIT' : 'BCA'}`);
            } else {
                sub.department = dept._id;
                sub.course = s.course;
                sub.semester = s.semester;
                await sub.save();
                console.log(`Linked Subject: ${s.name} (${s.code}) -> Course: ${s.course === imscitCourse._id ? 'iMScIT' : 'BCA'}`);
            }
            subjectDocMap[s.code] = sub;
        }

        // 4. Multiple Faculty in FCAIT (1 Faculty -> Multiple Subjects)
        // Faculty 1: Prof. Mahir Patel (teaches AI & DBMS)
        let faculty1 = await User.findOne({ email: 'mahir@gmail.com' });
        if (faculty1) {
            faculty1.department = dept._id;
            faculty1.course = imscitCourse._id;
            faculty1.assignedSubjects = [
                subjectDocMap['AI01']._id,
                subjectDocMap['FC01']._id
            ];
            await faculty1.save();
            console.log(`Faculty 1: ${faculty1.name} assigned to 2 subjects: AI01 & FC01`);
        }

        // Faculty 2: Prof. Hiren Patel (teaches Python & PHP)
        let faculty2 = await User.findOne({ email: 'hiren@gmail.com' });
        if (!faculty2) {
            faculty2 = await User.create({
                name: 'Prof. Hiren Patel',
                email: 'hiren@gmail.com',
                password: 'password123',
                role: 'faculty',
                idNumber: '002',
                department: dept._id,
                course: bcaCourse._id,
                assignedSubjects: [
                    subjectDocMap['FC03']._id,
                    subjectDocMap['FC02']._id
                ]
            });
            console.log(`Created Faculty 2: ${faculty2.name} assigned to 2 subjects: FC03 & FC02`);
        } else {
            faculty2.department = dept._id;
            faculty2.course = bcaCourse._id;
            faculty2.assignedSubjects = [
                subjectDocMap['FC03']._id,
                subjectDocMap['FC02']._id
            ];
            await faculty2.save();
            console.log(`Updated Faculty 2: ${faculty2.name} assigned to 2 subjects: FC03 & FC02`);
        }

        // 5. Student linked to Course & Department
        let student = await User.findOne({ email: 'abhikiranpatel@gmail.com' });
        if (student) {
            student.department = dept._id;
            student.course = imscitCourse._id;
            student.year = 'FY';
            await student.save();
            console.log(`Student: ${student.name} linked to Department: FCAIT, Course: iMScIT`);
        }

        // 6. Link Classes to Course
        await Class.updateMany(
            { subject: { $in: [subjectDocMap['AI01']._id, subjectDocMap['FC01']._id] } },
            { $set: { course: imscitCourse._id } }
        );
        await Class.updateMany(
            { subject: { $in: [subjectDocMap['FC03']._id, subjectDocMap['FC02']._id] } },
            { $set: { course: bcaCourse._id } }
        );
        console.log('Linked Classes to respective Course Foreign Keys');

        console.log('\n=============================================');
        console.log('RELATIONAL HIERARCHY SEEDED SUCCESSFULLY!');
        console.log('Department: FCAIT');
        console.log('  Branches/Courses: iMSc(IT) & BCA');
        console.log('  Faculty 1: Prof. Mahir Patel (AI01, FC01)');
        console.log('  Faculty 2: Prof. Hiren Patel (FC03, FC02)');
        console.log('  Student: Patel Abhi Kiranbhai (Course: iMScIT)');
        console.log('=============================================\n');

        process.exit(0);
    } catch (err) {
        console.error('Error seeding hierarchy:', err);
        process.exit(1);
    }
}

seedFcaitHierarchy();
