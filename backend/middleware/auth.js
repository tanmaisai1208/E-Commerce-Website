// Middleware to check if user is an admin
function adminAuth(req, res, next) {
    if (req.session.role === "admin") {
        next(); // User is an admin, proceed to the next middleware or route
    } else {
        res.status(403).send('Access denied. Only admins are allowed.'); // Block access
    }
}

function isAuth(req, res, next) {
    if (req.session.user) {
      next(); // User is authenticated, proceed to next route
    } else {
      return res.redirect('/login?message=You%20need%20to%20login%20first%20to%20access%20this%20page');
    }
}
  
  
module.exports = { adminAuth, isAuth };
