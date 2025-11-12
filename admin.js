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
    li.dataset.id = item.id;
    const imgSrc = item.image || item.imageData || "";
    li.innerHTML = `
      <div class="inv-head">
        ${imgSrc
          ? `<img class="inventory-thumb" src="${imgSrc}" alt="Foto ${item.title}" />`
          : `<div class="inventory-thumb placeholder" aria-hidden="true"></div>`}
        <div class="inv-meta">
          <strong>${item.title}</strong>
          <span>Categoría: ${item.category}</span>
          <span class="helper-text">ID interno: ${item.id}</span>
        </div>
      </div>
      <div class="two-col">
        <label>
          Precio (CLP)
          <input type="number" class="inv-price" min="0" step="1" value="${Number(
            item.price
          )}" />
        </label>
        <label>
          Stock
          <input type="number" class="inv-stock" min="0" step="1" value="${Number(
            item.stock
          )}" />
        </label>
      </div>
      <div>
        <button class="pill-button secondary small save-item">Guardar cambios</button>
        <button class="pill-button ghost small edit-item">Editar</button>
      </div>
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
  const showroomForm = document.getElementById('showroomForm');
  if (showroomForm) showroomForm.hidden = !isAuth;
  const newsForm = document.getElementById('newsForm');
  if (newsForm) newsForm.hidden = !isAuth;
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
    price: Number(entry.price),
    stock: Number(entry.stock),
    category: entry.category,
    notes: entry.notes?.trim(),
  };
  if (!payload.title || Number.isNaN(payload.price) || Number.isNaN(payload.stock)) {
    alert("Completa nombre, precio y stock antes de guardar.");
    return;
  }
  if (!payload.notes) delete payload.notes;

  // Foto requerida: tomamos el archivo, comprimimos y adjuntamos como dataURL
  const file = document.querySelector('#photoInput').files[0];
  if (!file) {
    alert('La foto del producto es requerida.');
    return;
  }
  try {
    const dataUrl = await compressImageToDataURL(file, 1280, 1280, 0.72);
    payload.imageData = dataUrl; // backend acepta dataURL
  } catch (err) {
    console.error(err);
    alert('No pudimos procesar la foto. Intenta con otra imagen.');
    return;
  }

  // Campos por categoría
  if (payload.category === 'hilados') {
    payload.thickness = entry.thickness?.trim();
    payload.composition = entry.composition?.trim();
    payload.lengthWeight = entry.lengthWeight?.trim();
  }
  // Tags
  if (entry.tags) {
    payload.tags = String(entry.tags)
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

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
    // Limpia vista previa
    const preview = document.getElementById('photoPreview');
    if (preview) preview.hidden = true;
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

// Actualización inline de precio/stock
inventoryList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".save-item");
  if (btn) {
    const li = btn.closest("li");
    const id = li?.dataset?.id;
    if (!id) return;
    const priceEl = li.querySelector(".inv-price");
    const stockEl = li.querySelector(".inv-stock");
    const price = Number(priceEl?.value);
    const stock = Number(stockEl?.value);
    if (Number.isNaN(price) || price < 0 || Number.isNaN(stock) || stock < 0) {
      alert("Revisa los valores de precio y stock.");
      return;
    }
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      };
      if (adminKey) headers[ADMIN_HEADER] = adminKey;
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ price, stock }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el producto");
      const { product } = await res.json();
      const idx = inventory.findIndex((p) => p.id === id);
      if (idx >= 0) {
        inventory[idx] = { ...inventory[idx], price: product.price, stock: product.stock };
      }
      renderInventory();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error actualizando");
    }
    return;
  }
  const editBtn = e.target.closest('.edit-item');
  if (editBtn) {
    const li = editBtn.closest('li');
    const id = li?.dataset?.id;
    if (!id) return;
    openEditDialog(id);
  }
});

// Diálogo de edición completa
const editDialog = document.getElementById('editProductDialog');
const editClose = document.getElementById('editClose');
const editForm = document.getElementById('editProductForm');
const editCategory = document.getElementById('editCategory');
const editYarnFields = document.getElementById('editYarnFields');
const editLWField = document.getElementById('editLWField');
const editPhotoInput = document.getElementById('editPhotoInput');
let editId = null;

function updateEditCategoryFields() {
  const isYarn = editCategory?.value === 'hilados';
  if (editYarnFields) editYarnFields.hidden = !isYarn;
  if (editLWField) editLWField.hidden = !isYarn;
}
editCategory?.addEventListener('change', updateEditCategoryFields);

function openEditDialog(id) {
  const item = inventory.find((p) => p.id === id);
  if (!item) return;
  editId = id;
  // Prefill
  const els = editForm?.elements || {};
  if (editCategory) editCategory.value = item.category || 'accesorios';
  if (els['title']) els['title'].value = item.title || '';
  if (els['price']) els['price'].value = item.price ?? 0;
  if (els['stock']) els['stock'].value = item.stock ?? 0;
  if (els['thickness']) els['thickness'].value = item.thickness || '';
  if (els['composition']) els['composition'].value = item.composition || '';
  if (els['lengthWeight']) els['lengthWeight'].value = item.lengthWeight || '';
  if (els['tags']) els['tags'].value = Array.isArray(item.tags) ? item.tags.join(' ') : '';
  if (els['notes']) els['notes'].value = item.notes || '';
  updateEditCategoryFields();
  editDialog.showModal();
}

editClose?.addEventListener('click', () => editDialog?.close());

editForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!editId) return;
  const data = Object.fromEntries(new FormData(editForm).entries());
  const payload = {
    title: data.title?.trim(),
    category: data.category,
    price: Number(data.price),
    stock: Number(data.stock),
    notes: data.notes?.trim(),
  };
  if (payload.category === 'hilados') {
    payload.thickness = data.thickness?.trim();
    payload.composition = data.composition?.trim();
    payload.lengthWeight = data.lengthWeight?.trim();
  } else {
    payload.thickness = undefined;
    payload.composition = undefined;
    payload.lengthWeight = undefined;
  }
  if (data.tags) {
    payload.tags = String(data.tags)
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  // Foto opcional nueva
  if (editPhotoInput && editPhotoInput.files && editPhotoInput.files[0]) {
    try {
      const dataUrl = await compressImageToDataURL(editPhotoInput.files[0], 1280, 1280, 0.72);
      payload.imageData = dataUrl;
    } catch (err) {
      console.error(err);
      alert('No pudimos procesar la foto nueva.');
      return;
    }
  }
  try {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` };
    if (adminKey) headers[ADMIN_HEADER] = adminKey;
    const res = await fetch(`${API_BASE_URL}/api/products/${editId}/full`, {
      method: 'PATCH', headers, body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let data = null;
      try { data = await res.json(); } catch {}
      if (res.status === 404) {
        alert('No se pudo guardar: producto no encontrado o ruta "/full" no disponible en el backend. Recargaremos el inventario.');
        await fetchInventoryFromBackend();
        return;
      }
      const msg = (data && (data.error || data.message)) || 'No se pudo guardar cambios';
      throw new Error(msg);
    }
    const { product } = await res.json();
    const idx = inventory.findIndex((p) => p.id === editId);
    if (idx >= 0) inventory[idx] = { ...inventory[idx], ...product };
    renderInventory();
    editDialog.close();
  } catch (err) {
    console.error(err);
    alert(err.message || 'Error guardando cambios');
  }
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

