# Backend madejadictas® (Cloud Run + Cloud Firestore)

Servicio Express preparado para correr en Google Cloud Run, usando Cloud Firestore como base de datos y Firebase Admin para autenticación de servicio.

## Requirements

- Node.js >= 20
- Una cuenta de GCP con Firestore habilitado (modo nativo)
- `gcloud` CLI autenticada

## Desarrollo local

```bash
cd backend
npm install
cp .env.example .env # ajusta ADMIN_API_KEY, GOOGLE_CLIENT_ID y ALLOWED_ADMINS
npm run dev
```

El servidor expone (con login Google obligatorio):

- `GET /healthz`
- `GET /api/products?category=lanas&limit=10`
- `POST /api/products`
- `PATCH /api/products/:id/stock`

Para conectar con Firestore localmente debes exportar `GOOGLE_APPLICATION_CREDENTIALS` apuntando al JSON del service account.

## Despliegue en Cloud Run

1. Build & push (manual):
   ```bash
   cd backend
   gcloud builds submit --tag gcr.io/<PROJECT_ID>/madejadictas-api
   gcloud run deploy madejadictas-api \
     --image gcr.io/<PROJECT_ID>/madejadictas-api \
     --region us-central1 \
     --set-env-vars "ADMIN_API_KEY=superclave,GOOGLE_CLIENT_ID=TU_CLIENT_ID.apps.googleusercontent.com,ALLOWED_ADMINS=claudia@madejadictas.com,carla@madejadictas.com,hector@madejadictas.com,ENFORCE_ADMIN_API_KEY=false" \
     --allow-unauthenticated
   ```
2. Alternativamente usa `cloudbuild.yaml` en la raíz del repo para automatizar.

El runtime usará la identidad asociada al servicio para escribir/leer en Firestore. Asegúrate de asignar el rol `roles/datastore.user`.

## Próximos pasos

- Verificación de token Google: agregada con `verifyGoogle`. El backend ahora exige un ID token válido y correo permitido en `ALLOWED_ADMINS`.
- Añadir endpoints para órdenes/pagos y reglas de Firestore adicionales.
- Configurar Cloud Scheduler + Pub/Sub para tareas de inventario (reposición, alertas).
