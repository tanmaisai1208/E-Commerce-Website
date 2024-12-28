const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Adjust path to Product model
const Order = require('../models/order'); // Adjust path to Order model
const { adminAuth } = require('../middleware/auth'); // Middleware for admin authentication

// Add a new product
router.post('/admin/products', adminAuth, async (req, res) => {
    const { name, price, description, stock } = req.body;
    try {
        const product = new Product({ name, price, description, stock });
        await product.save();
        res.send('Product added successfully.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding product.');
    }
});

// Update a product
router.put('/admin/products/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    const { name, price, description, stock } = req.body;
    try {
        const product = await Product.findByIdAndUpdate(
            id,
            { name, price, description, stock },
            { new: true } // Return the updated product
        );
        if (product) {
            res.send('Product updated successfully.');
        } else {
            res.status(404).send('Product not found.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating product.');
    }
});

// Delete a product
router.delete('/admin/products/:id', adminAuth, async (req, res) => {
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

// View all orders
router.get('/admin/orders', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'name email'); // Assuming 'user' is a ref field in Order
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching orders.');
    }
});

module.exports = router;
