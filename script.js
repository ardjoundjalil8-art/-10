// ================================
// SHADOW STORE - SUPABASE
// ================================

const SUPABASE_URL = "https://knjdouprbwkxcuqyhpvh.supabase.co";

// ⚠️ ضع Publishable Key تاعك هنا فقط
const SUPABASE_KEY = "sb_publishable_iNdVPUDh7LRiQ27JX3smyA_C345zSB_";

const ADMIN_PASSWORD = "2412822010";

// WhatsApp
const WHATSAPP = "213696380625";

let products = [];
let delivery = [];
let orders = [];
let settings = {
  default_price: 2600,
  whatsapp: WHATSAPP
};

let cart = [];


// ================================
// SUPABASE REQUEST
// ================================

async function supabaseRequest(endpoint, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${endpoint}`,
    {
      ...options,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": options.method === "POST"
          ? "return=representation"
          : "return=minimal",
        ...(options.headers || {})
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Supabase error");
  }

  const text = await response.text();

  return text ? JSON.parse(text) : null;
}


// ================================
// LOAD ALL DATA
// ================================

async function loadProducts() {
  products = await supabaseRequest(
    "products?select=*&order=id.asc"
  );

  renderProducts();
  renderAdminProducts();
}


async function loadDelivery() {
  delivery = await supabaseRequest(
    "delivery?select=*&order=id.asc"
  );

  renderWilayas();
  renderAdminDelivery();
}


async function loadOrders() {
  orders = await supabaseRequest(
    "orders?select=*&order=id.desc"
  );

  renderAdminOrders();
  updateStats();
}


async function loadSettings() {

  const data = await supabaseRequest(
    "settings?select=*&order=id.asc"
  );

  data.forEach(item => {

    if (item.key === "default_price") {
      settings.default_price = Number(item.value) || 2600;
    }

    if (item.key === "whatsapp") {
      settings.whatsapp = item.value || WHATSAPP;
    }

  });

  const priceInput = document.getElementById("defaultPrice");
  const waInput = document.getElementById("waNumber");

  if (priceInput) {
    priceInput.value = settings.default_price;
  }

  if (waInput) {
    waInput.value = settings.whatsapp;
  }
}


// ================================
// PRODUCTS
// ================================

function parseSizes(value) {

  if (!value) return [];

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {}

  return String(value)
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
}


function renderProducts() {

  const grid = document.getElementById("productGrid");

  if (!grid) return;

  if (!products.length) {

    grid.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:50px;
        color:#777;
      ">
        لا توجد منتجات حاليًا
      </div>
    `;

    return;
  }

  grid.innerHTML = products.map(product => {

    const sizes = parseSizes(product.sizes);

    const sizeOptions = sizes.length
      ? sizes.map(size =>
          `<option value="${escapeHTML(size)}">${escapeHTML(size)}</option>`
        ).join("")
      : `<option value="">اختار المقاس</option>`;

    return `
      <article class="product-card">

        <img
          class="product-image"
          src="${escapeAttribute(product.image || "")}"
          alt="${escapeAttribute(product.name)}"
          onerror="this.style.opacity='.2'"
        >

        <div class="product-info">

          <h3>${escapeHTML(product.name)}</h3>

          <p class="description">
            ${escapeHTML(product.description || "")}
          </p>

          <div class="price">
            ${Number(product.price).toLocaleString()} DA
          </div>

          <div class="sizes">
            ${sizes.length
              ? "المقاسات: " + sizes.map(escapeHTML).join(" / ")
              : "المقاسات غير محددة"}
          </div>

          <div class="product-actions">

            <select id="size-${product.id}">
              ${sizeOptions}
            </select>

            <button
              class="btn"
              onclick="addToCart(${product.id})"
            >
              أضف
            </button>

          </div>

        </div>

      </article>
    `;

  }).join("");
}


// ================================
// CART
// ================================

function addToCart(productId) {

  const product = products.find(
    p => Number(p.id) === Number(productId)
  );

  if (!product) return;

  const select = document.getElementById(`size-${productId}`);

  const size = select ? select.value : "";

  if (parseSizes(product.sizes).length && !size) {
    alert("اختار المقاس أولًا");
    return;
  }

  cart.push({
    product_id: product.id,
    name: product.name,
    price: Number(product.price),
    size: size
  });

  renderCart();

  document.getElementById("order")?.scrollIntoView({
    behavior: "smooth"
  });
}


