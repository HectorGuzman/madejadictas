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
cp .env.example .env # ajusta ADMIN_API_KEY
npm run dev
```

El servidor expone:

- `GET /healthz`
- `GET /api/products?category=lanas&limit=10`
- `POST /api/products` (requiere header `x-admin-key`)
- `PATCH /api/products/:id/stock` (requiere header `x-admin-key`)

Para conectar con Firestore localmente debes exportar `GOOGLE_APPLICATION_CREDENTIALS` apuntando al JSON del service account.

## Despliegue en Cloud Run

1. Build & push (manual):
   ```bash
   cd backend
   gcloud builds submit --tag gcr.io/<PROJECT_ID>/madejadictas-api
   gcloud run deploy madejadictas-api \
     --image gcr.io/<PROJECT_ID>/madejadictas-api \
     --region us-central1 \
     --set-env-vars "ADMIN_API_KEY=superclave" \
     --allow-unauthenticated
   ```
2. Alternativamente usa `cloudbuild.yaml` en la raíz del repo para automatizar.

El runtime usará la identidad asociada al servicio para escribir/leer en Firestore. Asegúrate de asignar el rol `roles/datastore.user`.

## Próximos pasos

- Integrar verificación de token de Google Identity Services en lugar del header estático.
- Añadir endpoints para órdenes/pagos y reglas de Firestore adicionales.
- Configurar Cloud Scheduler + Pub/Sub para tareas de inventario (reposición, alertas).
