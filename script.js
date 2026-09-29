const SUPABASE_URL =
  "https://knjdouprbwkxcuqyhpvh.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_iNdVPUDh7LRiQ27JX3smyA_C345zSB_";

const ADMIN_PASSWORD =
  "2412822010";

const WHATSAPP =
  "213696380625";


const INITIAL_PRODUCTS = [

  {
    name: "Hoodie Shadow 1",
    price: 2600,
    image: "https://i.postimg.cc/13wPb6zH/4ADBA7A9-68C2-4452-ACA3-4FD44F2F085C.jpg",
    sizes: "S,M,L,XL",
    description: "Hoodie Shadow"
  },

  {
    name: "Hoodie Shadow 2",
    price: 2600,
    image: "https://i.postimg.cc/YCYkTgSX/6056F7AE-2271-4941-9F4B-1B779F29B795.jpg",
    sizes: "S,M,L,XL",
    description: "Hoodie Shadow"
  },

  {
    name: "Hoodie Shadow 3",
    price: 2600,
    image: "https://i.postimg.cc/htTgNxG1/6254ECBD-FB1B-4B36-A209-F7149C1A9AA7.jpg",
    sizes: "S,M,L,XL",
    description: "Hoodie Shadow"
  },

  {
    name: "Hoodie Shadow 4",
    price: 2600,
    image: "https://i.postimg.cc/t4Wy8Pgz/A13B2B7D-7ECA-4E82-A3FD-5B6D3DAD5712.jpg",
    sizes: "S,M,L,XL",
    description: "Hoodie Shadow"
  },

  {
    name: "Hoodie Shadow 5",
    price: 2600,
    image: "https://i.postimg.cc/YCYkTgSd/BD14C110-EB7C-4E2B-8D57-97A5EE756A9D.jpg",
    sizes: "S,M,L,XL",
    description: "Hoodie Shadow"
  },

  {
    name: "Hoodie Shadow 6",
    price: 2600,
    image: "https://i.postimg.cc/13wPb6z0/E5BA47BB-383E-405B-BFAA-75755F697FA3.jpg",
    sizes: "S,M,L,XL",
    description: "Hoodie Shadow"
  }

];


let products = [];
let delivery = [];
let cart = [];


