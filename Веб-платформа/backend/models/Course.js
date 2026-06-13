const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    description: String,

    slug: {
        type: String,
        unique: true,
        sparse: true
    },

    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    archived: {
        type: Boolean,
        default: false
    }

},
{
    timestamps:true
});

module.exports =
mongoose.model(
    "Course",
    courseSchema
);
