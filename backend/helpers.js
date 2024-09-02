import twilio from 'twilio';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import Resident from './models/Resident.js'; // Adjust path as necessary
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from './notification/twilioConfig.js';

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
        const resident = await Resident.findOne({ flatNumber });
        return resident ? resident.phoneNumber : null;
    } catch (error) {
        console.error('Error fetching resident phone number:', error);
        return null;
    }
};

export { sendSMS, getResidentPhoneNumber };