function removeFromCart(index) {

  cart.splice(index, 1);

  renderCart();
}


function renderCart() {

  const box = document.getElementById("cartList");

  if (!box) return;

  if (!cart.length) {

    box.innerHTML = `
      <div style="color:#777;text-align:center;padding:20px">
        السلة فارغة
      </div>
    `;

  } else {

    box.innerHTML = cart.map((item, index) => `
      <div class="cart-item">

        <div>
          <strong>${escapeHTML(item.name)}</strong>
          <div style="color:#888;font-size:13px">
            ${item.size ? "المقاس: " + escapeHTML(item.size) : ""}
          </div>
        </div>

        <div>
          ${item.price.toLocaleString()} DA
          <button onclick="removeFromCart(${index})">×</button>
        </div>

      </div>
    `).join("");
  }

  updateTotals();
}


function getSubtotal() {

  return cart.reduce(
    (sum, item) => sum + Number(item.price),
    0
  );
}


function getDeliveryPrice() {

  const select = document.getElementById("wilaya");

  if (!select || !select.value) return 0;

  const selected = delivery.find(
    d => d.name === select.value
  );

  return selected ? Number(selected.price) : 0;
}


function updateTotals() {

  const subtotal = getSubtotal();
  const deliveryPrice = getDeliveryPrice();
  const total = subtotal + deliveryPrice;

  const subtotalEl = document.getElementById("subtotal");
  const deliveryEl = document.getElementById("deliveryFee");
  const totalEl = document.getElementById("total");

  if (subtotalEl) {
    subtotalEl.textContent = subtotal.toLocaleString();
  }

  if (deliveryEl) {
    deliveryEl.textContent = deliveryPrice.toLocaleString();
  }

  if (totalEl) {
    totalEl.textContent = total.toLocaleString();
  }
}


// ================================
// WILAYAS
// ================================

function renderWilayas() {

  const select = document.getElementById("wilaya");

  if (!select) return;

  select.innerHTML = `
    <option value="">اختار الولاية</option>
  `;

  delivery.forEach(item => {

    select.innerHTML += `
      <option value="${escapeAttribute(item.name)}">
        ${escapeHTML(item.name)} — ${Number(item.price).toLocaleString()} DA
      </option>
    `;

  });

  select.onchange = updateTotals;
}


// ================================
// SEND ORDER
// ================================

