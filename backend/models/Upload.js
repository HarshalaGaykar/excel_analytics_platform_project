const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  data: { type: [Object], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
  visualizations: [
    {
      type: { type: String, required: true },
      data: { type: Object, required: true },
      createdAt: { type: Date, default: Date.now },
      visualizationImage: { type: String }, // Base64 image string
      xAxis: { type: String }, // Added to store the X-axis column name
      yAxis: { type: String }, // Added to store the Y-axis column name
    },
  ],
});
const visualizationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  data: { type: [Object], required: true },
  createdAt: { type: Date, default: Date.now },
  visualizationImage: { type: String },
  xAxis: { type: String },
  yAxis: { type: String },
  filename: { type: String },
});

module.exports = mongoose.model("Upload", uploadSchema);
