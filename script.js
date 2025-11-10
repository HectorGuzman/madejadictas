
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

// Admin modal logic with Google sign-in
const GOOGLE_CLIENT_ID = "TU_CLIENT_ID.apps.googleusercontent.com"; // Reemplaza con tu client_id real
const AUTHORIZED_EMAILS = [
  "claudia@madejadictas.com",
  "carla@madejadictas.com",
  "hector@madejadictas.com",
].map((email) => email.toLowerCase());
const ADMIN_HEADER = "x-admin-key";
const ADMIN_KEY_STORAGE = "mdAdminKey";
const INVENTORY_KEY = "mdInventory";

const adminDialog = document.querySelector("#adminDialog");
const openAdminPanel = document.querySelector("#openAdminPanel");
const closeAdminDialog = document.querySelector("#closeAdminDialog");
const productForm = document.querySelector("#productForm");
const inventoryPanel = document.querySelector("#inventoryPanel");
const inventoryList = document.querySelector("#inventoryList");
const clearInventoryButton = document.querySelector("#clearInventory");
const googleButtonContainer = document.querySelector("#googleButtonContainer");
const teamProfile = document.querySelector("#teamProfile");
const teamName = document.querySelector("#teamName");
const teamEmail = document.querySelector("#teamEmail");
const signOutButton = document.querySelector("#signOutButton");
const updateApiKeyButton = document.querySelector("#updateApiKeyButton");

let inventory = [];
let adminKey = localStorage.getItem(ADMIN_KEY_STORAGE) || "";
let currentUser = null;
let idToken = null;
let googleReady = false;

const parseJwt = (token) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
};

