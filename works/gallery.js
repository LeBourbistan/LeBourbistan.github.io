/* ============================================================
   LE BOURBISTAN — gallery.js
   ============================================================ */

const PHOTO_BASE = {
  street:    'assets/images/streetphotos/',
  landscape: 'assets/images/landscapes/',
  portrait:  'assets/images/portraits/',
  auto:      'assets/images/automobiles/'
};

// Déduit le dossier depuis le préfixe du nom de fichier quand galerie est null
function inferFolder(filename) {
  if (filename.startsWith('street-'))    return 'assets/images/streetphotos/';
  if (filename.startsWith('landscape-')) return 'assets/images/landscapes/';
  if (filename.startsWith('portrait-'))  return 'assets/images/portraits/';
  if (filename.startsWith('auto-'))      return 'assets/images/automobiles/';
  return 'assets/images/';
}

function getPhotoPath(filename, galerie) {
  return ROOT + (galerie ? PHOTO_BASE[galerie] : inferFolder(filename)) + filename;
}

function getRoot() {
  // Compte les segments de dossier dans le pathname
  // /destinations/moscou.html → 1 dossier → '../'
  // /works/streetphotos.html  → 1 dossier → '../'
  // /index.html ou /about.html → 0 dossier → './'
  const parts = window.location.pathname
    .replace(/\/+$/, '')   // enlever slash final
    .split('/')
    .filter(Boolean);       // enlever segments vides
  
  // Le dernier segment est le fichier .html — on compte les dossiers avant
  const depth = parts.length > 0 && parts[parts.length - 1].includes('.html')
    ? parts.length - 1
    : parts.length;

  // Sur GitHub Pages sans domaine custom : /LeBourbistan.github.io/destinations/moscou.html
  // → parts = ['LeBourbistan.github.io', 'destinations', 'moscou.html'] → depth = 2 → '../../'
  // Sur domaine custom : /destinations/moscou.html → depth = 1 → '../'
  // Sur racine : /index.html → depth = 0 → './'
  
  if (depth === 0) return './';
  return '../'.repeat(depth);
}

const ROOT = getRoot();

async function loadData() {
  const res = await fetch(ROOT + 'photos.json');
  return await res.json();
}

/* ============================================================
   LIGHTBOX — partagé entre galeries et destinations
   ============================================================ */
function initLightbox() {
  // Créer le lightbox s'il n'existe pas encore
  if (document.getElementById('lightbox')) return;

  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.innerHTML = `
    <img id="lightbox-img" src="" alt="">
    <div id="lightbox-caption"></div>
  `;
  lb.style.cssText = `
    display:none; position:fixed; inset:0;
    background:rgba(0,0,0,0.93); z-index:9999;
    align-items:center; justify-content:center;
    cursor:zoom-out; flex-direction:column; gap:1rem;
  `;

  const img = lb.querySelector('#lightbox-img');
  img.style.cssText = 'max-width:90vw; max-height:85vh; object-fit:contain; border-radius:4px; pointer-events:none;';

  const cap = lb.querySelector('#lightbox-caption');
  cap.style.cssText = `
    font-family:'Cormorant Garamond',Georgia,serif;
    font-style:italic; font-size:15px;
    color:rgba(245,243,239,0.7); pointer-events:none;
  `;

  document.body.appendChild(lb);

  // Clic n'importe où sur le lightbox ferme — pointer-events:none sur img et caption
  // garantit que le clic remonte toujours jusqu'au conteneur
  lb.addEventListener('click', () => closeLightbox());
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
}

function openLightbox(src, caption) {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-caption').textContent = caption || '';
  lb.style.display = 'flex';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.style.display = 'none';
}

/* ============================================================
   GALERIES
   ============================================================ */
async function buildGallery(type) {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  const data  = await loadData();
  const items = Object.entries(data.photos)
    .filter(([, v]) => v.galerie === type)
    .map(([filename, v]) => ({ filename, ...v }));

  if (items.length === 0) {
    container.innerHTML = '<p style="opacity:0.4;font-style:italic;">Aucune photo pour l\'instant.</p>';
    return;
  }

  container.innerHTML = items.map(({ filename, caption }) => {
    const src = ROOT + PHOTO_BASE[type] + filename;
    return `
      <div class="gallery-item" style="cursor:zoom-in;" onclick="openLightbox('${src}','${(caption||'').replace(/'/g,"\\'")}')">
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

  initLightbox();

  // Titre
  const titleEl = document.getElementById('destination-titre');
  if (titleEl) {
    titleEl.textContent = (dest && dest.titre)
      ? dest.titre
      : slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Vidéos
  const videosEl = document.getElementById('destination-videos');
  if (videosEl) {
    if (dest && dest.videos && dest.videos.length > 0) {
      videosEl.innerHTML = dest.videos.map(id => `
        <div class="video-embed">
          <iframe src="https://www.youtube.com/embed/${id}"
            title="${dest ? dest.titre : slug} — Le Bourbistan"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen loading="lazy">
          </iframe>
        </div>`).join('');
    } else {
      videosEl.style.display = 'none';
    }
  }

  // Photos
  const gridEl = document.getElementById('destination-photos');
  if (!gridEl) return;

  const photos = Object.entries(data.photos)
    .filter(([, v]) => v.destination === slug)
    .map(([filename, v]) => ({ filename, ...v }));

  if (photos.length === 0) {
    gridEl.innerHTML = '<p style="opacity:0.4;font-style:italic;grid-column:1/-1;">Pas encore de photo disponible pour cette destination — continuez à explorer&nbsp;!</p>';
    return;
  }

  gridEl.innerHTML = photos.map(({ filename, galerie, caption }) => {
    const src = getPhotoPath(filename, galerie);
    const cap = (caption || '').replace(/'/g, "\\'");
    return `
      <div class="destination-photo-item">
        <div class="destination-photo-frame" style="cursor:zoom-in;" onclick="openLightbox('${src}','${cap}')">
          <img src="${src}" alt="${caption || filename}" loading="lazy">
          ${caption ? `<div class="photo-caption">${caption}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}
