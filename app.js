import {
  ref,
  set,
  get,
  update,
  remove,
  child,
} from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";

import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js";

const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(getAuth(window.firebaseApp));
    // Redirect or update UI after successful logout
    alert("Logged out successfully.");
    // Example: redirect to login page
    window.location.href = "/login.html";
  } catch (error) {
    console.error("Error signing out:", error);
    alert("Failed to logout. Please try again.");
  }
});

class Product {
  constructor(id, title, price, description, image) {
    this.id = id;
    this.title = title;
    this.price = price;
    this.description = description;
    this.image = image;
  }
}

async function fetchProductsFromAPI() {
  const response = await fetch("https://fakestoreapi.com/products?limit=20");
  const data = await response.json();
  return data.map(
    (item) =>
      new Product(item.id, item.title, item.price, item.description, item.image)
  );
}

async function fetchProductsFromFirebase() {
  const dbRef = ref(window.firebaseDb, "products");
  const snapshot = await get(dbRef);
  const products = [];

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const item = childSnapshot.val();
      products.push(
        new Product(
          item.id,
          item.title,
          item.price,
          item.description,
          item.image
        )
      );
    });
  }
  return products;
}

async function fetchAndRenderProducts() {
  const apiProducts = await fetchProductsFromAPI();
  const firebaseProducts = await fetchProductsFromFirebase();
  const allProducts = [...apiProducts, ...firebaseProducts];
  renderProducts(allProducts);
}

function renderProducts(products) {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = products
    .map(
      (product) => `
        <div class="product-card" id="product-${product.id}">
            <img src="${product.image}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p>$${product.price}</p>
            <p>${product.description}</p>
            <button onclick="deleteProduct('${product.id}')">Delete</button>
            <button onclick="updateProduct('${product.id}')">Update</button>
        </div>
    `
    )
    .join("");
}

document
  .getElementById("new-product-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("product-title").value;
    const price = document.getElementById("product-price").value;
    const description = document.getElementById("product-description").value;
    const image = document.getElementById("product-image").value;

    const newProductRef = ref(window.firebaseDb, "products/" + Date.now());
    const newProduct = new Product(
      Date.now(),
      title,
      price,
      description,
      image
    );
    await set(newProductRef, newProduct);
    fetchAndRenderProducts();
  });

window.deleteProduct = async function (id) {
  const productRef = ref(window.firebaseDb, "products/" + id);
  await remove(productRef);
  fetchAndRenderProducts();
};

window.updateProduct = async function (id) {
  const title = prompt("Enter new title");
  const price = prompt("Enter new price");
  const description = prompt("Enter new description");
  const image = prompt("Enter new image URL");

  if (title && price && description && image) {
    const productRef = ref(window.firebaseDb, "products/" + id);
    await update(productRef, { title, price, description, image });
    fetchAndRenderProducts();
  }
};

fetchAndRenderProducts();
