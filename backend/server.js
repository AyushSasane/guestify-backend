import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import guestRoutes from './routes/guests.js';
import residentRoutes from './routes/residents.js';
import suggestionsRoutes from './routes/suggestions.js';
import userRoutes from './routes/users.js'; 
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from './models/User.js';
import Guest from './models/Guest.js';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from './notification/twilioConfig.js';
import { sendSMS, getResidentPhoneNumber } from './helpers.js';
import axios from 'axios'; // Import axios for making HTTP requests

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/guestEntrySystem', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const redirectUrl = (username === 'secretary') ? 'index.html' : (username === 'watchman') ? 'watchman_dash.html' : null;

        if (redirectUrl) {
            res.json({ token, redirect: redirectUrl });
        } else {
            res.status(401).json({ error: 'Unauthorized user' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.use('/api', suggestionsRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/users', userRoutes);

app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ username: user.username });
    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.patch('/api/profile', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/guests/:guestId/checkout', async (req, res) => {
    const { guestId } = req.params;
    try {
        const guest = await Guest.findById(guestId);
        if (!guest) return res.status(404).json({ message: 'Guest not found' });

        guest.checkOutTime = new Date();
        await guest.save();

        // Notify resident
        const residentPhoneNumber = await getResidentPhoneNumber(guest.residentFlatNumber);
        if (residentPhoneNumber) {
            const message = `Guest ${guest.name} has checked out.`;
            await sendSMS(residentPhoneNumber, message);
        }
        
        res.json({ message: 'Guest checked out successfully!' });
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ message: error.message });
    }
});

// New endpoint for Twilio status
app.get('/api/twilio/status', async (req, res) => {
    try {
        const response = await axios.get(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}.json`, {
            auth: {
                username: TWILIO_ACCOUNT_SID,
                password: TWILIO_AUTH_TOKEN,
            },
        });

        const status = response.data.status; // Modify this based on what information you need
        res.json({ status });
    } catch (error) {
        console.error('Error fetching Twilio status:', error);
        res.status(500).json({ error: 'Failed to fetch Twilio status' });
    }
});

app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route' });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