// Utilidades de imagen: compresión a dataURL
function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImageToDataURL(file, maxW = 1280, maxH = 1280, quality = 0.72) {
  const img = await readFileAsImage(file);
  let { width, height } = img;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  const targetW = Math.round(width * ratio);
  const targetH = Math.round(height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetW, targetH);
  // Forzar JPEG para mayor compresión
  return canvas.toDataURL('image/jpeg', quality);
}

// Vista previa de imagen
const photoInput = document.getElementById('photoInput');
if (photoInput) {
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    const preview = document.getElementById('photoPreview');
    const imgEl = document.getElementById('photoPreviewImg');
    const meta = document.getElementById('photoMeta');
    if (!file) {
      if (preview) preview.hidden = true;
      return;
    }
    try {
      const dataUrl = await compressImageToDataURL(file, 800, 800, 0.7);
      if (imgEl) imgEl.src = dataUrl;
      if (meta) meta.textContent = `Archivo: ${file.name} • Original ${(file.size/1024).toFixed(0)} KB • Envío ~${(dataURLSizeKB(dataUrl)).toFixed(0)} KB`;
      if (preview) preview.hidden = false;
    } catch (e) {
      console.warn('No se pudo generar vista previa', e);
    }
  });
}

function dataURLSizeKB(dataUrl) {
  // Tamaño aproximado en KB del base64
  const head = 'base64,';
  const i = dataUrl.indexOf(head);
  if (i < 0) return 0;
  const b64 = dataUrl.slice(i + head.length);
  return (b64.length * 3) / 4 / 1024;
}

// Showrooms: compresión múltiple + publicación
const showroomPhotos = document.getElementById('showroomPhotos');
const showroomPreview = document.getElementById('showroomPreview');
const showroomForm = document.getElementById('showroomForm');

