import mongoose from 'mongoose';

const residentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    flatNumber: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    }
});

// Check if the model is already defined before creating it
const Resident = mongoose.models.Resident || mongoose.model('Resident', residentSchema);

export default Resident;
