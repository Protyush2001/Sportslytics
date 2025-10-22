const express = require("express");
const router = express.Router();
const User = require("../models/user-model");
const CustomMatch = require("../models/customMatch-model");
const Player = require("../models/player-model")
const authorizeRoles = require("../middlewares/checkRole");
const authenticateUser = require("../middlewares/authenticateUser");


router.get("/stats", authenticateUser, authorizeRoles("admin"), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activePlayers = await Player.countDocuments();
    const teamOwners = await User.countDocuments({ role: "team_owner" });
    const totalMatches = await CustomMatch.countDocuments();
    const upcomingMatches = await CustomMatch.countDocuments({ status: "Upcoming" });

    res.json({
      totalUsers,
      activePlayers,
      teamOwners,
      totalMatches,
      upcomingMatches,
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err.message);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});


router.get("/users", authenticateUser, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.find().select("_id username email role");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


router.delete("/user/:id", authenticateUser, authorizeRoles("admin"), async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});


router.patch("/user/:id", authenticateUser, authorizeRoles("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    const updated = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!updated) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "User role updated", user: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user role" });
  }
});


router.get("/matches", authenticateUser, authorizeRoles("admin"), async (req, res) => {
  try {
    const matches = await CustomMatch.find().select("_id title status date createdBy");
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});


router.delete("/matches/:id", authenticateUser, authorizeRoles("admin"), async (req, res) => {
  try {
    const deleted = await CustomMatch.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Match not found" });
    res.json({ msg: "Match deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete match" });
  }
});



module.exports = router;