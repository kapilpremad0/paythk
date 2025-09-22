const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Show login page
exports.showLoginPage = (req, res) => {
    res.render('panel/login', { error: null, layout: false });
};

exports.showRegisterPage = (req, res) => {
    res.render('panel/register', { error: null, layout: false });
};

// Handle login form submission
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {

        const user = await User.findOne({ email }); // Sequelize: { where: { email } }
        if (!user || user.user_type !== "partner") {
            return res.status(400).json({ error: "Invalid email" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ error: "Incorrect password" });
        }

        req.session.panel = { id: user.id, email: user.email, role: user.user_type, businessType: user.businessType };


        return res.json({ success: true, redirect: "/panel/home" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};


exports.logout = (req, res) => {
    req.session.destroy((err) => {
        res.clearCookie("connect.sid"); // clear session cookie
        return res.redirect("/panel/login"); // 👈 redirect instead of JSON
    });
};



