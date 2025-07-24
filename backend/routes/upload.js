const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const Upload = require("../models/Upload");
const auth = require("../middleware/auth");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// No change needed for upload and history routes
router.post("/upload", [auth, upload.single("file")], async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const upload = new Upload({
      filename: req.file.originalname,
      data,
      userId: req.user.id,
    });

    await upload.save();
    res.json({ msg: "File uploaded successfully", uploadId: upload._id });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

router.get("/history", auth, async (req, res) => {
  try {
    const uploads = await Upload.find({ userId: req.user.id }).sort({ uploadedAt: -1 });
    res.json(uploads);
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

router.post("/visualize/:uploadId", auth, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { type, data, image, xAxis, yAxis } = req.body;

    // Validate input
    if (!uploadId || !type || !xAxis || !yAxis || !image) {
      return res.status(400).json({ msg: "Missing required fields: type, xAxis, yAxis, or image" });
    }

    const upload = await Upload.findOne({ _id: uploadId, userId: req.user.id });
    if (!upload) return res.status(404).json({ msg: "Upload not found" });

    // Ensure data is an array (normalize for both 2D and 3D)
    const normalizedData = Array.isArray(data) ? data : [data];

    // Create visualization object
    const visualization = {
      type,
      data: normalizedData,
      visualizationImage: image,
      xAxis,
      yAxis,
      createdAt: new Date(),
    };

    // Add visualization to the upload's visualizations array
    upload.visualizations.push(visualization);
    await upload.save();

    res.json({ msg: "Visualization saved", visualizations: upload.visualizations });
  } catch (error) {
    console.error("Visualization save error:", error);
    res.status(500).json({ msg: "Failed to save visualization", error: error.message });
  }
});

router.get("/:uploadId", auth, async (req, res) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.uploadId, userId: req.user.id });
    if (!upload) return res.status(404).json({ msg: "Upload not found" });
    res.json({ data: upload.data, visualizations: upload.visualizations });
  } catch (error) {
    console.error("Upload fetch error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

module.exports = router;