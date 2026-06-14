const express = require("express");
const multer = require("multer");
const path = require("path");

const auth = require("../middleware/auth");
const Submission = require("../models/Submission");
const Material = require("../models/Material");

const router = express.Router();

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

function canManage(req) {
    return req.user.role === "teacher" || req.user.role === "admin";
}

router.post(
    "/material/:materialId",
    auth,
    upload.single("file"),
    async (req, res) => {
        try {
            if (req.user.role !== "student") {
                return res.status(403).json({
                    message: "Only students can submit practice work"
                });
            }

            const material =
            await Material.findById(req.params.materialId);

            if (!material) {
                return res.status(404).json({
                    message: "Material not found"
                });
            }

            if (material.type !== "practice") {
                return res.status(400).json({
                    message: "This material is not a practice work"
                });
            }

            const update = {
                material: material._id,
                course: material.course,
                student: req.user.id,
                text: req.body.text || "",
                status: "submitted"
            };

            if (req.file) {
                update.fileUrl = `/uploads/${req.file.filename}`;
                update.fileName = req.file.originalname;
                update.fileType = req.file.mimetype;
                update.fileSize = req.file.size;
            }

            const submission =
            await Submission.findOneAndUpdate(
                {
                    material: material._id,
                    student: req.user.id
                },
                update,
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

            res.status(201).json(submission);
        }
        catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.get(
    "/my",
    auth,
    async (req, res) => {
        try {
            const submissions =
            await Submission.find({
                student: req.user.id
            })
                .populate("material", "title type deadline")
                .populate("course", "title slug")
                .sort({
                    createdAt: -1
                });

            res.json(submissions);
        }
        catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.get(
    "/material/:materialId",
    auth,
    async (req, res) => {
        try {
            if (!canManage(req)) {
                return res.status(403).json({
                    message: "Access denied"
                });
            }

            const submissions =
            await Submission.find({
                material: req.params.materialId
            })
                .populate("student", "name email group")
                .populate("material", "title type deadline")
                .populate("course", "title slug")
                .sort({
                    createdAt: -1
                });

            res.json(submissions);
        }
        catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.put(
    "/:id/check",
    auth,
    async (req, res) => {
        try {
            if (!canManage(req)) {
                return res.status(403).json({
                    message: "Access denied"
                });
            }

            const submission =
            await Submission.findByIdAndUpdate(
                req.params.id,
                {
                    grade: req.body.grade,
                    feedback: req.body.feedback,
                    status: "checked"
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            res.json(submission);
        }
        catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
);

module.exports = router;