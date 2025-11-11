
const API_BASE_URL = "https://madejadictas-api-mqjpwzxwma-uc.a.run.app";

let products = [];

const productGrid = document.querySelector("#productGrid");
const filterChips = document.querySelectorAll(".chip");
let activeFilter = "todos";

const renderProducts = (filter = "todos") => {
  const fragment = document.createDocumentFragment();
  const filtered = products.filter((item) => filter === "todos" || item.category === filter);
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "product-card";
    empty.innerHTML = `<p class="lead">Aún no hay productos en esta categoría.</p>`;
    fragment.appendChild(empty);
  } else {
    filtered.forEach((product) => {
      const card = document.createElement("article");
      card.className = "product-card";
      const imgSrc = product.image || product.imageData || product.imageUrl || "";
      const priceText = typeof product.price === "number"
        ? `$${Number(product.price).toLocaleString("es-CL")}`
        : (product.price || "");
      const tagText = product.tag || (product.stock === 0 ? "Agotado" : "");
      const tagClass = product.stock === 0 ? "tag stock-out" : "tag";
      const descText = product.description || product.notes || "";

      card.innerHTML = `
        <div class="product-media">
          ${imgSrc ? `<img src="${imgSrc}" alt="${product.imageAlt || product.title}" loading="lazy" />` : ""}
        </div>
        <div class="title-line">
          <h3>${product.title}</h3>
          <span class="price">${priceText}</span>
        </div>
        ${tagText ? `<p class="${tagClass}">${tagText}</p>` : ""}
        ${descText ? `<p class="lead">${descText}</p>` : ""}
        <button class="pill-button ghost small">Añadir a mi bolsa</button>
      `;
      fragment.appendChild(card);
    });
  }
  productGrid.innerHTML = "";
  productGrid.appendChild(fragment);
};

const handleFilterClick = (event) => {
  const { filter } = event.target.dataset;
  if (!filter) return;
  activeFilter = filter;
  filterChips.forEach((chip) => chip.classList.toggle("active", chip === event.target));
  renderProducts(activeFilter);
};

filterChips.forEach((chip) => chip.addEventListener("click", handleFilterClick));

const smoothScrollButtons = document.querySelectorAll("[data-scroll]");
smoothScrollButtons.forEach((button) =>
  button.addEventListener("click", () => {
    const id = button.getAttribute("data-scroll");
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  })
);

const dialog = document.querySelector("#flowDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogMessage = document.querySelector("#dialogMessage");

const openDialog = ({ title, message }) => {
  dialogTitle.textContent = title;
  dialogMessage.textContent = message;
  dialog.showModal();
};

document.querySelector("#closeDialog").addEventListener("click", () => dialog.close());

document.querySelector("#googleLoginButton").addEventListener("click", () =>
  openDialog({
    title: "Integración Google pendiente",
    message:
      "Aquí se invocará Google Identity Services (OAuth 2.0). Por ahora mostramos este flujo de referencia mientras se completa la integración.",
  })
);

document.querySelector("#guestCheckoutButton").addEventListener("click", () =>
  openDialog({
    title: "Compra sin registro",
    message:
      "El flujo de invitada pedirá solo email + dirección + método de despacho. Podemos persistirlo en localStorage o enviarlo directo al backend.",
  })
);

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
menuToggle.addEventListener("click", () => nav.classList.toggle("open"));

const buildStamp = document.querySelector("#buildStamp");
const formatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
});
buildStamp.textContent = formatter.format(new Date());

async function fetchCatalog() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`);
    if (!res.ok) throw new Error("No se pudo obtener el catálogo");
    const { products: list } = await res.json();
    if (Array.isArray(list)) {
      products = list;
      renderProducts(activeFilter);
      return;
    }
  } catch (e) {
    console.warn("Catálogo remoto no disponible", e);
  }
  // Si no hay datos, deja el grid con un mensaje
  products = [];
  renderProducts(activeFilter);
}

fetchCatalog();

// Auto-actualiza el catálogo cada 5 minutos cuando la pestaña está visible
setInterval(() => {
  if (document.visibilityState === "visible") {
    fetchCatalog();
  }
}, 300000);

// Acceso oculto al panel admin:
// Atajo de teclado: Ctrl/Cmd + Alt + A
document.addEventListener("keydown", (e) => {
  const isCtrlOrCmd = e.ctrlKey || e.metaKey;
  if (isCtrlOrCmd && e.altKey && e.key.toLowerCase() === "a") {
    window.location.href = "admin.html";
  }
});

// Easter egg: 5 clics rápidos en el logo abre admin
(() => {
  const logo = document.querySelector(".logo");
  if (!logo) return;
  let clicks = 0;
  let timer = null;
  logo.addEventListener("click", () => {
    clicks += 1;
    clearTimeout(timer);
    if (clicks >= 5) {
      window.location.href = "admin.html";
      clicks = 0;
      return;
    }
    timer = setTimeout(() => {
      clicks = 0;
    }, 1200);
  });
})();

// Se movió el panel admin a admin.html (admin.js)
