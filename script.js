
const API_BASE_URL = "https://madejadictas-api-mqjpwzxwma-uc.a.run.app";

let products = [];

const productGrid = document.querySelector("#productGrid");
const CART_KEY = 'mdCart';
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
        <button class="pill-button ghost small" data-add-to-cart data-id="${product.id}">Añadir a mi bolsa</button>
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

// Sección de cuenta (login con Google para clientes)
const GOOGLE_CLIENT_ID_LANDING = "754600563497-i9qjck33s0ckffnea75pnc6uoatrf6fn.apps.googleusercontent.com"; // GSI client (público)
const googleBtnContainerLanding = document.querySelector("#googleButtonContainerLanding");
const googleLoginButton = document.querySelector("#googleLoginButton");
const guestCheckoutButton = document.querySelector("#guestCheckoutButton");
const accountProfile = document.querySelector("#accountProfile");
const accountName = document.querySelector("#accountName");
const accountEmail = document.querySelector("#accountEmail");
const signOutLanding = document.querySelector("#signOutLanding");
const goAdminButton = document.querySelector('#goAdminButton');
// Guest checkout form
const accountForm = document.querySelector('#accountForm');
const useGoogleDataButton = document.querySelector('#useGoogleDataButton');
const clearAccountButton = document.querySelector('#clearAccountButton');
const accountSavedMsg = document.querySelector('#accountSavedMsg');

const ACCOUNT_STORAGE_KEY = 'mdCustomer';

let landingUser = null;
const ADMIN_EMAILS_LANDING = [
  'claudia.sepulveda.s@gmail.com',
  'carla@madejadictas.com',
  'hectorguzmancortes@gmail.com',
].map(e => e.toLowerCase());

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function updateAccountUI() {
  const isAuth = Boolean(landingUser);
  if (googleBtnContainerLanding) googleBtnContainerLanding.style.display = isAuth ? "none" : "flex";
  if (googleLoginButton) googleLoginButton.style.display = isAuth ? "none" : "inline-flex";
  if (accountProfile) accountProfile.hidden = !isAuth;
  if (isAuth) {
    accountName.textContent = landingUser.name || landingUser.email;
    accountEmail.textContent = landingUser.email || "";
    if (goAdminButton) {
      const isAdmin = ADMIN_EMAILS_LANDING.includes((landingUser.email || '').toLowerCase());
      goAdminButton.hidden = !isAdmin;
    }
  } else {
    accountName.textContent = "";
    accountEmail.textContent = "";
    if (goAdminButton) goAdminButton.hidden = true;
  }
  // El formulario siempre está visible (tanto invitada como logeada)
  // Prefill si hay datos guardados
  const stored = loadCustomer();
  if (stored) applyCustomerToForm(stored);
}

function onLandingCredential(response) {
  const payload = parseJwt(response.credential);
  if (!payload?.email) return;
  landingUser = { email: payload.email, name: payload.name, picture: payload.picture };
  localStorage.setItem("mdUser", JSON.stringify(landingUser));
  updateAccountUI();
}

function initGoogleLanding() {
  if (!window.google?.accounts?.id) return;
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID_LANDING,
    callback: onLandingCredential,
    auto_select: false,
  });
  if (googleBtnContainerLanding) {
    google.accounts.id.renderButton(googleBtnContainerLanding, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "pill",
      text: "continue_with",
    });
  }
}

window.addEventListener("load", () => {
  try {
    const stored = JSON.parse(localStorage.getItem("mdUser") || "null");
    if (stored?.email) landingUser = stored;
  } catch {}
  updateAccountUI();
  initGoogleLanding();
});

if (googleLoginButton) {
  googleLoginButton.addEventListener("click", () => {
    if (window.google?.accounts?.id) {
      google.accounts.id.prompt();
    }
  });
}

if (signOutLanding) {
  signOutLanding.addEventListener("click", () => {
    const email = landingUser?.email;
    landingUser = null;
    localStorage.removeItem("mdUser");
    if (window.google?.accounts?.id && email) {
      google.accounts.id.revoke(email, () => {});
      google.accounts.id.disableAutoSelect();
    }
    updateAccountUI();
  });
}

