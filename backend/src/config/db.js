const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
    // If already connected, reuse existing connection
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    try {
        // Try connecting to Atlas first
        console.log('Attempting to connect to MongoDB Atlas...');
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000 // 10 second timeout for reliable Atlas connection
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.warn(`Atlas connection failed: ${error.message}`);
        console.log('Falling back to local in-memory MongoDB (mongodb-memory-server)...');
        
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            mongoServer = await MongoMemoryServer.create();
            const uri = mongoServer.getUri();
            
            const conn = await mongoose.connect(uri);
            console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
            
            // Seed a default admin user so they can login
            const User = require('../models/User');
            const adminExists = await User.findOne({ role: 'admin' });
            if (!adminExists) {
                console.log('Seeding default admin user...');
                await User.create({
                    name: 'Admin User',
                    email: 'admin@attendai.com',
                    password: 'password123', // Will be hashed by pre-save hook
                    role: 'admin'
                });
                console.log('Default admin seeded: admin@attendai.com / password123');
            }
            return conn;
        } catch (memError) {
            console.error(`Failed to start in-memory database: ${memError.message}`);
            throw memError;
        }
    }
};

module.exports = connectDB;
