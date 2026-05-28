const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";

const TOPLAM_SURE_MS = 6000;
const ON_ISLEM_SURE_MS = 2000;
const GEMINI_MIN_SURE_MS = 1500;
const KONFIG_CACHE_SURE_MS = 60_000;

const HATA_MESAJLARI = {
  400: "Geçersiz istek",
  401: "Yetkisiz",
  403: "Erişim reddedildi",
  404: "Model bulunamadı",
  429: "Kota dolu",
  500: "AI sunucu hatası",
  502: "AI ağ geçidi hatası",
  503: "AI meşgul",
  504: "AI zaman aşımı",
};

let konfigCache = { zaman: 0, isActive: true };

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
    const buApi = liste.find(a => a.slug === "senveau");
    const isActive = buApi ? buApi.isActive !== false : true;
    konfigCache = { zaman: simdi, isActive };
    return isActive;
  } catch (hata) {
    console.error(`Konfig hatası: ${hata.message}`);
    return konfigCache.isActive;
  }
}

async function sozAl(signal) {
  const res = await fetch("https://stoic-quotes.com/api/quote", { signal });
  if (!res.ok) throw new Error(`Stoic API ${res.status}`);
  const veri = await res.json();
  return { yazar: veri.author, soz: veri.text };
}

async function geminiAciklamasi(apiKey, soz, sureMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), sureMs);

  try {
    const komut = `Şu sözü en fazla 2 cümleyle açıkla. Sadece düz metin ver: "${soz}"`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: komut }] }],
          generationConfig: { temperature: 0.1 },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const govde = await res.text().catch(() => "");
      console.error(`Gemini ${res.status}: ${govde.slice(0, 500)}`);
      const aciklamaMetni = HATA_MESAJLARI[res.status] || "Bilinmeyen hata";
      return `[AI ${res.status} - ${aciklamaMetni}]`;
    }

    const veri = await res.json();
    return veri.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[Açıklama boş]";
  } catch (hata) {
    if (hata.name === "AbortError") return "[Zaman aşımı]";
    console.error(`Gemini hatası: ${hata.message}`);
    return "[AI Hatası]";
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Content-Type", "text/plain; charset=utf-8");

  if (request.method === "OPTIONS") return response.status(200).end();

  const baslangic = Date.now();
  const onIslemController = new AbortController();
  const onIslemTimer = setTimeout(() => onIslemController.abort(), ON_ISLEM_SURE_MS);

  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    const [konfigSonuc, sozSonuc] = await Promise.allSettled([
      konfigAktifMi(githubToken, onIslemController.signal),
      sozAl(onIslemController.signal),
    ]);
    clearTimeout(onIslemTimer);

    if (konfigSonuc.status === "fulfilled" && konfigSonuc.value === false) {
      return response.status(200).send(KAPALI_YAZISI);
    }

    if (sozSonuc.status !== "fulfilled") {
      console.error(`Söz alınamadı: ${sozSonuc.reason?.message}`);
      return response.status(502).send("Sistem Hatası: Söz kaynağı erişilemez.");
    }

    const { yazar, soz } = sozSonuc.value;

    let aciklama = "[AI devre dışı]";
    if (geminiApiKey) {
      const kalanSure = Math.max(
        GEMINI_MIN_SURE_MS,
        TOPLAM_SURE_MS - (Date.now() - baslangic)
      );
      aciklama = await geminiAciklamasi(geminiApiKey, soz, kalanSure);
    }

    return response.status(200).send(`${yazar},${soz} :: .${aciklama}`);
  } catch (hata) {
    clearTimeout(onIslemTimer);
    console.error(`Sistem hatası: ${hata.message}`);
    return response.status(500).send(`Sistem Hatası: ${hata.message}`);
  }
}
