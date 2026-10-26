const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    // Used for dynamic QR code validation
    sessionToken: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    attendanceCode: {
        type: String,
        required: true
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    radius: {
        type: Number,
        required: true,
        default: 100
    },
    records: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Late', 'Excused'],
            default: 'Absent'
        },
        // Distance in meters between student and instructor at check-in
        distance: {
            type: Number
        },
        // Device GPS accuracy radius reported by student device
        accuracy: {
            type: Number
        },
        // Biometric Euclidean distance from face-api.js (threshold < 0.6)
        faceDistance: {
            type: Number
        },
        // Coordinates captured from student phone
        deviceLocation: {
            lat: Number,
            lng: Number
        },
        // Timestamp of when the student scanned the QR or was marked present
        markedAt: {
            type: Date
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);
