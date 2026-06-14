const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({

    title: String,

    slug: {
        type: String,
        unique: true
    },

    description: String,

    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

module.exports =
mongoose.model("Course", courseSchema);