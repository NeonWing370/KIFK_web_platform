const mongoose = require("mongoose");

const forumPostSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true,
        trim: true
    },

    text: {
        type: String,
        required: true
    },

    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        default: null
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    replies: [
        {
            text: {
                type: String,
                required: true
            },

            author: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
},
{
    timestamps: true
});

module.exports = mongoose.model(
    "ForumPost",
    forumPostSchema
);