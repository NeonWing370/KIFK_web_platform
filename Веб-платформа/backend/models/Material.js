const mongoose = require("mongoose");

const materialSchema =
new mongoose.Schema({

    title: {
        type:String,
        required:true
    },

    content:String,

    type:{
        type:String,
        enum:[
    "text",
    "file",
    "event",
    "practice"
],
        default:"text"
    },

    fileUrl:String,

    fileName:String,

    fileType:String,

    fileSize:Number,

    hidden:{
        type:Boolean,
        default:false
    },

    pinned:{
        type:Boolean,
        default:false
    },

    publishDate:Date,

    deadline:Date,

    eventDate:Date,

    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course"
    },

    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }

},
{
    timestamps:true
});

module.exports =
mongoose.model(
    "Material",
    materialSchema
);
