const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";
const KONFIG_CACHE_SURE_MS = 60_000;
const TOPLAM_SURE_MS = 6000;

let konfigCache = { zaman: 0, isActive: true };

const weatherMap = {
  // --- AÇIK VE BULUTLU ---
  0: "Açık ve Güneşli",
  1: "Çoğunlukla Açık",
  2: "Parçalı Bulutlu",
  3: "Bulutlu / Kapalı",

  // --- SİS VE PUS ---
  45: "Sisli",
  48: "Kırağılı Sis (Buzlanan Sis)",

  // --- ÇİSENTİ (DRIZZLE) ---
  51: "Hafif Çisenti",
  53: "Orta Şiddette Çisenti",
  55: "Yoğun Çisenti",
  56: "Hafif Dondurucu Çisenti",
  57: "Yoğun Dondurucu Çisenti",

  // --- YAĞMUR ---
  61: "Hafif Yağmurlu",
  63: "Yağmurlu",
  65: "Şiddetli Yağmurlu",
  66: "Hafif Dondurucu Yağmur",
  67: "Şiddetli Dondurucu Yağmur",

  // --- KAR ---
  71: "Hafif Kar Yağışlı",
  73: "Orta Şiddette Kar Yağışlı",
  75: "Yoğun Kar Yağışlı",
  77: "Kar Taneleri (Kar Kumcuğu)",

  // --- SAĞANAK (SHOWERS) ---
  80: "Hafif Yağmur Sağanağı",
  81: "Yağmur Sağanağı",
  82: "Şiddetli Yağmur Sağanağı",
  85: "Hafif Kar Sağanağı",
  86: "Şiddetli Kar Sağanağı",

  // --- FIRTINA VE DOLU ---
  95: "Gök Gürültülü Fırtına",
  96: "Hafif Dolu Eşliğinde Fırtına",
  99: "Şiddetli Dolu ve Fırtına"
};

async function konfigAktifMi(token, signal) {
  const simdi = Date.now();
  if (simdi - konfigCache.zaman < KONFIG_CACHE_SURE_MS) return konfigCache.isActive;

  const headers = { Accept: "application/vnd.github.v3.raw" };
  if (token) headers.Authorization = `token ${token}`;

  try {
    const res = await fetch(
      "https://api.github.com/repos/cafeina13/asuria/contents/apis.json",
      { headers, signal }
    );
    if (!res.ok) {
      console.error(`Konfig okunamadı: GitHub ${res.status}`);
      return konfigCache.isActive;
    }
    const veri = await res.json();
    const liste = Array.isArray(veri) ? veri : veri.apis || [];
    const buApi = liste.find(a => a.slug === "bored");
    const isActive = buApi ? buApi.isActive !== false : true;
    konfigCache = { zaman: simdi, isActive };
    return isActive;
  } catch (hata) {
    console.error(`Konfig hatası: ${hata.message}`);
    return konfigCache.isActive;
  }
}

export default async function handler(req, res) {
  const sehir = req.query.sehir;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TOPLAM_SURE_MS);

  try {
    const aktif = await konfigAktifMi(process.env.GITHUB_TOKEN, controller.signal);
    if (!aktif) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(KAPALI_YAZISI);
    }

    let fetchUrl = `https://api.open-meteo.com/v1/forecast?latitude=37.7648&longitude=30.5566&current_weather=true&timezone=auto`;
    if (sehir) {
      try {
        const sehirKoordinatlari = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(sehir)}&format=json&limit=1`,
          { headers: { "User-Agent": "Asuria-Weather-App" }, signal: controller.signal }
        );
        const koordinatData = await sehirKoordinatlari.json();
        if (koordinatData.length !== 0) {
          fetchUrl = `https://api.open-meteo.com/v1/forecast?latitude=${koordinatData[0].lat}&longitude=${koordinatData[0].lon}&current_weather=true&timezone=auto`;
        }
      } catch (geoHata) {
        console.error(`Geocoding başarısız, varsayılan konum kullanılıyor: ${geoHata.message}`);
      }
    }

    const [havaResponse, kediResponse] = await Promise.all([
      fetch(fetchUrl, { signal: controller.signal }),
      fetch("https://catfact.ninja/fact", { signal: controller.signal }),
    ]);

    const [havaData, kediFact] = await Promise.all([
      havaResponse.json(),
      kediResponse.json(),
    ]);

    const sicaklik = havaData.current_weather.temperature;
    const ruzgar = havaData.current_weather.windspeed;
    const havaKodu = havaData.current_weather.weathercode;
    const havaDurumu = weatherMap[havaKodu] || "Bilinmeyen Hava Durumu";
    const zaman = havaData.current_weather.time.split("T")[1];

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    const cikti = `Kediii: ${kediFact.fact}\n${sehir ? sehir.charAt(0).toUpperCase() + sehir.slice(1) : "Isparta"} Hava Durumu: ${havaDurumu}\nSıcaklık: ${sicaklik}°C\nRüzgar Hızı: ${ruzgar} km/h\nEn son güncelleme: ${zaman}`;

    return res.status(200).send(cikti);
  } catch (e) {
    if (e.name === "AbortError") {
      return res.status(504).send("Hata: Zaman aşımı");
    }
    return res.status(500).send("Hata oluştu: " + e.message);
  } finally {
    clearTimeout(timer);
  }
}
