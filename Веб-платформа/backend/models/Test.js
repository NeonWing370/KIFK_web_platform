const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
{
    question: {
        type: String,
        required: true
    },
    options: [
        {
            type: String,
            required: true
        }
    ],
    answer: {
        type: Number,
        required: true
    },
    points: {
        type: Number,
        default: 1
    }
},
{
    _id: false
});

const testSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true,
        trim: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    passScore: {
        type: Number,
        default: 60
    },
    availableFrom: Date,
    deadline: Date,
    showAnswers: {
        type: Boolean,
        default: true
    },
    hidden: {
        type: Boolean,
        default: false
    },
    pinned: {
        type: Boolean,
        default: false
    },
    questions: [questionSchema]
},
{
    timestamps: true
});

module.exports = mongoose.model("Test", testSchema);
