const express =
require("express");

const mongoose =
require("mongoose");

const router =
express.Router();

const auth =
require("../middleware/auth");

const Material =
require("../models/Material");

const Course =
require("../models/Course");

const User =
require("../models/User");

const Notification =
require("../models/Notification");

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

    const aliases =
    normalized === "electronics"
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
    let course =
    await findCourse(
        requestedCourseId
    );

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

router.post(
"/",
auth,
async(req,res)=>{

try{

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
            message:"Access denied"
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

        course:course._id,

        author:req.user.id

    });

    const students =
    await User.find({
        _id:{
            $in:
            course.students
        }
    });

    for(const student of students){

        await Notification.create({

            user:
            student._id,

            course:
            course._id,

            title:
            "New material",

            text:
            `${title} added`

        });

    }

    res.json(material);

}
catch(error){

    res.status(500).json({
        message:error.message
    });

}

});


router.get(
"/course/:courseId",
auth,
async(req,res)=>{

const materials =
await Material.find({

    course:
    mongoose.Types.ObjectId.isValid(req.params.courseId)
        ? req.params.courseId
        : (await findCourse(req.params.courseId))?._id

})
.populate(
    "author",
    "name"
)
.sort({
    createdAt:-1
});

res.json(materials);

});

router.put(
"/:id",
auth,
async(req,res)=>{

try{

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
        return res.status(403).json({
            message:"Access denied"
        });
    }

    const material =
    await Material.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new:true,
            runValidators:true
        }
    );

    if (!material) {
        return res.status(404).json({
            message:"Material not found"
        });
    }

    res.json(material);

}
catch(error){

    res.status(500).json({
        message:error.message
    });

}

});

router.delete(
"/:id",
auth,
async(req,res)=>{

try{

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
        return res.status(403).json({
            message:"Access denied"
        });
    }

    await Material.findByIdAndDelete(
        req.params.id
    );

    res.json({
        message:"Material deleted"
    });

}
catch(error){

    res.status(500).json({
        message:error.message
    });

}

});

module.exports = router;
