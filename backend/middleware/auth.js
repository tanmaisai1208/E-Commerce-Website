// Middleware to check if user is an admin
function adminAuth(req, res, next) {
    if (req.session.role === "admin") {
        next(); // User is an admin, proceed to the next middleware or route
    } else {
        res.status(403).send('Access denied. Only admins are allowed.'); // Block access
    }
}

module.exports = { adminAuth };
