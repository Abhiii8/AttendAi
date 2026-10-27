require('dotenv').config();
const mongoose = require('mongoose');

async function seedFcaitTimetable() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas');

        const User = require('../models/User');
        const Subject = require('../models/Subject');
        const Class = require('../models/Class');
        const Department = require('../models/Department');

        // 1. Ensure FCAIT Department
        let fcaitDept = await Department.findOne({ code: 'FCAIT' });
        if (!fcaitDept) {
            fcaitDept = await Department.create({
                name: 'ImscIT',
                code: 'FCAIT',
                description: 'Faculty of Computer Applications & Information Technology'
            });
            console.log('Created FCAIT Department');
        }

        // 2. Update Faculty & Student department to FCAIT
        const faculty = await User.findOne({ role: 'faculty' });
        if (faculty) {
            faculty.department = fcaitDept._id;
            faculty.course = 'iMScIT';
            await faculty.save();
            console.log(`Updated faculty: ${faculty.name} (${faculty.email}) to FCAIT`);
        } else {
            console.error('Faculty not found!');
            process.exit(1);
        }

        const student = await User.findOne({ role: 'student' });
        if (student) {
            student.department = fcaitDept._id;
            student.course = 'iMScIT';
            student.year = 'FY';
            await student.save();
            console.log(`Updated student: ${student.name} (${student.email}) to FCAIT`);
        }

        const studentIds = student ? [student._id] : [];

        // 3. Find or Create Subjects
        const subjectConfigs = [
            { name: 'Artificial Inteligence', code: 'AI01', credits: 4 },
            { name: 'Database Management Systems', code: 'FC01', credits: 4 },
            { name: 'PHP & Web Development', code: 'FC02', credits: 4 },
            { name: 'Python Programming', code: 'FC03', credits: 4 }
        ];

        const subjectMap = {};
        for (const s of subjectConfigs) {
            let sub = await Subject.findOne({ code: s.code });
            if (!sub) {
                // Also check by name
                sub = await Subject.findOne({ name: s.name });
            }
            if (!sub) {
                sub = await Subject.create({ ...s, department: fcaitDept._id });
                console.log(`Created subject: ${s.name} (${s.code})`);
            } else {
                sub.department = fcaitDept._id;
                await sub.save();
            }
            subjectMap[s.code] = sub;
        }

        // 4. Define Schedule Slots adhering strictly to Timetable.jsx TIMESLOTS:
        // Slot 1: 07:30 - 08:15
        // Slot 2: 08:15 - 09:00
        // Slot 3: 09:00 - 09:45
        // BREAK: 09:45 - 10:05
        // Slot 4: 10:05 - 10:50 (CURRENT TIME FOR NOW!)
        // Slot 5: 10:50 - 11:35
        // Slot 6: 11:35 - 12:20

        const schedulesBySubject = {
            'AI01': [
                // Tuesday (TODAY) Slot 4: 10:05 - 10:50 (RIGHT NOW!)
                { dayOfWeek: 'Tuesday', startTime: '10:05', endTime: '10:50', room: '304', type: 'Lecture' },
                // Thursday Slot 3: 09:00 - 09:45
                { dayOfWeek: 'Thursday', startTime: '09:00', endTime: '09:45', room: '304', type: 'Lecture' },
                // Friday Slot 1 & 2 (Lab)
                { dayOfWeek: 'Friday', startTime: '07:30', endTime: '08:15', room: 'Lab 2', type: 'Lab' },
                { dayOfWeek: 'Friday', startTime: '08:15', endTime: '09:00', room: 'Lab 2', type: 'Lab' }
            ],
            'FC01': [
                // Tuesday (TODAY) Slot 5: 10:50 - 11:35 (UPCOMING NEXT!)
                { dayOfWeek: 'Tuesday', startTime: '10:50', endTime: '11:35', room: '304', type: 'Lecture' },
                // Monday Slot 1 & 2
                { dayOfWeek: 'Monday', startTime: '07:30', endTime: '08:15', room: '304', type: 'Lecture' },
                { dayOfWeek: 'Monday', startTime: '08:15', endTime: '09:00', room: '304', type: 'Lecture' },
                // Wednesday Slot 1 & 2 (Lab)
                { dayOfWeek: 'Wednesday', startTime: '07:30', endTime: '08:15', room: 'Lab 1', type: 'Lab' },
                { dayOfWeek: 'Wednesday', startTime: '08:15', endTime: '09:00', room: 'Lab 1', type: 'Lab' }
            ],
            'FC02': [
                // Tuesday (TODAY) Slot 6: 11:35 - 12:20
                { dayOfWeek: 'Tuesday', startTime: '11:35', endTime: '12:20', room: '304', type: 'Lecture' },
                // Monday Slot 4
                { dayOfWeek: 'Monday', startTime: '10:05', endTime: '10:50', room: '304', type: 'Lecture' },
                // Wednesday Slot 5
                { dayOfWeek: 'Wednesday', startTime: '10:50', endTime: '11:35', room: '304', type: 'Lecture' },
                // Friday Slot 4 & 5
                { dayOfWeek: 'Friday', startTime: '10:05', endTime: '10:50', room: 'Lab 1', type: 'Lab' },
                { dayOfWeek: 'Friday', startTime: '10:50', endTime: '11:35', room: 'Lab 1', type: 'Lab' },
                // Saturday Slot 1 & 2
                { dayOfWeek: 'Saturday', startTime: '07:30', endTime: '08:15', room: '304', type: 'Lecture' },
                { dayOfWeek: 'Saturday', startTime: '08:15', endTime: '09:00', room: '304', type: 'Lecture' }
            ],
            'FC03': [
                // Tuesday (TODAY) Slot 3: 09:00 - 09:45
                { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '09:45', room: 'Lab 3', type: 'Lab' },
                // Monday Slot 3
                { dayOfWeek: 'Monday', startTime: '09:00', endTime: '09:45', room: '304', type: 'Lecture' },
                // Wednesday Slot 4
                { dayOfWeek: 'Wednesday', startTime: '10:05', endTime: '10:50', room: '304', type: 'Lecture' },
                // Thursday Slot 4 & 5 (Lab)
                { dayOfWeek: 'Thursday', startTime: '10:05', endTime: '10:50', room: 'Lab 3', type: 'Lab' },
                { dayOfWeek: 'Thursday', startTime: '10:50', endTime: '11:35', room: 'Lab 3', type: 'Lab' }
            ]
        };

        // 5. Update or Create Classes for FCAIT
        for (const [code, schedule] of Object.entries(schedulesBySubject)) {
            const subject = subjectMap[code];
            if (!subject) continue;

            const className = `FY-ImscIT-${code}`;
            let cls = await Class.findOne({ subject: subject._id, faculty: faculty._id });
            
            if (!cls) {
                // Check if class with same name exists
                cls = await Class.findOne({ name: className });
            }

            if (!cls) {
                cls = await Class.create({
                    name: className,
                    subject: subject._id,
                    faculty: faculty._id,
                    students: studentIds,
                    schedule
                });
                console.log(`Created new class: ${className} with ${schedule.length} slots`);
            } else {
                cls.name = className;
                cls.subject = subject._id;
                cls.faculty = faculty._id;
                cls.students = studentIds;
                cls.schedule = schedule;
                await cls.save();
                console.log(`Updated class: ${className} with ${schedule.length} slots`);
            }
        }

        // Also clean up or link any existing unassigned classes to FCAIT
        const existingClasses = await Class.find({ faculty: faculty._id });
        console.log(`Total classes configured for ${faculty.name}: ${existingClasses.length}`);

        console.log('FCAIT Timetable successfully populated!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding timetable:', err);
        process.exit(1);
    }
}

seedFcaitTimetable();