if (guestCheckoutButton) {
  guestCheckoutButton.addEventListener("click", () => {
    // Enfoca el formulario y resalta
    accountForm?.scrollIntoView({ behavior: 'smooth' });
    const first = accountForm?.querySelector('input[name="fullName"]');
    if (first) first.focus();
  });
}

// Cart helpers
function loadCart() { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } }
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function addToCart(productId, qty = 1) {
  const cart = loadCart();
  const existing = cart.find((it) => it.productId === productId);
  if (existing) existing.quantity += qty; else cart.push({ productId, quantity: qty });
  saveCart(cart);
  renderCart();
}
function removeFromCart(productId) { saveCart(loadCart().filter((it) => it.productId !== productId)); renderCart(); }
function renderCart() {
  const listEl = document.getElementById('cartList');
  if (!listEl) return;
  const cart = loadCart();
  listEl.innerHTML = '';
  if (!cart.length) {
    const li = document.createElement('li');
    li.textContent = 'Tu bolsa está vacía.';
    li.style.color = 'var(--muted)';
    listEl.appendChild(li);
    return;
  }
  cart.forEach((it) => {
    const product = products.find((p) => p.id === it.productId);
    const title = product?.title || it.productId;
    const price = typeof product?.price === 'number' ? Number(product.price) : 0;
    const line = document.createElement('li');
    const imgSrc = product?.image || product?.imageData || '';
    line.innerHTML = `
      <div class="inv-head">
        ${imgSrc ? `<img class="inventory-thumb" src="${imgSrc}" alt="${title}" />` : `<div class=\"inventory-thumb placeholder\"></div>`}
        <div class="inv-meta">
          <strong>${title}</strong>
          <span>${it.quantity} unidad(es)</span>
        </div>
      </div>
      ${price ? `<span>Subtotal: $${(price * it.quantity).toLocaleString('es-CL')}</span>` : ''}
      <div>
        <button class="pill-button ghost small" data-remove-item data-id="${it.productId}">Quitar</button>
      </div>`;
    listEl.appendChild(line);
  });
}

productGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add-to-cart]');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  if (id) addToCart(id, 1);
});

document.getElementById('cartList')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove-item]');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  if (id) removeFromCart(id);
});

document.getElementById('clearCartButton')?.addEventListener('click', () => {
  localStorage.removeItem(CART_KEY);
  renderCart();
});

renderCart();

document.getElementById('checkoutButton')?.addEventListener('click', async () => {
  const msg = document.getElementById('checkoutMsg');
  const cart = loadCart();
  if (!cart.length) { msg.textContent = 'Tu bolsa está vacía.'; return; }
  const customer = loadCustomer();
  if (!customer || !customer.fullName || !customer.email || !customer.address) {
    msg.textContent = 'Completa nombre, email y dirección en Mi cuenta antes de confirmar.';
    return;
  }
  try {
    const payload = {
      customer,
      items: cart,
      channel: landingUser ? 'google' : 'guest',
      contactEmail: landingUser?.email || customer.email,
      contactName: landingUser?.name || customer.fullName,
    };
    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('No se pudo crear el pedido');
    const { order } = await res.json();
    localStorage.removeItem(CART_KEY);
    renderCart();
    msg.textContent = `Pedido creado (#${order.id}). Te contactaremos por correo.`;
  } catch (err) {
    console.error(err);
    msg.textContent = 'Ocurrió un error al crear tu pedido. Intenta nuevamente.';
  }
});

// Gestión de datos de cliente (guest o logeado)
function loadCustomer() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY) || 'null');
  } catch { return null; }
}

function saveCustomer(data) {
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(data));
}

function applyCustomerToForm(c) {
  if (!accountForm || !c) return;
  accountForm.fullName.value = c.fullName || '';
  accountForm.email.value = c.email || '';
  accountForm.phone.value = c.phone || '';
  accountForm.region.value = c.region || '';
  accountForm.address.value = c.address || '';
  accountForm.city.value = c.city || '';
  accountForm.notes.value = c.notes || '';
}

if (accountForm) {
  accountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(accountForm).entries());
    // Validación simple
    if (!data.fullName || !data.email || !data.address) {
      accountSavedMsg.textContent = 'Completa nombre, email y dirección para guardar.';
      return;
    }
    saveCustomer(data);
    accountSavedMsg.textContent = 'Datos guardados. Los usaremos al finalizar tu compra.';
  });
}

