const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const Notification = require("../models/Notification");

router.get("/", auth, async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user.id
        })
            .populate("course", "title slug")
            .sort({
                createdAt: -1
            });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.put("/read/all", auth, async (req, res) => {
    try {
        await Notification.updateMany(
            {
                user: req.user.id
            },
            {
                isRead: true,
                read: true
            }
        );

        res.json({
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.put("/:id/read", auth, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.id
            },
            {
                isRead: true,
                read: true
            }
        );

        res.json({
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.delete("/:id", auth, async (req, res) => {
    try {
        await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        res.json({
            message: "Notification deleted"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;