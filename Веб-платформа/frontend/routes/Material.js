const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema({

    title:String,

    content:String,

    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course"
    },

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    fileUrl:String,

    imageUrl:String,

    publishDate:Date,

    notes:String

},{
    timestamps:true
});

module.exports =
mongoose.model(
"Material",
MaterialSchema
);

