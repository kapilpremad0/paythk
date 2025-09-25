const Coupon = require('../../models/Coupon');

// List Page
exports.getList = async (req, res) => {
  try {
    res.render('admin/coupons/list', { title: "Coupons" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create Form
exports.create = async (req, res) => {
  try {
    res.render('admin/coupons/create', { title: "Create Coupon", coupon: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Edit Form
exports.edit = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).send("Coupon not found");

    res.render('admin/coupons/create', { title: "Edit Coupon", coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Show Detail Page
exports.getDetail = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).send("Coupon not found");

    res.render('admin/coupons/show', { title: "Coupon Details", coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Coupon
exports.deleteRecord = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });

    await Coupon.findByIdAndDelete(req.params.id);

    res.json({ message: "Coupon deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting Coupon", error: err.message });
  }
};

// Data for DataTable
exports.getData = async (req, res) => {
  try {
    const draw = parseInt(req.body.draw) || 0;
    const start = parseInt(req.body.start) || 0;
    const length = parseInt(req.body.length) || 10;
    const search = req.body.search?.value || "";

    const query = {};

    if (search) {
      query.$or = [
        { code: new RegExp(search, "i") },
        { type: new RegExp(search, "i") },
        { couponFor: new RegExp(search, "i") },
      ];
    }

    const totalRecords = await Coupon.countDocuments();
    const filteredRecords = await Coupon.countDocuments(query);

    const data_fetch = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(length)
      .exec();

    const data = data_fetch.map((coupon, index) => ({
      serial: start + index + 1,
      code: coupon.code,
      discountType: coupon.type, // flat | percentage
      discountValue: coupon.discountValue,
      couponFor: coupon.couponFor, // Rental | Hostel | Guide
      validFrom: coupon.validFrom ? coupon.validFrom.toDateString() : "-",
      validTo: coupon.validTo ? coupon.validTo.toDateString() : "-",
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
    //   isActive: coupon.isActive ? "Active" : "Inactive",
       isActive: coupon.isActive 
                ? '<span class="badge bg-success">Active</span>'
                : '<span class="badge bg-danger">Inactive</span>',
      action: coupon.action_div
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

// Store New Coupon
exports.storeData = async (req, res) => {
  try {
    const {
      code,
      type,           // flat | percentage
      discountValue,
      maxDiscount,
      minPurchase,
      usageLimit,
      perUserLimit,
      validFrom,
      validTo,
      couponFor,      // Rental | Hostel | Guide
      isActive
    } = req.body;

    const errors = {};
    // if (!code) errors.code = "Coupon code is required";
    if (!type) errors.type = "Discount type is required";
    if (!discountValue) errors.discountValue = "Discount value is required";
    if (!couponFor) errors.couponFor = "Coupon For is required";
    if (!validTo) errors.validTo = "Valid To date is required";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const coupon = await Coupon.create({
      type,
      discountValue,
      maxDiscount: maxDiscount || 0,
      minPurchase: minPurchase || 0,
      usageLimit: usageLimit || 1,
      perUserLimit: perUserLimit || 1,
      validFrom: validFrom || Date.now(),
      validTo,
      couponFor,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user?._id || null
    });

    res.status(201).json({ message: "Coupon created successfully", data: coupon });
  } catch (err) {
    res.status(500).json({ error: "Failed to create Coupon", details: err.message });
  }
};

// Update Coupon
exports.updateData = async (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = await Coupon.findById(couponId);
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });

    const {
      code,
      type,           // flat | percentage
      discountValue,
      maxDiscount,
      minPurchase,
      usageLimit,
      perUserLimit,
      validFrom,
      validTo,
      couponFor,      // Rental | Hostel | Guide
      isActive
    } = req.body;

    coupon.type = type;
    coupon.discountValue = discountValue;
    coupon.maxDiscount = maxDiscount || 0;
    coupon.minPurchase = minPurchase || 0;
    coupon.usageLimit = usageLimit || 1;
    coupon.perUserLimit = perUserLimit || 1;
    coupon.validFrom = validFrom || coupon.validFrom;
    coupon.validTo = validTo;
    coupon.couponFor = couponFor;
    coupon.isActive = isActive !== undefined ? isActive : true;

    await coupon.save();

    res.status(200).json({ message: "Coupon updated successfully", data: coupon });
  } catch (err) {
    res.status(500).json({ error: "Failed to update Coupon", details: err.message });
  }
};
