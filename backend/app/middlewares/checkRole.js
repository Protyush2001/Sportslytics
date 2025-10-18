// middleware/checkRole.js
const jwt = require("jsonwebtoken");

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
            const token = req.header("Authorization").replace("Bearer ", "");

            if (!token) return res.status(401).json({ message: "No token provided" });

            const decoded = jwt.verify(token, 'secret@123');
            req.user = decoded; // attach user info to req

            if (!allowedRoles.includes(decoded.role)) {
                return res.status(403).json({ message: "Access denied" });
            }

            next();
        } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
        }
    };
};

module.exports = authorizeRoles;