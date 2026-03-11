const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Content-Type", "text/plain; charset=utf-8");

  if (request.method === "OPTIONS") return response.status(200).end();

  try {
    const token = process.env.GITHUB_TOKEN;

    // --- İYİLEŞTİRME 1: PARALEL ÇALIŞMA ---
    // GitHub kontrolü ve Stoic API isteğini AYNI ANDA başlatıyoruz.
    const [jsonCheckPromise, sozYanitiPromise] = [
      fetch("https://api.github.com/repos/cafeina13/asuria/contents/apis.json", {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3.raw' }
      }),
      fetch("https://stoic-quotes.com/api/quote")
    ];

    const [jsonCheckRes, sozYaniti] = await Promise.all([jsonCheckPromise, sozYanitiPromise]);

    // 1. Durum Kontrolü
    if (jsonCheckRes.ok) {
      const apisList = await jsonCheckRes.json();
      const buApi = apisList.find(api => api.slug === "senveau");
      if (buApi && buApi.isActive === false) {
        return response.status(200).send(KAPALI_YAZISI);
      }
    }

    if (!sozYaniti.ok) throw new Error("Stoic API kapalı.");
    const sozVerisi = await sozYaniti.json();
    const orijinalSoz = sozVerisi.text;
    const yazar = sozVerisi.author;

    // 2. Gemini Kısmı (Zaman Sınırı İle)
    let aciklama = "";
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      // --- İYİLEŞTİRME 2: GEMINI'YE ZAMAN SINIRI (TIMEOUT) ---
      // Gemini 2.5 saniye içinde cevap vermezse isteği iptal et.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 saniye sınırı

      try {
        const komut = `Şu sözü en fazla 2 cümleyle açıkla. Sadece düz metin ver: "${orijinalSoz}"`;

        const geminiYaniti = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: komut }] }],
              generationConfig: { temperature: 0.1 },
            }),
            signal: controller.signal // İptal sinyalini buraya bağlıyoruz
          }
        );

        clearTimeout(timeoutId); // Yanıt gelirse zamanlayıcıyı temizle

        if (geminiYaniti.ok) {
          const geminiVerisi = await geminiYaniti.json();
          aciklama = geminiVerisi.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[Açıklama alınamadı]";
        } else {
          aciklama = "[AI meşgul]";
        }
      } catch (geminiHata) {
        // Zaman aşımı olursa veya hata çıkarsa buraya düşer
        aciklama = geminiHata.name === 'AbortError' ? "[Zaman aşımı: Açıklama hazırlanamadı]" : "[AI Hatası]";
      }
    }

    const sonCikti = `${yazar},${orijinalSoz} :: .${aciklama}`;
    return response.status(200).send(sonCikti);

  } catch (error) {
    return response.status(500).send(`Sistem Hatası: ${error.message}`);
  }
}