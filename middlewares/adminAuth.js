const User = require('../models/User'); // adjust path if needed

const adminAuth = async (req, res, next) => {
  try {
    // Check if user is in session
    if (!req.session || !req.session.admin) {
      console.log("No session user found, redirecting to admin login");
      return res.redirect('/admin/login');
    }

    // Find user from DB
    const user = await User.findById(req.session.admin.id);
    if (!user) {
      console.log("User not found in DB, clearing session");
      req.session.destroy(() => { });
      return res.redirect('/admin/login');
    }

    // Role check
    if (user.user_type !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("Admin auth error:", err.message);
    return res.redirect('/admin/login');
  }
};

module.exports = adminAuth;
