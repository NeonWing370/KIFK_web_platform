const mongoose = require("mongoose");

const TestSchema = new mongoose.Schema({

    title:String,

    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course"
    },

    dueDate:Date,

    questions:[{

        question:String,

        type:{
            type:String,
            enum:["single","multiple"]
        },

        options:[String],

        correctAnswers:[Number]

    }]

},{
    timestamps:true
});

module.exports =
mongoose.model(
"Test",
TestSchema
);