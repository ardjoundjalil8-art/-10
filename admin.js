const SUPABASE_URL =
  "https://knjdouprbwkxcuqyhpvh.supabase.co";


const SUPABASE_KEY =
  "sb_publishable_iNdVPUDh7LRiQ27JX3smyA_C345zSB_";


const ADMIN_PASSWORD =
  "2412822010";


if (
  sessionStorage.getItem(
    "shadow_admin"
  ) !== "1"
) {

  location.href =
    "index.html";

}


async function api(
  path,
  options = {}
) {

  const response =
    await fetch(
      SUPABASE_URL +
      "/rest/v1/" +
      path,
      {

        ...options,

        headers: {

          apikey:
            SUPABASE_KEY,

          Authorization:
            "Bearer " +
            SUPABASE_KEY,

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


  const text =
    await response.text();


  return text
    ? JSON.parse(text)
    : [];

}


async function refresh() {

  try {

    const products =
      await api(
        "products?select=*&order=id.desc"
      );


    document.getElementById(
      "productsList"
    ).innerHTML =

      products.map(
        product => `

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
              ${product.price} DA
              —
              ${escapeHTML(
                product.sizes || ""
              )}
            </p>

          </div>

          <button
            class="danger"
            onclick="delProduct(${product.id})"
          >
            حذف
          </button>

        </div>

      `
      ).join("");


    const delivery =
      await api(
        "delivery?select=*&order=id.asc"
      );


    document.getElementById(
      "deliveryList"
    ).innerHTML =

      delivery.map(
        item => `

        <div class="admin-row">

          <div>

            <b>
              ${escapeHTML(item.name)}
            </b>

            <p>

              Domicile:
              ${item.price} DA

              —

              Stop desk:
              ${item.stop_price ?? 0} DA

            </p>

          </div>

          <button
            class="danger"
            onclick="delDelivery(${item.id})"
          >
            حذف
          </button>

        </div>

      `
      ).join("");


    const orders =
      await api(
        "orders?select=*&order=id.desc"
      );


    document.getElementById(
      "ordersList"
    ).innerHTML =

      orders.length

        ? orders.map(
            order => {

              let items = [];

              try {

                items =
                  Array.isArray(order.items)
                    ? order.items
                    : JSON.parse(
                        order.items || "[]"
                      );

              }

              catch {

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

                    ${order.total || 0} DA

                  </p>

                  <small>

                    ${escapeHTML(
                      order.address || ""
                    )}

                  </small>


                  <div class="order-products">

                    ${
                      items.length

                        ? items.map(
                            item => {

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

                            }
                          ).join("")

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

              </div>

              `;

            }
          ).join("")

        : "<p class='muted'>لا توجد طلبات.</p>";


  }

  catch (error) {

    console.error(error);

    alert(
      "حدث خطأ في الاتصال بـ Supabase"
    );

  }

}


function showTab(id) {

  document
    .querySelectorAll(".admin-tab")
    .forEach(
      section =>
        section.classList.add(
          "hidden"
        )
    );


  document
    .getElementById(id)
    .classList.remove(
      "hidden"
    );

}


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
          "Hoodie Shadow"

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


function saveSettings() {

  alert(
    "تم الحفظ"
  );

}


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
