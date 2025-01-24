const express = require("express");
const session = require('express-session');
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const cors = require("cors");
const dotenv = require("dotenv");
require("dotenv").config();

// Import Custom Modules
const productRoutes = require("./routes/productRoutes");
const adminRoute = require('./routes/adminRoutes'); 
const User = require("./models/user");
const { adminAuth, isAuth } = require('./middleware/auth'); 


const path = require("path");
const app = express();
// Set up express-session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the routes with /api prefix
app.use(productRoutes);
app.use(adminRoute);

// Database connection
mongoose
.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error(err));


// Serve static frontend files
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.static('images'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve the admin page only if the user is an admin
app.get('/admin', isAuth, adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Catch-all route to serve the homepage
app.get("/", isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/become-admin", isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/become-admin.html"));
});

// Route to serve products-listing page
app.get("/product-listing", isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/product-listing.html"));
});

// Route to serve the Manage Products page
app.get("/manage-products", adminAuth, isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/manage-product.html"));
});

// Route for Create Product Page
app.get('/create-product', adminAuth, isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/create-product.html'));
});

// Route for Update Product Page
app.get('/update-product', adminAuth, isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/update-product.html'));
});

// Handle GET request for the Edit Product page
app.get('/edit-product/:id', adminAuth, isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/edit-product.html'));
});

// Serve the Product Details page
app.get('/product-details/:id', isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/product-details.html'));
});

// Route to get cart data
app.get('/api/get-cart', isAuth, (req, res) => {
  if (req.session.cart) {
    const cartDetails = req.session.cart.map(item => {
      // Fetch product details from database using productId
      // Assuming you have a Product model and it's available in the scope
      const product = Product.findById(item.productId);
      return {
        ...product.toObject(),
        quantity: item.quantity,
      };
    });

    res.json(cartDetails);
  } else {
    res.json([]);
  }
});

// Serve cart.html when user navigates to /cart
app.get("/cart", isAuth, (req, res) => { 
  res.sendFile(path.join(__dirname, "../frontend/cart.html")); 
});

// Serve cart.html when user navigates to /cart
app.get("/checkOut", isAuth, (req, res) => { 
  res.sendFile(path.join(__dirname, "../frontend/checkOut.html")); 
});

app.get("/confirmation", isAuth, (req, res) => { 
  res.sendFile(path.join(__dirname, "../frontend/confirmation.html")); 
});

app.get("/order-history", isAuth, (req, res) => { 
  res.sendFile(path.join(__dirname, "../frontend/orderHistory.html")); 
});

app.get("/profile", isAuth, (req, res) => { 
  res.sendFile(path.join(__dirname, "../frontend/profile.html")); 
});

app.get("/comparisonResults", isAuth, (req, res) => { 
  res.sendFile(path.join(__dirname, "../frontend/comparisonResults.html")); 
});

// Route for register page
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/register.html"));
});
  
// Route for login page
app.get("/login", (req, res) => {
    delete req.session.message;
    res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// Register route
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, contact } = req.body;

    // Validate required fields
    if (!name || !email || !password || !contact) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate password length (at least 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Validate contact number length (exactly 10 digits)
    if (!/^\d{10}$/.test(contact)) {
      return res.status(400).json({ message: "Contact number must be exactly 10 digits" });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      contact,
      role: 'user',
    });

    // Save the user in the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare the entered password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate a JWT token (for authentication)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    req.session.user = user;
    req.session.role = user.role;
    // Respond with the token
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/check-session', (req, res) => {
  if (req.session.user) {
    return res.json({ isLoggedIn: true });
  } else {
    return res.json({ isLoggedIn: false });
  }
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    // Clear the session cookie (cookie name is typically 'connect.sid', but it might differ based on your config)
    res.clearCookie('connect.sid');
    res.redirect('/');  // Redirect to the homepage
  });
});


// Middleware to check if the user is logged in
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.user ? true : false;
  next();
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
