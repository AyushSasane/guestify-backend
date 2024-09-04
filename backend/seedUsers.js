import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

// Load environment variables from .env file
dotenv.config();

// Debugging output
console.log('MongoDB URI:', process.env.MONGODB_URI);

async function seedDatabase() {
    try {
        // Connect to MongoDB using the URI from .env file
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');

        // Hash password for the sample user
        const hashedPassword = await bcrypt.hash('secretary123', 10);

        // Create a sample user
        await User.create({
            username: 'secretary',
            password: hashedPassword,
        });

        console.log('Sample user created');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        // Close the connection to the database
        mongoose.connection.close();
    }
}

// Run the seed function
seedDatabase();
