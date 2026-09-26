# Lote visual de eventos de prueba

Este tooling prepara 15 eventos publicados con entradas activas para recorrer evento, carrito, reserva, Mercado Pago TEST y emisión de ticket/QR.

## Barreras de seguridad

- `dry-run` no escribe en la API, Prisma ni R2.
- `load` consulta `https://api.mercadolibre.com/users/me` y sólo continúa cuando la credencial informa una cuenta `test_user`.
- El preflight exige `FRONT_URL` y `BASE_URL` públicas por HTTPS, porque los tickets y QR se generan desde el webhook.
- No existe un flag para omitir la verificación de Mercado Pago.
- La carga exige `--apply --confirm <batchId>`.
- Los eventos se crean primero como `draft` y se publican al completar los 15.
- Cada descripción incluye `[BLACKNIGHT_TEST_BATCH:<batchId>]`.
- Cada portada subida y cada ID creado se guarda en `.test-events/manifest-<batchId>.json`.
- Los secretos administrativos se reciben por variables de entorno y nunca se guardan en el manifiesto.

## Dry-run

```powershell
npm run test-events:dry-run -- --batch-id BN_TEST15_YYYYMMDD_XXXXXXXX
```

Si se omite `--batch-id`, el comando genera uno. El reporte queda en `.test-events/dry-run-<batchId>.json`. Para considerar el lote apto deben pasar catálogo, configuración R2, las 15 portadas y la verificación remota de la cuenta TEST.

## Carga

Configurar las credenciales administrativas únicamente en la sesión de terminal:

```powershell
$env:BN_TEST_API_BASE_URL = "http://localhost:3001/api"
$env:BN_ADMIN_EMAIL = "admin@example.com"
$env:BN_ADMIN_PASSWORD = "..."
npm run test-events:load -- --batch-id BN_TEST15_YYYYMMDD_XXXXXXXX --apply --confirm BN_TEST15_YYYYMMDD_XXXXXXXX
```

También puede proporcionarse una cookie ya autenticada mediante `BN_ADMIN_COOKIE`. La carga usa el flujo real: URL firmada de portada, `PUT` a R2, creación administrativa del evento y publicación por `PUT /api/events/:id`.

## Limpieza

Vista previa de los datos relacionados:

```powershell
npm run test-events:cleanup -- --batch-id BN_TEST15_YYYYMMDD_XXXXXXXX
```

Eliminación efectiva:

```powershell
npm run test-events:cleanup -- --batch-id BN_TEST15_YYYYMMDD_XXXXXXXX --apply --confirm BN_TEST15_YYYYMMDD_XXXXXXXX
```

La limpieza cruza el tag con el manifiesto y elimina, dentro de una transacción, tickets/QR, registros, pagos locales, items de reserva, reservas, tipos de entrada y eventos. Después elimina de R2 sólo las claves de portada registradas y validadas. Las operaciones de Mercado Pago son de prueba; el script no intenta cancelar ni reembolsar movimientos externos.

El script toma Prisma y el cliente S3 instalados en el backend hermano. Si el backend está en otra ubicación puede indicarse `--api-root C:\ruta\al\api`.