const loadInventoryFromCache = () => {
  try {
    const stored = localStorage.getItem(INVENTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("No se pudo leer inventario local", error);
    return [];
  }
};

const renderInventoryMessage = (text) => {
  inventoryList.innerHTML = "";
  const li = document.createElement("li");
  li.style.color = "var(--muted)";
  li.style.fontSize = "0.9rem";
  li.textContent = text;
  inventoryList.appendChild(li);
};

const renderInventory = () => {
  inventoryList.innerHTML = "";
  if (!inventory.length) {
    renderInventoryMessage(
      currentUser && idToken ? "Sin productos registrados todavía." : "Ingresa con Google para ver el inventario."
    );
    return;
  }

  inventory.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.title}</strong>
      <span>SKU: ${item.sku} · ${item.category}</span>
      <span>Precio: $${Number(item.price).toLocaleString("es-CL")} · Stock: ${item.stock}</span>
      ${item.notes ? `<span>Notas: ${item.notes}</span>` : ""}
      <span>Registrado por ${item.owner || "Equipo"} el ${item.createdAt}</span>
    `;
    inventoryList.appendChild(li);
  });
};

inventory = loadInventoryFromCache();
renderInventory();

const updateAdminUI = () => {
  const isAuth = Boolean(currentUser && idToken);
  productForm.hidden = !isAuth;
  inventoryPanel.hidden = !isAuth;
  clearInventoryButton.disabled = !isAuth;
  if (teamProfile) teamProfile.hidden = !isAuth;
  if (googleButtonContainer) {
    googleButtonContainer.style.display = isAuth ? "none" : "flex";
  }
  if (updateApiKeyButton) updateApiKeyButton.hidden = !isAuth;

  if (isAuth) {
    teamName.textContent = currentUser.name || currentUser.email;
    teamEmail.textContent = currentUser.email;
    if (!inventory.length) renderInventoryMessage("Sin productos registrados todavía.");
    else renderInventory();
  } else {
    teamEmail.textContent = "";
    renderInventoryMessage("Ingresa con Google para ver el inventario.");
  }
};

updateAdminUI();

const handleCredentialResponse = (response) => {
  try {
    const payload = parseJwt(response.credential);
    const email = payload.email?.toLowerCase();
    if (!email || !AUTHORIZED_EMAILS.includes(email)) {
      alert("Tu cuenta no tiene permisos para administrar el catálogo.");
      return;
    }
    currentUser = {
      name: payload.name || email,
      email,
      picture: payload.picture,
    };
    idToken = response.credential;
    updateAdminUI();
    fetchInventoryFromBackend();
    if (!adminKey) {
      configureApiKey();
    }
  } catch (error) {
    console.error(error);
    alert("No se pudo validar tu sesión de Google.");
  }
};

const initGoogleAuth = () => {
  if (googleReady) return;
  if (!window.google?.accounts?.id) return;
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: true,
    use_fedcm_for_prompt: true,
  });
  if (googleButtonContainer) {
    google.accounts.id.renderButton(googleButtonContainer, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "pill",
    });
  }
  googleReady = true;
};

window.addEventListener("load", initGoogleAuth);

const configureApiKey = () => {
  const value = prompt("Ingresa la clave API que comparte Héctor:", adminKey);
  if (!value) return;
  adminKey = value.trim();
  localStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
};

const fetchInventoryFromBackend = async () => {
  if (!currentUser || !idToken) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        ...(adminKey ? { [ADMIN_HEADER]: adminKey } : {}),
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        renderInventoryMessage("Tu sesión expiró, vuelve a conectarte.");
      }
      return;
    }
    const { products } = await response.json();
    if (Array.isArray(products)) {
      inventory = products.map((product) => ({
        ...product,
        owner: product.owner || currentUser.name,
        createdAt:
          product.createdAt?.seconds
            ? new Date(product.createdAt.seconds * 1000).toLocaleString("es-CL")
            : new Date().toLocaleString("es-CL"),
      }));
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
      renderInventory();
    }
  } catch (error) {
    console.warn("No se pudo sincronizar inventario remoto", error);
  }
};

const saveProductRemote = async (payload) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  };
  if (adminKey) headers[ADMIN_HEADER] = adminKey;

  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = "Error al guardar producto";
    try {
      const data = await response.json();
      detail = data.error || JSON.stringify(data);
    } catch (_) {
      // ignored
    }
    throw new Error(detail);
  }

  return response.json();
};

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !idToken) {
    alert("Inicia sesión con Google para publicar productos.");
    return;
  }
  if (!adminKey) {
    configureApiKey();
    if (!adminKey) return;
  }

  const formData = new FormData(event.target);
  const entry = Object.fromEntries(formData.entries());
  const payload = {
    title: entry.title?.trim(),
    sku: entry.sku?.trim(),
    price: Number(entry.price),
    stock: Number(entry.stock),
    category: entry.category,
    image: entry.image?.trim(),
    notes: entry.notes?.trim(),
  };

  if (!payload.title || !payload.sku || Number.isNaN(payload.price) || Number.isNaN(payload.stock)) {
    alert("Completa nombre, SKU, precio y stock antes de guardar.");
    return;
  }

  if (!payload.image) delete payload.image;
  if (!payload.notes) delete payload.notes;

  try {
    const { product } = await saveProductRemote(payload);
    const storedItem = {
      ...product,
      owner: currentUser.name || currentUser.email,
      createdAt: new Intl.DateTimeFormat("es-CL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date()),
    };
    inventory = [storedItem, ...inventory];
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    renderInventory();
    event.target.reset();
    alert("Producto enviado al backend de madejadictas®.");
  } catch (error) {
    console.error(error);
    alert(error.message || "No pudimos guardar el producto, intenta nuevamente.");
  }
});

clearInventoryButton.addEventListener("click", () => {
  if (!inventory.length) return;
  const confirmed = confirm("¿Seguro que quieres limpiar la vista local?");
  if (!confirmed) return;
  inventory = [];
  localStorage.removeItem(INVENTORY_KEY);
  renderInventoryMessage("Sin productos registrados todavía.");
});

const signOut = () => {
  if (window.google?.accounts?.id && currentUser?.email) {
    google.accounts.id.revoke(currentUser.email, () => {});
    google.accounts.id.disableAutoSelect();
  }
  currentUser = null;
  idToken = null;
  updateAdminUI();
};

signOutButton.addEventListener("click", signOut);
if (updateApiKeyButton) updateApiKeyButton.addEventListener("click", configureApiKey);

openAdminPanel.addEventListener("click", () => {
  initGoogleAuth();
  adminDialog.showModal();
  updateAdminUI();
  if (currentUser && idToken) {
    fetchInventoryFromBackend();
  } else if (window.google?.accounts?.id) {
    google.accounts.id.prompt();
  }
});

closeAdminDialog.addEventListener("click", () => adminDialog.close());
