const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Function to launch the browser
async function launchBrowser(userDataDir) {
  return await puppeteer.launch({
    headless: true, // Set to false if you want to see the browser window
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Ensure compatibility across systems
    userDataDir: userDataDir,
  });
}

// Function to navigate to a page
async function navigateToPage(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

// Function to scrape product links
async function scrapeProductLinks(page, source) {
  await page.waitForSelector('.s-main-slot'); // Wait for the product list to load

  const links = await page.evaluate((source) => {
    const uniqueLinks = new Set();

    // Select all product items (both sponsored and non-sponsored)
    const productElements = document.querySelectorAll('.s-main-slot .s-result-item');

    productElements.forEach((item) => {
      // Check all anchor tags within the product container
      const anchors = item.querySelectorAll('a[href]');
      anchors.forEach((anchor) => {
        const href = anchor.getAttribute('href');

        // Include both sponsored and non-sponsored products
        if (href.includes('/dp/') || href.includes('/gp/slredirect/')) {
          uniqueLinks.add('https://www.amazon.com' + href.split('?')[0]); // Normalize the URL
        }
      });
    });

    // Return links along with the source
    return Array.from(uniqueLinks).map(link => ({
      link,
      source: source, // Adding source to the result
    }));
  }, source);

  return links;
}

// Function to scrape product details from a single product page
async function scrapeProductDetails(page, link, source) {
  await navigateToPage(page, link);
  return await page.evaluate((source) => {
    // Scraping the product description
    const description = document.querySelector('#productTitle')
      ? document.querySelector('#productTitle').innerText.trim()
      : 'Description not found';

    // Scraping the price
    const price = document.querySelector('.a-price > span.a-offscreen')
      ? document.querySelector('.a-price > span.a-offscreen').innerText.trim()
      : 'Price not found';

    // Return product details along with source
    return { description, price, source };
  }, source);
}

// Function to save data to a JSON file
function saveDataToFile(fileName, data) {
  // const filePath = path.join(__dirname, fileName);
  fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${fileName}`);
}

// Function to load scraped data from the JSON file
function loadScrapedData() {
  try {
    const filePath = path.join(__dirname, 'scrapedData.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading scraped data:', error);
    return [];
  }
}

// Main function to orchestrate the scraping
async function scrapeData() {
  try {
    // Specify the custom directory for user data
    const userDataDir = path.join(__dirname, 'puppeteer_profile');

    // Launch the browser and open a new page
    const browser = await launchBrowser(userDataDir);
    const page = await browser.newPage();

    // URL of the category page on Amazon
    const url =
      'https://www.amazon.com/s?i=specialty-aps&bbn=16225009011&rh=n%3A%252116225009011%2Cn%3A281407&ref=nav_em__nav_desktop_sa_intl_accessories_and_supplies_0_2_5_2';
    
    // Navigate to the category page
    await navigateToPage(page, url);

    // Scrape product links, passing "Amazon" as the source
    const productLinks = await scrapeProductLinks(page, 'Amazon');
    console.log('Found product links:', productLinks);

    // Scrape details for each product and include the source
    const productDetails = [];
    for (const { link, source } of productLinks) {
      const productData = await scrapeProductDetails(page, link, source);
      productDetails.push({ link, ...productData });
    }

    console.log('Scraped product details:', productDetails);

    // Save the scraped data to a JSON file
    saveDataToFile('scrapedData.json', productDetails);

    // Close the browser
    await browser.close();
  } catch (error) {
    console.error('Error occurred while running Puppeteer:', error);
  }
}

// Call the main function
scrapeData();

module.exports = {
  loadScrapedData,
};
