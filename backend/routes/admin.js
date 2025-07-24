const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Upload = require("../models/Upload");
const auth = require("../middleware/auth");

router.get("/stats", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });

    const totalUsersLoggedIn = await User.countDocuments({ lastLogin: { $exists: true, $ne: null } });
    const totalFilesUploaded = await Upload.countDocuments();
    const mostUsedChartTypes = await Upload.aggregate([
      { $unwind: "$visualizations" },
      { $group: { _id: "$visualizations.type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]).then((results) => results.map((r) => ({ type: r._id, count: r.count })));

    res.json({ totalUsersLoggedIn, totalFilesUploaded, mostUsedChartTypes });
  } catch (error) {
    console.error("Stats error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/users", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });

    const users = await User.find().select("username isBlocked _id");
    res.json(users);
  } catch (error) {
    console.error("Users fetch error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/users/:userId/block", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.isBlocked = true;
    await user.save();
    res.json({ msg: "User blocked", user });
  } catch (error) {
    console.error("Block error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/users/:userId/unblock", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.isBlocked = false;
    await user.save();
    res.json({ msg: "User unblocked", user });
  } catch (error) {
    console.error("Unblock error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete("/users/:userId", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    await user.remove();
    res.json({ msg: "User deleted" });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;