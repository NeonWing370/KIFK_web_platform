const express = require("express");

const auth = require("../middleware/auth");
const Group = require("../models/Group");
const User = require("../models/User");

const router = express.Router();

function canManage(req) {
  return req.user.role === "teacher" || req.user.role === "admin";
}

function groupScope(req) {
  return req.user.role === "admin" ? {} : { teacher: req.user.id };
}

async function findManagedGroup(req, groupId) {
  return Group.findOne({ _id: groupId, ...groupScope(req) });
}

router.get("/", auth, async (req, res) => {
  try {
    if (!canManage(req)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const groups = await Group.find(groupScope(req))
      .populate("teacher", "name email")
      .populate("leader", "name email")
      .populate("students", "name email role");

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    if (!canManage(req)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const teacher = req.user.role === "admin" && req.body.teacher
      ? req.body.teacher
      : req.user.id;

    const group = await Group.create({
      name: req.body.name,
      teacher,
      students: []
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/students/:studentId", auth, async (req, res) => {
  try {
    if (!canManage(req)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const group = await findManagedGroup(req, req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const student = await User.findOne({
      _id: req.params.studentId,
      role: "student"
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.group && String(student.group) !== String(group._id)) {
      await Group.findByIdAndUpdate(student.group, {
        $pull: { students: student._id }
      });
      await Group.updateOne(
        { _id: student.group, leader: student._id },
        { $set: { leader: null } }
      );
    }

    if (!group.students.some((id) => String(id) === String(student._id))) {
      group.students.push(student._id);
      await group.save();
    }

    student.group = group._id;
    await student.save();

    const populated = await Group.findById(group._id)
      .populate("teacher", "name email")
      .populate("leader", "name email")
      .populate("students", "name email role");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id/students/:studentId", auth, async (req, res) => {
  try {
    if (!canManage(req)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const group = await findManagedGroup(req, req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    group.students = group.students.filter(
      (id) => String(id) !== String(req.params.studentId)
    );
    if (group.leader && String(group.leader) === String(req.params.studentId)) {
      group.leader = null;
    }
    await group.save();

    await User.updateOne(
      { _id: req.params.studentId, group: group._id },
      { group: null }
    );

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id/leader", auth, async (req, res) => {
  try {
    if (!canManage(req)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const group = await findManagedGroup(req, req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const leaderId = req.body.leaderId || null;
    if (leaderId) {
      const isMember = group.students.some(
        (studentId) => String(studentId) === String(leaderId)
      );
      if (!isMember) {
        return res.status(400).json({
          message: "The group leader must be a student in this group"
        });
      }
    }

    group.leader = leaderId;
    await group.save();

    const populated = await Group.findById(group._id)
      .populate("teacher", "name email")
      .populate("leader", "name email")
      .populate("students", "name email role");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
