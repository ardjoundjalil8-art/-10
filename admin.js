const SUPABASE_URL =
  "https://knjdouprbwkxcuqyhpvh.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_iNdVPUDh7LRiQ27JX3smyA_C345zSB_";


if (
  sessionStorage.getItem("shadow_admin") !== "1"
) {
  location.href = "index.html";
}


async function api(path, options = {}) {

  const response = await fetch(
    SUPABASE_URL + "/rest/v1/" + path,
    {
      ...options,

      headers: {
        apikey: SUPABASE_KEY,

        Authorization:
          "Bearer " + SUPABASE_KEY,

        "Content-Type":
          "application/json",

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

  return text
    ? JSON.parse(text)
    : [];
}


/* =========================
   REFRESH
========================= */

async function refresh() {

  try {

    const products = await api(
      "products?select=*&order=id.desc"
    );


    document.getElementById(
      "productsList"
    ).innerHTML = products.length

      ? products.map(product => `

        <div class="admin-row">

          <img
            src="${escapeHTML(product.image)}"
            alt=""
          >

          <div>

            <b>
              ${escapeHTML(product.name)}
            </b>

            <p>
              ${Number(product.price || 0).toLocaleString("fr-DZ")}
              DA

              —

              ${escapeHTML(product.sizes || "")}
            </p>

            <p>
              ${
                product.is_hidden
                  ? "🔴 المنتج مخفي"
                  : "🟢 المنتج ظاهر"
              }
            </p>

          </div>


          <button
            class="admin-btn"
            onclick="editProduct(${product.id})"
          >
            ✏️ تعديل
          </button>


          <button
            class="admin-btn"
            onclick="toggleProduct(${product.id}, ${product.is_hidden ? "true" : "false"})"
          >
            ${
              product.is_hidden
                ? "👁️ إظهار"
                : "🙈 إخفاء"
            }
          </button>


          <button
            class="danger"
            onclick="delProduct(${product.id})"
          >
            حذف
          </button>

        </div>

      `).join("")

      : "<p class='muted'>لا توجد منتجات.</p>";


    /* DELIVERY */

    const delivery = await api(
      "delivery?select=*&order=id.asc"
    );


    document.getElementById(
      "deliveryList"
    ).innerHTML = delivery.map(item => `

      <div class="admin-row">

        <div>

          <b>
            ${escapeHTML(item.name)}
          </b>

          <p>

            Domicile:
            ${Number(item.price || 0).toLocaleString("fr-DZ")}
            DA

            —

            Stop desk:
            ${Number(item.stop_price || 0).toLocaleString("fr-DZ")}
            DA

          </p>

        </div>


        <button
          class="danger"
          onclick="delDelivery(${item.id})"
        >
          حذف
        </button>

      </div>

    `).join("");


    /* ORDERS */

    const orders = await api(
      "orders?select=*&order=id.desc"
    );


    document.getElementById(
      "ordersList"
    ).innerHTML = orders.length

      ? orders.map(order => {

          let items = [];

          try {

            items =
              Array.isArray(order.items)
                ? order.items
                : JSON.parse(
                    order.items || "[]"
                  );

          } catch {

            items = [];

          }


          return `

          <div class="admin-row order-admin-row">

            <div class="order-content">

              <b>
                ${escapeHTML(
                  order.customer_name || ""
                )}
              </b>

              <p>

                ${escapeHTML(
                  order.phone || ""
                )}

                —

                ${escapeHTML(
                  order.wilaya || ""
                )}

                —

                ${Number(
                  order.total || 0
                ).toLocaleString("fr-DZ")}
                DA

              </p>


              <small>

                ${escapeHTML(
                  order.address || ""
                )}

              </small>


              <div class="order-products">

                ${
                  items.length

                    ? items.map(item => {

                        const product =
                          products.find(
                            p =>
                              String(p.id) ===
                              String(item.id)
                          );


                        const image =
                          item.image ||
                          product?.image ||
                          "";


                        return `

                        <div class="order-product">

                          ${
                            image

                              ? `

                                <img
                                  src="${escapeHTML(image)}"
                                  alt=""
                                >

                              `

                              : `

                                <div class="no-product-image">
                                  لا صورة
                                </div>

                              `
                          }


                          <div>

                            <strong>
                              ${escapeHTML(
                                item.name || ""
                              )}
                            </strong>

                            <span>

                              ${Number(
                                item.price || 0
                              ).toLocaleString("fr-DZ")}

                              DA

                            </span>

                          </div>

                        </div>

                        `;

                      }).join("")

                    : `

                      <small class="muted">
                        لا توجد معلومات المنتجات
                      </small>

                    `
                }

              </div>

            </div>


            <select
              onchange="statusOrder(
                ${order.id},
                this.value
              )"
            >

              <option
                ${
                  order.status === "جديد"
                    ? "selected"
                    : ""
                }
              >
                جديد
              </option>

              <option
                ${
                  order.status === "مؤكد"
                    ? "selected"
                    : ""
                }
              >
                مؤكد
              </option>

              <option
                ${
                  order.status === "تم التوصيل"
                    ? "selected"
                    : ""
                }
              >
                تم التوصيل
              </option>

              <option
                ${
                  order.status === "ملغى"
                    ? "selected"
                    : ""
                }
              >
                ملغى
              </option>

            </select>

            <button
              class="danger"
              onclick="deleteOrder(${order.id})"
            >
              🗑️ حذف الطلب
            </button>

          </div>

          `;

        }).join("")

      : "<p class='muted'>لا توجد طلبات.</p>";


  } catch (error) {

    console.error(error);

    alert(
      "حدث خطأ في الاتصال بـ Supabase"
    );

  }

}


/* =========================
   TABS
========================= */

function showTab(id) {

  document
    .querySelectorAll(".admin-tab")
    .forEach(section =>
      section.classList.add("hidden")
    );


  document
    .getElementById(id)
    .classList.remove("hidden");

}


/* =========================
   ADD PRODUCT
========================= */

async function addProduct() {

  const name =
    document.getElementById(
      "pName"
    ).value.trim();


  const price =
    Number(
      document.getElementById(
        "pPrice"
      ).value || 2600
    );


  const image =
    document.getElementById(
      "pImage"
    ).value.trim();


  const sizes =
    document.getElementById(
      "pSizes"
    ).value.trim();


  if (!name || !image) {

    alert(
      "اكتب اسم المنتج ورابط الصورة"
    );

    return;

  }


  await api(
    "products",
    {
      method: "POST",

      body: JSON.stringify({

        name: name,

        price: price,

        image: image,

        sizes: sizes,

        description:
          "Hoodie Shadow",

        is_hidden: false

      })

    }
  );


  document.getElementById(
    "pName"
  ).value = "";


  document.getElementById(
    "pImage"
  ).value = "";


  await refresh();

}


/* =========================
   EDIT PRODUCT
========================= */

async function editProduct(id) {

  const products = await api(
    "products?id=eq." + id + "&select=*"
  );


  if (!products.length) {

    alert(
      "المنتج غير موجود"
    );

    return;

  }


  const product = products[0];


  const name = prompt(
    "اسم المنتج:",
    product.name || ""
  );


  if (name === null) {
    return;
  }


  const priceText = prompt(
    "السعر:",
    product.price || 0
  );


  if (priceText === null) {
    return;
  }


  const image = prompt(
    "رابط الصورة:",
    product.image || ""
  );


  if (image === null) {
    return;
  }


  const sizes = prompt(
    "المقاسات مثال: S,M,L,XL",
    product.sizes || ""
  );


  if (sizes === null) {
    return;
  }


  await api(
    "products?id=eq." + id,
    {
      method: "PATCH",

      body: JSON.stringify({

        name: name.trim(),

        price: Number(
          priceText || 0
        ),

        image: image.trim(),

        sizes: sizes.trim()

      })

    }
  );


  await refresh();


  alert(
    "تم تعديل المنتج بنجاح ✅"
  );

}


/* =========================
   HIDE / SHOW PRODUCT
========================= */

async function toggleProduct(
  id,
  currentlyHidden
) {

  const newHidden =
    !currentlyHidden;


  await api(
    "products?id=eq." + id,
    {
      method: "PATCH",

      body: JSON.stringify({

        is_hidden:
          newHidden

      })

    }
  );


  await refresh();


  alert(
    newHidden
      ? "تم إخفاء المنتج 🙈"
      : "تم إظهار المنتج 👁️"
  );

}


/* =========================
   DELETE PRODUCT
========================= */

async function delProduct(id) {

  if (
    !confirm(
      "حذف المنتج؟"
    )
  ) {

    return;

  }


  await api(
    "products?id=eq." + id,
    {
      method: "DELETE"
    }
  );


  await refresh();

}


/* =========================
   DELIVERY
========================= */

async function addDelivery() {

  const name =
    document.getElementById(
      "dName"
    ).value.trim();


  const price =
    Number(
      document.getElementById(
        "dPrice"
      ).value || 0
    );


  const stopPrice =
    Number(
      document.getElementById(
        "dStop"
      ).value || 0
    );


  if (!name) {

    alert(
      "اكتب اسم الولاية"
    );

    return;

  }


  await api(
    "delivery",
    {
      method: "POST",

      body: JSON.stringify({

        name: name,

        price: price,

        stop_price:
          stopPrice

      })

    }
  );


  document.getElementById(
    "dName"
  ).value = "";


  document.getElementById(
    "dPrice"
  ).value = "";


  document.getElementById(
    "dStop"
  ).value = "";


  await refresh();

}


async function delDelivery(id) {

  if (
    !confirm(
      "حذف الولاية؟"
    )
  ) {

    return;

  }


  await api(
    "delivery?id=eq." + id,
    {
      method: "DELETE"
    }
  );


  await refresh();

}


/* =========================
   ORDER STATUS
========================= */

async function statusOrder(
  id,
  status
) {

  await api(
    "orders?id=eq." + id,
    {
      method: "PATCH",

      body: JSON.stringify({
        status: status
      })

    }
  );

}


/* =========================
   DELETE ORDER
========================= */

async function deleteOrder(id) {

  if (
    !confirm(
      "هل تريد حذف هذا الطلب نهائيًا؟"
    )
  ) {

    return;

  }


  await api(
    "orders?id=eq." + id,
    {
      method: "DELETE"
    }
  );


  await refresh();

}


/* =========================
   CHANGE ADMIN PASSWORD
========================= */

function changeAdminPassword() {

  const currentPassword =
    prompt(
      "اكتب كود الدخول الحالي:"
    );


  if (currentPassword === null) {
    return;
  }


  const savedPassword =
    localStorage.getItem(
      "shadow_admin_password"
    ) || "2412822010";


  if (
    currentPassword !==
    savedPassword
  ) {

    alert(
      "كود الدخول الحالي غير صحيح ❌"
    );

    return;

  }


  const newPassword =
    prompt(
      "اكتب كود الدخول الجديد:"
    );


  if (newPassword === null) {
    return;
  }


  const cleanPassword =
    newPassword.trim();


  if (
    cleanPassword.length < 4
  ) {

    alert(
      "الكود الجديد يجب أن يكون 4 أحرف أو أرقام على الأقل"
    );

    return;

  }


  const confirmPassword =
    prompt(
      "أعد كتابة كود الدخول الجديد:"
    );


  if (
    confirmPassword !==
    cleanPassword
  ) {

    alert(
      "الكودان غير متطابقين ❌"
    );

    return;

  }


  localStorage.setItem(
    "shadow_admin_password",
    cleanPassword
  );


  alert(
    "تم تغيير كود الدخول بنجاح ✅"
  );

}


/* =========================
   SETTINGS
========================= */

function saveSettings() {

  alert(
    "تم الحفظ"
  );

}


/* =========================
   DELETE ALL PRODUCTS
========================= */

async function deleteAllProducts() {

  if (
    !confirm(
      "تأكيد حذف جميع المنتجات؟"
    )
  ) {

    return;

  }


  await api(
    "products?id=gt.0",
    {
      method: "DELETE"
    }
  );


  await refresh();

}


/* =========================
   ESCAPE HTML
========================= */

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


refresh();
