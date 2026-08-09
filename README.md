# Flujo Finanzas

Panel local para controlar un préstamo, distribuir capital entre inversiones y medir su rentabilidad.

## Desarrollo

```powershell
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Estructura

- `app/page.tsx`: interfaz y lógica del panel.
- `app/globals.css`: estilos globales.
- `app/layout.tsx`: estructura, fuentes y metadatos.
- `public/`: recursos públicos.
- `worker/`: entrada de producción para Cloudflare.
- `build/`: integración de compilación con Sites.
- `.openai/hosting.json`: configuración de recursos de Sites.

Los datos se guardan en `localStorage` del navegador. No se utiliza una base de datos externa.

## Comandos

- `npm run dev`: desarrollo local con recarga automática.
- `npm run build`: compilación de producción con Vinext.
- `npm run start`: servidor de producción Vinext.
- `npm run lint`: revisión estática del código.
