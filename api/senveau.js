const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";

const TOPLAM_SURE_MS = 6000;
const ON_ISLEM_SURE_MS = 2000;
const GEMINI_MIN_SURE_MS = 1500;
const KONFIG_CACHE_SURE_MS = 60_000;
const RSS_CACHE_SURE_MS = 2 * 60 * 60 * 1000;

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
let rssCache = { zaman: 0, yazar: "", soz: "", aciklama: "" };

function xmlKacisla(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(s) {
  return `<![CDATA[${String(s).replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function rssOlustur({ yazar, soz, aciklama, zaman, siteUrl }) {
  const pubDate = new Date(zaman).toUTCString();
  const aiVar = aciklama && !aciklama.startsWith("[");
  const govdeDuz = aiVar ? `${soz}\n\n— ${yazar}\n\n${aciklama}` : `${soz}\n\n— ${yazar}`;
  const govdeHtml = aiVar
    ? `<blockquote><p>${xmlKacisla(soz)}</p><footer>— <cite>${xmlKacisla(yazar)}</cite></footer></blockquote><p>${xmlKacisla(aciklama)}</p>`
    : `<blockquote><p>${xmlKacisla(soz)}</p><footer>— <cite>${xmlKacisla(yazar)}</cite></footer></blockquote>`;
  const baslikKisa = soz.length > 80 ? soz.slice(0, 77) + "…" : soz;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Senveau — Stoik Sözler</title>
    <link>${xmlKacisla(siteUrl)}</link>
    <description>2 saatte bir stoik söz ve AI açıklaması.</description>
    <language>tr</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <ttl>120</ttl>
    <item>
      <title>${xmlKacisla(`${yazar} — ${baslikKisa}`)}</title>
      <link>${xmlKacisla(siteUrl)}</link>
      <description>${cdata(govdeDuz)}</description>
      <content:encoded>${cdata(govdeHtml)}</content:encoded>
      <dc:creator>${xmlKacisla(yazar)}</dc:creator>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">senveau-${zaman}</guid>
    </item>
  </channel>
</rss>`;
}

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

  if (request.method === "OPTIONS") return response.status(200).end();

  const rssMod = request.query?.format === "rss";
  const siteUrl = `https://${request.headers.host || "asuria.vercel.app"}/`;

  if (rssMod && Date.now() - rssCache.zaman < RSS_CACHE_SURE_MS && rssCache.soz) {
    response.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    return response.status(200).send(rssOlustur({ ...rssCache, siteUrl }));
  }

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
      if (rssMod) {
        response.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
        return response.status(200).send(rssOlustur({
          yazar: "Senveau", soz: KAPALI_YAZISI, aciklama: "",
          zaman: Date.now(), siteUrl,
        }));
      }
      response.setHeader("Content-Type", "text/plain; charset=utf-8");
      return response.status(200).send(KAPALI_YAZISI);
    }

    if (sozSonuc.status !== "fulfilled") {
      console.error(`Söz alınamadı: ${sozSonuc.reason?.message}`);
      response.setHeader("Content-Type", "text/plain; charset=utf-8");
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

    if (rssMod) {
      rssCache = { zaman: Date.now(), yazar, soz, aciklama };
      response.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      return response.status(200).send(rssOlustur({ ...rssCache, siteUrl }));
    }

    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    return response.status(200).send(`${yazar},${soz} :: .${aciklama}`);
  } catch (hata) {
    clearTimeout(onIslemTimer);
    console.error(`Sistem hatası: ${hata.message}`);
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    return response.status(500).send(`Sistem Hatası: ${hata.message}`);
  }
}
