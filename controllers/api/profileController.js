const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const axios = require('axios');


// Helper: Format validation error
const formatError = (field, message) => ({ [field]: message });

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, gender, email, dob ,interests ,avtar } = req.body || {};
    const images = req.files?.images?.map(f => f.filename) || [];
    const errors = {};


    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (gender) user.gender = gender;
        if (dob) user.dob = dob;
        if (interests) user.interests = interests;
        if (avtar) user.avtar = avtar;
        if (images) user.images = images;

        if (req.files?.profile) {
            user.profile = req.files.profile[0].filename;
        }

        await user.save();

        return res.json({
            message: 'Profile updated successfully',
            user: user
        });
    } catch (err) {
        console.error('Update Profile:', err.message);
        return res.status(500).json({ message: 'Server Error' });
    }
};


exports.getProfile = async (req, res) => {
    const userId = req.user.id; // assuming authentication middleware sets req.user

    try {
        const user = await User.findById(userId).select('-password'); // exclude password

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        return res.json({
            message: "Profile data fetch successfully",
            user
        });
    } catch (err) {
        console.error('Get Profile Data:', err.message);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
}


exports.deleteProfile = async (req, res) => {
    const userId = req.user.id; // assuming authentication middleware sets req.user

    try {
        const user = await User.findById(userId).select('-password'); // exclude password

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.profile) {
            // remove from DB
            user.profile = null;
            await user.save();
        }


        return res.json({
            message: "Profile data fetch successfully",
            user
        });
    } catch (err) {
        console.error('Get Profile Data:', err.message);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
}


exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you're using auth middleware to set req.user
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile deleted successfully" });
    } catch (error) {
        console.error("Error deleting profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
