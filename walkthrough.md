# Walkthrough - Istanbul Curated Sequential Route Web App

The single-page web application **"İstanbul Gezi Rotalarım / My Istanbul Curated Route"** has been successfully built and deployed locally. It features a curated, sequential step-by-step travel itinerary with bilingual TR/EN support, an interactive Leaflet route map ("Kroki"), transport badges, and local insider tips.

## Accomplished Features

### 1. Bilingual Support (Türkçe / English Toggle)
- Instant language switching across all titles, descriptions, insider tips, transit instructions, filters, and local modal guides.
- Language preference is automatically saved in `localStorage`.

### 2. Sequential Route & Public Transport Stepper
- Structured geographically in sequential order:
  - **Historic Peninsula & Bosphorus (Avrupa Yakası)**: Topkapı Sarayı & Harem ➡️ Şehzade Cağ Kebap ➡️ Hafız Mustafa 1864 ➡️ Ayasofya & Sultanahmet ➡️ Karaköy Güllüoğlu ➡️ Galata Kulesi ➡️ Helvacı Ali Galata ➡️ Dolmabahçe Sarayı ➡️ Balkanlar Lokantası ➡️ Midyeci Ahmet ➡️ Ortaköy Meydanı.
  - **Romantic Bosphorus Vapur Crossing ⛴️**: Inter-continental ferry transit from Beşiktaş/Karaköy to Kadıköy using Istanbulkart / QR code app.
  - **Asian Side (Anadolu Yakası - Kadıköy)**: Kadıköy Boğa Heykeli ➡️ Breakfast (Cafe Jêle / Müjgan / Luşnika) ➡️ Nâzım Hikmet Kültür Merkezi ➡️ Yanyalı Fehmi Lokantası ➡️ Kadıköy Midyecisi ➡️ WAYANA Wine Bar ➡️ Güneşin Sofrası Meyhane ➡️ Kuzen Beer Cafe (Mahzen Canlı Müzik) ➡️ Fül Fül Çorba ➡️ Kadıköy Barlar Sokağı.
- Each inter-step connection includes transport type badges (Tram 🚋, Metro 🚇, Ferry ⛴️, Walk 🚶), duration, and specific directions.

### 3. Interactive Route Map ("Kroki")
- Custom Leaflet map with CartoDB Dark Matter tiles.
- Numbered color-coded route markers (Cyan for European side, Amber for Asian side).
- Dashed route polylines connecting the stops and a Bosphorus ferry line across continents.
- Clicking any card's **"Haritada Göster / Focus on Map"** button smoothly flies the map to the location and opens its popup.

### 4. Insider Tips & Transport Drawer
- **Specific recommendations included**:
  - Cağ Kebap ordering advice (2 skewers per person, skip side traps).
  - Hürrem's Harem at Topkapı Palace.
  - Pistachio helva over ice cream at Galata.
  - Sütlaç & tea at Yanyalı Fehmi.
  - Cellar live music at Kuzen.
- **Local Tips Modal**: Detailed instructions for downloading the Istanbulkart mobile app, QR code usage, and crucial warnings to avoid yellow taxis in high-traffic tourist areas (use Tram/Metro or Uber) and checking Google Maps reviews for Kadıköy bars.

---

## Visual Demonstration

![Application Interface Screenshot](file:///Users/aliocalan/.gemini/antigravity-ide/brain/aa8e67de-450f-4351-aa06-bf714bb816d4/scrolled_page_1_1785009309654.png)

![Local Tips Modal Screenshot](file:///Users/aliocalan/.gemini/antigravity-ide/brain/aa8e67de-450f-4351-aa06-bf714bb816d4/modal_open_1785009420411.png)

---

## How to Run Locally

1. Open a terminal in the project directory:
   ```bash
   cd /Users/aliocalan/git/best-routes
   ```
2. Start the HTTP dev server:
   ```bash
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your web browser.