if (useGoogleDataButton) {
  useGoogleDataButton.addEventListener('click', () => {
    if (!landingUser) {
      accountSavedMsg.textContent = 'Inicia sesión con Google para usar tus datos.';
      return;
    }
    applyCustomerToForm({ fullName: landingUser.name || '', email: landingUser.email || '' });
    accountSavedMsg.textContent = 'Completamos nombre y email desde tu cuenta Google.';
  });
}

if (clearAccountButton) {
  clearAccountButton.addEventListener('click', () => {
    localStorage.removeItem(ACCOUNT_STORAGE_KEY);
    applyCustomerToForm({});
    accountSavedMsg.textContent = 'Datos borrados.';
  });
}

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
menuToggle.addEventListener("click", () => nav.classList.toggle("open"));

const buildStamp = document.querySelector("#buildStamp");
const formatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
});
buildStamp.textContent = formatter.format(new Date());

// Rellena la tarjeta de "Más vendido" en el hero
function renderBestseller() {
  const holder = document.querySelector('#bestsellerCard');
  if (!holder) return;
  if (!Array.isArray(products) || products.length === 0) {
    holder.innerHTML = `
      <h3>Más vendido</h3>
      <p>Muy pronto destacaremos nuestro favorito de la semana.</p>
      <button class="pill-button ghost small" data-scroll="#productos">Ver catálogo</button>
    `;
    return;
  }
  // Heurística: etiqueta que indique "más vendido" o el primero de la lista
  const best =
    products.find((p) => /más\s*vendido|best|destacado/i.test(p.tag || '')) || products[0];
  const imgSrc = best.image || best.imageData || best.imageUrl || '';
  const priceText = typeof best.price === 'number' ? `$${Number(best.price).toLocaleString('es-CL')}` : (best.price || '');
  holder.innerHTML = `
    <h3>Más vendido</h3>
    <div class="product-media" style="margin:0.5rem 0 0.75rem">
      ${imgSrc ? `<img src="${imgSrc}" alt="${best.title}" loading="lazy" />` : ''}
    </div>
    <p class="lead" style="margin:0">${best.title}</p>
    ${priceText ? `<p class="price" style="margin:0">${priceText}</p>` : ''}
    <button class="pill-button ghost small" data-scroll="#productos">Ver catálogo</button>
  `;
}

