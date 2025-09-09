const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendSMS = require('../utils/sendSMS');

// Helper: Format validation error
const formatError = (field, message) => ({ [field]: message });
const allowedTypes = ['customer', 'driver'];

function generateOTP(length = 4) {
    return 1234;
    // return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
}


exports.register = async (req, res) => {
    try {
        const { name, mobile, password, type, email } = req.body || {};
        const errors = {};

        if (!name) {
            Object.assign(errors, formatError('name', 'The name field is required.'));
        } else if (typeof name !== 'string') {
            Object.assign(errors, formatError('name', 'The name must be a string.'));
        }

        if (!mobile) {
            Object.assign(errors, formatError('mobile', 'The mobile field is required.'));
        } else if (!/^\d{10}$/.test(mobile)) {
            Object.assign(errors, formatError('mobile', 'The mobile must be a valid 10-digit number.'));
        }

        if (!password) {
            Object.assign(errors, formatError('password', 'The password field is required.'));
        } else if (password.length < 6) {
            Object.assign(errors, formatError('password', 'The password must be at least 6 characters.'));
        }

        if (!type)
            Object.assign(errors, formatError('type', 'The type field is required.'));
        else if (!type.trim()) Object.assign(errors, formatError('type', 'The type field is required.'));
        else if (!allowedTypes.includes(type.toLowerCase())) {
            Object.assign(errors, formatError('type', `The type must be one of: ${allowedTypes.join(', ')}`));
        }


        if (!email) {
            Object.assign(errors, formatError('email', 'The email field is required.'));
        } else if (typeof email !== 'string') {
            Object.assign(errors, formatError('email', 'The email must be a string.'));
        } else if (!/^[\w.%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            Object.assign(errors, formatError('email', 'The email must be a valid email address.'));
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }

        const userExists = await User.findOne({ mobile });
        if (userExists) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('mobile', `Mobile number is already registered as ${userExists.user_type}`)
            });
        }

        const userEmailExists = await User.findOne({ email });
        if (userEmailExists) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('email', `Email is already registered as ${userEmailExists.user_type}`)
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            mobile,
            password: hashedPassword,
            user_type: type,
            email: email
        });

        const otp = generateOTP(6);
        const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min from now

        // Save OTP & expiry in DB
        newUser.otp = otp;
        newUser.otpExpiry = otpExpiry;

        await newUser.save();

        const payload = { user: { id: newUser.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });


        return res.status(200).json({
            message: 'User registered successfully',
            success: true,
            token,
            mobile,
            name,
            user_type: type
        });
    } catch (err) {
        console.error('Register Error:', err);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
};


exports.login = async (req, res) => {
    try {
        const { mobile, password, type } = req.body || {};
        const errors = {};

        if (!mobile) {
            Object.assign(errors, formatError('mobile', 'The mobile field is required.'));
        } else if (!/^\d{10}$/.test(mobile)) {
            Object.assign(errors, formatError('mobile', 'The mobile must be a valid 10-digit number.'));
        }

        if (!password) {
            Object.assign(errors, formatError('password', 'The password field is required.'));
        }


        if (!type)
            Object.assign(errors, formatError('type', 'The type field is required.'));
        else if (!type.trim()) Object.assign(errors, formatError('type', 'The type field is required.'));
        else if (!allowedTypes.includes(type.toLowerCase())) {
            Object.assign(errors, formatError('type', `The type must be one of: ${allowedTypes.join(', ')}`));
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }

        const user = await User.findOne({ mobile, user_type: type });
        if (!user) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('mobile', `No ${type} account is registered with the mobile number ${mobile}.`)
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('password', 'The password is incorrect.')
            });
        }


        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        const response = {
            message: 'Login successful',
            token,
            name: user.name,
            user_type: user.user_type,
            is_verify: true,
            otp_verify: user.otp_verify
        };

        if (type == 'driver') {

            if (!user.ssn || user.ssn.trim() === '') {
                response.is_verify = false;
                response.pending_step = 'personal_info';
            }
            else if (
                !user.driverCredentials ||
                !user.driverCredentials.licenseNumber ||
                !user.driverCredentials.licenseIssueDate ||
                !user.driverCredentials.licenseExpiryDate
            ) {
                response.is_verify = false;
                response.pending_step = 'driver_credential';
            }
            else if (
                !user.documents ||
                !user.documents.licenseFront ||
                !user.documents.licenseBack ||
                !user.documents.addressFront ||
                !user.documents.addressBack
            ) {
                response.is_verify = false;
                response.pending_step = 'documents';
            }
        }

        return res.json(response);
    } catch (err) {
        console.error('Login Error:', err.message);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
};


