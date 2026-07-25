// Application Logic for Istanbul Curated Sequential Route (TR, EN, RU)
let currentLang = localStorage.getItem('istanbul_route_lang') || 'tr';
let currentFilter = 'all';
let currentDay = 'all';
let searchQuery = '';

let map = null;
let markersMap = {};
let routePolyline = null;

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initEventListeners();
  renderApp();
});

// Initialize Leaflet Interactive Map
function initMap() {
  const mapElement = document.getElementById('leaflet-map');
  if (!mapElement) return;

  map = L.map('leaflet-map', {
    center: [41.018, 28.985],
    zoom: 13,
    zoomControl: true
  });

  // Dark Map Tiles (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  updateMapMarkersAndLines();
}

// Update Map Markers & Transit Lines
function updateMapMarkersAndLines() {
  if (!map) return;

  // Clear existing markers & polylines
  Object.values(markersMap).forEach(marker => map.removeLayer(marker));
  markersMap = {};
  if (routePolyline) map.removeLayer(routePolyline);

  const points = [];

  routeData.locations.forEach(loc => {
    if (!matchesFilter(loc)) return;

    const [lat, lng] = loc.coordinates;
    points.push([lat, lng]);

    // Custom Pin Colors based on Day
    let pinColor = '#00b4d8';
    if (loc.day === 2) pinColor = '#a855f7';
    if (loc.day === 3) pinColor = '#f77f00';

    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          background: ${pinColor};
          color: #fff;
          font-weight: 800;
          font-size: 12px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
          box-shadow: 0 0 15px rgba(0,0,0,0.5);
          cursor: pointer;
        ">
          ${loc.id}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

    const title = currentLang === 'tr' ? loc.nameTr : (currentLang === 'ru' ? loc.nameRu : loc.nameEn);
    const tip = currentLang === 'tr' ? loc.tipTr : (currentLang === 'ru' ? loc.tipRu : loc.tipEn);
    
    const popupContent = `
      <div style="padding: 4px; font-family: sans-serif;">
        <h4 style="margin: 0 0 4px 0; color: #fff; font-size: 14px;">
          #${loc.id} ${title}
        </h4>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #cbd5e1;">
          ${tip.substring(0, 75)}...
        </p>
        <a href="${loc.mapsUrl}" target="_blank" style="font-size: 11px; color: #38bdf8; font-weight: bold;">
          🗺️ Google Maps ↗
        </a>
      </div>
    `;
    marker.bindPopup(popupContent);

    marker.on('click', () => {
      scrollToCard(loc.id);
    });

    markersMap[loc.id] = marker;
  });

  // Polyline for visible markers
  if (points.length > 1) {
    routePolyline = L.polyline(points, {
      color: '#00b4d8',
      weight: 4,
      opacity: 0.7,
      dashArray: '6, 8'
    }).addTo(map);
  }
}

// Filter Checking Utility
function matchesFilter(loc) {
  // Day filter
  if (currentDay !== 'all' && String(loc.day) !== String(currentDay)) return false;

  // Category & Region filter
  if (currentFilter === 'europe' && loc.region !== 'europe') return false;
  if (currentFilter === 'asia' && loc.region !== 'asia') return false;
  if (currentFilter === 'historic' && loc.category !== 'historic') return false;
  if (currentFilter === 'food' && loc.category !== 'food') return false;
  if (currentFilter === 'nightlife' && loc.category !== 'nightlife') return false;

  // Search query filter
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    const nameMatch = (loc.nameTr && loc.nameTr.toLowerCase().includes(q)) ||
                      (loc.nameEn && loc.nameEn.toLowerCase().includes(q)) ||
                      (loc.nameRu && loc.nameRu.toLowerCase().includes(q));
    const tipMatch = (loc.tipTr && loc.tipTr.toLowerCase().includes(q)) ||
                     (loc.tipEn && loc.tipEn.toLowerCase().includes(q)) ||
                     (loc.tipRu && loc.tipRu.toLowerCase().includes(q));
    if (!nameMatch && !tipMatch) return false;
  }
  return true;
}

// Initialize Event Listeners
function initEventListeners() {
  // Language Buttons
  document.getElementById('btn-tr')?.addEventListener('click', () => setLanguage('tr'));
  document.getElementById('btn-en')?.addEventListener('click', () => setLanguage('en'));
  document.getElementById('btn-ru')?.addEventListener('click', () => setLanguage('ru'));

  // Day Selector Buttons
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentDay = e.target.dataset.day || 'all';
      renderCards();
      updateMapMarkersAndLines();
    });
  });

  // Filter Category Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter || 'all';
      renderCards();
      updateMapMarkersAndLines();
    });
  });

  // Search Bar
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderCards();
      updateMapMarkersAndLines();
    });
  }

  // Modal Triggers
  document.getElementById('open-tips-btn')?.addEventListener('click', () => toggleModal(true));
  document.getElementById('close-modal-btn')?.addEventListener('click', () => toggleModal(false));
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') toggleModal(false);
  });
}

