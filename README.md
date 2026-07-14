# App Clima y Outfit con IA

Aplicación web full-stack que recomienda un estilo de ropa personalizado dependiendo del clima en una ciudad específica, impulsado por Google Gemini.

## Instalación y Ejecución

### 1. Variables de entorno
Dentro de la carpeta `backend`, edita el archivo `.env` e inserta tu clave de la API de Gemini:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="supersecretjwtkeyforprototype"
GEMINI_API_KEY="TU_CLAVE_DE_GEMINI_AQUI"
```

### 2. Levantar el Backend
Abre una terminal y ejecuta:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
node server.js
```

### 3. Levantar el Frontend
Abre otra terminal y ejecuta:
```bash
cd frontend
npm install
npm run dev
```

### 4. Uso
Entra a `http://localhost:5173`. Tendrás que registrarte obligatoriamente. Tras el registro, verás un anuncio simulado de 5 segundos, y luego podrás usar el buscador de clima o el botón de geolocalización.
