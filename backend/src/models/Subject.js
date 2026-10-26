const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a subject name']
    },
    code: {
        type: String,
        required: [true, 'Please add a subject code (e.g., CS101)'],
        unique: true,
        uppercase: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    },
    credits: {
        type: Number,
        required: true,
        default: 3
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);