// Set Active Language
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('istanbul_route_lang', lang);

  document.getElementById('btn-tr')?.classList.toggle('active', lang === 'tr');
  document.getElementById('btn-en')?.classList.toggle('active', lang === 'en');
  document.getElementById('btn-ru')?.classList.toggle('active', lang === 'ru');

  renderApp();
  updateMapMarkersAndLines();
}

// Main Render Function
function renderApp() {
  renderHeaderAndModal();
  renderCards();
}

// Render Header, Stat Labels & Modal Text
function renderHeaderAndModal() {
  const tips = routeData.generalTips[currentLang] || routeData.generalTips.tr;
  const daysText = routeData.days[currentLang] || routeData.days.tr;

  const isTr = currentLang === 'tr';
  const isRu = currentLang === 'ru';

  // Header & Brand
  setText('brand-title', isTr ? 'İstanbul Gezi Rotalarım' : (isRu ? 'Мои маршруты по Стамбулу' : 'My Istanbul Curated Route'));
  setText('hero-badge', isTr ? '✨ Toplu Taşıma İle Adım Adım İstanbul' : (isRu ? '✨ Стамбул шаг за шагом на транспорте' : '✨ Step-by-Step Public Transport Route'));
  setText('hero-title', isTr ? 'İstanbul Sıralı Gezi Rehberi' : (isRu ? 'Путеводитель по Стамбулу' : 'Istanbul Sequential Travel Guide'));
  setText('hero-desc', isTr 
    ? 'Benim bizzat gezdiğim yerler, en sevdiğim lezzetler, tarihi saraylar ve ipuçları! Harita ve sırayla adım adım ulaşım rehberi eşliğinde keyifle gezin.'
    : (isRu ? 'Мои любимые места, дворцы, блюда и советы! Исследуйте город по карте и пошаговому маршруту.' : 'Handpicked places, my favorite eats, historic palaces, and local insider tips! Follow step-by-step with public transport guide.'));
  
  setText('stat-label-1', isTr ? 'Sıralı Durak' : (isRu ? 'Всего остановок' : 'Total Stops'));
  setText('stat-label-2', isTr ? 'Günlük Rota' : (isRu ? 'Дней маршрута' : 'Day Routes'));
  setText('stat-label-3', isTr ? 'Ulaşım Araçları' : (isRu ? 'Вида транспорта' : 'Transit Modes'));

  setText('tips-btn-text', isTr ? '💡 İstanbulkart & Ulaşım İpuçları' : (isRu ? '💡 Транспорт и советы' : '💡 Transport & Local Tips'));

  // Day Selector Labels
  setText('day-select-label', isTr ? '🗓️ GÜN SEÇİMİ:' : (isRu ? '🗓️ ВЫБОР ДНЯ:' : '🗓️ SELECT DAY:'));
  setText('day-all', isTr ? 'Tüm Günler (21 Durak)' : (isRu ? 'Все дни (21)' : 'All Days (21)'));
  setText('day-1', daysText.day1);
  setText('day-2', daysText.day2);
  setText('day-3', daysText.day3);

  // Filter Buttons Text
  setText('filter-all', isTr ? 'Tüm Rota' : (isRu ? 'Все местоположения' : 'All Locations'));
  setText('filter-europe', isTr ? 'Avrupa Yakası' : (isRu ? 'Европейская сторона' : 'European Side'));
  setText('filter-asia', isTr ? 'Anadolu Yakası (Kadıköy)' : (isRu ? 'Азиатская сторона (Кадыкёй)' : 'Asian Side (Kadıköy)'));
  setText('filter-historic', isTr ? 'Tarihi Yerler & Müze' : (isRu ? 'История и музеи' : 'Historic & Museums'));
  setText('filter-food', isTr ? 'Yeme & İçme' : (isRu ? 'Еда и сладости' : 'Food & Sweets'));
  setText('filter-nightlife', isTr ? 'Gece Hayatı' : (isRu ? 'Ночная жизнь' : 'Nightlife'));

  // Modal Content
  setText('modal-istanbulkart-title', tips.istanbulkartTitle);
  setText('modal-istanbulkart-body', tips.istanbulkartBody);
  setText('modal-taxi-title', tips.taxiTitle);
  setText('modal-taxi-body', tips.taxiBody);
  
  const appLink = document.getElementById('modal-app-link');
  if (appLink) {
    appLink.innerText = tips.appLinkText;
  }
}

