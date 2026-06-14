const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Course = require("../models/Course");

const router = express.Router();

function publicUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        group: user.group,
        joinedCourses: user.joinedCourses
    };
}

async function populatedPublicUser(user) {
    const populated = await User.findById(user._id)
        .populate("joinedCourses", "title slug")
        .populate("group", "name");

    return publicUser(populated);
}

function createToken(user) {
    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
}

router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const exists = await User.findOne({
            email: String(email).toLowerCase()
        });

        if (exists) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const defaultCourses = role === "teacher" || role === "admin"
            ? await Promise.all(["electronics", "logic"].map(async (slug) => {
                let course = await Course.findOne({ slug });
                if (!course) {
                    course = await Course.create({
                        title: slug === "logic" ? "Computer Logic" : "Computer Electronics",
                        slug
                    });
                }
                return course._id;
            }))
            : [];

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "student",
            joinedCourses: defaultCourses
        });

        res.status(201).json({
            message: "User created",
            token: createToken(user),
            user: await populatedPublicUser(user)
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            email: String(email || "").toLowerCase()
        });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        const match = await bcrypt.compare(password || "", user.password);

        if (!match) {
            return res.status(400).json({
                message: "Wrong password"
            });
        }

        res.json({
            token: createToken(user),
            user: await populatedPublicUser(user)
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/logout", (req, res) => {
    res.json({
        message: "Logged out"
    });
});

module.exports = router;
