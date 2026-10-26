require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const seedAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log('MongoDB Connected. Checking for existing admin...');
        const adminExists = await User.findOne({ email: 'Arcenix' });
        
        if (adminExists) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        console.log('Creating Admin user (Arcenix)...');
        await User.create({
            name: 'System Admin',
            email: 'Arcenix', // Using the requested username instead of an email for login
            password: 'Arx@6312',
            role: 'admin',
            idNumber: 'ADMIN-001'
        });

        console.log('Admin user created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedAdmin();
