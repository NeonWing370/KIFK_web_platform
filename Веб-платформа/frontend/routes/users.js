const express = require("express");

const router = express.Router();

const auth =
require("../middleware/auth");

const User =
require("../models/User");

router.get(
"/me",
auth,
async(req,res)=>{

    const user =
    await User.findById(
        req.user.id
    );

    res.json(user);

});

router.put(
"/profile",
auth,
async(req,res)=>{

    const user =
    await User.findByIdAndUpdate(
        req.user.id,
        req.body,
        {new:true}
    );

    res.json(user);

});