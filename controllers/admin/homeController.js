const User = require('../../models/User');


exports.dashboard = (req, res) => {
  res.render('admin/dashboard',{ title: "Dashboard" });
};


exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ user_type: 'customer' ,otp_verify:true });
    const totalDrivers = await User.countDocuments({ user_type: 'driver' ,otp_verify:true });

    // Today’s users
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsers = await User.countDocuments({ createdAt: { $gte: today } });
    const todayDrivers = await User.countDocuments({ 
      user_type: 'driver',
      createdAt: { $gte: today }
    });

    res.json({
      totalUsers,
      totalDrivers,
      todayUsers,
      todayDrivers
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats', error: err });
  }
};


