const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Product = require('../models/product');
const Review = require('../models/review');
const Order = require('../models/order');
const multer = require('multer'); // For handling image uploads
const path = require('path');
const fs = require('fs');
const Razorpay = require('razorpay');
const order = require('../models/order');
const puppeteer = require('puppeteer');

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

const { loadScrapedData } = require('../services/scraper');

// Set up multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set your desired folder for image storage
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure unique file names
  }
});

const upload = multer({ storage: storage });
const SECRET_PASSWORD = '@123';

const scrapedData = JSON.parse(fs.readFileSync(path.join(__dirname, '../services/scrapedData.json')));

// Route: Become Admin
router.post('/become-admin', async (req, res) => {
    const { email, secretPassword } = req.body;
    if (secretPassword !== SECRET_PASSWORD) {
        return res.status(403).send('Invalid secret password.');
    }
    try {
        const user = await User.findOneAndUpdate(
            { email },
            { role: 'admin' },
            { new: true } // Return the updated document
        );
        req.session.role = "admin";
        if (user) {
            res.send(`Congratulations! The user with email "${email}" is now an admin.`);
        } else {
            res.status(404).send('User not found.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while processing your request.');
    }
});

// Route to get user details
router.get('/get-user-details', (req, res) => {
  if (req.session && req.session.user) {
    // Extract user details from the session
    const userDetails = {
      name: req.session.user.name,
      email: req.session.user.email,
      contact: req.session.user.contact,
    };
    res.status(200).json(userDetails);
  } else {
    // If user is not logged in
    res.status(401).json({ message: 'User not logged in' });
  }
});

router.get('/api/get-user-role', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ role: req.session.role }); // Assuming role is stored in the session
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Get all products with filters
router.get('/api/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, ratingSort } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (minPrice) {
      filter.price = { $gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
      filter.price = filter.price || {};
      filter.price.$lte = parseFloat(maxPrice);
    }

    // Sorting by rating
    const sort = {};
    if (ratingSort === 'asc') {
      sort.rating = 1; // Ascending order
    } else if (ratingSort === 'desc') {
      sort.rating = -1; // Descending order
    }

    const products = await Product.find(filter).sort(sort);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Create a new product
router.post('/api/create-product', upload.single('image'), async (req, res) => {
  try {
    let { name, category, price, available, description } = req.body;
    category = category.toLowerCase();
    const imageUrl = req.file ? req.file.path.replace(/\\/g, '/') : ''; // Convert backslashes to forward slashes

    const newProduct = new Product({
      name,
      category,
      price,
      available,
      description,
      imageUrl,
    });

    await newProduct.save();
    res.redirect('/manage-products?success=true');
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Fetch a single product by ID for the update form
router.get('/api/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ message: 'Error fetching product details' });
  }
});

// Update an existing product
router.post('/api/update-product/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, description } = req.body;
    const updateData = { name, category, price, description };

    if (req.file) {
      updateData.imageUrl = req.file.path.replace(/\\/g, '/'); // Update image URL if a new image is uploaded
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.redirect('/manage-products'); // Redirect to manage products page
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete a product by ID
router.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndDelete(productId);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Get detailed information of a single product by ID (for product details page)
router.get('/api/product-details/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ message: 'Error fetching product details' });
  }
});

// Route to add product to cart
router.post('/api/add-to-cart', async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    // Fetch product details by productId
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Initialize cart if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if the product is already in the cart
    const productIndex = req.session.cart.findIndex(item => item.productId.toString() === productId);

    if (productIndex !== -1) {
      // If product is already in the cart, update quantity
      req.session.cart[productIndex].quantity += quantity;
    } else {
      // Otherwise, add new product to the cart
      req.session.cart.push({ productId, quantity });
    }

    res.json({ success: true, message: 'Product added to cart' });
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ success: false, message: 'Failed to add product to cart' });
  }
});

// Route to get cart data
router.get('/api/get-cart', async (req, res) => {
  if (req.session.cart && req.session.cart.length > 0) {
    try {
      // Fetch product details for each item in the cart
      const cartDetails = await Promise.all(
        req.session.cart.map(async (item) => {
          const product = await Product.findById(item.productId);
          if (product) {
            return {
              productId: item.productId,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,  // Assuming product has an imageUrl field
              quantity: item.quantity,
              category: product.category,
              rating: product.rating,
            };
          }
          return null;
        })
      );

      // Filter out any null values in case a product is not found
      res.json(cartDetails.filter(item => item !== null));
    } catch (error) {
      console.error('Error fetching cart items:', error);
      res.status(500).json({ error: 'Error fetching cart items' });
    }
  } else {
    res.json([]);  // No items in the cart
  }
});

