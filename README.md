# E-Commerce Website

## Overview
This is a fully functional **E-Commerce Website** built using **HTML, Tailwind CSS, JavaScript (Frontend)** and **Node.js, Express.js, MongoDB (Backend)**. It includes features like **user authentication, product listings, cart functionality, checkout, and an AI-driven price comparison extension**.

## Key Functionalities
### 🛍️ User Functionalities
- **User Authentication** – Register, login, and session-based authentication.  
- **Product Browsing & Search** – View product listings with advanced filtering.  
- **Shopping Cart & Checkout** – Add/remove items and proceed to secure checkout.  
- **Payment Integration** – RazorPay for seamless transactions.  

### 🛠️ Admin Functionalities
- **Product Management** – Add, update, and remove products.  
- **Order Management** – View and manage user orders.  

### 🤖 AI-Driven Price Comparison
- **Web Scraping** – Uses Puppeteer to fetch and compare product prices from different websites.  
- **Automated Data Storage** – Scraped data is stored in `scrapedData.json`.  


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


## Usage

### User Features:
- Register and log in as a user.
- Browse products and use the search/filter feature.
- Add items to the cart and proceed to checkout.
  
### Admin Features:
- Manage products and orders via the dashboard.

### AI-Driven Price Comparison:
- The Chrome extension fetches and compares prices from different sources.


## Folder Structure
```bash
E-Commerce-Website/
│── backend/            # Backend-related files  
│   ├── middleware/     # Middleware functions  
│   ├── models/         # Database models (MongoDB schemas)  
│   ├── routes/         # Express routes  
│   ├── services/       # Web scraping scripts and scraped data storage  
│   │   ├── scraper.js  # Puppeteer-based web scraper  
│   │   ├── scrapedData.json  # JSON file storing scraped data  
│   ├── server.js       # Main server file  
│  
│── frontend/           # Frontend HTML, CSS, JS files  
│── images/             # Image assets  
│── node_modules/       # Node.js dependencies  
│── uploads/            # Uploaded files  
│── .gitignore          # Git ignore file  
│── README.md           # Documentation  
│── package.json        # Project dependencies  
│── package-lock.json   # Dependency lock file  
```

## Contributing
### Steps to Contribute

- Fork the repository
- Create a new branch
```bash
git checkout -b feature-branch
```

- Make your changes and commit them
```bash
git commit -m "Added new feature"
```

- Push to the branch
```bash
git push origin feature-branch
```
