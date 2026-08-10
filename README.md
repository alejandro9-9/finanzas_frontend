# Flujo Finanzas

Aplicación web para administrar créditos, cuotas, capital e inversiones con un backend ASP.NET Core.

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
- `app/api/`: cliente y contratos del backend.
- `next.config.ts`: proxy de producción hacia la API desplegada en Render.

Los datos financieros se obtienen del backend y se almacenan en PostgreSQL.

## Comandos

- `npm test`: pruebas unitarias y de componentes.
- `npm run test:watch`: Vitest en modo interactivo.
- `npm run test:coverage`: pruebas con reporte en `coverage/`.
- `npm run test:e2e`: pruebas de navegador con Playwright.

- `npm run dev`: desarrollo local con recarga automática.
- `npm run build`: compilación optimizada de Next.js.
- `npm run start`: servidor de producción de Next.js.
- `npm run lint`: revisión estática del código.
