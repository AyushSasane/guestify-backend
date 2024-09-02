import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

mongoose.connect('mongodb://127.0.0.1:27017/guestEntrySystem', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');

    // Hash password for the sample user
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create a sample user
    await User.create({
        username: 'admin',
        password: hashedPassword // Use a hashed password in a real application
    });

    console.log('Sample user created');
    mongoose.connection.close();
}).catch(err => console.error(err));
