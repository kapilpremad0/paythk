const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Show login page
exports.showLoginPage = (req, res) => {
  res.render('admin/login', { error: null ,layout: false });
};

// Handle login form submission
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {

    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });

    if (!existingAdmin) {
      const newAdmin = new User({
        name: "admin user",
        email: 'admin@gmail.com',
        mobile: "0000000001",
        password: await bcrypt.hash('Admin@123', 10), // Will be hashed by pre-save hook
        user_type: 'admin'
      });

      await newAdmin.save();
      console.log('✅ Admin user created: admin@gmail.com / Admin@123');
    } else {
      console.log('✅ Admin already exists: admin@gmail.com');
    }


    const user = await User.findOne({ email }); // Sequelize: { where: { email } }
    if (!user || user.user_type !== "admin") {
      return res.status(400).json({ error: "Invalid email" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    req.session.admin = { id: user.id, email: user.email, role: user.user_type };


    return res.json({ success: true, redirect: "/admin/home" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};


exports.logout = (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie("connect.sid"); // clear session cookie
    return res.redirect("/admin/login"); // 👈 redirect instead of JSON
  });
};



