const jwt = require("jsonwebtoken");

module.exports = function authDoctor(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "doctor") {
      return res.status(403).json({ error: "Doctor access only" });
    }

    req.user = decoded;
    next(); // ✅ REQUIRED
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
