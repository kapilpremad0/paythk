const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Setting = require('../../models/Setting');
const Wallet = require('../../models/Wallet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendSMS = require('../../utils/sendSMS');
const { logWalletTransaction } = require('../../helpers/wallet');


// Helper: Format validation error
const formatError = (field, message) => ({ [field]: message });
const allowedTypes = ['customer', 'driver'];

function generateOTP(length = 4) {
    return 1234;
    // return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
}


exports.register = async (req, res) => {
    try {
        const { name, mobile, password, type, email, referral_code, fcm_token } = req.body || {};
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


        if (!email) {
            Object.assign(errors, formatError('email', 'The email field is required.'));
        } else if (typeof email !== 'string') {
            Object.assign(errors, formatError('email', 'The email must be a string.'));
        } else if (!/^[\w.%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            Object.assign(errors, formatError('email', 'The email must be a valid email address.'));
        }

        const userExists = await User.findOne({ mobile });

        if (userExists) {
            Object.assign(errors, formatError('mobile', 'Mobile number is already registered'));
        }
        const userEmailExists = await User.findOne({ email });
        if (userEmailExists) {
            Object.assign(errors, formatError('email', 'Email is already registered'));
        }

        let referrer = null;

        if (referral_code) {
            referrer = await User.findOne({ referralCode: referral_code });
            if (!referrer) {
                Object.assign(errors, formatError('referral_code', 'Invalid referral code'));
            }

        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }


        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            mobile,
            password: hashedPassword,
            email: email
        });



        if (referrer) {
            newUser.fromReferral = referrer._id;
            // ✅ Fetch bonuses from settings
            const settings = await Setting.find({
                key: { $in: ["referral_bonus", "welcome_bonus"] }
            });

            let referralBonus = 0;
            let welcomeBonus = 0;

            settings.forEach(s => {
                if (s.key === "referral_bonus") referralBonus = Number(s.value) || 0;
                if (s.key === "welcome_bonus") welcomeBonus = Number(s.value) || 0;
            });

            if (welcomeBonus > 0) {
                await logWalletTransaction({
                    userId: newUser._id,
                    amount: welcomeBonus,
                    type: "credit",
                    reason: "Welcome Bonus",
                    description: `Welcome bonus of ₹${welcomeBonus} credited`,
                });
            }

            if (referralBonus > 0) {
                await logWalletTransaction({
                    userId: referrer._id,
                    amount: referralBonus,
                    type: "credit",
                    reason: "Referral Bonus",
                    description: `Referral bonus of ₹${referralBonus} credited for inviting ${newUser.name}`,
                });
            }
        }

        if (fcm_token) {
            newUser.fcm_token = fcm_token;
        }

        await newUser.save();

        const otp = generateOTP(6);
        const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min from now

        newUser.otp = otp;
        newUser.otpExpiry = otpExpiry;

        const payload = { user: { id: newUser.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1Y' });

        return res.status(200).json({
            message: 'User registered successfully',
            success: true,
            token,
            mobile,
            name,
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
        const { username, password ,fcm_token } = req.body || {};
        const errors = {};

        // ✅ Validate username
        if (!username) {
            Object.assign(errors, formatError('username', 'The username field is required.'));
        } else {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
            const isMobile = /^\d{10}$/.test(username);

            if (!isEmail && !isMobile) {
                Object.assign(errors, formatError('username', 'The username must be a valid email or 10-digit mobile number.'));
            }
        }

        // ✅ Validate password
        if (!password) {
            Object.assign(errors, formatError('password', 'The password field is required.'));
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }

        // ✅ Find user by email OR mobile
        const query = /^\d{10}$/.test(username)
            ? { mobile: username }
            : { email: username };

        const user = await User.findOne(query);
        if (!user) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('username', `No account is registered with ${username}.`)
            });
        }

        if (fcm_token) {
            user.fcm_token = fcm_token;
            await user.save();
        }

        // ✅ Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('password', 'The password is incorrect.')
            });
        }

        // ✅ Generate JWT token
        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        const response = {
            message: 'Login successful',
            token,
            name: user.name,
            otp_verify: user.otp_verify,
            mobile: user.mobile,
            email: user.email
        };

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
        const { username, type } = req.body || {};
        const errors = {};

        // ✅ Validate username
        if (!username) {
            Object.assign(errors, formatError('username', 'The username field is required.'));
        } else {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
            const isMobile = /^\d{10}$/.test(username);

            if (!isEmail && !isMobile) {
                Object.assign(errors, formatError('username', 'The username must be a valid email or 10-digit mobile number.'));
            }
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }

        // ✅ Find user by email OR mobile
        const query = /^\d{10}$/.test(username)
            ? { mobile: username }
            : { email: username };

        const user = await User.findOne(query);
        if (!user) {
            return res.status(422).json({
                message: 'Validation Error',
                errors: formatError('username', `No account is registered with ${username}.`)
            });
        }

        // ✅ Generate OTP
        const otp = generateOTP(6);
        const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min from now

        // Save OTP & expiry in DB
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // ✅ Send OTP depending on type (email or SMS)
        if (/^\d{10}$/.test(username)) {
            // Send via SMS
            // await sendSMS(user.mobile, otp);
        } else {
            // Send via Email
            // await sendEmail(user.email, `Your OTP is ${otp}`);
        }

        return res.json({
            message: 'OTP sent successfully.',
            success: true
        });

    } catch (err) {
        console.error('ForgotPassword Error:', err.message);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
};



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



