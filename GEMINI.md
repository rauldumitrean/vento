# Reglas del Proyecto — Ventoo (AppClima)

## Proyecto
- Nombre: **Ventoo**
- Repositorio GitHub: `https://github.com/rauldumitrean/vento.git`
- Deploy: **Vercel** (auto-deploy en cada push a `main`). Plan FREE → máx. ~100 deploys/mes.
- Rama principal: `main`

## Stack
- **Frontend:** React 19 + Vite 8 + Tailwind CSS v4 + Framer Motion + TanStack Query → desplegado en Vercel
- **Backend:** Node.js + Express 5 + Prisma ORM + PostgreSQL (Neon Serverless) → desplegado en Vercel Serverless Functions
- **IA:** Google Gemini (outfits, chat, links afiliado) + Pollinations AI (imágenes de prendas)
- **Clima:** Open-Meteo API (gratuita, sin key)
- **Pagos:** Stripe (plan mensual + lifetime)
- **Monitoring:** Sentry (frontend + backend)
- **Auth:** JWT + Google OAuth + Apple Sign-in

## Git — Setup en esta máquina
- Git portátil instalado en: `$env:USERPROFILE\AppData\Local\Programs\Git\cmd\`
- **Antes de cualquier comando git**, añadir al PATH de la sesión:
  ```powershell
  $env:Path = "$env:USERPROFILE\AppData\Local\Programs\Git\cmd;" + $env:Path
  ```
- El remote ya tiene el token PAT incluido en la URL — no se necesita interacción manual de credenciales.
- Directorio marcado como safe: `E:/08. Proyectos/AppClima`

## Política de commits y push

### ✅ SIEMPRE al terminar cambios de código
Ejecutar el ciclo completo:
```powershell
$env:Path = "$env:USERPROFILE\AppData\Local\Programs\Git\cmd;" + $env:Path
git add .
git commit -m "<tipo>: <descripción>"
git push origin main
```

### ⚡ Optimización para no agotar Vercel Free (~100 deploys/mes)
- **Agrupar** todos los cambios relacionados de una tarea en **un solo commit y un solo push**.
- Si una tarea implica cambios en múltiples ficheros, hacer primero TODOS los cambios y luego **un único push** al final.
- **No hacer push** por cambios triviales no funcionales (whitespace, comentarios menores) — acumularlos con el siguiente cambio real.
- Si se van a hacer varias mejoras seguidas en la misma sesión, **preguntar al usuario** si prefiere agruparlas todas en un único push al final.

### 📝 Formato de mensajes de commit (Conventional Commits)
- `feat:` — nueva funcionalidad
- `fix:` — corrección de bug
- `chore:` — mantenimiento, limpieza, dependencias
- `refactor:` — refactorización sin cambio funcional
- `style:` — cambios de UI/CSS
- `perf:` — mejora de rendimiento
