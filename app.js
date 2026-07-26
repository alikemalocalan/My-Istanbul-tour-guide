// Application Logic for Istanbul Curated Sequential Route (TR, EN, RU)
let currentLang = localStorage.getItem('istanbul_route_lang') || 'tr';
let currentFilter = 'all';
let currentDay = 'all';
let searchQuery = '';

let map = null;
let markersMap = {};
let routePolyline = null;

// Dark / Light Theme Management
let currentTheme = localStorage.getItem('istanbul_theme');

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMap();
  initEventListeners();
  renderApp();
});

// Initialize & Detect Theme (OS preference + manual toggle)
function initTheme() {
  if (!currentTheme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme = prefersDark ? 'dark' : 'light';
  }
  applyTheme(currentTheme, false);

  // Dynamic listener for OS theme changes if user hasn't manually overridden
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('istanbul_theme')) {
      currentTheme = e.matches ? 'dark' : 'light';
      applyTheme(currentTheme, false);
    }
  });
}

function applyTheme(theme, isManual = true) {
  currentTheme = theme;
  if (isManual) {
    localStorage.setItem('istanbul_theme', theme);
  }
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  updateThemeToggleIcon();
}

function toggleTheme() {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme, true);
}

function updateThemeToggleIcon() {
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.innerText = currentTheme === 'dark' ? '☀️' : '🌙';
  }
}

