const Plan = require('../../models/Plan.js'); // Plan model
const Location = require('../../models/Location'); // Plan model
const Availability = require('../../models/Availability'); // Plan model
const path = require('path');
const fs = require('fs');
const { languages } = require("../../config/languages");



exports.getList = async (req, res) => {
    try {
        res.render('admin/plans/list', { title: "plans" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const locations = await Location.find();
        console.log(languages);
        res.render('admin/plans/create', { title: "Create Plan", plan: null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.edit = async (req, res) => {
    try {
        const locations = await Location.find();
        const plan = await Plan.findById(req.params.id);
        console.log("Plan Data:", plan);
        if (!plan) return res.status(404).send("Plan not found");

        res.render('admin/plans/create', { title: "Edit Plan", plan});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDetail = async (req, res) => {
    try {
        const Plan = await Plan.findById(req.params.id);
        if (!Plan) return res.status(404).send("Plan not found");

        res.render('admin/plans/show', { title: "Plan Details", Plan });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteRecord = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ error: "Plan not found" });

        // Delete associated availabilities
        await Availability.deleteMany({ parentId: plan._id, parentType: "Plan" });
        // Delete the Plan
        await Plan.findByIdAndDelete(req.params.id);

        res.json({ message: "Plan deleted successfully" });
    } catch (err) {
        console.error("Error deleting Plan:", err);
        res.status(500).json({ message: "Error deleting Plan", error: err.message });
    }
};

exports.getData = async (req, res) => {
    try {
        const draw = parseInt(req.body.draw) || 0;
        const start = parseInt(req.body.start) || 0;
        const length = parseInt(req.body.length) || 10;
        const search = req.body.search?.value || "";

        const query = {};

        if (search) {
            query.$or = [
                { plan_name: new RegExp(search, "i") },
                { description: new RegExp(search, "i") },
                { status: new RegExp(search, "i") }
            ];
        }

        const totalRecords = await Plan.countDocuments();
        const filteredRecords = await Plan.countDocuments(query);

        const plans = await Plan.find(query)
            .sort({ createdAt: -1 })
            .skip(start)
            .limit(length)
            .exec();

        const data = plans.map((plan, index) => ({
            serial: start + index + 1,
            plan_name: plan.plan_name,
            amount: plan.amount,
            is_free: plan.is_free
                ? '<span class="badge bg-primary">Yes</span>'
                : '<span class="badge bg-secondary">No</span>',
            status: plan.status === "active"
                ? '<span class="badge bg-success">Active</span>'
                : '<span class="badge bg-danger">Inactive</span>',
            hostel_limit: plan.hostel_limit,
            guide_limit: plan.guide_limit,
            rental_limit: plan.rental_limit,
            cafe_limit: plan.cafe_limit,
            buddy_scroll_limit: plan.buddy_scroll_limit,
            circle_limit: plan.circle_limit,
            itinerary_limit: plan.itinerary_limit,
            createdAt: plan.createdAt.toISOString().split("T")[0],
            action: plan.action_div
        }));

        res.json({
            draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data
        });

    } catch (err) {
        console.error("Error fetching plans:", err);
        res.status(500).json({ error: err.message });
    }
};



exports.storeData = async (req, res) => {
    try {
        const {
            plan_name,
            amount,
            is_free,
            description = "",
            status,
            hostel_limit = 0,
            guide_limit = 0,
            rental_limit = 0,
            cafe_limit = 0,
            buddy_scroll_limit = 0,
            circle_limit = 0,
            itinerary_limit = 0,
            availability = []
        } = req.body;

        const errors = {};
        if (!plan_name) errors.plan_name = "Plan name is required";
        if (amount === undefined || isNaN(Number(amount))) errors.amount = "Valid amount is required";
        if (Object.keys(errors).length) return res.status(400).json({ errors });

        // Create plan
        const newPlan = await Plan.create({
            plan_name,
            amount: Number(amount),
            is_free: is_free ? true : false,
            description,
            status: status === "active" ? "active" : "inactive",
            hostel_limit: Number(hostel_limit),
            guide_limit: Number(guide_limit),
            rental_limit: Number(rental_limit),
            buddy_scroll_limit: Number(buddy_scroll_limit),
            circle_limit: Number(circle_limit),
            itinerary_limit: Number(itinerary_limit),
            cafe_limit: Number(cafe_limit)
        });


        res.status(201).json({
            message: "Plan created successfully",
            data: { plan: newPlan, availability }
        });
    } catch (err) {
        console.error("Error saving Plan:", err);
        res.status(500).json({ error: "Failed to save Plan. Please try again later." });
    }
};

exports.updateData = async (req, res) => {
    try {
        const planId = req.params.id;
        const plan = await Plan.findById(planId);
        if (!plan) return res.status(404).json({ error: "Plan not found" });

        const {
            plan_name,
            amount,
            is_free,
            description = "",
            status,
            hostel_limit = 0,
            guide_limit = 0,
            rental_limit = 0,
            cafe_limit = 0,
            buddy_scroll_limit = 0,
            itinerary_limit = 0,
            circle_limit = 0,
            availability = []
        } = req.body;

        const errors = {};
        if (!plan_name) errors.plan_name = "Plan name is required";
        if (amount === undefined || isNaN(Number(amount))) errors.amount = "Valid amount is required";
        if (Object.keys(errors).length) return res.status(400).json({ errors });

        // Update plan
        Object.assign(plan, {
            plan_name,
            amount: Number(amount),
            is_free: is_free ? true : false,
            description,
            status: status === "active" ? "active" : "inactive",
            hostel_limit: Number(hostel_limit),
            guide_limit: Number(guide_limit),
            rental_limit: Number(rental_limit),
            cafe_limit: Number(cafe_limit),
            buddy_scroll_limit: Number(buddy_scroll_limit),
            circle_limit: Number(circle_limit),
            itinerary_limit: Number(itinerary_limit),
        });

        await plan.save();

        res.status(200).json({
            message: "Plan updated successfully",
            data: plan
        });
    } catch (err) {
        console.error("Error updating Plan:", err);
        res.status(500).json({ error: "Failed to update Plan. Please try again later." });
    }
};

