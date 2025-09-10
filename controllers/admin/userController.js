const { render } = require('ejs');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');


exports.getList = async (req, res) => {
  try {
    res.render('admin/users/list', { title: "Passenger" });
    // res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    res.render('admin/users/create', { title: "Create User", user: null });
    // res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.getDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).send("User not found");

    // bookings empty for now (later you can fetch from Booking model)
    const bookings = [];

    res.render('admin/users/show', {
      title: "User Detail", user,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
}

exports.deleteRecord = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err });
  }
};

exports.getData = async (req, res) => {
  try {

    const draw = parseInt(req.body.draw) || 0;
    const start = parseInt(req.body.start) || 0;
    const length = parseInt(req.body.length) || 10;
    const search = req.body.search?.value || "";
    const status = req.body.status; // Get the status filter

    const query = { user_type: "customer", otp_verify: true };

    // Search condition
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { mobile: new RegExp(search, "i") },
        { gender: new RegExp(search, "i") }
      ];
    }


    if (status) {
      query.status = status; // Add the status filter to the query
    }

    const totalRecords = await User.countDocuments();
    const filteredRecords = await User.countDocuments(query);



    const data_fetch = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(length)
      .exec();

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;

    const data = data_fetch.map(item => ({
      name__: item.name,
      gender: item.gender,
      dob: item.dob,
      name: item.name_div,

      // status: item.status === 1
      //   ? `<span class="badge rounded-pill badge-light-primary me-1">Active</span>`
      //   : `<span class="badge rounded-pill badge-light-danger me-1">Inactive</span>`,
      // description: item.description,
      datetime: new Date(item.createdAt).toLocaleString(), // Format datetime
      action: item.action_div
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.storeData = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    console.log("REQ FILE:", req.file);

    const {
      name,
      email,
      mobile,
      password,
      gender,
      dob,
      ssn,
      emergencyContact,
      homeAddress,
      otp_verify,
      terms_conditions
    } = req.body || {};

    const profile = req.files?.profile?.[0]; // uploaded profile image (if exists)

    const errors = {};

    // Required fields
    if (!name) errors.name = "Name is required";
    if (!mobile) errors.mobile = "Mobile number is required";
    if (!password) errors.password = "Password is required";

    // Format validations
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format";
    }

    if (mobile && !/^[0-9]{10}$/.test(mobile)) {
      errors.mobile = "Mobile must be a 10-digit number";
    }

    if (dob && isNaN(Date.parse(dob))) {
      errors.dob = "Invalid date of birth";
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        errors.email = "Email already exists";

      }
    }

    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      errors.mobile = "Mobile number already exists";
    }

    // Return validation errors
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      mobile,
      password: hashedPassword, // ⚠️ Ideally hash this before saving!
      user_type: "customer",
      gender: gender || null,
      dob: dob ? new Date(dob) : null,
      profile: profile ? profile.filename : "",
      ssn: ssn || null,
      emergencyContact: emergencyContact || null,
      homeAddress: homeAddress || null,
      otp_verify: true,
      terms_conditions: true
    });

    await user.save();

    return res.status(201).json({
      message: "User created successfully",
      data: user
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save user. Please try again later." });
  }
};