if (showroomPhotos) {
  showroomPhotos.addEventListener('change', async () => {
    const files = Array.from(showroomPhotos.files || []).slice(0, 10);
    showroomPreview.innerHTML = '';
    if (!files.length) { showroomPreview.hidden = true; return; }
    for (const f of files) {
      try {
        const dataUrl = await compressImageToDataURL(f, 1000, 1000, 0.7);
        const sizeKB = dataURLSizeKB(dataUrl);
        const block = document.createElement('div');
        block.style.display = 'flex';
        block.style.alignItems = 'center';
        block.style.gap = '0.5rem';
        block.innerHTML = `
          <img src="${dataUrl}" alt="preview" class="inventory-thumb" />
          <span class="helper-text">${f.name} • ~${sizeKB.toFixed(0)} KB</span>
        `;
        showroomPreview.appendChild(block);
      } catch {}
    }
    showroomPreview.hidden = false;
  });
}

if (showroomForm) {
  showroomForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !idToken) { alert('Inicia sesión con Google'); return; }
    const files = Array.from(showroomPhotos.files || []).slice(0, 10);
    if (!files.length) { alert('Agrega al menos una foto'); return; }
    const body = Object.fromEntries(new FormData(showroomForm).entries());
    try {
      const photos = [];
      for (const f of files) {
        const dataUrl = await compressImageToDataURL(f, 1000, 1000, 0.7);
        photos.push(dataUrl);
      }
      const payload = {
        title: body.title?.trim(),
        date: body.date,
        location: body.location?.trim(),
        description: body.description?.trim(),
        photos,
      };
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` };
      if (adminKey) headers[ADMIN_HEADER] = adminKey;
      const res = await fetch(`${API_BASE_URL}/api/showrooms`, {
        method: 'POST', headers, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('No se pudo publicar el showroom');
      showroomForm.reset();
      showroomPreview.innerHTML = '';
      showroomPreview.hidden = true;
      alert('Showroom publicado');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error publicando showroom');
    }
  });
}

// Noticias: opcional 1 foto + creación
const newsPhoto = document.getElementById('newsPhoto');
const newsPreview = document.getElementById('newsPreview');
const newsForm = document.getElementById('newsForm');

if (newsPhoto) {
  newsPhoto.addEventListener('change', async () => {
    const file = newsPhoto.files && newsPhoto.files[0];
    newsPreview.innerHTML = '';
    if (!file) { newsPreview.hidden = true; return; }
    try {
      const dataUrl = await compressImageToDataURL(file, 1000, 1000, 0.7);
      const sizeKB = dataURLSizeKB(dataUrl);
      const block = document.createElement('div');
      block.style.display = 'flex';
      block.style.alignItems = 'center';
      block.style.gap = '0.5rem';
      block.innerHTML = `
        <img src="${dataUrl}" alt="preview" class="inventory-thumb" />
        <span class="helper-text">${file.name} • ~${sizeKB.toFixed(0)} KB</span>
      `;
      newsPreview.appendChild(block);
      newsPreview.hidden = false;
    } catch {}
  });
}

if (newsForm) {
  newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !idToken) { alert('Inicia sesión con Google'); return; }
    const data = Object.fromEntries(new FormData(newsForm).entries());
    const payload = { title: data.title?.trim(), text: data.text?.trim() };
    if (!payload.title || !payload.text) { alert('Completa título y texto'); return; }
    if (newsPhoto && newsPhoto.files && newsPhoto.files[0]) {
      try { payload.imageData = await compressImageToDataURL(newsPhoto.files[0], 1200, 1200, 0.72); } catch {}
    }
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` };
      if (adminKey) headers[ADMIN_HEADER] = adminKey;
      const res = await fetch(`${API_BASE_URL}/api/news`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('No se pudo publicar la noticia');
      newsForm.reset();
      if (newsPreview) { newsPreview.innerHTML = ''; newsPreview.hidden = true; }
      alert('Noticia publicada');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error publicando noticia');
    }
  });
}

// Mostrar/Ocultar campos de Hilados según categoría
const categorySelect = document.getElementById('categorySelect');
const yarnFields = document.getElementById('yarnFields');
const lwField = document.getElementById('lwField');
function updateCategoryFields() {
  const val = categorySelect?.value;
  const isYarn = val === 'hilados';
  if (yarnFields) yarnFields.hidden = !isYarn;
  if (lwField) lwField.hidden = !isYarn;
}
categorySelect?.addEventListener('change', updateCategoryFields);
updateCategoryFields();
