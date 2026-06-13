const mongoose =
require("mongoose");

const notificationSchema =
new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
        default:null
    },

    title:String,

    text:String,

    type:{
        type:String,
        default:"system"
    },

    isRead:{
        type:Boolean,
        default:false
    }

},
{
    timestamps:true
});

module.exports =
mongoose.model(
    "Notification",
    notificationSchema
);
