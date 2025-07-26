const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  // Get token from header
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    // Verify token and decode user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Store decoded user data (including id, role, etc.)
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = auth;