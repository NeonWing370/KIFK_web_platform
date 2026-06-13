const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
{
    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [String],
    answer: Number,
    points: {
        type: Number,
        default: 1
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("Question", questionSchema);
