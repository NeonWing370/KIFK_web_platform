const mongoose = require("mongoose");

const TestResultSchema =
new mongoose.Schema({

    student:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    test:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Test"
    },

    score:Number,

    passed:Boolean

},{
    timestamps:true
});

module.exports =
mongoose.model(
"TestResult",
TestResultSchema
);