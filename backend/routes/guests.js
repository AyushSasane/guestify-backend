import express from 'express';
import Guest from '../models/Guest.js';
import Resident from '../models/Resident.js'; // Import Resident model
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from '../notification/twilioConfig.js';
import twilio from 'twilio';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const router = express.Router();
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const formatPhoneNumber = (phoneNumber) => {
    const parsedNumber = parsePhoneNumberFromString(phoneNumber, 'IN');
    return parsedNumber ? parsedNumber.format('E.164') : null;
};

const sendSMS = (to, message) => {
    const formattedNumber = formatPhoneNumber(to);
    if (!formattedNumber) {
        console.error('Invalid phone number format:', to);
        return;
    }
    
    client.messages.create({
        body: message,
        from: TWILIO_PHONE_NUMBER,
        to: formattedNumber
    })
    .then(message => console.log(`SMS sent: ${message.sid}`))
    .catch(err => console.error('Failed to send SMS:', err));
};

const getResidentPhoneNumber = async (flatNumber) => {
    try {
        console.log(`Searching for resident with flatNumber: ${flatNumber}`);
        const resident = await Resident.findOne({ flatNumber });
        if (!resident) {
            console.log(`Resident not found for flatNumber: ${flatNumber}`);
            return null;
        }
        console.log(`Resident found:`, resident);
        return resident.phoneNumber;
    } catch (error) {
        console.error('Error fetching resident phone number:', error);
        return null;
    }
};



router.post('/', async (req, res) => {
    const { name, contactNumber, purposeOfVisit, residentFlatNumber, residentName, numberOfGuests } = req.body;
    try {
        const newGuest = new Guest({
            name,
            contactNumber,
            purposeOfVisit,
            residentFlatNumber,
            residentName,
            numberOfGuests,
            visitTime: new Date(),
        });
        const savedGuest = await newGuest.save();

        const residentPhoneNumber = await getResidentPhoneNumber(residentFlatNumber);
        const guestMessage = `Hello ${name}, you have checked in. Purpose: ${purposeOfVisit}. Contact Number: ${contactNumber}.`;
        const residentMessage = `Guest ${name} has checked in. Purpose: ${purposeOfVisit}. Contact Number: ${contactNumber}.`;

        // Send SMS to guest
        sendSMS(contactNumber, guestMessage);
        // Send SMS to resident if phone number is available
        if (residentPhoneNumber) {
            sendSMS(residentPhoneNumber, residentMessage);
        }

        res.status(201).json(savedGuest);
    } catch (error) {
        console.error('Error during guest check-in:', error);
        res.status(500).json({ message: error.message });
    }
});

router.patch('/checkout', async (req, res) => {
    const { flatNumber } = req.body;
    try {
        const guest = await Guest.findOneAndUpdate(
            { residentFlatNumber: flatNumber, checkOutTime: null },
            { checkOutTime: new Date() },
            { new: true }
        );
        if (!guest) {
            return res.status(404).json({ message: 'Guest not found or already checked out.' });
        }

        const residentPhoneNumber = await getResidentPhoneNumber(flatNumber);
        const guestMessage = `Hello ${guest.name}, you have checked out.`;
        const residentMessage = `Guest ${guest.name} has checked out.`;

        // Send SMS to guest
        sendSMS(guest.contactNumber, guestMessage);
        // Send SMS to resident if phone number is available
        if (residentPhoneNumber) {
            sendSMS(residentPhoneNumber, residentMessage);
        }

        res.json(guest);
    } catch (error) {
        console.error('Error during guest check-out:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/active', async (req, res) => {
    try {
        const guests = await Guest.find({ checkOutTime: null });
        res.json(guests);
    } catch (err) {
        console.error('Error fetching active guests:', err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/total', async (req, res) => {
    try {
        const guests = await Guest.find();
        res.json(guests);
    } catch (err) {
        console.error('Error fetching all guests:', err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const guest = await Guest.findById(id);
        if (!guest) {
            return res.status(404).json({ message: 'Guest not found.' });
        }
        res.json(guest);
    } catch (err) {
        console.error('Error fetching guest details:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/:guestId/notify-resident', async (req, res) => {
    const { guestId } = req.params;
    const { flatNumber, guestName } = req.body;

    try {
        console.log(`Notify resident request received for guestId: ${guestId}`);
        const residentPhoneNumber = await getResidentPhoneNumber(flatNumber);
        if (!residentPhoneNumber) {
            console.log(`No phone number found for flatNumber: ${flatNumber}`);
            return res.status(404).json({ message: 'Resident phone number not found' });
        }

        const message = `Guest ${guestName} has checked out.`;
        await sendSMS(residentPhoneNumber, message);
        res.json({ message: 'Notification sent to resident' });
    } catch (error) {
        console.error('Error notifying resident:', error);
        res.status(500).json({ message: error.message });
    }
});



export default router;
