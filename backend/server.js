const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
connectDB(); // Call connectDB only once
app.use("/api/upload", uploadRoutes);

app.use("/api/auth", authRoutes);
app.get("/", (req, res) => res.send("API running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


