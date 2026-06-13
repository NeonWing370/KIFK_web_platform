const express =
require("express");

const router =
express.Router();

const auth =
require("../middleware/auth");

const Notification =
require("../models/Notification");

router.get(
"/",
auth,
async(req,res)=>{

const notifications =
await Notification.find({

    user:req.user.id

})
.sort({
    createdAt:-1
});

res.json(
    notifications
);

});

router.put(
"/:id/read",
auth,
async(req,res)=>{

await Notification.findByIdAndUpdate(

    {
        _id:req.params.id,
        user:req.user.id
    },

    {
        isRead:true
    }

);

res.json({
    success:true
});

});

router.put(
"/read/all",
auth,
async(req,res)=>{

await Notification.updateMany(
    {
        user:req.user.id
    },
    {
        isRead:true
    }
);

res.json({
    success:true
});

});

module.exports = router;
