const products = [
  {
    title: "Merino DK Andes",
    price: "$16.990",
    tag: "Lote microtintura",
    description: "400g · Degradé cobre/terracota · Tratamiento antipeeling",
    category: "lanas",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Ovillos de lana merino en tonos tierra",
  },
  {
    title: "Kit Chal Aurora",
    price: "$49.900",
    tag: "Incluye guía",
    description: "Nivel intermedio · Agujas 4mm · Acceso a video privado",
    category: "kits",
    image:
      "https://images.unsplash.com/photo-1508047630978-887c2975095b?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Kit de chal con palillos circulares y madejas rosadas",
  },
  {
    title: "Set marcadores 3D",
    price: "$8.500",
    tag: "Studio partner",
    description: "12 piezas · PLA reciclado · Formas geométricas",
    category: "accesorios",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Accesorios de tejido sobre una mesa de madera clara",
  },
  {
    title: "Algodón Pima Bloom",
    price: "$14.500",
    tag: "Color exclusivo",
    description: "100% pima · DK · Paleta coral / miel / oliva",
    category: "lanas",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Conos de algodón premium apilados",
  },
  {
    title: "Kit Bucket minimal",
    price: "$38.000",
    tag: "Entrega 48h",
    description: "Nivel básico · Crochet 5mm · Patrón descargable",
    category: "kits",
    image:
      "https://images.unsplash.com/photo-1600180758890-6d763d6f7f4d?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Bolsa con madejas y ganchillo lista para tejer",
  },
  {
    title: "Bloqueadores metálicos",
    price: "$21.990",
    tag: "Premium",
    description: "Acero inoxidable · Set 30 piezas · Estuche lino",
    category: "accesorios",
    image:
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Herramientas metálicas de tejido sobre fondo rosa",
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

// Admin modal logic
const adminDialog = document.querySelector("#adminDialog");
const openAdminPanel = document.querySelector("#openAdminPanel");
const closeAdminDialog = document.querySelector("#closeAdminDialog");
const adminAccessForm = document.querySelector("#adminAccessForm");
const productForm = document.querySelector("#productForm");
const inventoryPanel = document.querySelector("#inventoryPanel");
const inventoryList = document.querySelector("#inventoryList");
const clearInventoryButton = document.querySelector("#clearInventory");

const ACCESS_CODE = "lanalovers2024";
const INVENTORY_KEY = "mdInventory";

const loadInventory = () => {
  try {
    const stored = localStorage.getItem(INVENTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("No se pudo leer inventario local", error);
    return [];
  }
};

let inventory = loadInventory();

const renderInventory = () => {
  inventoryList.innerHTML = "";
  if (!inventory.length) {
    const empty = document.createElement("li");
    empty.textContent = "Aún no hay productos añadidos en este navegador.";
    empty.style.color = "var(--muted)";
    inventoryList.appendChild(empty);
    return;
  }

  inventory.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.title}</strong>
      <span>SKU: ${item.sku} · ${item.category}</span>
      <span>Precio: $${Number(item.price).toLocaleString("es-CL")} · Stock: ${item.stock}</span>
      ${item.notes ? `<span>Notas: ${item.notes}</span>` : ""}
      <span>Registrado por ${item.owner} el ${item.createdAt}</span>
    `;
    inventoryList.appendChild(li);
  });
};

const toggleAdminForms = (isUnlocked) => {
  adminAccessForm.hidden = isUnlocked;
  productForm.hidden = !isUnlocked;
  inventoryPanel.hidden = !isUnlocked;
};

openAdminPanel.addEventListener("click", () => {
  toggleAdminForms(false);
  adminAccessForm.reset();
  productForm.reset();
  adminDialog.showModal();
  renderInventory();
});

closeAdminDialog.addEventListener("click", () => adminDialog.close());

adminAccessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const owner = formData.get("owner");
  const passcode = formData.get("passcode");

  if (!owner) {
    alert("Selecciona la persona que está ingresando.");
    return;
  }
  if (passcode !== ACCESS_CODE) {
    alert("Clave incorrecta. Pídele a Héctor la clave actualizada.");
    return;
  }

  toggleAdminForms(true);
  productForm.dataset.owner = owner;
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const entry = Object.fromEntries(formData.entries());
  entry.owner = productForm.dataset.owner || "Admin";
  entry.createdAt = new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  inventory = [entry, ...inventory];
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  renderInventory();
  event.target.reset();
});

clearInventoryButton.addEventListener("click", () => {
  if (!inventory.length) return;
  const confirmed = confirm("¿Seguro que quieres limpiar el inventario local?");
  if (!confirmed) return;
  inventory = [];
  localStorage.removeItem(INVENTORY_KEY);
  renderInventory();
});