async function sendOrder() {

  if (!cart.length) {
    alert("السلة فارغة");
    return;
  }

  const name =
    document.getElementById("customerName")?.value.trim();

  const phone =
    document.getElementById("customerPhone")?.value.trim();

  const wilaya =
    document.getElementById("wilaya")?.value;

  if (!name || !phone || !wilaya) {
    alert("أكمل معلومات الطلب");
    return;
  }

  const subtotal = getSubtotal();
  const deliveryPrice = getDeliveryPrice();
  const total = subtotal + deliveryPrice;

  const orderItems = cart.map(item => ({
    product_id: item.product_id,
    name: item.name,
    price: item.price,
    size: item.size
  }));

  try {

    const result = await supabaseRequest(
      "orders",
      {
        method: "POST",
        body: JSON.stringify({
          customer_name: name,
          phone: phone,
          wilaya: wilaya,
          address: "",
          total: total,
          status: "جديد",
          items: orderItems
        }),
        headers: {
          "Prefer": "return=representation"
        }
      }
    );

    const orderId =
      result && result[0]
        ? result[0].id
        : "";

    let message =
`🖤 *SHADOW - NOUVELLE COMMANDE*

📦 Commande: #${orderId}

👤 الاسم: ${name}
📱 الهاتف: ${phone}
📍 الولاية: ${wilaya}

🛍️ المنتجات:
`;

    cart.forEach((item, index) => {

      message +=
`${index + 1}. ${item.name}
المقاس: ${item.size || "-"}
السعر: ${Number(item.price).toLocaleString()} DA

`;

    });

    message +=
`🚚 التوصيل: ${deliveryPrice.toLocaleString()} DA
💰 المجموع: ${total.toLocaleString()} DA`;

    const url =
      `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");

    cart = [];

    renderCart();

    document.getElementById("customerName").value = "";
    document.getElementById("customerPhone").value = "";
    document.getElementById("wilaya").value = "";

    await loadOrders();

    alert("تم تسجيل الطلب بنجاح");

  } catch (error) {

    console.error(error);

    alert(
      "حدث خطأ أثناء تسجيل الطلب.\n\n" +
      "تأكد من اتصال Supabase."
    );
  }
}


// ================================
// ADMIN LOGIN
// ================================

function openAdmin() {

  const modal = document.getElementById("adminModal");

  if (modal) {
    modal.classList.remove("hidden");
  }

}


function closeAdmin() {

  const modal = document.getElementById("adminModal");

  if (modal) {
    modal.classList.add("hidden");
  }

}


async function loginAdmin() {

  const password =
    document.getElementById("adminPassword")?.value;

  if (password !== ADMIN_PASSWORD) {

    alert("كلمة السر خاطئة");

    return;
  }

  document.getElementById("loginBox")
    ?.classList.add("hidden");

  document.getElementById("adminPanel")
    ?.classList.remove("hidden");

  await loadProducts();
  await loadDelivery();
  await loadOrders();
  await loadSettings();

  updateStats();
}


// ================================
// ADMIN TABS
// ================================

function showAdminTab(tabId) {

  document
    .querySelectorAll(".admin-tab")
    .forEach(tab => tab.classList.add("hidden"));

  document
    .getElementById(tabId)
    ?.classList.remove("hidden");
}


// ================================
// ADMIN PRODUCTS
// ================================

function renderAdminProducts() {

  const box = document.getElementById("adminProducts");

  if (!box) return;

  box.innerHTML = products.map(product => {

    return `
      <div class="admin-item">

        <img
          src="${escapeAttribute(product.image || "")}"
          alt=""
        >

        <div class="admin-item-info">

          <strong>
            ${escapeHTML(product.name)}
          </strong>

          <small>
            ${Number(product.price).toLocaleString()} DA
          </small>

        </div>

        <div class="admin-actions">

          <button onclick="editProduct(${product.id})">
            تعديل
          </button>

          <button onclick="deleteProduct(${product.id})">
            حذف
          </button>

        </div>

      </div>
    `;

  }).join("");
}


async function addProduct() {

  const name =
    document.getElementById("newName")?.value.trim();

  const price =
    Number(document.getElementById("newPrice")?.value);

  const image =
    document.getElementById("newImage")?.value.trim();

  const sizes =
    document.getElementById("newSizes")?.value.trim();

  const description =
    document.getElementById("newDescription")?.value.trim();

  if (!name || !price) {
    alert("اكتب اسم المنتج والسعر");
    return;
  }

  try {

    await supabaseRequest(
      "products",
      {
        method: "POST",
        body: JSON.stringify({
          name,
          price,
          image,
          sizes,
          description
        }),
        headers: {
          "Prefer": "return=representation"
        }
      }
    );

    document.getElementById("newName").value = "";
    document.getElementById("newPrice").value = "";
    document.getElementById("newImage").value = "";
    document.getElementById("newSizes").value = "";
    document.getElementById("newDescription").value = "";

    await loadProducts();

    alert("تمت إضافة المنتج");

  } catch (error) {

    console.error(error);
    alert("حدث خطأ أثناء إضافة المنتج");
  }
}


async function editProduct(id) {

  const product =
    products.find(p => Number(p.id) === Number(id));

  if (!product) return;

  const name =
    prompt("اسم المنتج:", product.name);

  if (name === null) return;

  const price =
    prompt("السعر:", product.price);

  if (price === null) return;

  const image =
    prompt("رابط الصورة:", product.image || "");

  if (image === null) return;

  const sizes =
    prompt(
      "المقاسات مثال S,M,L,XL:",
      parseSizes(product.sizes).join(",")
    );

  if (sizes === null) return;

  const description =
    prompt(
      "الوصف:",
      product.description || ""
    );

  if (description === null) return;

  try {

    await supabaseRequest(
      `products?id=eq.${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name,
          price: Number(price),
          image,
          sizes,
          description
        })
      }
    );

    await loadProducts();

    alert("تم تعديل المنتج");

  } catch (error) {

    console.error(error);
    alert("حدث خطأ أثناء تعديل المنتج");
  }
}