// Initialize Leaflet Interactive Map
function initMap() {
  const mapElement = document.getElementById('leaflet-map');
  if (!mapElement) return;

  map = L.map('leaflet-map', {
    center: [41.018, 28.985],
    zoom: 13,
    zoomControl: true
  });

  // CartoDB Dark Matter / Positron Tiles depending on theme
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
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
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
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
        <h4 style="margin: 0 0 4px 0; font-weight: 800; font-size: 14px;">
          #${loc.id} ${title}
        </h4>
        <p style="margin: 0 0 8px 0; font-size: 12px; opacity: 0.85;">
          ${tip.substring(0, 75)}...
        </p>
        <a href="${loc.mapsUrl}" target="_blank" style="font-size: 11px; color: #00b4d8; font-weight: bold;">
          🗺️ Google Maps ↗
        </a>
      </div>
    `;

    marker.bindPopup(popupContent);
    markersMap[loc.id] = marker;
  });

  // Draw connecting line between sequential spots
  if (points.length > 1) {
    routePolyline = L.polyline(points, {
      color: '#00b4d8',
      weight: 3,
      opacity: 0.7,
      dashArray: '8, 8'
    }).addTo(map);
  }
}

// Check if location matches current filters and search query
function matchesFilter(loc) {
  if (currentDay !== 'all' && loc.day !== parseInt(currentDay)) {
    return false;
  }
  if (currentFilter !== 'all') {
    if (currentFilter === 'europe' && loc.region !== 'europe') return false;
    if (currentFilter === 'asia' && loc.region !== 'asia') return false;
    if (currentFilter === 'historic' && loc.category !== 'historic') return false;
    if (currentFilter === 'food' && loc.category !== 'food') return false;
    if (currentFilter === 'nightlife' && loc.category !== 'nightlife') return false;
  }

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
  // Theme Toggle Button
  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

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
  setText('hero-badge', isTr ? '✨ TOPLU TAŞIMA İLE ADIM ADIM İSTANBUL ✨' : (isRu ? '✨ СТАМБУЛ ШАГ ЗА ШАГОМ НА ТРАНСПОРТЕ ✨' : '✨ STEP-BY-STEP PUBLIC TRANSPORT ROUTE ✨'));
  setText('hero-title', isTr ? 'İstanbul Sıralı Gezi Rehberi' : (isRu ? 'Путеводитель по Стамбулу' : 'Istanbul Sequential Travel Guide'));
  setText('hero-desc', isTr 
    ? 'Benim bizzat gezdiğim yerler, en sevdiğim lezzetler, tarihi saraylar ve ipuçları! Harita ve sırayla adım adım ulaşım rehberi eşliğinde keyifle gezin.'
    : (isRu ? 'Мои любимые места, дворцы, блюда и советы! Исследуйте город по карте и пошаговому маршруту.' : 'Handpicked places, my favorite eats, historic palaces, and local insider tips! Follow step-by-step with public transport guide.'));
  
  setText('tips-btn-text', isTr ? '💡 İstanbulkart & Ulaşım İpuçları' : (isRu ? '💡 Транспорт и советы' : '💡 Transport & Local Tips'));
  setText('tips-btn-text-compact', isTr ? '💡 İpuçları' : (isRu ? '💡 Советы' : '💡 Local Tips'));

  // Day Selector Labels
  const totalCount = routeData.locations.length;
  setText('day-select-label', isTr ? '🗓️ GÜN SEÇİMİ:' : (isRu ? '🗓️ ВЫБОР ДНЯ:' : '🗓️ SELECT DAY:'));
  setText('day-all', isTr ? `Tüm Günler (${totalCount} Durak)` : (isRu ? `Все дни (${totalCount})` : `All Days (${totalCount})`));
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

// Render Sequential Route Cards with Tailwind UI
function renderCards() {
  const container = document.getElementById('cards-container');
  if (!container) return;

  const filteredLocations = routeData.locations.filter(matchesFilter);

  if (filteredLocations.length === 0) {
    const noResultsText = currentLang === 'tr' 
      ? 'Aranan kriterlere uygun yer bulunamadı.' 
      : (currentLang === 'ru' ? 'Места не найдены.' : 'No locations found matching your filter.');
    container.innerHTML = `
      <div class="text-center py-12 px-4 text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 class="text-base font-semibold">${noResultsText}</h3>
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

    const catBadgeColor = loc.category === 'historic'
      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
      : loc.category === 'food'
      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

    const dayBadgeText = isTr ? `${loc.day}. GÜN` : (isRu ? `ДЕНЬ ${loc.day}` : `DAY ${loc.day}`);

    html += `
      <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-0" id="card-${loc.id}">
        
        <!-- Media Image Column -->
        <div class="md:col-span-5 relative h-52 md:h-full min-h-[220px] overflow-hidden group">
          <img src="${loc.image}" alt="${title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent md:hidden"></div>
          
          <div class="absolute top-3 left-3 w-9 h-9 rounded-full bg-slate-950/80 backdrop-blur-md text-white font-black text-sm flex items-center justify-center border border-white/20 shadow-md">
            #${loc.id}
          </div>

          <div class="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-400 font-bold text-xs border border-white/10 shadow-md">
            ${dayBadgeText}
          </div>

          <div class="absolute bottom-3 left-3 right-3 md:hidden text-white font-bold text-xs flex items-center gap-1.5 drop-shadow">
            ${regionName}
          </div>
        </div>

        <!-- Content Column -->
        <div class="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${catBadgeColor}">
                ${catName}
              </span>
              <span class="hidden md:inline-flex text-xs font-semibold text-slate-500 dark:text-slate-400">
                ${regionName}
              </span>
            </div>

            <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-snug">
              ${title}
            </h3>
            
            <!-- Personal Tip Box -->
            <div class="bg-amber-500/10 dark:bg-amber-500/10 border-l-4 border-amber-500 p-3.5 sm:p-4 rounded-r-2xl mb-6">
              <div class="font-extrabold text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                💡 ${isTr ? 'Benim İpucum & Notum' : (isRu ? 'Мой совет и заметка' : 'My Personal Note & Tip')}
              </div>
              <div class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                ${tip}
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <a href="${loc.mapsUrl}" target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-xl shadow-md shadow-sky-500/20 transition-all cursor-pointer">
              📍 Google Maps ↗
            </a>
            <button onclick="focusSpot(${loc.id})" class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer">
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
        <div class="my-4 pl-4 sm:pl-8 border-l-2 border-dashed ${t.type === 'ferry' ? 'border-amber-500' : 'border-sky-500/50'}">
          <div class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 sm:p-4 rounded-2xl flex items-start gap-3 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl flex-shrink-0">
              ${icon}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-[10px] sm:text-xs font-black tracking-wider px-2 py-0.5 rounded-md ${t.type === 'ferry' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-sky-500/20 text-sky-600 dark:text-sky-400'}">
                  ${typeLabel}
                </span>
                <span class="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                  ⏱️ ${duration}
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                ${desc}
              </p>
            </div>
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
    card.classList.add('ring-2', 'ring-sky-500');
    setTimeout(() => {
      card.classList.remove('ring-2', 'ring-sky-500');
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
