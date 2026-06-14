const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["student", "teacher", "admin"],
        default: "student"
    },

    bio: {
        type: String,
        default: ""
    },

    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        default: null
    },

    joinedCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ]
},
{
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);
