const express = require("express");
const mongoose = require("mongoose");

const auth = require("../middleware/auth");
const ForumPost = require("../models/ForumPost");
const Course = require("../models/Course");

const router = express.Router();

async function findCourse(courseId) {
    if (!courseId || courseId === "all") {
        return null;
    }

    if (mongoose.Types.ObjectId.isValid(courseId)) {
        return Course.findById(courseId);
    }

    const normalized = String(courseId).toLowerCase().trim();

    return Course.findOne({
        $or: [
            {
                slug: normalized
            },
            {
                title: {
                    $regex: normalized,
                    $options: "i"
                }
            }
        ]
    });
}

router.get("/", auth, async (req, res) => {
    try {
        const query = {};

        if (req.query.course && req.query.course !== "all") {
            const course = await findCourse(req.query.course);

            if (course) {
                query.course = course._id;
            }
        }

        const posts = await ForumPost.find(query)
            .populate("author", "name email role")
            .populate("course", "title slug")
            .populate("replies.author", "name email role")
            .sort({
                createdAt: -1
            });

        res.json(posts);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/", auth, async (req, res) => {
    try {
        const course = await findCourse(req.body.courseId);

        const post = await ForumPost.create({
            title: req.body.title,
            text: req.body.text,
            course: course?._id || null,
            author: req.user.id
        });

        const populated = await ForumPost.findById(post._id)
            .populate("author", "name email role")
            .populate("course", "title slug")
            .populate("replies.author", "name email role");

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/:id/replies", auth, async (req, res) => {
    try {
        const post = await ForumPost.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    replies: {
                        text: req.body.text,
                        author: req.user.id
                    }
                }
            },
            {
                new: true
            }
        )
            .populate("author", "name email role")
            .populate("course", "title slug")
            .populate("replies.author", "name email role");

        res.json(post);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.delete("/:id", auth, async (req, res) => {
    try {
        const post = await ForumPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (
            String(post.author) !== req.user.id &&
            req.user.role !== "admin" &&
            req.user.role !== "teacher"
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        await ForumPost.findByIdAndDelete(req.params.id);

        res.json({
            message: "Post deleted"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;