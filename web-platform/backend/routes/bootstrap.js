const express = require("express");

const auth = require("../middleware/auth");
const User = require("../models/User");
const Course = require("../models/Course");
const Material = require("../models/Material");
const Test = require("../models/Test");
const Result = require("../models/Result");
const Notification = require("../models/Notification");
const Group = require("../models/Group");

const router = express.Router();

router.get("/", auth, async (req, res) => {
    try {
        const [users, courses, materials, tests, results, notifications, groups] = await Promise.all([
            req.user.role === "admin"
                ? User.find().select("-password -verificationCode")
                : User.find({ _id: req.user.id }).select("-password -verificationCode"),
            Course.find(),
            Material.find(),
            Test.find(),
            req.user.role === "student" ? Result.find({ student: req.user.id }) : Result.find(),
            req.user.role === "student" ? Notification.find({ user: req.user.id }) : Notification.find(),
            req.user.role === "student" ? Group.find({ students: req.user.id }) : Group.find()
        ]);

        res.json({
            users,
            courses,
            materials,
            tests,
            results,
            notifications,
            groups
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