// Render Sequential Route Cards
function renderCards() {
  const container = document.getElementById('cards-container');
  if (!container) return;

  const filteredLocations = routeData.locations.filter(matchesFilter);

  if (filteredLocations.length === 0) {
    const noResultsText = currentLang === 'tr' 
      ? 'Aranan kriterlere uygun yer bulunamadı.' 
      : (currentLang === 'ru' ? 'Места не найдены.' : 'No locations found matching your filter.');
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
        <h3>${noResultsText}</h3>
      </div>
    `;
    return;
  }

  let html = '';
  filteredLocations.forEach((loc) => {
    const isTr = currentLang === 'tr';
    const isRu = currentLang === 'ru';

    const title = isTr ? loc.nameTr : (isRu ? loc.nameRu : loc.nameEn);
    const tip = isTr ? loc.tipTr : (isRu ? loc.tipRu : loc.tipEn);

    const regionName = loc.region === 'europe' 
      ? (isTr ? 'Avrupa Yakası 🏰' : (isRu ? 'Европейская сторона 🏰' : 'European Side 🏰')) 
      : (isTr ? 'Anadolu Yakası (Kadıköy) 🌊' : (isRu ? 'Азиатская сторона (Кадыкёй) 🌊' : 'Asian Side (Kadıköy) 🌊'));

    const catName = loc.category === 'historic'
      ? (isTr ? 'Tarihi & Müze' : (isRu ? 'История и Музей' : 'Historic & Museum'))
      : loc.category === 'food'
      ? (isTr ? 'Yeme & İçme' : (isRu ? 'Еда и Сладости' : 'Food & Sweets'))
      : (isTr ? 'Gece Hayatı' : (isRu ? 'Ночная жизнь' : 'Nightlife & Bars'));

    const dayBadgeText = isTr ? `${loc.day}. GÜN` : (isRu ? `ДЕНЬ ${loc.day}` : `DAY ${loc.day}`);

    html += `
      <div class="route-card" id="card-${loc.id}">
        <div class="card-media">
          <img src="${loc.image}" alt="${title}" loading="lazy" />
          <div class="card-step-badge">#${loc.id}</div>
          <div class="card-day-badge">${dayBadgeText}</div>
          <div class="card-region-badge">${regionName}</div>
        </div>

        <div class="card-content">
          <div>
            <div class="card-header-meta">
              <span class="category-tag ${loc.category}">${catName}</span>
            </div>
            <h3 class="card-title">${title}</h3>
            
            <div class="tip-box">
              <div class="tip-title">
                💡 ${isTr ? 'Benim İpucum & Notum' : (isRu ? 'Мой совет и заметка' : 'My Personal Note & Tip')}
              </div>
              <div class="tip-text">${tip}</div>
            </div>
          </div>

          <div class="card-actions">
            <a href="${loc.mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-maps">
              📍 Google Maps ↗
            </a>
            <button class="btn-focus-map" onclick="focusSpot(${loc.id})">
              🗺️ ${isTr ? 'Haritada Göster' : (isRu ? 'Показать на карте' : 'Focus on Map')}
            </button>
          </div>
        </div>
      </div>
    `;

    // Inter-step transit indicator
    if (loc.transitToNext) {
      const t = loc.transitToNext;
      const duration = isTr ? t.durationTr : (isRu ? t.durationRu : t.durationEn);
      const desc = isTr ? t.descTr : (isRu ? t.descRu : t.descEn);
      
      let icon = '🚶';
      let typeLabel = isTr ? 'YÜRÜYÜŞ' : (isRu ? 'ПЕШКОМ' : 'WALK');
      
      if (t.type === 'tram') {
        icon = '🚋';
        typeLabel = isTr ? 'T1 TRAMVAY' : (isRu ? 'ТРАМВАЙ T1' : 'T1 TRAMWAY');
      } else if (t.type === 'metro') {
        icon = '🚇';
        typeLabel = isTr ? 'METRO / OTOBÜS' : (isRu ? 'МЕТРО / АВТОБУС' : 'METRO / BUS');
      } else if (t.type === 'ferry') {
        icon = '⛴️';
        typeLabel = isTr ? 'DENİZ ULAŞIMI (VAPUR TURU)' : (isRu ? 'ПАРОМ (МОРСКОЙ ПЕРЕХОД)' : 'SEA TRANSIT (FERRY TOUR)');
      }

      html += `
        <div class="transit-step ${t.type === 'ferry' ? 'ferry' : ''}">
          <div class="transit-icon">${icon}</div>
          <div class="transit-info">
            <div class="transit-meta">
              <span class="transit-type">${typeLabel}</span>
              <span class="transit-time">⏱️ ${duration}</span>
            </div>
            <div class="transit-desc">${desc}</div>
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = html;
}

// Focus Map Marker & Scroll Card
function focusSpot(id) {
  const loc = routeData.locations.find(l => l.id === id);
  if (!loc || !map) return;

  map.flyTo(loc.coordinates, 15, { duration: 1.2 });

  if (markersMap[id]) {
    markersMap[id].openPopup();
  }

  scrollToCard(id);
}

// Scroll to Card element with glow animation
function scrollToCard(id) {
  const card = document.getElementById(`card-${id}`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.style.borderColor = 'var(--primary)';
    card.style.boxShadow = '0 0 35px rgba(0, 180, 216, 0.4)';
    setTimeout(() => {
      card.style.borderColor = '';
      card.style.boxShadow = '';
    }, 2000);
  }
}

// Show / Hide Tips Modal
function toggleModal(show) {
  const modal = document.getElementById('modal-overlay');
  if (modal) {
    modal.classList.toggle('active', show);
  }
}

// Helper to set inner text safely
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}
