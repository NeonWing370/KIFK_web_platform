const express = require("express");

const auth = require("../middleware/auth");
const Course = require("../models/Course");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { getCourseDefinition } = require("../data/courseCatalog");

const router = express.Router();

function canManage(req) {
    return req.user.role === "teacher" || req.user.role === "admin";
}

async function findCourse(courseId) {
    if (!courseId) {
        return null;
    }

    if (courseId.match && courseId.match(/^[0-9a-fA-F]{24}$/)) {
        return Course.findById(courseId);
    }

    const normalized = String(courseId).toLowerCase().trim();
    const definition = getCourseDefinition(normalized);
    const aliases = definition ? definition[1].aliases : [normalized];

    return Course.findOne({
        $or: [
            { slug: { $in: aliases } },
            {
                title: {
                    $regex: definition ? definition[1].title : normalized,
                    $options: "i"
                }
            }
        ]
    });
}

async function resolveCourse(courseId, userId) {
    const requestedCourseId = courseId || "electronics";
    let course = await findCourse(requestedCourseId);

    if (!course) {
        const definition = getCourseDefinition(requestedCourseId);
        const slug = definition ? definition[0] : requestedCourseId;

        course = await Course.create({
            title: definition ? definition[1].title : "Computer Electronics",
            slug,
            teacher: userId,
            students: []
        });
    }

    return course;
}

router.get("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const query = req.user.role === "student"
            ? { _id: { $in: user.joinedCourses }, archived: { $ne: true } }
            : {};

        const courses = await Course.find(query)
            .populate("teacher", "name email")
            .populate("students", "name email role group");

        res.json(courses);
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

        const course = await Course.create({
            title: req.body.title,
            description: req.body.description,
            slug: req.body.slug,
            teacher: req.body.teacher || req.user.id,
            students: req.body.students || []
        });

        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.put("/:id", auth, async (req, res) => {
    try {
        if (!canManage(req)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.json(course);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/:id/enroll", auth, async (req, res) => {
    try {
        const course = await resolveCourse(req.params.id, req.user.id);

        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        if (!course.students.some((id) => String(id) === req.user.id)) {
            course.students.push(req.user.id);
            await course.save();
        }

        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: {
                joinedCourses: course._id
            }
        });

        await Notification.create({
            user: req.user.id,
            course: course._id,
            type: "course",
            title: "Course joined",
            text: `You joined ${course.title}.`
        });

        res.json(course);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.delete("/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        await Course.findByIdAndDelete(req.params.id);

        res.json({
            message: "Course deleted"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
