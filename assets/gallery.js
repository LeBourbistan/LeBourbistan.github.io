/* ============================================================
   LE BOURBISTAN — gallery.js
   ============================================================ */

const PHOTO_BASE = {
  street:    'assets/images/streetphotos/',
  landscape: 'assets/images/landscapes/',
  portrait:  'assets/images/portraits/',
  auto:      'assets/images/automobiles/'
};

function getRoot() {
  const path = window.location.pathname;
  const knownSubfolders = ['works', 'destinations'];
  const inSubfolder = knownSubfolders.some(f => path.includes('/' + f + '/'));
  return inSubfolder ? '../' : './';
}

const ROOT = getRoot();

async function loadData() {
  const res = await fetch(ROOT + 'photos.json');
  return await res.json();
}

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
      <div class="gallery-item">
        <img src="${src}" alt="${caption || filename}" loading="lazy">
        ${caption ? `<div class="caption">${caption}</div>` : ''}
      </div>`;
  }).join('');
}

async function buildDestination(slug) {
  const data = await loadData();
  const dest = data.destinations[slug];

  // Titre — extrait du JSON ou du slug formaté
  const titleEl = document.getElementById('destination-titre');
  if (titleEl) {
    if (dest && dest.titre) {
      titleEl.textContent = dest.titre;
    } else {
      // Formater le slug : 'saint-petersbourg' → 'Saint-Petersbourg'
      titleEl.textContent = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  // Vidéos
  const videosEl = document.getElementById('destination-videos');
  if (videosEl) {
    if (dest && dest.videos && dest.videos.length > 0) {
      videosEl.innerHTML = dest.videos.map(id => `
        <div class="video-embed">
          <iframe src="https://www.youtube.com/embed/${id}"
            title="${dest.titre} — Le Bourbistan"
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
