import express from 'express';
import Resident from '../models/Resident.js'; // Ensure this path is correct

const router = express.Router();

// Endpoint to get resident suggestions
router.get('/residents/suggestions', async (req, res) => {
    try {
        const { name } = req.query;

        // Validate the query parameter
        if (!name) {
            return res.status(400).json({ message: 'Name query parameter is required.' });
        }

        // Fetch residents matching the name query parameter (case-insensitive)
        const residents = await Resident.find({
            name: { $regex: new RegExp(name, 'i') }
        }).select('name flatNumber'); // Select only the required fields

        // Return the list of residents as suggestions
        res.json(residents);
    } catch (error) {
        console.error('Error fetching resident suggestions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
