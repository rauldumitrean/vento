# 🌤️ Ventoo - AI Fashion & Weather Assistant

Ventoo es una innovadora aplicación web Full-Stack que combina datos meteorológicos en tiempo real con Inteligencia Artificial generativa para recomendar el outfit perfecto basado en tu ubicación y el clima actual.

## ✨ Características Principales

* **Recomendaciones Inteligentes:** Analiza la temperatura, humedad, viento y sensación térmica para sugerir ropa mediante **Google Gemini AI**.
* **Armario Virtual:** Permite a los usuarios guardar sus propias prendas. La IA dará prioridad a la ropa del armario del usuario antes de recomendar artículos nuevos.
* **Asistente de Estilo Conversacional:** Chat integrado en tiempo real donde puedes preguntarle a la IA dudas sobre el outfit sugerido o pedirle alternativas.
* **Visualización Dinámica:** Generación de imágenes en tiempo real de cada prenda de ropa utilizando **Pollinations AI**.
* **Geolocalización y Autocompletado:** Búsqueda inteligente de ciudades de todo el mundo mediante la API de Open-Meteo.
* **Monetización Inteligente:** Enlaces de compra directos a Amazon generados mediante IA con etiquetas de afiliado integradas.
* **Modo Oscuro:** Interfaz premium y adaptable a las preferencias del usuario.

## 🛠️ Tecnologías Utilizadas

### Frontend
* **React + Vite:** Para una experiencia de usuario extremadamente rápida.
* **Tailwind CSS:** Para un diseño elegante, totalmente responsive y soporte nativo para Dark Mode.
* **Framer Motion:** Para animaciones fluidas y transiciones de pantalla complejas (como el panel de inicio de sesión deslizable).
* **Lucide React:** Iconografía moderna.

### Backend
* **Node.js + Express:** Arquitectura robusta y escalable.
* **Prisma ORM:** Interacción segura y tipada con la base de datos.
* **PostgreSQL (Neon):** Base de datos relacional Serverless alojada en la nube.
* **JWT (JSON Web Tokens):** Para autenticación segura de usuarios.

### APIs de Inteligencia Artificial y Datos
* **Google Gemini:** El cerebro detrás de las recomendaciones de moda y el chat conversacional.
* **Pollinations AI:** Para la renderización dinámica de prendas.
* **Open-Meteo API:** Proveedor de datos meteorológicos y geocodificación.

## 🚀 Despliegue en Producción

Toda la aplicación está diseñada con una arquitectura moderna **Serverless**:
* **Frontend:** Desplegado en Vercel
* **Backend:** Desplegado en Vercel Serverless Functions
* **Base de datos:** Neon Tech Serverless Postgres

---
*Diseñado y programado por [Raul Florin Dumitrean](https://rfdportfolio.vercel.app/)*
