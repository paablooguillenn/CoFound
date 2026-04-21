# CoFound Landing — Deploy Guide

Landing page estática lista para subir a cualquier hosting. Todo funciona client-side; no necesita backend.

**Descarga del APK:** los botones apuntan a GitHub Releases de `paablooguillenn/CoFound`. Asegúrate de que exista un release con el asset `cofound.apk` (o cambia la URL en `index.html` si el repo cambia).

---

## 🚀 Opción 1 — Vercel (más rápido, recomendado)

1. Crea cuenta en [vercel.com](https://vercel.com) con tu GitHub.
2. En el dashboard → **Add New → Project**.
3. Importa el repo donde subiste esta carpeta, o **arrastra la carpeta** directamente al área de "Import".
4. Framework Preset: **Other** (es HTML plano). Root directory: donde esté `index.html`.
5. Click **Deploy**. En ~30s tendrás una URL `tuproyecto.vercel.app`.
6. **Dominio custom:** Project → Settings → Domains → añade tu dominio. Vercel te dice los registros DNS (A/CNAME) que tienes que poner en Namecheap / GoDaddy / donde compraste el dominio.

SSL automático, CDN global, gratis.

---

## 🚀 Opción 2 — Netlify (drag & drop)

1. [app.netlify.com/drop](https://app.netlify.com/drop) → **arrastra esta carpeta `deploy/` entera** al navegador.
2. Te da URL instantánea tipo `random-name-123.netlify.app`.
3. **Dominio custom:** Site settings → Domain management → Add custom domain.

Cero configuración. Gratis.

---

## 🚀 Opción 3 — GitHub Pages

1. Crea un repo nuevo en GitHub (ej. `cofound-landing`) o usa una carpeta `/docs` del repo existente.
2. Sube todo el contenido de esta carpeta al repo.
3. Repo → **Settings → Pages → Source: Deploy from branch → `main` → `/root`** (o `/docs`).
4. En 1-2 minutos: `paablooguillenn.github.io/cofound-landing`.
5. **Dominio custom:** Settings → Pages → Custom domain → guarda el dominio, luego en tu registrador de dominio crea un CNAME apuntando a `paablooguillenn.github.io`.

Gratis.

---

## 🌐 Comprar un dominio

Si aún no tienes dominio, opciones recomendadas:
- **Namecheap** — barato, ~10€/año. `.app` y `.com`.
- **Cloudflare Registrar** — precio al coste, sin markup.
- **Porkbun** — barato, UI moderna.

Sugerencias de nombre disponibles (comprueba):
- `cofound.app`
- `cofound.es`
- `trycofound.com`
- `getcofound.com`

---

## 📁 Estructura

```
deploy/
├── index.html              ← La landing (renombrada para que sea la home)
├── assets/
│   ├── logo-mark.png       ← Favicon + hero
│   ├── logocofound.png     ← Og:image para previews en redes
│   ├── logocofound-v2.png
│   └── tailwind-compiled.css
└── README.md               ← Este archivo
```

---

## 🔍 Para que Google te encuentre

Después de desplegar:

1. Ve a [Google Search Console](https://search.google.com/search-console) y añade tu dominio.
2. Verifica propiedad (método DNS o HTML file).
3. Envía el sitemap (o simplemente la URL raíz).
4. **Tarda de días a semanas** en indexar.

Para ayudar al SEO, ya tienes:
- ✅ `<meta description>` optimizado
- ✅ Open Graph tags (preview bonito en WhatsApp/Twitter/LinkedIn)
- ✅ Canonical URL
- ✅ Favicon

**Recomendado extra:**
- Crea un `sitemap.xml` básico (solo la URL raíz si la landing es de una sola página).
- Añade un `robots.txt` con `Allow: /`.

---

## ✏️ Editar la landing después de desplegar

- **Vercel/Netlify con repo conectado:** push a `main` → redeploy automático.
- **Netlify drag&drop:** arrastra la nueva versión de la carpeta → overwrite.
- **GitHub Pages:** push al repo y listo.

---

## 🆘 Problemas comunes

- **"El botón descarga un archivo vacío"** → Asegúrate de haber creado un Release en `github.com/paablooguillenn/CoFound/releases` con un asset llamado exactamente `cofound.apk`.
- **"Las imágenes no cargan"** → Verifica que la carpeta `assets/` se subió junto a `index.html`.
- **"El dominio no funciona"** → Los cambios de DNS pueden tardar hasta 24h en propagarse.
