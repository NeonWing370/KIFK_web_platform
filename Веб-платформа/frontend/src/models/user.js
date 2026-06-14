const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,

    email: {
        type: String,
        unique: true
    },

    password: String,

    role: {
        type: String,
        default: "student"
    },

    bio: String,

    joinedCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ],

    notifications: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Notification"
        }
    ],

    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    }
});

module.exports =
mongoose.model("User", userSchema);