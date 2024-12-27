const loadProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/products");
      const products = await response.json();
  
      const productList = document.getElementById("product-list");
      productList.innerHTML = products.map(product => `
        <div class="border p-4 bg-white rounded">
          <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded">
          <h2 class="text-lg font-bold mt-2">${product.name}</h2>
          <p class="text-gray-700">$${product.price.toFixed(2)}</p>
          <button class="bg-blue-500 text-white px-4 py-2 mt-2 rounded">View</button>
        </div>
      `).join("");
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  
  document.addEventListener("DOMContentLoaded", loadProducts);
  