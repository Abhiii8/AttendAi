const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a department name'],
        unique: true
    },
    code: {
        type: String,
        required: [true, 'Please add a department code (e.g., CS, IT, ME)'],
        unique: true,
        uppercase: true
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
