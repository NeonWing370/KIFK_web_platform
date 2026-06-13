const express = require("express");
const mongoose = require("mongoose");

const auth = require("../middleware/auth");
const Test = require("../models/Test");
const Result = require("../models/Result");
const Course = require("../models/Course");
const Notification = require("../models/Notification");

const router = express.Router();

function canManage(req) {
    return req.user.role === "teacher" || req.user.role === "admin";
}

async function findCourse(courseId) {
    if (!courseId) {
        return null;
    }

    if (mongoose.Types.ObjectId.isValid(courseId)) {
        return Course.findById(courseId);
    }

    const normalized = String(courseId).toLowerCase().trim();
    const aliases = normalized === "electronics"
        ? ["electronics", "computer-electronics", "computer electronics", "comp electronics"]
        : normalized === "logic"
            ? ["logic", "computer-logic", "computer logic", "comp logic"]
            : [normalized];

    return Course.findOne({
        $or: [
            {
                slug: {
                    $in: aliases
                }
            },
            {
                title: {
                    $regex: normalized === "electronics" ? "electronics" : normalized === "logic" ? "logic" : normalized,
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
        course = await Course.create({
            title: requestedCourseId === "logic" ? "Computer Logic" : "Computer Electronics",
            slug: requestedCourseId,
            teacher: userId,
            students: []
        });
    }

    return course;
}

router.get("/course/:courseId", auth, async (req, res) => {
    try {
        const course = await findCourse(req.params.courseId);
        const tests = course ? await Test.find({
            course: course._id
        }).sort({
            createdAt: -1
        }) : [];

        res.json(tests);
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

        const course = await resolveCourse(req.body.courseId, req.user.id);

        const test = await Test.create({
            title: req.body.title,
            course: course._id,
            author: req.user.id,
            passScore: req.body.passScore,
            availableFrom: req.body.availableFrom,
            deadline: req.body.deadline,
            showAnswers: req.body.showAnswers,
            questions: req.body.questions || []
        });

        if (course) {
            await Promise.all((course.students || []).map((studentId) => Notification.create({
                user: studentId,
                course: course._id,
                type: "test",
                title: "New test",
                text: `${test.title} is available in ${course.title}.`
            })));
        }

        res.status(201).json(test);
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

        const update = Object.assign({}, req.body);

        if (req.body.courseId) {
            const course = await resolveCourse(req.body.courseId, req.user.id);
            update.course = course._id;
            delete update.courseId;
        }

        const test = await Test.findByIdAndUpdate(
            req.params.id,
            update,
            {
                new: true,
                runValidators: true
            }
        );

        res.json(test);
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

        await Result.deleteMany({
            test: req.params.id
        });
        await Test.findByIdAndDelete(req.params.id);

        res.json({
            message: "Test deleted"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/:id/submit", auth, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can submit tests"
            });
        }

        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({
                message: "Test not found"
            });
        }

        const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
        let score = 0;
        let maxScore = 0;

        const checkedAnswers = test.questions.map((question, index) => {
            const points = Number(question.points || 1);
            const answer = Number(answers[index]);
            const correct = answer === Number(question.answer);

            maxScore += points;
            if (correct) score += points;

            return {
                questionIndex: index,
                answer,
                correct,
                points: correct ? points : 0
            };
        });

        const percentage = maxScore ? Math.round((score / maxScore) * 100) : 0;
        const result = await Result.findOneAndUpdate(
            {
                test: test._id,
                student: req.user.id
            },
            {
                test: test._id,
                course: test.course,
                student: req.user.id,
                answers: checkedAnswers,
                score,
                maxScore,
                percentage,
                passed: percentage >= Number(test.passScore || 60)
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        await Notification.create({
            user: req.user.id,
            course: test.course,
            type: "result",
            title: "Test submitted",
            text: `${test.title}: ${score}/${maxScore} (${percentage}%).`
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
