import mongoose from 'mongoose';

const GuestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    purposeOfVisit: { type: String, required: true },
    residentFlatNumber: { type: String, required: true },
    residentName: { type: String, required: true },
    visitTime: { type: Date, default: Date.now },
    checkOutTime: { type: Date, default: null }, // Ensure this field exists
    numberOfGuests: { type: String, required: true } // Ensure this field exists
});

const Guest = mongoose.model('Guest', GuestSchema);
export default Guest;
