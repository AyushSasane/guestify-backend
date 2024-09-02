import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../css/styles.css';
import { FaUser, FaPhone, FaCalendarAlt, FaHome, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';

const GuestEntryForm = () => {
    const [activeTab, setActiveTab] = useState('check-in');
    const [formData, setFormData] = useState({
        name: '',
        contactNumber: '',
        purposeOfVisit: '',
        residentFlatNumber: '',
        residentName: '',
        numberOfGuests: '',
        flatNumber: '' // Added for check-out
    });
    const [residentSuggestions, setResidentSuggestions] = useState([]);
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const inputRef = useRef(null); // Reference to the input field

    useEffect(() => {
        if (formData.residentName) {
            fetchResidentSuggestions(formData.residentName);
        } else {
            setResidentSuggestions([]);
        }
    }, [formData.residentName]);

    const fetchResidentSuggestions = async (name) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/residents/suggestions?name=${name}`);
            setResidentSuggestions(response.data);
        } catch (error) {
            console.error('Error fetching resident suggestions:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectResident = (resident) => {
        setFormData({
            ...formData,
            residentName: resident.name,
            residentFlatNumber: resident.flatNumber
        });
        setResidentSuggestions([]); // Hide suggestions
        inputRef.current.blur(); // Remove focus from input field
    };

    const handleClickOutside = (e) => {
        if (inputRef.current && !inputRef.current.contains(e.target)) {
            setResidentSuggestions([]); // Hide suggestions when clicking outside
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'check-in') {
                const response = await axios.post('http://localhost:5000/api/guests', formData);
                console.log('Guest Checked In:', response.data);
                setConfirmationMessage('Guest checked in successfully!');
            } else if (activeTab === 'check-out') {
                const response = await axios.patch('http://localhost:5000/api/guests/checkout', {
                    flatNumber: formData.flatNumber
                });
                console.log('Guest Checked Out:', response.data);
                setConfirmationMessage('Guest checked out successfully!');
            }
            setIsModalOpen(true);
            setFormData({
                name: '',
                contactNumber: '',
                purposeOfVisit: '',
                residentFlatNumber: '',
                residentName: '',
                numberOfGuests: '',
                flatNumber: ''
            });
        } catch (error) {
            console.error('Error:', error);
            setConfirmationMessage('An error occurred. Please try again.');
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="form-container">
            <div className="segment-selector">
                <button 
                    className={`segment-button ${activeTab === 'check-in' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('check-in')}
                >
                    Check In
                </button>
                <button 
                    className={`segment-button ${activeTab === 'check-out' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('check-out')}
                >
                    Check Out
                </button>
            </div>
            <div className="form-card">
                <div className="circle-icon">
                    {activeTab === 'check-in' ? (
                        <FaSignInAlt className="circle-icon-image" />
                    ) : (
                        <FaSignOutAlt className="circle-icon-image" />
                    )}
                </div>
                <h2 className="form-title">{activeTab === 'check-in' ? 'Guest Check-In' : 'Guest Check-Out'}</h2>
                <form onSubmit={handleSubmit}>
                    {activeTab === 'check-in' && (
                        <>
                            <div className="form-field-group">
                                <label className="form-label">Name of Guest</label>
                                <div className="input-wrapper">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Contact Number</label>
                                <div className="input-wrapper">
                                    <FaPhone className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter Contact Number"
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Purpose of Visit</label>
                                <div className="input-wrapper">
                                    <FaCalendarAlt className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter Purpose"
                                        name="purposeOfVisit"
                                        value={formData.purposeOfVisit}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Resident's Name</label>
                                <div className="input-wrapper">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter Resident's Name"
                                        name="residentName"
                                        value={formData.residentName}
                                        onChange={handleChange}
                                        ref={inputRef}
                                        required
                                    />
                                    {residentSuggestions.length > 0 && (
                                        <div className="suggestions-dropdown">
                                            {residentSuggestions.map((resident) => (
                                                <div
                                                    key={`${resident.name}-${resident.flatNumber}`} // Unique key combining name and flatNumber
                                                    className="suggestion-item"
                                                    onMouseDown={() => handleSelectResident(resident)} // Use onMouseDown to avoid double-click issues
                                                >
                                                    {resident.name} - {resident.flatNumber}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Resident's Flat Number</label>
                                <div className="input-wrapper">
                                    <FaHome className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter Flat Number"
                                        name="residentFlatNumber"
                                        value={formData.residentFlatNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Number of Guests</label>
                                <div className="input-wrapper">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter No. Of Guests"
                                        name="numberOfGuests"
                                        value={formData.numberOfGuests}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    {activeTab === 'check-out' && (
                        <>
                            <div className="form-field-group">
                                <label className="form-label">Resident's Flat Number</label>
                                <div className="input-wrapper">
                                    <FaHome className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter Flat Number"
                                        name="flatNumber"
                                        value={formData.flatNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    <button className="btn-submit" type="submit">Submit</button>
                </form>
            </div>

            {/* Modal for confirmation */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{confirmationMessage}</h3>
                        <button onClick={handleCloseModal} className="btn-close">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuestEntryForm;
