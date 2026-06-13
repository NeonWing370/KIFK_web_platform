const express = require("express");

const auth = require("../middleware/auth");
const Group = require("../models/Group");
const User = require("../models/User");

const router = express.Router();

function canManage(req) {
    return req.user.role === "teacher" || req.user.role === "admin";
}

router.get("/", auth, async (req, res) => {
    try {
        if (!canManage(req)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const groups = await Group.find()
            .populate("teacher", "name email")
            .populate("students", "name email role");

        res.json(groups);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/", auth, async (req, res) => {
    try {
        if (!canManage(req)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const group = await Group.create({
            name: req.body.name,
            teacher: req.body.teacher || req.user.id,
            students: req.body.students || []
        });

        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/:id/students/:studentId", auth, async (req, res) => {
    try {
        if (!canManage(req)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const group = await Group.findByIdAndUpdate(
            req.params.id,
            {
                $addToSet: {
                    students: req.params.studentId
                }
            },
            {
                new: true
            }
        );

        await User.findByIdAndUpdate(req.params.studentId, {
            group: req.params.id
        });

        res.json(group);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.delete("/:id/students/:studentId", auth, async (req, res) => {
    try {
        if (!canManage(req)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const group = await Group.findByIdAndUpdate(
            req.params.id,
            {
                $pull: {
                    students: req.params.studentId
                }
            },
            {
                new: true
            }
        );

        await User.findByIdAndUpdate(req.params.studentId, {
            group: null
        });

        res.json(group);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
