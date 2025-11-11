
const API_BASE_URL = "https://madejadictas-api-mqjpwzxwma-uc.a.run.app";

const products = [
  {
    title: "Merino DK Andes",
    price: "$16.990",
    tag: "Lote microtintura",
    description: "400g · Degradé cobre/terracota · Tratamiento antipeeling",
    category: "lanas",
    image:
      "https://source.unsplash.com/600x450/?yarn,wool,terracotta",
    imageAlt: "Madejas de lana merino en tonos tierra",
  },
  {
    title: "Kit Chal Aurora",
    price: "$49.900",
    tag: "Incluye guía",
    description: "Nivel intermedio · Agujas 4mm · Acceso a video privado",
    category: "kits",
    image:
      "https://source.unsplash.com/600x450/?yarn,shawl,knitting",
    imageAlt: "Kit de chal con madejas y palillos",
  },
  {
    title: "Set marcadores 3D",
    price: "$8.500",
    tag: "Studio partner",
    description: "12 piezas · PLA reciclado · Formas geométricas",
    category: "accesorios",
    image:
      "https://source.unsplash.com/600x450/?yarn,notions,knitting",
    imageAlt: "Madejas y accesorios para tejido",
  },
  {
    title: "Algodón Pima Bloom",
    price: "$14.500",
    tag: "Color exclusivo",
    description: "100% pima · DK · Paleta coral / miel / oliva",
    category: "lanas",
    image:
      "https://source.unsplash.com/600x450/?cotton,yarn",
    imageAlt: "Madejas de algodón pima en colores suaves",
  },
  {
    title: "Kit Bucket minimal",
    price: "$38.000",
    tag: "Entrega 48h",
    description: "Nivel básico · Crochet 5mm · Patrón descargable",
    category: "kits",
    image:
      "https://source.unsplash.com/600x450/?crochet,yarn",
    imageAlt: "Set de crochet con madejas listas para tejer",
  },
  {
    title: "Bloqueadores metálicos",
    price: "$21.990",
    tag: "Premium",
    description: "Acero inoxidable · Set 30 piezas · Estuche lino",
    category: "accesorios",
    image:
      "https://source.unsplash.com/600x450/?wool,yarn,needles",
    imageAlt: "Madejas y herramientas de tejido",
  },
];

const productGrid = document.querySelector("#productGrid");
const filterChips = document.querySelectorAll(".chip");

const renderProducts = (filter = "todos") => {
  const fragment = document.createDocumentFragment();
  products
    .filter((item) => filter === "todos" || item.category === filter)
    .forEach((product) => {
      const card = document.createElement("article");
      card.className = "product-card";
      card.innerHTML = `
        <div class="product-media">
          <img src="${product.image}" alt="${product.imageAlt}" loading="lazy" />
        </div>
        <div class="title-line">
          <h3>${product.title}</h3>
          <span class="price">${product.price}</span>
        </div>
        <p class="tag">${product.tag}</p>
        <p class="lead">${product.description}</p>
        <button class="pill-button ghost small">Añadir a mi bolsa</button>
      `;
      fragment.appendChild(card);
    });
  productGrid.innerHTML = "";
  productGrid.appendChild(fragment);
};

const handleFilterClick = (event) => {
  const { filter } = event.target.dataset;
  if (!filter) return;
  filterChips.forEach((chip) => chip.classList.toggle("active", chip === event.target));
  renderProducts(filter);
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

renderProducts();

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