async function deleteProduct(id) {

  if (!confirm("هل تريد حذف هذا المنتج؟")) {
    return;
  }

  try {

    await supabaseRequest(
      `products?id=eq.${id}`,
      {
        method: "DELETE"
      }
    );

    await loadProducts();

  } catch (error) {

    console.error(error);
    alert("حدث خطأ أثناء حذف المنتج");
  }
}


async function deleteAllProducts() {

  if (!confirm("تحذير: سيتم حذف جميع المنتجات. هل أنت متأكد؟")) {
    return;
  }

  try {

    await supabaseRequest(
      "products?id=not.is.null",
      {
        method: "DELETE"
      }
    );

    await loadProducts();

    alert("تم حذف جميع المنتجات");

  } catch (error) {

    console.error(error);
    alert("حدث خطأ أثناء الحذف");
  }
}


// ================================
// DELIVERY ADMIN
// ================================

function renderAdminDelivery() {

  const box =
    document.getElementById("adminDelivery");

  if (!box) return;

  box.innerHTML = delivery.map(item => {

    return `
      <div class="admin-item">

        <div></div>

        <div class="admin-item-info">

          <strong>
            ${escapeHTML(item.name)}
          </strong>

          <small>
            ${Number(item.price).toLocaleString()} DA
          </small>

        </div>

        <div class="admin-actions">

          <button onclick="editDelivery(${item.id})">
            تعديل
          </button>

          <button onclick="deleteDelivery(${item.id})">
            حذف
          </button>

        </div>

      </div>
    `;

  }).join("");
}


async function addDelivery() {

  const name =
    document.getElementById("deliveryName")?.value.trim();

  const price =
    Number(document.getElementById("deliveryPrice")?.value);

  if (!name || Number.isNaN(price)) {
    alert("اكتب الولاية والسعر");
    return;
  }

  try {

    await supabaseRequest(
      "delivery",
      {
        method: "POST",
        body: JSON.stringify({
          name,
          price
        }),
        headers: {
          "Prefer": "return=representation"
        }
      }
    );

    document.getElementById("deliveryName").value = "";
    document.getElementById("deliveryPrice").value = "";

    await loadDelivery();

  } catch (error) {

    console.error(error);
    alert("حدث خطأ أثناء إضافة الولاية");
  }
}


async function editDelivery(id) {

  const item =
    delivery.find(d => Number(d.id) === Number(id));

  if (!item) return;

  const name =
    prompt("الولاية:", item.name);

  if (name === null) return;

  const price =
    prompt("سعر التوصيل:", item.price);

  if (price === null) return;

  try {

    await supabaseRequest(
      `delivery?id=eq.${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name,
          price: Number(price)
        })
      }
    );

    await loadDelivery();

  } catch (error) {

    console.error(error);
    alert("حدث خطأ أثناء التعديل");
  }
}


async function deleteDelivery(id) {

  if (!confirm("حذف هذه الولاية؟")) return;

  try {

    await supabaseRequest(
      `delivery?id=eq.${id}`,
      {
        method: "DELETE"
      }
    );

    await loadDelivery();

  } catch (error) {

    console.error(error);
    alert("حدث خطأ أثناء الحذف");
  }
}


// ================================
// ADMIN ORDERS
// ================================

function renderAdminOrders() {

  const box =
    document.getElementById("adminOrders");

  if (!box) return;

  if (!orders.length) {

    box.innerHTML = `
      <div style="padding:25px;color:#777;text-align:center">
        لا توجد طلبات
      </div>
    `;

    return;
  }

  box.innerHTML = orders.map(order => {

    const items =
      Array.isArray(order.items)
        ? order.items
        : [];

    return `
      <div
        class="admin-item"
        style="grid-template-columns:1fr"
      >

        <div class="admin-item-info">

          <strong>
            #${order.id} — ${escapeHTML(order.customer_name || "")}
          </strong>

          <small>
            📱 ${escapeHTML(order.phone || "")}
            <br>
            📍 ${escapeHTML(order.wilaya || "")}
            <br>
            💰 ${Number(order.total || 0).toLocaleString()} DA
            <br>
            📌 الحالة:
            ${escapeHTML(order.status || "جديد")}
          </small>

          <div style="margin-top:12px">

            ${items.map(item => `
              <div style="color:#aaa;font-size:13px">
                • ${escapeHTML(item.name)}
                ${item.size
                  ? " — " + escapeHTML(item.size)
                  : ""}
              </div>
            `).join("")}

          </div>

        </div>

        <div class="admin-actions">

          <button onclick="changeOrderStatus(${order.id})">
            الحالة
          </button>

          <button onclick="deleteOrder(${order.id})">
            حذف
          </button>

        </div>

      </div>
    `;

  }).join("");
}


async function changeOrderStatus(id) {

  const order =
    orders.find(o => Number(o.id) === Number(id));

  if (!order) return;

  const status =
    prompt(
      "اكتب الحالة: جديد / مؤكد / قيد التوصيل / تم التسليم / ملغى",
      order.status || "جديد"
    );

  if (status === null) return;

  try {

    await supabaseRequest(
      `orders?id=eq.${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status
        })
      }
    );

    await loadOrders();

  } catch (error) {

    console.error(error);
    alert("حدث خطأ أثناء تغيير الحالة");
  }
}