async function api(path, options = {}) {

  const response = await fetch(
    SUPABASE_URL + "/rest/v1/" + path,
    {
      ...options,

      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  if (!response.ok) {

    throw new Error(
      await response.text()
    );

  }

  const text = await response.text();

  return text ? JSON.parse(text) : [];

}


async function loadAll() {

  try {

    products = await api(
      "products?select=*&order=id.asc"
    );


    if (!products.length) {

      for (const product of INITIAL_PRODUCTS) {

        await api(
          "products",
          {
            method: "POST",

            headers: {
              Prefer: "return=minimal"
            },

            body: JSON.stringify(product)
          }
        );

      }

      products = await api(
        "products?select=*&order=id.asc"
      );

    }


    delivery = await api(
      "delivery?select=*&order=id.asc"
    );


    renderProducts();

    renderWilayas();

    updateCart();

  }

  catch (error) {

    console.error(error);

    document.getElementById(
      "productGrid"
    ).innerHTML =

      `<div class="loading">
        تعذر الاتصال بقاعدة البيانات.
        تأكد من Publishable Key في script.js.
      </div>`;

  }

}


function renderProducts() {

  const grid =
    document.getElementById(
      "productGrid"
    );


  if (!products.length) {

    grid.innerHTML =
      `<div class="loading">
        لا توجد منتجات حاليًا
      </div>`;

    return;
  }


  grid.innerHTML =
    products.map(
      (product, index) => `

      <article class="product-card">

        <img
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}"
        >

        <div class="product-info">

          <h3>
            ${escapeHTML(product.name)}
          </h3>

          <div class="price">
            ${Number(product.price).toLocaleString("fr-DZ")} DA
          </div>

          <div class="sizes">
            Tailles:
            ${escapeHTML(product.sizes || "S,M,L,XL")}
          </div>

          <button
            class="add-btn"
            onclick="addToCart(${index})"
          >
            AJOUTER AU PANIER
          </button>

        </div>

      </article>

    `
    ).join("");

}


function renderWilayas() {

  const select =
    document.getElementById("wilaya");


  select.innerHTML =
    `<option value="">
      Sélectionnez votre wilaya
    </option>` +

    delivery.map(
      item => `

      <option value="${item.id}">
        ${escapeHTML(item.name)}
      </option>

    `
    ).join("");

}


function addToCart(index) {

  cart.push(
    products[index]
  );

  updateCart();

  scrollToOrder();

}


function removeCart(index) {

  cart.splice(index, 1);

  updateCart();

}


function updateCart() {

  document.getElementById(
    "cartCount"
  ).textContent = cart.length;


  const cartBox =
    document.getElementById(
      "cartList"
    );


  const subtotal =
    cart.reduce(
      (total, product) =>
        total + Number(product.price),
      0
    );


  if (cart.length) {

    cartBox.innerHTML =
      cart.map(
        (product, index) => `

        <div class="cart-item">

          <span>
            ${escapeHTML(product.name)}
          </span>

          <b>

            ${Number(product.price)
              .toLocaleString("fr-DZ")} DA

            <button
              onclick="removeCart(${index})"
            >
              ×
            </button>

          </b>

        </div>

      `
      ).join("");

  }

  else {

    cartBox.innerHTML =
      "<p>Votre panier est vide.</p>";

  }


  document.getElementById(
    "subtotal"
  ).textContent =
    subtotal.toLocaleString("fr-DZ")
    + " DA";


  updateDelivery();

}


function updateDelivery() {

  const selected =
    delivery.find(
      item =>
        String(item.id) ===
        String(
          document.getElementById(
            "wilaya"
          ).value
        )
    );


  const type =
    document.getElementById(
      "deliveryType"
    ).value;


  let fee = 0;


  if (selected) {

    if (type === "desk") {

      fee =
        Number(
          selected.stop_price || 0
        );

    }

    else if (type === "home") {

      fee =
        Number(
          selected.price || 0
        );

    }

  }


  const subtotal =
    cart.reduce(
      (total, product) =>
        total + Number(product.price),
      0
    );


  document.getElementById(
    "deliveryFee"
  ).textContent =
    fee.toLocaleString("fr-DZ")
    + " DA";


  document.getElementById(
    "total"
  ).textContent =
    (subtotal + fee)
      .toLocaleString("fr-DZ")
    + " DA";

}


async function sendOrder(event) {

  event.preventDefault();


  if (!cart.length) {

    alert(
      "أضف منتجًا إلى السلة أولاً"
    );

    return;
  }


  const name =
    document.getElementById(
      "customerName"
    ).value.trim();


  const phone =
    document.getElementById(
      "customerPhone"
    ).value.trim();


  const selected =
    delivery.find(
      item =>
        String(item.id) ===
        String(
          document.getElementById(
            "wilaya"
          ).value
        )
    );


  const type =
    document.getElementById(
      "deliveryType"
    ).value;


  const address =
    document.getElementById(
      "address"
    ).value.trim();


  const fee =
    selected
      ? (
        type === "desk"
          ? Number(selected.stop_price || 0)
          : Number(selected.price || 0)
        )
      : 0;


  const subtotal =
    cart.reduce(
      (total, product) =>
        total + Number(product.price),
      0
    );


  const total =
    subtotal + fee;


  const items =
    cart.map(
      product => ({
        id: product.id,
        name: product.name,
        price: product.price
      })
    );


  try {

    await api(
      "orders",
      {
        method: "POST",

        headers: {
          Prefer: "return=minimal"
        },

        body: JSON.stringify({

          customer_name: name,

          phone: phone,

          wilaya:
            selected?.name || "",

          address: address,

          total: total,

          status: "جديد",

          items: items

        })

      }
    );


    const whatsappMessage =

      `Bonjour SHADOW%0A%0A` +

      `Nom: ${encodeURIComponent(name)}%0A` +

      `Tel: ${encodeURIComponent(phone)}%0A` +

      `Wilaya: ${encodeURIComponent(
        selected?.name || ""
      )}%0A` +

      `Livraison: ${
        type === "desk"
          ? "Stop desk"
          : "Domicile"
      }%0A` +

      `Adresse: ${encodeURIComponent(address)}%0A` +

      `Produits: ${encodeURIComponent(
        items
          .map(item => item.name)
          .join(", ")
      )}%0A` +

      `Total: ${total} DA`;


    window.open(
      "https://wa.me/" +
      WHATSAPP +
      "?text=" +
      whatsappMessage,
      "_blank"
    );


    alert(
      "تم تسجيل طلبك بنجاح"
    );


    cart = [];

    updateCart();

    event.target.reset();

    updateDelivery();

  }

  catch (error) {

    console.error(error);

    alert(
      "حدث خطأ أثناء إرسال الطلب"
    );

  }

}


function openAdminLogin() {

  document
    .getElementById("loginModal")
    .classList.add("show");

  document
    .getElementById("adminPassword")
    .focus();

}


function closeAdminLogin() {

  document
    .getElementById("loginModal")
    .classList.remove("show");

}


function loginAdmin() {

  const password =
    document.getElementById(
      "adminPassword"
    ).value;


  if (
    password ===
    ADMIN_PASSWORD
  ) {

    sessionStorage.setItem(
      "shadow_admin",
      "1"
    );

    location.href =
      "admin.html";

  }

  else {

    document.getElementById(
      "loginError"
    ).textContent =
      "كلمة المرور غير صحيحة";

  }

}


function scrollToOrder() {

  document
    .getElementById("order")
    .scrollIntoView({
      behavior: "smooth"
    });

}


function escapeHTML(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    character => ({

      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"

    })[character]
  );

}


document.addEventListener(
  "DOMContentLoaded",
  loadAll
);
