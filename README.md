# madejadictas® · Catálogo ecommerce de insumos para tejido

Proyecto base estático listo para publicarse en GitHub Pages. Contiene hero responsivo, catálogo con fotos simbólicas, kits personalizables, creadoras destacadas y un flujo de referencia para login con Google o compra como invitada.

## Estructura

- `index.html`: layout principal y componentes semánticos.
- `styles.css`: sistema de diseño (tipografías, grid responsivo, chips, paleta).
- `script.js`: datos de ejemplo para el catálogo, filtros, diálogo de flujo y helpers (smooth scroll, sello de build, menú mobile).
- `backend/`: API Express lista para Cloud Run + Cloud Firestore (`backend/README.md` tiene los pasos).

## Ver localmente

1. Clona este repo y abre `index.html` en tu navegador, o levanta un servidor estático:
   ```bash
   cd madejadictas
   python3 -m http.server 4173
   ```
2. Visita `http://localhost:4173` y valida el diseño en desktop + mobile.

## Deploy en GitHub Pages

1. Crea un repo en GitHub y sube estos archivos (sin build step).
2. En **Settings → Pages**, selecciona la rama (`main`/`master`) y la carpeta `/root`.
3. Guarda y espera unos minutos; tu sitio quedará servido en `https://<usuario>.github.io/<repo>/`.
4. Cada push a la rama configurada actualiza automáticamente el sitio.

## Próximos pasos sugeridos

1. **Login con Google**
   - Habilita Google Identity Services y copia el `client_id`.
   - Reemplaza el flujo de ejemplo en `script.js` con `google.accounts.id.initialize` y `prompt()`.
   - Envía el token al backend o usa Firebase/Netlify Identity si no habrá backend propio.
2. **Checkout invitado**
   - Construye un formulario ligero (nombre, email, dirección, método de despacho).
   - Persiste temporalmente en `localStorage` y envía vía API al confirmar compra.
3. **Catálogo dinámico**
   - Lleva el arreglo `products` a un archivo JSON o un CMS headless para editarlo sin tocar código.
4. **Analítica y performance**
   - Añade metadatos Open Graph, favicon y medición (p.ej. Google Analytics 4) antes del lanzamiento público.

## Backend en GCP

El backend vive en `backend/` y expone endpoints para CRUD de productos sobre Cloud Firestore. Incluye `Dockerfile` y `cloudbuild.yaml` para desplegar a Cloud Run:

```bash
cd backend
npm install
gcloud builds submit --config ../cloudbuild.yaml --substitutions _ADMIN_API_KEY="clave-real"
```

Consulta `backend/README.md` para ver variables de entorno, autenticación con `x-admin-key` y comandos adicionales.

Con esto ya tienes un punto de partida visual para iterar contenido, conversar con stakeholders y avanzar en la integración real de autenticación y checkout. ¡A tejer! 🧶
