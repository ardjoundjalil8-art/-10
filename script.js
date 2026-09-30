const SUPABASE_URL =
  "https://knjdouprbwkxcuqyhpvh.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_iNdVPUDh7LRiQ27JX3smyA_C345zSB_";

const DEFAULT_ADMIN_PASSWORD =
  "2412822010";

const WHATSAPP =
  "213696380625";


function getAdminPassword() {
  return (
    localStorage.getItem("shadow_admin_password") ||
    DEFAULT_ADMIN_PASSWORD
  );
}


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


const ALL_WILAYAS = [

  "أدرار",
  "الشلف",
  "الأغواط",
  "أم البواقي",
  "باتنة",
  "بجاية",
  "بسكرة",
  "بشار",
  "البليدة",
  "البويرة",
  "تمنراست",
  "تبسة",
  "تلمسان",
  "تيارت",
  "تيزي وزو",
  "الجزائر",
  "الجلفة",
  "جيجل",
  "سطيف",
  "سعيدة",
  "سكيكدة",
  "سيدي بلعباس",
  "عنابة",
  "قالمة",
  "قسنطينة",
  "المدية",
  "مستغانم",
  "المسيلة",
  "معسكر",
  "ورقلة",
  "وهران",
  "البيض",
  "إليزي",
  "برج بوعريريج",
  "بومرداس",
  "الطارف",
  "تندوف",
  "تيسمسيلت",
  "الوادي",
  "خنشلة",
  "سوق أهراس",
  "تيبازة",
  "ميلة",
  "عين الدفلى",
  "النعامة",
  "عين تموشنت",
  "غرداية",
  "غليزان",
  "تيميمون",
  "برج باجي مختار",
  "أولاد جلال",
  "بني عباس",
  "عين صالح",
  "عين قزام",
  "تقرت",
  "جانت",
  "المغير",
  "المنيعة"

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


async function addMissingWilayas() {

  const existingNames =
    delivery.map(
      item =>
        String(item.name).trim()
    );

  const missing =
    ALL_WILAYAS.filter(
      name =>
        !existingNames.includes(name)
    );

  if (!missing.length) {
    return;
  }

  const newWilayas =
    missing.map(
      name => ({
        name: name,
        price: 0,
        stop_price: 0
      })
    );

  await api(
    "delivery",
    {
      method: "POST",

      headers: {
        Prefer: "return=minimal"
      },

      body:
        JSON.stringify(newWilayas)
    }
  );

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


    await addMissingWilayas();


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


  const visibleProducts =
    products.filter(
      product =>
        product.is_hidden !== true
    );


  if (!visibleProducts.length) {

    grid.innerHTML =
      `<div class="loading">
        لا توجد منتجات حاليًا
      </div>`;

    return;

  }


  grid.innerHTML =
    visibleProducts.map(
      product => {

        const realIndex =
          products.findIndex(
            p =>
              String(p.id) ===
              String(product.id)
          );

        return `

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
              ${
