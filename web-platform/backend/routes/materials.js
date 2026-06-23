const multer = require("multer");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const auth = require("../middleware/auth");
const Material = require("../models/Material");
const Course = require("../models/Course");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { getCourseDefinition } = require("../data/courseCatalog");

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "uploads/");
    },

    filename(req, file, cb) {
        cb(
            null,
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname)
        );
    }
});

const upload = multer({
    storage
});

async function findCourse(courseId) {
    if (!courseId) {
        return null;
    }

    if (mongoose.Types.ObjectId.isValid(courseId)) {
        return Course.findById(courseId);
    }

    const normalized =
    String(courseId)
        .toLowerCase()
        .trim();

    const definition = getCourseDefinition(normalized);
    const aliases = definition ? definition[1].aliases : [normalized];

    return Course.findOne({
        $or: [
            {
                slug: {
                    $in: aliases
                }
            },
            {
                title: {
                    $regex:
                    definition ? definition[1].title : normalized,
                    $options: "i"
                }
            }
        ]
    });
}

async function resolveCourse(courseId, userId) {
    const requestedCourseId = courseId || "electronics";

    let course =
    await findCourse(
        requestedCourseId
    );

    if (!course) {
        const definition = getCourseDefinition(requestedCourseId);
        const slug = definition ? definition[0] : requestedCourseId;

        course = await Course.create({
            title:
            definition ? definition[1].title : "Computer Electronics",
            slug,
            teacher: userId,
            students: []
        });
    }

    return course;
}

router.post(
    "/upload",
    auth,
    upload.single("file"),
    async (req, res) => {
        try {
            if (req.user.role !== "teacher" && req.user.role !== "admin") {
                return res.status(403).json({
                    message: "Access denied"
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    message: "File not uploaded"
                });
            }

            res.json({
                fileUrl: `/uploads/${req.file.filename}`,
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            });
        }
        catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.post(
    "/",
    auth,
    async (req, res) => {
        try {
            const {
                title,
                content,
                type,
                courseId,
                deadline,
                publishDate,
                eventDate,
                fileUrl,
                fileName,
                fileType,
                fileSize,
                hidden,
                pinned
            } = req.body;

            if (req.user.role !== "teacher" && req.user.role !== "admin") {
                return res.status(403).json({
                    message: "Access denied"
                });
            }

            const course =
            await resolveCourse(
                courseId,
                req.user.id
            );

            const material =
            await Material.create({
                title,
                content,
                type,
                fileUrl,
                fileName,
                fileType,
                fileSize,
                hidden,
                pinned,
                publishDate,
                deadline,
                eventDate,
                course: course._id,
                author: req.user.id
            });

            const students =
            await User.find({
                _id: {
                    $in: course.students
                }
            });

            for (const student of students) {
                await Notification.create({
                    user: student._id,
                    course: course._id,
                    type: "material",
                    title: "New material",
                    text: `${title} added`
                });
            }

            res.status(201).json(material);
        }
        catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.get(
    "/course/:courseId",
    auth,
    async (req, res) => {
        try {
            const course =
            mongoose.Types.ObjectId.isValid(req.params.courseId)
                ? await Course.findById(req.params.courseId)
                : await findCourse(req.params.courseId);

            const materials =
            course
                ? await Material.find({
                    course: course._id,
                    hidden: {
                        $ne: true
                    }
                })
                    .populate(
                        "author",
                        "name"
                    )
                    .sort({
                        pinned: -1,
                        createdAt: -1
                    })
                : [];

            res.json(materials);
        }
        catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.get(
    "/teacher/course/:courseId",
    auth,
    async (req, res) => {
        try {
            if (req.user.role !== "teacher" && req.user.role !== "admin") {
                return res.status(403).json({
                    message: "Access denied"
                });
            }

            const course =
            mongoose.Types.ObjectId.isValid(req.params.courseId)
                ? await Course.findById(req.params.courseId)
                : await findCourse(req.params.courseId);

            const materials =
            course
                ? await Material.find({
                    course: course._id
                })
                    .populate(
                        "author",
                        "name"
                    )
                    .sort({
                        pinned: -1,
                        createdAt: -1
                    })
                : [];

            res.json(materials);
        }
        catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.get(
    "/:id",
    auth,
    async (req, res) => {
        try {
            const material =
            await Material.findById(req.params.id)
                .populate("course", "title slug")
                .populate("author", "name email role");

            if (!material) {
                return res.status(404).json({
                    message: "Material not found"
                });
            }

            if (
                material.hidden &&
                req.user.role !== "teacher" &&
                req.user.role !== "admin"
            ) {
                return res.status(403).json({
                    message: "Material is hidden"
                });
            }

            res.json(material);
        }
        catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.put(
    "/:id",
    auth,
    async (req, res) => {
        try {
            if (req.user.role !== "teacher" && req.user.role !== "admin") {
                return res.status(403).json({
                    message: "Access denied"
                });
            }

            const material =
            await Material.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!material) {
                return res.status(404).json({
                    message: "Material not found"
                });
            }

            res.json(material);
        }
        catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.delete(
    "/:id",
    auth,
    async (req, res) => {
        try {
            if (req.user.role !== "teacher" && req.user.role !== "admin") {
                return res.status(403).json({
                    message: "Access denied"
                });
            }

            await Material.findByIdAndDelete(
                req.params.id
            );

            res.json({
                message: "Material deleted"
            });
        }
        catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

module.exports = router;