exports.forgotPassword = async (req, res) => {
    try {
        const { mobile, type } = req.body || {};
        const errors = {};

        if (!mobile) {
            Object.assign(errors, formatError('mobile', 'The mobile field is required.'));
        } else if (!/^\d{10}$/.test(mobile)) {
            Object.assign(errors, formatError('mobile', 'The mobile must be a valid 10-digit number.'));
        }

        if (!type)
            Object.assign(errors, formatError('type', 'The type field is required.'));
        else if (!type.trim()) Object.assign(errors, formatError('type', 'The type field is required.'));
        else if (!allowedTypes.includes(type.toLowerCase())) {
            Object.assign(errors, formatError('type', `The type must be one of: ${allowedTypes.join(', ')}`));
        }


        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }

        const user = await User.findOne({ mobile, user_type: type });
        if (!user) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('mobile', `No ${type} account is registered with the mobile number ${mobile}.`)
            });
        }

        const otp = generateOTP(6);
        const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min from now

        // Save OTP & expiry in DB
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP via SMS (pseudo-code)
        // await sendSMS(mobile, otp);

        return res.json({
            message: 'OTP sent successfully.',
            success: true
        });



    } catch (err) {
        console.error('Login Error:', err.message);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
}


exports.verifyOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body || {};
        const errors = {};

        // Validate inputs
        if (!mobile) {
            Object.assign(errors, formatError('mobile', 'The mobile field is required.'));
        } else if (!/^\d{10}$/.test(mobile)) {
            Object.assign(errors, formatError('mobile', 'The mobile must be a valid 10-digit number.'));
        }
        if (!otp) {
            Object.assign(errors, formatError('otp', 'The OTP field is required.'));
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }

        // Find user
        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('mobile', 'This mobile is not registered.')
            });
        }

        // Check OTP
        if (user.otp !== otp) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('otp', 'Invalid OTP.')
            });
        }

        // Check expiry
        if (user.otpExpiry && Date.now() > user.otpExpiry) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('otp', 'OTP has expired.')
            });
        }

        // OTP is valid → clear OTP from DB
        user.otp = null;
        user.otpExpiry = null;
        user.otp_verify = true;
        await user.save();

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.json({
            message: 'OTP verified successfully.',
            success: true,
            name: user.name,
            mobile: user.mobile,
            token
        });

    } catch (err) {
        console.error("Verify OTP Error:", err.message);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
};



exports.resetPassword = async (req, res) => {
    try {
        const { mobile, password, confirm_password } = req.body || {};
        const errors = {};

        // Validation
        if (!mobile) {
            Object.assign(errors, formatError('mobile', 'The mobile field is required.'));
        } else if (!/^\d{10}$/.test(mobile)) {
            Object.assign(errors, formatError('mobile', 'The mobile must be a valid 10-digit number.'));
        }
        if (!password) {
            Object.assign(errors, formatError('password', 'The password field is required.'));
        } else if (password.length < 6) {
            Object.assign(errors, formatError('password', 'The password must be at least 6 characters.'));
        }

        if (!confirm_password) {
            Object.assign(errors, formatError('confirm_password', 'The confirm password field is required.'));
        }


        if (password !== confirm_password) {
            Object.assign(errors, formatError('confirm_password', 'Password confirmation does not match.'));
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }

        // Find user
        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('mobile', 'This mobile is not registered.')
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Save new password & clear OTP
        user.password = hashedPassword;

        await user.save();

        return res.json({
            message: 'Password reset successfully.',
            success: true
        });

    } catch (err) {
        console.error("Reset Password Error:", err.message);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
};



