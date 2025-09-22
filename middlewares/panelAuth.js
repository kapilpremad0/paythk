const User = require('../models/User'); // adjust path if needed

const panelAuth = async (req, res, next) => {
  try {
    // Check if user is in session
    if (!req.session || !req.session.panel) {
      console.log("No session user found, redirecting to panel login");
      return res.redirect('/panel/login');
    }

    // Find user from DB
    const user = await User.findById(req.session.panel.id);
    if (!user) {
      console.log("User not found in DB, clearing session");
      req.session.destroy(() => { });
      return res.redirect('/panel/login');
    }

    // Role check
    if (user.user_type !== 'partner') {
      return res.status(403).json({ message: "Forbidden: Partner only" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("panel auth error:", err.message);
    return res.redirect('/panel/login');
  }
};

module.exports = panelAuth;