// Route to remove a product from the cart
router.delete('/api/remove-from-cart/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    if (!req.session.cart) {
      return res.status(400).json({ success: false, message: 'No items in cart' });
    }

    // Find the index of the product to remove in the cart
    const productIndex = req.session.cart.findIndex(item => item.productId.toString() === productId);

    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    // Remove the product from the cart
    req.session.cart.splice(productIndex, 1);

    res.json({ success: true, message: 'Product removed from cart' });
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).json({ success: false, message: 'Failed to remove product from cart' });
  }
});

router.put('/api/update-cart-quantity', async (req, res) => {
  const { productId, quantity } = req.body;

  if (quantity < 1) {
    return res.status(400).json({ success: false, message: "Quantity cannot be less than 1" });
  }

  if (req.session.cart) {
    const cart = req.session.cart;
    const productIndex = cart.findIndex(item => item.productId === productId);

    if (productIndex !== -1) {
      cart[productIndex].quantity = quantity;
      req.session.cart = cart; // Update the session
      return res.json({ success: true });
    }
  }
  res.status(404).json({ success: false, message: "Product not found in cart" });
});

// Fetch reviews for a specific product
router.get('/api/product-reviews/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).exec();
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Add a review for a product
router.post('/api/add-review', async (req, res) => { 
  const { productId, reviewText, rating } = req.body;
  const username = req.session.user ? req.session.user.name : 'Guest'; // Fetch username from session or use 'Guest' if not logged in
  const userId = req.session.user ? req.session.user._id : null; // Get user ID from session

  try {
    const newReview = new Review({
      productId,
      userId, // Include the userId from the session
      username,
      text: reviewText,
      rating: parseInt(rating),
    });

    await newReview.save();
    
    // Calculate the new average rating for the product
    const reviews = await Review.find({ productId });
    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRatings / reviews.length).toFixed(2); // Round to 2 decimal places
    // Update the product's rating
    await Product.findByIdAndUpdate(productId, { rating: averageRating });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ success: false, message: 'Failed to add review' });
  }
});

// Edit review route
router.put('/api/edit-review/:reviewId', async (req, res) => {
  const { reviewText, rating } = req.body;
  const { reviewId } = req.params;
  const userId = req.session.user ? req.session.user._id : null; // Assuming user is logged in and we have user info in session

  try {
    // Find the review by ID
    const review = await Review.findById(reviewId);
    
    // Check if the review exists and if the logged-in user is the one who created the review
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only edit your own review' });
    }

    // Update the review
    review.text = reviewText;
    review.rating = parseInt(rating);
    await review.save();

    res.json({ success: true, message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error editing review:', error);
    res.status(500).json({ message: 'Error editing review' });
  }
});

// Delete review route
router.delete('/api/delete-review/:reviewId', async (req, res) => {
  const reviewId = req.params.reviewId;
  const userId = req.session.user ? req.session.user._id : null; // Assuming user is logged in and we have user info in session

  try {
    // Find the review by ID
    const review = await Review.findById(reviewId);

    // Check if the review exists and if the logged-in user is the one who created the review
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own review' });
    }

    // Delete the review
    await review.deleteOne();

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
});

// Checkout route
router.post('/api/checkout', async (req, res) => {
  const userId = req.session.user; // Assuming user is logged in and their ID is stored in the session
  const user_Id = userId._id;
  if (!userId) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  if (!req.session.cart || req.session.cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const { paymentMethod, shippingDetails } = req.body;

  // Validate incoming data
  if (!paymentMethod || !shippingDetails) {
    return res.status(400).json({ error: 'Payment method and shipping details are required.' });
  }

  // Initialize the totalPrice
  let totalPrice = 0;

  // Add price to each cart item and calculate the total price
  const updatedCartItems = [];
  for (const item of req.session.cart) {
    const product = await Product.findById(item.productId); // Fetch product to get the price
    if (product) {
      const price = product.price;
      const totalItemPrice = price * item.quantity;

      updatedCartItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price, // Add price here
      });

      totalPrice += totalItemPrice; // Add to total price
    }
  }

  // Generate a unique order ID
  const orderId = `order_${new Date().getTime()}_${user_Id}`;

  // Save the order in the database
  const newOrder = new Order({
    userId,
    order_id: orderId, // Add the order_id field here
    razorpay_order_id: null,
    orderDetails: updatedCartItems, // Store the updated cart items with prices
    totalPrice,
    paymentMethod,
    shippingDetails,
    status: 'Pending', // Order status
    createdAt: new Date(),
  });
  console.log(orderId);
  try {
    await newOrder.save();
    // req.session.cart = [];
    res.json({ success: true, message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ error: 'Failed to process checkout' });
  }
});

