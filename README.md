# E-Commerce Website

## Overview
This is a fully functional **E-Commerce Website** built using **HTML, Tailwind CSS, JavaScript (Frontend)** and **Node.js, Express.js, MongoDB (Backend)**. It includes features like **user authentication, product listings, cart functionality, checkout, and an AI-driven price comparison extension**.

## Features
- ✅ **User Authentication** – Registration & Login system with session-based authentication.  
- ✅ **Product Listing & Search** – Search and filter products efficiently.  
- ✅ **Shopping Cart & Checkout** – Add/remove items and complete the purchase.  
- ✅ **Payment Integration** – Secure payments handled using RazorPay.  
- ✅ **Admin Dashboard** – Manage products, orders, and users.  
- ✅ **AI-Driven Price Comparison** – Chrome extension for comparing prices using Puppeteer web scraping.  

## Tech Stack

### Frontend:
- HTML  
- Tailwind CSS  
- JavaScript  

### Backend:
- Node.js  
- Express.js  
- MongoDB  

### Other Tools & Libraries:
- Puppeteer (for price comparison)  
- RazorPay (for payments)  
- Express-session (for authentication handling)  

## Installation & Setup

### 1. Clone the Repository:
```bash
git clone https://github.com/your-username/E-Commerce-Website.git
cd E-Commerce-Website
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
```bash
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key
RAZORPAY_KEY=your_razorpay_api_key
RAZORPAY_SECRET=your_razorpay_api_secret
```

### 4. Start the server
```bash
node backend/server.js
```
The application will run at http://localhost:3000
