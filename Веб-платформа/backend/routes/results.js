const express = require("express");

const auth = require("../middleware/auth");
const Result = require("../models/Result");

const router = express.Router();

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

module.exports = router;
