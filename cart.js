const API_BASE_URL = "https://madejadictas-api-mqjpwzxwma-uc.a.run.app";
const GOOGLE_CLIENT_ID = "754600563497-i9qjck33s0ckffnea75pnc6uoatrf6fn.apps.googleusercontent.com";

const CART_KEY = 'mdCart';
const ACCOUNT_STORAGE_KEY = 'mdCustomer';

// Google login
const googleBtnContainerCart = document.querySelector('#googleButtonContainerCart');
const guestCheckoutButtonCart = document.querySelector('#guestCheckoutButtonCart');
const accountProfileCart = document.querySelector('#accountProfileCart');
const accountNameCart = document.querySelector('#accountNameCart');
const accountEmailCart = document.querySelector('#accountEmailCart');
const signOutCart = document.querySelector('#signOutCart');

const accountFormCart = document.querySelector('#accountFormCart');
const useGoogleDataCart = document.querySelector('#useGoogleDataCart');
const clearAccountCart = document.querySelector('#clearAccountCart');
const accountSavedMsgCart = document.querySelector('#accountSavedMsgCart');

let user = null;
let catalog = [];

async function fetchCatalog() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`);
    if (!res.ok) throw new Error('No se pudo obtener el catálogo');
    const { products } = await res.json();
    catalog = Array.isArray(products) ? products : [];
  } catch (e) {
    catalog = [];
  }
}

function findProduct(id) { return catalog.find((p) => p.id === id); }

// Toast helpers (comparten estilo con landing)
function ensureToastContainer() {
  let c = document.getElementById('toastContainer');
  if (!c) { c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container'; document.body.appendChild(c); }
  return c;
}
function showToast(message) {
  const c = ensureToastContainer();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 200ms ease'; setTimeout(() => el.remove(), 220); }, 2500);
}

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    return JSON.parse(jsonPayload);
  } catch { return null; }
}

function onCredential(response) {
  const payload = parseJwt(response.credential);
  if (!payload?.email) return;
  user = { email: payload.email, name: payload.name, picture: payload.picture };
  localStorage.setItem('mdUser', JSON.stringify(user));
  updateAccountUI();
}

function initGSI() {
  if (!window.google?.accounts?.id) return;
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onCredential, auto_select: false });
  if (googleBtnContainerCart) {
    google.accounts.id.renderButton(googleBtnContainerCart, { theme: 'outline', size: 'large', type: 'standard', shape: 'pill', text: 'continue_with' });
  }
}

function loadCustomer() {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY) || 'null'); } catch { return null; }
}
function saveCustomer(data) { localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(data)); }
function applyCustomerToForm(c) {
  if (!accountFormCart || !c) return;
  const f = accountFormCart;
  if (f.fullName) f.fullName.value = c.fullName || '';
  if (f.email) f.email.value = c.email || '';
  if (f.phone) f.phone.value = c.phone || '';
  if (f.region) f.region.value = c.region || '';
  if (f.address) f.address.value = c.address || '';
  if (f.city) f.city.value = c.city || '';
  if (f.notes) f.notes.value = c.notes || '';
}

function updateAccountUI() {
  const isAuth = Boolean(user);
  if (googleBtnContainerCart) googleBtnContainerCart.style.display = isAuth ? 'none' : 'flex';
  if (accountProfileCart) accountProfileCart.hidden = !isAuth;
  if (accountFormCart) accountFormCart.hidden = !isAuth; // mostrar form tras login; para invitada, por botón
  if (isAuth) {
    accountNameCart.textContent = user.name || user.email;
    accountEmailCart.textContent = user.email || '';
  } else {
    accountNameCart.textContent = '';
    accountEmailCart.textContent = '';
  }
  const stored = loadCustomer();
  if (stored) applyCustomerToForm(stored);
}

window.addEventListener('load', async () => {
  try { const storedUser = JSON.parse(localStorage.getItem('mdUser') || 'null'); if (storedUser?.email) user = storedUser; } catch {}
  updateAccountUI();
  initGSI();
  await fetchCatalog();
  renderCart();
  // Revalidar stock periódicamente (cada 30s)
  setInterval(async () => {
    await fetchCatalog();
    const adjusted = reconcileCartWithStock();
    if (adjusted.length) {
      renderCart();
      showToast('Actualizamos tu bolsa por cambios de stock.');
    }
  }, 30000);
});

signOutCart?.addEventListener('click', () => {
  const email = user?.email;
  user = null;
  localStorage.removeItem('mdUser');
  if (window.google?.accounts?.id && email) {
    google.accounts.id.revoke(email, () => {});
    google.accounts.id.disableAutoSelect();
  }
  updateAccountUI();
  if (accountFormCart) accountFormCart.hidden = true;
});

guestCheckoutButtonCart?.addEventListener('click', () => {
  if (accountFormCart) accountFormCart.hidden = false;
  accountFormCart?.scrollIntoView({ behavior: 'smooth' });
  const first = accountFormCart?.querySelector('input[name="fullName"]');
  first?.focus();
});

accountFormCart?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(accountFormCart).entries());
  if (!data.fullName || !data.email || !data.address) {
    accountSavedMsgCart.textContent = 'Completa nombre, email y dirección para guardar.';
    return;
  }
  saveCustomer(data);
  accountSavedMsgCart.textContent = 'Datos guardados. Los usaremos al finalizar tu compra.';
});

useGoogleDataCart?.addEventListener('click', () => {
  if (!user) { accountSavedMsgCart.textContent = 'Inicia sesión con Google para usar tus datos.'; return; }
  applyCustomerToForm({ fullName: user.name || '', email: user.email || '' });
  accountSavedMsgCart.textContent = 'Completamos nombre y email desde tu cuenta Google.';
});

clearAccountCart?.addEventListener('click', () => {
  localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  applyCustomerToForm({});
  accountSavedMsgCart.textContent = 'Datos borrados.';
});

// Cart helpers
function loadCart() { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } }
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function renderCart() {
  const listEl = document.getElementById('cartListCart');
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
  let total = 0;
  cart.forEach((it) => {
    const line = document.createElement('li');
    const product = findProduct(it.productId);
    const title = product?.title || it.productId;
    const price = typeof product?.price === 'number' ? Number(product.price) : 0;
    const imgSrc = product?.image || product?.imageData || '';
    const max = Number(product?.stock ?? 99);
    const qty = Math.min(max, Number(it.quantity || 0));
    const subtotal = price * qty;
    total += subtotal;
    line.innerHTML = `
      <div class="inv-head">
        ${imgSrc ? `<img class="inventory-thumb" src="${imgSrc}" alt="${title}" />` : `<div class=\"inventory-thumb placeholder\"></div>`}
        <div class="inv-meta">
          <strong>${title}</strong>
          <span>
            Cantidad:
            <input type="number" class="qty-input-cart" data-id="${it.productId}" value="${qty}" min="0" max="${max}" style="width:80px;padding:0.3rem;border:1px solid var(--line);border-radius:0.5rem;margin-left:0.25rem;" />
            ${Number.isFinite(max) ? `<span class=\"helper-text\">/ ${max}</span>` : ''}
          </span>
        </div>
      </div>
      ${price ? `<span>Subtotal: $${subtotal.toLocaleString('es-CL')}</span>` : ''}
      <div>
        <button class="pill-button ghost small" data-remove-item data-id="${it.productId}">Quitar</button>
      </div>`;
    listEl.appendChild(line);
  });
  // Total
  const totalEl = document.createElement('li');
  totalEl.innerHTML = `<div class="inv-head"><div class="inv-meta"><strong>Total</strong></div></div><span><strong>$${total.toLocaleString('es-CL')}</strong></span>`;
  listEl.appendChild(totalEl);
}

// Ajusta cantidades si exceden stock o si item ya no existe
function reconcileCartWithStock() {
  const cart = loadCart();
  const changes = [];
  const next = [];
  for (const it of cart) {
    const p = findProduct(it.productId);
    if (!p || Number(p.stock || 0) <= 0) {
      // Mantener el ítem pero con cantidad 0 para que el usuario lo quite manualmente
      changes.push({ id: it.productId, type: 'out' });
      next.push({ productId: it.productId, quantity: 0 });
      continue;
    }
    const max = Number(p.stock);
    const q = Math.min(max, Number(it.quantity || 0));
    if (q !== it.quantity) changes.push({ id: it.productId, type: 'cap', to: q });
    next.push({ productId: it.productId, quantity: q });
  }
  saveCart(next);
  return changes;
}

document.getElementById('cartListCart')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove-item]');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  if (!id) return;
  const next = loadCart().filter((it) => it.productId !== id);
  saveCart(next);
  renderCart();
});

// Cambios de cantidad en vivo
document.getElementById('cartListCart')?.addEventListener('change', (e) => {
  const input = e.target.closest('.qty-input-cart');
  if (!input) return;
  const id = input.getAttribute('data-id');
  if (!id) return;
  let qty = Number(input.value);
  if (Number.isNaN(qty) || qty < 0) qty = 0;
  const max = Number(findProduct(id)?.stock ?? 99);
  if (qty > max) qty = max;
  // Aplica cambios
  const cart = loadCart();
  const idx = cart.findIndex((x) => x.productId === id);
  if (idx >= 0) {
    if (qty <= 0) cart.splice(idx, 1); else cart[idx].quantity = qty;
  }
  saveCart(cart);
  renderCart();
});

document.getElementById('clearCartCart')?.addEventListener('click', () => {
  localStorage.removeItem(CART_KEY);
  renderCart();
});

document.getElementById('checkoutCart')?.addEventListener('click', async () => {
  const msg = document.getElementById('checkoutMsgCart');
  const cart = loadCart();
  if (!cart.length) { msg.textContent = 'Tu bolsa está vacía.'; return; }
  // Verifica stock actualizado antes de enviar
  await fetchCatalog();
  const adjusted = reconcileCartWithStock();
  if (adjusted.length) {
    renderCart();
    msg.textContent = 'Actualizamos tu bolsa por cambios de stock. Revisa antes de confirmar.';
    return;
  }
  const customer = loadCustomer();
  if (!customer || !customer.fullName || !customer.email || !customer.address) {
    msg.textContent = 'Completa nombre, email y dirección antes de confirmar.';
    return;
  }
  try {
    const payload = {
      customer,
      items: cart,
      channel: user ? 'google' : 'guest',
      contactEmail: user?.email || customer.email,
      contactName: user?.name || customer.fullName,
    };
    const res = await fetch(`${API_BASE_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
