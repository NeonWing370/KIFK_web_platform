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
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

function canManage(req) {
  return req.user.role === "teacher" || req.user.role === "admin";
}

function validGrade(value) {
  const grade = Number(value);
  return Number.isInteger(grade) && grade >= 1 && grade <= 12 ? grade : null;
}

function populatedSubmissions(query) {
  return Submission.find(query)
    .populate("student", "name email group")
    .populate("material", "title type deadline author")
    .populate("course", "title slug")
    .sort({ createdAt: -1 });
}

router.post("/material/:materialId", auth, upload.single("file"), async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can submit practice work" });
    }

    const material = await Material.findById(req.params.materialId);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }
    if (material.type !== "practice") {
      return res.status(400).json({ message: "This material is not a practice work" });
    }

    const update = {
      material: material._id,
      course: material.course,
      student: req.user.id,
      text: req.body.text || "",
      status: "submitted",
      grade: null,
      feedback: ""
    };
    if (req.file) {
      update.fileUrl = "/uploads/" + req.file.filename;
      update.fileName = req.file.originalname;
      update.fileType = req.file.mimetype;
      update.fileSize = req.file.size;
    }

    const submission = await Submission.findOneAndUpdate(
      { material: material._id, student: req.user.id },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const submissions = await populatedSubmissions({ student: req.user.id });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    if (!canManage(req)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const submissions = await populatedSubmissions({});
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/material/:materialId", auth, async (req, res) => {
  try {
    if (!canManage(req)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const submissions = await populatedSubmissions({ material: req.params.materialId });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id/check", auth, async (req, res) => {
  try {
    if (!canManage(req)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const grade = validGrade(req.body.grade);
    if (grade === null) {
      return res.status(400).json({ message: "Grade must be an integer from 1 to 12" });
    }

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { grade, feedback: String(req.body.feedback || "").trim(), status: "checked" },
      { new: true, runValidators: true }
    );
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