// Route to initiate Razorpay payment
router.post('/api/initiate-payment', async (req, res) => {
  const { totalAmount, orderId} = req.body; // Get the total amount and order ID from the request body
  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({ success: false, msg: 'Invalid payment amount or invalid order ID' });
  }

  try {
    // Convert amount to paisa (smallest currency unit for INR) for Razorpay
    const amountInPaisa = Math.round(totalAmount*100);

    // Create an order on Razorpay
    const options = {
      // order_id: order.order_id,
      // order_id: orderId,
      amount: amountInPaisa,
      currency: 'INR', // Set the currency
      receipt: `receipt_${Date.now()}`, // Generate a unique receipt ID
    };
    console.log('Razorpay options:', options);
    razorpayInstance.orders.create(options, async (err, razorpayOrder) => {
      if (err) {
        console.error('Error creating Razorpay order:', err);
        return res.status(500).json({ success: false, msg: 'Failed to create payment order' });
      }

      // Update the Razorpay order_id in the database
      await Order.findOneAndUpdate(
        { order_id: orderId }, // Match the internal order ID
        { razorpay_order_id: razorpayOrder.id } // Save Razorpay's order ID
      );

      res.status(200).json({
        success: true,
        order_id: razorpayOrder.id,
        orderId: orderId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: RAZORPAY_ID_KEY,
      });
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
});


// New route to update order status after payment
router.post('/api/update-order-status', async (req, res) => {
  console.log('update called');
  const { orderId } = req.body;
  console.log(orderId);
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }
  try {
    const order = await Order.findOne({ order_id: orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    console.log('order found');
    // Update the status to 'Completed'
    order.status = "Completed";
    await order.save();  // Save the updated order
    console.log('updated');
    res.json({ success: true, message: 'Order status updated to completed' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// clear the car
router.post('/api/clear-cart', (req, res) => {
  if (!req.session.cart) {
    return res.status(400).json({ error: "Cart is already empty" });
  }

  req.session.cart = [];
  console.log("Cart cleared successfully");
  res.json({ success: true, message: "Cart cleared successfully" });
});

// Order History Route
router.get('/api/order-history', async (req, res) => {
  const userId = req.session.user; // Ensure user is logged in
  const user_Id = userId?._id;

  if (!userId) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  try {
    // Find orders for the user and populate product details in orderDetails
    const orders = await Order.find({ userId: user_Id }).populate({
      path: 'orderDetails.productId',
      select: 'name', // Only fetch the 'name' field of the product
    });

    // Format orders to include item names
    const formattedOrders = orders.map(order => ({
      order_id: order.order_id,
      createdAt: order.createdAt,
      totalPrice: order.totalPrice,
      status: order.status,
      items: order.orderDetails.map(item => ({
        name: item.productId?.name || 'Product Name Not Found', // Handle missing product
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Error fetching order history' });
  }
});


// Get User Profile
router.get('/api/get-profile', async (req, res) => {
  const userId = req.session.user; // Ensure user is logged in
  if (!userId) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  try {
    const user = await User.findById(userId);
    res.json(user); // Send back user profile data
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Update User Profile
router.post('/api/update-profile', async (req, res) => {
  const { name, email, contact } = req.body;
  const userId = req.session.user; // Ensure user is logged in

  if (!userId) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  try {
    const user = await User.findById(userId);
    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.contact = contact || user.contact;
      await user.save();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Route to compare product details with scraped data
router.get('/api/compare/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    // Fetch the product from the database using the productId
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Load the scraped data from the file
    const scrapedData = loadScrapedData();

    // Get the product name from the database
    const productName = product.name.toLowerCase(); // Case insensitive comparison
    const productWords = productName.split(' '); // Split the product name into individual words

    // Filter the scraped data to find matching descriptions (must have all words from product name)
    const comparison = scrapedData.filter((item) => {
      // Convert the description to lowercase for case-insensitive comparison
      const description = item.description.toLowerCase();

      // Check if atleast one product name words are found in the description
      return productWords.some((word) => description.includes(word));
    });

    if (comparison.length === 0) {
      return res.status(404).json({ message: 'No comparison data found for this product' });
    }

    // Prepare comparison data
    const comparisonResult = comparison.map((comparisonProduct) => ({
      product: {
        name: product.name,
        price: product.price,
        link: product.link,
        description: product.description,
      },
      comparison: {
        description: comparisonProduct.description,
        price: comparisonProduct.price,
        link: comparisonProduct.link,
        source: comparisonProduct.source || 'Unknown', // Assuming 'source' is included in the scraped data
      },
    }));

    // Send the comparison data back
    res.json({ product: comparisonResult });

  } catch (error) {
    console.error('Error comparing product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Dummy function to simulate fetching a product by ID
async function getProductById(productId) {
  // Replace this with actual logic to fetch the product from your database or product list
  return {
    _id: productId,
    name: 'Sample Product',
    price: 100,
    description: 'A great product for testing.',
    // Add any other product fields as needed
  };
}

module.exports = router;
