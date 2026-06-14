const express = require("express");

const User =
require("../models/User");

const auth =
require("../middleware/auth");

const router =
express.Router();

function isAdmin(req) {
    return req.user.role === "admin";
}


// CURRENT USER

router.get(
"/me",
auth,
async (req, res) => {

    try {

        const user =
        await User.findById(
            req.user.id
        )
        .select("-password -verificationCode")
        .populate("group", "name")
        .populate("joinedCourses", "title slug");

        res.json(user);

    }
    catch (error) {

        res.status(500).json({
            message:
            error.message
        });

    }

});


// UPDATE PROFILE

// UPDATE PROFILE

router.put(
"/profile",
auth,
async (req, res) => {

    try {

        const {
            name,
            bio
        } = req.body;

        const user =
        await User.findByIdAndUpdate(

            req.user.id,

            {
                ...(name !== undefined ? { name } : {}),
                ...(bio !== undefined ? { bio } : {})
            },

            {
                new: true
            }

        )
        .select("-password -verificationCode")
        .populate("group", "name")
        .populate("joinedCourses", "title slug");

        res.json(user);

    }
    catch (error) {

        res.status(500).json({
            message:
            error.message
        });

    }

});


// ADMIN GET USERS

router.get(
"/",
auth,
async (req, res) => {

    try {

        if (
            !isAdmin(req)
        ) {

            return res.status(403).json({
                message:
                "Access denied"
            });

        }

        const users =
        await User.find()
        .select("-password -verificationCode")
        .populate("group", "name")
        .populate("joinedCourses", "title slug");

        res.json(users);

    }
    catch (error) {

        res.status(500).json({
            message:
            error.message
        });

    }

});


// ADMIN UPDATE USER

router.put(
"/:id",
auth,
async (req, res) => {

    try {

        if (!isAdmin(req)) {

            return res.status(403).json({
                message:
                "Access denied"
            });

        }

        const {
            name,
            role,
            group
        } = req.body;

        const user =
        await User.findByIdAndUpdate(
            req.params.id,
            {
                ...(name !== undefined ? { name } : {}),
                ...(role !== undefined ? { role } : {}),
                ...(group !== undefined ? { group: group || null } : {})
            },
            {
                new: true,
                runValidators: true
            }
        ).select("-password -verificationCode");

        res.json(user);

    }
    catch (error) {

        res.status(500).json({
            message:
            error.message
        });

    }

});


// DELETE CURRENT USER

router.delete(
"/me",
auth,
async (req, res) => {

    try {

        await User.findByIdAndDelete(
            req.user.id
        );

        res.json({
            message:
            "Account deleted"
        });

    }
    catch (error) {

        res.status(500).json({
            message:
            error.message
        });

    }

});


// ADMIN DELETE USER

router.delete(
"/:id",
auth,
async (req, res) => {

    try {

        if (
            !isAdmin(req)
        ) {

            return res.status(403).json({
                message:
                "Access denied"
            });

        }

        await User.findByIdAndDelete(
            req.params.id
        );

        res.json({
            message:
            "User deleted"
        });

    }
    catch (error) {

        res.status(500).json({
            message:
            error.message
        });

    }

});

module.exports = router;
