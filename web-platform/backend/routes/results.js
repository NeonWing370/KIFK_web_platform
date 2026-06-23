const express = require("express");

const auth = require("../middleware/auth");
const Result = require("../models/Result");

const router = express.Router();

function canManage(req) {
    return req.user.role === "teacher" || req.user.role === "admin";
}

router.get("/", auth, async (req, res) => {
    try {
        const query = req.user.role === "student"
            ? { student: req.user.id }
            : {};

        const results = await Result.find(query)
            .populate("student", "name email")
            .populate("test", "title passScore")
            .populate("course", "title slug")
            .sort({ createdAt: -1 });

        res.json(results);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.delete("/:id", auth, async (req, res) => {
    try {
        if (!canManage(req)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const result = await Result.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({
                message: "Result not found"
            });
        }

        res.json({
            message: "Result deleted"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
