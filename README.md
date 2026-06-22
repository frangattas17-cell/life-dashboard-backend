# Life Dashboard Pro — Backend
Universidad ORT Uruguay · Negocios Digitales 2026

## Cómo correr en Replit

1. Subí esta carpeta `backend/` a un nuevo Repl (Node.js)
2. En **Secrets** agregá: `ANTHROPIC_API_KEY` = tu clave de Anthropic
3. Ejecutá: `npm install` y luego `npm start`
4. Abrí la URL que te da Replit

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/health | Estado del servidor |
| GET | /api/assets | Listar activos |
| POST | /api/assets | Crear activo |
| DELETE | /api/assets/:id | Eliminar activo |
| GET | /api/transactions | Listar movimientos |
| POST | /api/transactions | Registrar movimiento |
| DELETE | /api/transactions/:id | Eliminar movimiento |
| GET | /api/fixed-expenses | Listar gastos fijos |
| POST | /api/fixed-expenses | Crear gasto fijo |
| DELETE | /api/fixed-expenses/:id | Eliminar gasto fijo |
| GET | /api/report | Reporte financiero del mes |
| POST | /api/ai/chat | Asesor IA (chat) |
| POST | /api/ai/analyze | Análisis automático IA |

## Estructura del proyecto

```
backend/
  server.js        ← Servidor Express con toda la lógica
  package.json     ← Dependencias
  public/
    index.html     ← Frontend conectado al backend
```
