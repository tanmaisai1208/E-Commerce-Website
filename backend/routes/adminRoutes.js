const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Adjust path to Product model
const Order = require('../models/order'); // Adjust path to Order model
const User = require('../models/user'); // Adjust path to User model
const { adminAuth } = require('../middleware/auth'); // Middleware for admin authentication
const multer = require('multer');
const path = require('path');
const methodOverride = require('method-override');

router.use(methodOverride('_method'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the folder for image storage
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Ensure unique file names
    }
});
const upload = multer({ storage: storage });

// Add a new product
router.post('/api/admin/products', adminAuth, upload.single('image'), async (req, res) => {
    const { name, price, description, category } = req.body;
    const imageUrl = req.file ? req.file.path.replace(/\\/g, '/') : ''; // Convert backslashes to forward slashes

    try {
        const product = new Product({
            name,
            price,
            description,
            category,
            imageUrl, // Store the image path
        });

        await product.save();
        res.redirect('/admin?success=true');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding product.');
    }
});

// Update a product
router.put('/api/admin/products/:id', adminAuth, async (req, res) => {
    console.log('edit called');
    const { id } = req.params;
    const { name, category, price, description, image } = req.body; // Capture the form data

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.name = name || product.name;
        product.category = category || product.category;
        product.price = price || product.price;
        product.description = description || product.description;
        // Handle image update logic if necessary
        if (image) {
            product.image = image; // Assume image URL is being passed (you might need to handle file upload)
        }

        await product.save();
        res.json({ message: 'Product updated successfully', product });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update product' });
    }
});

// Delete a product
router.delete('/api/admin/products/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findByIdAndDelete(id);
        if (product) {
            res.send('Product deleted successfully.');
        } else {
            res.status(404).send('Product not found.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting product.');
    }
});

// Get all products
router.get('/api/admin/products', adminAuth, async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching products.');
    }
});

// Get all orders
router.get('/api/admin/orders', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching orders.');
    }
});

// Get all users
router.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching users.');
    }
});

module.exports = router;
