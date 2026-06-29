# 🚀 Cómo publicar la app (gratis, sin tarjeta)

Necesitás dos cuentas gratuitas y seguir estos pasos. Te lleva unos 10 minutos.

---

## Paso 1 — Crear base de datos en Upstash (Redis gratis)

1. Entrá a **https://upstash.com** → Sign Up (con Google o email)
2. Una vez adentro: **Create Database**
3. Nombre: `google-reviews` | Region: **South America (São Paulo)** | Type: Regional
4. Click **Create**
5. En la página de tu database, copiá:
   - **UPSTASH_REDIS_REST_URL** (algo como `https://xxx.upstash.io`)
   - **UPSTASH_REDIS_REST_TOKEN** (string largo)
6. Guardá esos dos valores — los necesitás en el Paso 3

---

## Paso 2 — Subir el código a GitHub

1. Entrá a **https://github.com** → Sign Up (gratis)
2. Click en **+** → **New repository**
3. Nombre: `google-reviews` | Visibility: Private | Click **Create repository**
4. Seguí las instrucciones para subir esta carpeta:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TU_USUARIO/google-reviews.git
   git push -u origin main
   ```
   (Si no tenés git instalado: descargalo de https://git-scm.com)

---

## Paso 3 — Publicar en Vercel (hosting gratis)

1. Entrá a **https://vercel.com** → Sign Up con tu cuenta de GitHub
2. Click **Add New Project** → importá el repo `google-reviews`
3. Vercel detecta que es Node.js → click **Deploy** (sin cambiar nada más)
4. Una vez deployado, vas a **Settings → Environment Variables** y agregás:

   | Variable | Valor |
   |----------|-------|
   | `UPSTASH_REDIS_REST_URL` | (copiado del Paso 1) |
   | `UPSTASH_REDIS_REST_TOKEN` | (copiado del Paso 1) |
   | `ADMIN_PASSWORD` | Tu contraseña (la que quieras) |
   | `TOTAL_PIECES` | `100` |

5. Vas a **Deployments** → click en los tres puntos → **Redeploy** para aplicar las variables
6. Tu app ya está viva en: `https://google-reviews-xxx.vercel.app`

---

## ✅ Cómo usar el sistema

### Configurar las piezas antes de salir a vender
- Abrí el panel: `https://tu-app.vercel.app/public/login.html`
- Ingresá tu contraseña
- Las 100 piezas van a aparecer como "Libres"

### En el local del cliente (instalación)
1. Abrí el dashboard en tu celular
2. Buscá la pieza que vas a instalar (ej: #042)
3. Click → ponés el nombre del negocio + link de Google
4. **¿Cómo obtenés el link de Google?**
   - Abrís Google Maps en tu celu
   - Buscás el negocio
   - Toco en "Compartir" → "Copiar enlace"
   - Pegás en el campo
5. Guardás → la pieza ya redirige al instante

### Programar los chips NFC (NTAG213)
- Descargá **NFC Tools** (gratis, Android/iOS)
- Abrí la app → Write → Add a record → URL
- Ponés: `https://tu-app.vercel.app/r/042?s=n`
  (cambiá 042 por el número de tu pieza)
- Acercá el celular al chip → Write → listo

### QR para imprimir
- En el dashboard, abrís una pieza → aparece el QR automáticamente
- Botón "Descargar QR" → guardás la imagen
- El QR ya tiene la URL correcta con `?s=q` para trackear que vino de QR

---

## 📱 URLs del sistema

| Tipo | URL |
|------|-----|
| Panel admin | `/public/login.html` |
| Dashboard | `/public/dashboard.html` |
| Redirect QR | `/r/001?s=q` |
| Redirect NFC | `/r/001?s=n` |
| API piezas | `/api/admin/pieces` |
| API stats | `/api/admin/stats` |
| API QR imagen | `/api/admin/qr?code=001` |
