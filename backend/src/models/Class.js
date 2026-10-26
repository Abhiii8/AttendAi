const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a class name (e.g., TY-BTech-A)']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Faculty
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Students enrolled in this class
    }],
    schedule: [{
        dayOfWeek: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true
        },
        startTime: {
            type: String, // format HH:MM
            required: true
        },
        endTime: {
            type: String,
            required: true
        },
        room: {
            type: String
        },
        type: {
            type: String,
            default: 'Lecture'
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Class', classSchema);