async function deleteOrder(id) {

  if (!confirm("هل تريد حذف هذا الطلب؟")) {
    return;
  }

  try {

    await supabaseRequest(
      `orders?id=eq.${id}`,
      {
        method: "DELETE"
      }
    );

    await loadOrders();

  } catch (error) {

    console.error(error);
    alert("حدث خطأ أثناء حذف الطلب");
  }
}


// ================================
// STATS
// ================================

function updateStats() {

  const ordersCount =
    orders.length;

  const sales =
    orders
      .filter(o => o.status !== "ملغى")
      .reduce(
        (sum, o) => sum + Number(o.total || 0),
        0
      );

  const statOrders =
    document.getElementById("statOrders");

  const statSales =
    document.getElementById("statSales");

  const statProfit =
    document.getElementById("statProfit");

  if (statOrders) {
    statOrders.textContent = ordersCount;
  }

  if (statSales) {
    statSales.textContent =
      sales.toLocaleString() + " DA";
  }

  // الربح الحقيقي يحتاج تكلفة شراء المنتجات.
  // حاليًا نعرض المبيعات بدل اختراع تكلفة.
  if (statProfit) {
    statProfit.textContent =
      sales.toLocaleString() + " DA";
  }
}


// ================================
// SETTINGS
// ================================

async function saveSettings() {

  const price =
    Number(
      document.getElementById("defaultPrice")?.value
    );

  const whatsapp =
    document.getElementById("waNumber")?.value.trim();

  try {

    await upsertSetting(
      "default_price",
      String(price || 2600)
    );

    if (whatsapp) {

      await upsertSetting(
        "whatsapp",
        whatsapp
      );

    }

    settings.default_price =
      price || 2600;

    settings.whatsapp =
      whatsapp || WHATSAPP;

    alert("تم حفظ الإعدادات");

  } catch (error) {

    console.error(error);
    alert("حدث خطأ أثناء حفظ الإعدادات");
  }
}


async function upsertSetting(key, value) {

  await supabaseRequest(
    `settings?key=eq.${encodeURIComponent(key)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        value,
        updated_at: new Date().toISOString()
      })
    }
  );

  const existing =
    await supabaseRequest(
      `settings?key=eq.${encodeURIComponent(key)}&select=id`
    );

  if (!existing || !existing.length) {

    await supabaseRequest(
      "settings",
      {
        method: "POST",
        body: JSON.stringify({
          key,
          value
        }),
        headers: {
          "Prefer": "return=representation"
        }
      }
    );
  }
}


// ================================
// SECURITY / HTML HELPERS
// ================================

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

  return escapeHTML(value);
}


// ================================
// START
// ================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      await loadProducts();
      await loadDelivery();
      await loadSettings();

      renderCart();

    } catch (error) {

      console.error("SHADOW ERROR:", error);

      console.warn(
        "تأكد من Supabase URL و Publishable Key."
      );

    }

  }
);
