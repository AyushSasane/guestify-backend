import express from 'express';
import multer from 'multer'; // Import multer for handling file uploads
import fs from 'fs'; // Import fs for file system operations
import XLSX from 'xlsx'; // Import XLSX to handle Excel files
import Resident from '../models/Resident.js'; // Ensure the path is correct

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Specify a directory to store uploaded files

// Download resident data as CSV
router.get('/download', async (req, res) => {
    try {
        console.log('Download route accessed'); // Log when the route is accessed

        const residents = await Resident.find();
        console.log('Residents fetched:', residents); // Log fetched residents

        if (!residents.length) {
            console.log('No residents found'); // Log if no data is found
            return res.status(404).json({ message: 'No data found' });
        }

        // Convert data to CSV format
        const csv = [
            ['Name', 'Flat Number', 'Phone Number'],
            ...residents.map(resident => [resident.name, resident.flatNumber, resident.phoneNumber])
        ]
            .map(row => row.join(','))
            .join('\n');

        console.log('Generated CSV:', csv); // Log the generated CSV

        // Set headers to download the file
        res.setHeader('Content-Disposition', 'attachment; filename=residents.csv');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);

        console.log('CSV file sent successfully'); // Log when the CSV file is sent
    } catch (error) {
        console.error('Error in /download route:', error); // Log the error for debugging
        res.status(500).json({ message: error.message });
    }
});

// Get all residents
router.get('/', async (req, res) => {
    try {
        const residents = await Resident.find();
        res.status(200).json(residents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Import resident data
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Clear existing residents data
        await Resident.deleteMany({});

        // Read the file and process the data
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Transform data to match the required format
        const transformedData = data.map(row => ({
            name: row['Resident Name'],
            phoneNumber: row['Phone No'],
            flatNumber: row['Flat No']
        }));

        // Insert data into the database
        await Resident.insertMany(transformedData);

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        res.status(201).json({ message: 'Data imported successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a resident
router.put('/:id', async (req, res) => {
    try {
        const { name, flatNumber, phoneNumber } = req.body;
        const updatedResident = await Resident.findByIdAndUpdate(
            req.params.id,
            { name, flatNumber, phoneNumber },
            { new: true }
        );
        if (!updatedResident) {
            return res.status(404).json({ message: 'Resident not found' });
        }
        res.status(200).json(updatedResident);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get details of a resident by ID
router.get('/:id', async (req, res) => {
    try {
        const resident = await Resident.findById(req.params.id);
        if (!resident) return res.status(404).json({ message: 'Resident not found' });
        res.status(200).json(resident);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