async function fetchCatalog() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`);
    if (!res.ok) throw new Error("No se pudo obtener el catálogo");
    const { products: list } = await res.json();
    if (Array.isArray(list)) {
      products = list;
      renderProducts(activeFilter);
      renderBestseller();
      return;
    }
  } catch (e) {
    console.warn("Catálogo remoto no disponible", e);
  }
  // Si no hay datos, deja el grid con un mensaje
  products = [];
  renderProducts(activeFilter);
  renderBestseller();
}

fetchCatalog();

// Auto-actualiza el catálogo cada 5 minutos cuando la pestaña está visible
setInterval(() => {
  if (document.visibilityState === "visible") {
    fetchCatalog();
  }
}, 300000);

// Lightbox de showrooms
const srDialog = document.getElementById('showroomDialog');
const srTitle = document.getElementById('srTitle');
const srMeta = document.getElementById('srMeta');
const srMainImg = document.getElementById('srMainImg');
const srThumbs = document.getElementById('srThumbs');
const srClose = document.getElementById('srClose');
const srPrev = document.getElementById('srPrev');
const srNext = document.getElementById('srNext');

function openShowroomById(id) {
  const s = showroomsData.find((x) => x.id === id);
  if (!s) return;
  currentShowroom = s;
  currentSrIndex = 0;
  renderShowroomDialog();
  srDialog?.showModal();
}

function renderShowroomDialog() {
  if (!currentShowroom) return;
  srTitle.textContent = currentShowroom.title || 'Showroom';
  srMeta.textContent = `${currentShowroom.date || ''} • ${currentShowroom.location || ''}`.trim();
  const photos = currentShowroom.photos || [];
  if (!photos.length) {
    srMainImg.removeAttribute('src');
  } else {
    currentSrIndex = Math.max(0, Math.min(currentSrIndex, photos.length - 1));
    srMainImg.src = photos[currentSrIndex];
  }
  srThumbs.innerHTML = '';
  photos.forEach((p, i) => {
    const img = document.createElement('img');
    img.src = p;
    img.alt = `${currentShowroom.title} ${i + 1}`;
    if (i === currentSrIndex) img.classList.add('active');
    img.addEventListener('click', () => { currentSrIndex = i; renderShowroomDialog(); });
    srThumbs.appendChild(img);
  });
}

srClose?.addEventListener('click', () => srDialog?.close());
srPrev?.addEventListener('click', () => {
  if (!currentShowroom) return;
  const n = (currentSrIndex - 1 + currentShowroom.photos.length) % currentShowroom.photos.length;
  currentSrIndex = n; renderShowroomDialog();
});
srNext?.addEventListener('click', () => {
  if (!currentShowroom) return;
  const n = (currentSrIndex + 1) % currentShowroom.photos.length;
  currentSrIndex = n; renderShowroomDialog();
});

showroomGrid?.addEventListener('click', (e) => {
  const card = e.target.closest('.showroom-card');
  if (!card) return;
  const id = card.getAttribute('data-srid');
  if (id) openShowroomById(id);
});

// Llama tras definir todo el módulo de showrooms
fetchShowrooms();

// Acceso oculto al panel admin:
// Atajo de teclado: Ctrl/Cmd + Alt + A
document.addEventListener("keydown", (e) => {
  const isCtrlOrCmd = e.ctrlKey || e.metaKey;
  if (isCtrlOrCmd && e.altKey && e.key.toLowerCase() === "a") {
    window.location.href = "admin.html";
  }
});

// Easter egg: acceso oculto al panel admin
(() => {
  const logo = document.querySelector(".logo");
  if (!logo) return;
  let clicks = 0;
  let resetTimer = null;
  let pressTimer = null;

  const openAdmin = () => (window.location.href = "admin.html");

  // 5 clics en 4 segundos
  logo.addEventListener("click", () => {
    clicks += 1;
    clearTimeout(resetTimer);
    if (clicks >= 5) {
      clicks = 0;
      openAdmin();
      return;
    }
    resetTimer = setTimeout(() => {
      clicks = 0;
    }, 4000);
  });

  // Long-press (1.2s) como alternativa (móvil)
  const startPress = () => {
    clearTimeout(pressTimer);
    pressTimer = setTimeout(openAdmin, 1200);
  };
  const cancelPress = () => clearTimeout(pressTimer);
  logo.addEventListener("mousedown", startPress);
  logo.addEventListener("mouseup", cancelPress);
  logo.addEventListener("mouseleave", cancelPress);
  logo.addEventListener("touchstart", startPress, { passive: true });
  logo.addEventListener("touchend", cancelPress);
})();

// Se movió el panel admin a admin.html (admin.js)
// Showrooms: listar y renderizar + lightbox
const showroomGrid = document.querySelector('#showroomGrid');
let showroomsData = [];
let currentShowroom = null;
let currentSrIndex = 0;
async function fetchShowrooms() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/showrooms`);
    if (!res.ok) throw new Error('No se pudo cargar showrooms');
    const { showrooms } = await res.json();
    showroomsData = Array.isArray(showrooms) ? showrooms : [];
    renderShowrooms(showroomsData);
  } catch (e) {
    console.warn('Showrooms no disponibles', e);
    showroomsData = [];
    renderShowrooms([]);
  }
}

function renderShowrooms(list) {
  if (!showroomGrid) return;
  showroomGrid.innerHTML = '';
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'product-card';
    empty.innerHTML = '<p class="lead">Pronto subiremos fotos de nuestros showrooms.</p>';
    showroomGrid.appendChild(empty);
    return;
  }
  list.forEach((s) => {
    const card = document.createElement('article');
    card.className = 'product-card showroom-card';
    card.dataset.srid = s.id;
    const cover = s.cover || (s.photos && s.photos[0]) || '';
    card.innerHTML = `
      <div class="cover">${cover ? `<img src="${cover}" alt="${s.title}" />` : ''}</div>
      <div class="title-line">
        <h3>${s.title}</h3>
        <span class="price">${s.date || ''}</span>
      </div>
      <p class="tag">${s.location || ''}</p>
      ${s.description ? `<p class="lead">${s.description}</p>` : ''}
    `;
    showroomGrid.appendChild(card);
  });
}
