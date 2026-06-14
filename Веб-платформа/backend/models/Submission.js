const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
{
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material",
        required: true
    },

    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    text: {
        type: String,
        default: ""
    },

    fileUrl: String,
    fileName: String,
    fileType: String,
    fileSize: Number,

    status: {
        type: String,
        enum: ["submitted", "checked"],
        default: "submitted"
    },

    grade: {
        type: Number,
        default: null
    },

    feedback: {
        type: String,
        default: ""
    }
},
{
    timestamps: true
});

submissionSchema.index(
    {
        material: 1,
        student: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "Submission",
    submissionSchema
);