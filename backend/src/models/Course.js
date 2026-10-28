const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a course name (e.g., Integrated MSc in IT, BCA)'],
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Please add a course code (e.g., IMSCIT, BCA, MCA)'],
        unique: true,
        uppercase: true,
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Course must belong to a Department']
    },
    durationYears: {
        type: Number,
        default: 3
    },
    totalSemesters: {
        type: Number,
        default: 6
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
