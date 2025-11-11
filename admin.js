const API_BASE_URL = "https://madejadictas-api-mqjpwzxwma-uc.a.run.app";
const GOOGLE_CLIENT_ID = "754600563497-i9qjck33s0ckffnea75pnc6uoatrf6fn.apps.googleusercontent.com";
const AUTHORIZED_EMAILS = [
  "claudia.sepulveda.s@gmail.com",
  "carla@madejadictas.com",
  "hectorguzmancortes@gmail.com",
].map((e) => e.toLowerCase());

const ADMIN_HEADER = "x-admin-key";
const ADMIN_KEY_STORAGE = "mdAdminKey";
const INVENTORY_KEY = "mdInventory";

const googleButtonContainer = document.querySelector("#googleButtonContainer");
const teamProfile = document.querySelector("#teamProfile");
const teamName = document.querySelector("#teamName");
const teamEmail = document.querySelector("#teamEmail");
const signOutButton = document.querySelector("#signOutButton");
const updateApiKeyButton = document.querySelector("#updateApiKeyButton");
const productForm = document.querySelector("#productForm");
const inventoryPanel = document.querySelector("#inventoryPanel");
const inventoryList = document.querySelector("#inventoryList");
const clearInventoryButton = document.querySelector("#clearInventory");

let adminKey = localStorage.getItem(ADMIN_KEY_STORAGE) || "";
let currentUser = null;
let idToken = null;
let inventory = [];

const parseJwt = (token) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
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
    renderInventoryMessage("Sin productos registrados todavía.");
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

const updateAdminUI = () => {
  const isAuth = Boolean(currentUser && idToken);
  productForm.hidden = !isAuth;
  inventoryPanel.hidden = !isAuth;
  clearInventoryButton.disabled = !isAuth;
  teamProfile.hidden = !isAuth;
  googleButtonContainer.style.display = isAuth ? "none" : "flex";
};

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
    if (!response.ok) return;
    const { products } = await response.json();
    if (Array.isArray(products)) {
      inventory = products.map((p) => ({
        ...p,
        owner: p.owner || currentUser.name,
        createdAt: p.createdAt?.seconds
          ? new Date(p.createdAt.seconds * 1000).toLocaleString("es-CL")
          : new Date().toLocaleString("es-CL"),
      }));
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
      renderInventory();
    }
  } catch (e) {
    console.warn("No se pudo sincronizar inventario", e);
  }
};

const saveProductRemote = async (payload) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  };
  if (adminKey) headers[ADMIN_HEADER] = adminKey;

  const res = await fetch(`${API_BASE_URL}/api/products`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = "Error al guardar producto";
    try {
      const data = await res.json();
      detail = data.error || JSON.stringify(data);
    } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
};

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser || !idToken) {
    alert("Inicia sesión con Google para publicar productos.");
    return;
  }
  if (!adminKey) {
    configureApiKey();
    if (!adminKey) return;
  }
  const formData = new FormData(e.target);
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
    e.target.reset();
    alert("Producto enviado al backend de madejadictas®.");
  } catch (err) {
    console.error(err);
    alert(err.message || "No pudimos guardar el producto, intenta nuevamente.");
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
  teamName.textContent = "";
  teamEmail.textContent = "";
  updateAdminUI();
};

signOutButton.addEventListener("click", signOut);
updateApiKeyButton.addEventListener("click", configureApiKey);

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
    teamName.textContent = currentUser.name;
    teamEmail.textContent = currentUser.email;
    updateAdminUI();
    fetchInventoryFromBackend();
    if (!adminKey) configureApiKey();
  } catch (e) {
    console.error(e);
    alert("No se pudo validar tu sesión de Google.");
  }
};

const initGoogleAuth = () => {
  if (!window.google?.accounts?.id) return;
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: true,
    use_fedcm_for_prompt: true,
  });
  google.accounts.id.renderButton(googleButtonContainer, {
    theme: "outline",
    size: "large",
    type: "standard",
    shape: "pill",
  });
};

window.addEventListener("load", () => {
  updateAdminUI();
  initGoogleAuth();
});

