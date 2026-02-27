export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") return response.status(200).end();

  try {
    // 1. Stoic API'den sözü al
    const sozYaniti = await fetch("https://api.stoic-quotes.com/v1/quotes");
    if (!sozYaniti.ok) throw new Error(`Stoic API hatası! Durum: ${sozYaniti.status}`);
    const sozVerisi = await sozYaniti.json();
    const orijinalSoz = sozVerisi.data[0].body;
    const yazar = sozVerisi.data[0].author;

    // 2. API Key Kontrolü
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY Vercel ayarlarında bulunamadı!");
    }

    // 3. Gemini API'ye istek at
    const komut = `Bir API gibi davran. Şu sözü Türkçeye çevir ve kısaca açıkla: "${orijinalSoz}"`;
    const geminiYaniti = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: komut }] }] }),
      }
    );

    // Yanıtın JSON olup olmadığını kontrol et
    const contentType = geminiYaniti.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const hataMetni = await geminiYaniti.text();
      throw new Error(`Gemini JSON yerine HTML döndürdü. Mesajın başı: ${hataMetni.substring(0, 50)}`);
    }

    const geminiVerisi = await geminiYaniti.json();

    // ÖNEMLİ: Önce hata var mı diye bak, sonra candidates[0]'a eriş
    if (geminiVerisi.error) {
      throw new Error(`Gemini API Hatası: ${geminiVerisi.error.message}`);
    }

    if (!geminiVerisi.candidates || geminiVerisi.candidates.length === 0) {
      throw new Error("Gemini uygun bir yanıt oluşturamadı.");
    }

    const aciklamaliCeviri = geminiVerisi.candidates[0].content.parts[0].text;

    // 4. Başarılı sonuç
    return response.status(200).json({
      yazar,
      orijinal_soz: orijinalSoz,
      turkce_aciklama: aciklamaliCeviri,
    });

  } catch (error) {
    console.error("Hata Detayı:", error.message);
    return response.status(500).json({
      hata: "API işlenirken bir sorun oluştu.",
      detay: error.message,
    });
  }
}