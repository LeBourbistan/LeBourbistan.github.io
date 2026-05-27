/* ============================================================
   LE BOURBISTAN — gallery.js
   Lit photos.json et injecte dynamiquement :
   - les galeries (street / landscape / portrait / auto)
   - les pages destination (vidéos + grille photos)
   ============================================================ */

const PHOTO_BASE = {
  street:    'assets/images/streetphotos/',
  landscape: 'assets/images/landscapes/',
  portrait:  'assets/images/portraits/',
  auto:      'assets/images/automobiles/'
};

// Calcul fiable du chemin racine selon la profondeur de la page
function getRoot() {
  const path = window.location.pathname;
  // Compter les segments après le repo GitHub Pages (ex: /LeBourbistan.github.io/)
  const parts = path.replace(/\/$/, '').split('/').filter(Boolean);
  // Sur GitHub Pages : parts[0] = repo name, parts[1..] = dossiers
  // Sur domaine custom : parts[0..] = dossiers
  // On cherche jusqu'où on est par rapport à index.html
  const depth = parts.length > 0 && parts[parts.length - 1].endsWith('.html')
    ? parts.length - 1
    : parts.length;
  // Heuristique : si on est dans destinations/ ou works/, depth=1 → ../
  return depth > 0 ? '../'.repeat(depth) : './';
}

const ROOT = getRoot();

// ---- Charger photos.json ----
async function loadData() {
  const res = await fetch(ROOT + 'photos.json');
  return await res.json();
}

/* ============================================================
   GALERIES
   ============================================================ */
async function buildGallery(type) {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  const data   = await loadData();
  const photos = data.photos;

  const items = Object.entries(photos)
    .filter(([, v]) => v.galerie === type)
    .map(([filename, v]) => ({ filename, ...v }));

  if (items.length === 0) {
    container.innerHTML = '<p style="opacity:0.4;font-style:italic;">Aucune photo pour l\'instant.</p>';
    return;
  }

  container.innerHTML = items.map(({ filename, caption }) => {
    const src = ROOT + PHOTO_BASE[type] + filename;
    return `
      <div class="gallery-item">
        <img src="${src}" alt="${caption || filename}" loading="lazy">
        ${caption ? `<div class="caption">${caption}</div>` : ''}
      </div>`;
  }).join('');
}

/* ============================================================
   PAGE DESTINATION
   ============================================================ */
async function buildDestination(slug) {
  const data = await loadData();
  const dest = data.destinations[slug];

  // ---- Titre ----
  const titleEl = document.getElementById('destination-titre');
  if (titleEl) titleEl.textContent = dest ? dest.titre : slug;

  // ---- Vidéos ----
  const videosEl = document.getElementById('destination-videos');
  if (videosEl) {
    if (dest && dest.videos && dest.videos.length > 0) {
      videosEl.innerHTML = dest.videos.map(id => `
        <div class="video-embed">
          <iframe
            src="https://www.youtube.com/embed/${id}"
            title="${dest ? dest.titre : slug} — Le Bourbistan"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen loading="lazy">
          </iframe>
        </div>`).join('');
    } else {
      videosEl.style.display = 'none';
    }
  }

  // ---- Grille photos ----
  const gridEl = document.getElementById('destination-photos');
  if (!gridEl) return;

  const photos = Object.entries(data.photos)
    .filter(([, v]) => v.destination === slug)
    .map(([filename, v]) => ({ filename, ...v }));

  if (photos.length === 0) {
    gridEl.style.display = 'none';
    return;
  }

  gridEl.innerHTML = photos.map(({ filename, galerie, caption }) => {
    const src = ROOT + PHOTO_BASE[galerie] + filename;
    return `
      <div class="destination-photo-item">
        <div class="destination-photo-frame">
          <img src="${src}" alt="${caption || filename}" loading="lazy">
          ${caption ? `<div class="photo-caption">${caption}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}
