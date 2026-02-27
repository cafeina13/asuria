export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") return response.status(200).end();

  try {
    // 1. Yeni ve Çalışan Stoic API (stoic-quotes.com kullanıyoruz)
    const sozYaniti = await fetch("https://stoic-quotes.com/api/quote");
    
    if (!sozYaniti.ok) throw new Error(`Stoic API hatası! Durum: ${sozYaniti.status}`);
    
    const sozVerisi = await sozYaniti.json();
    
    // YENİ API'DE VERİ YAPISI FARKLI: sozVerisi.text ve sozVerisi.author
    const orijinalSoz = sozVerisi.text; 
    const yazar = sozVerisi.author;

    if (!orijinalSoz) throw new Error("API'den söz alınamadı.");

    // 2. Gemini API Key Kontrolü
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY Vercel ayarlarında bulunamadı!");
    }

    // 3. Gemini API'ye istek at
    const komut = `Bir API gibi davran. Şu sözü Türkçeye çevir ve kısaca (maksimum 2 cümle) açıkla: "${orijinalSoz}"`;
    
    const geminiYaniti = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: komut }] }] }),
      }
    );

    const geminiVerisi = await geminiYaniti.json();

    if (geminiVerisi.error) {
      throw new Error(`Gemini API Hatası: ${geminiVerisi.error.message}`);
    }

    const aciklamaliCeviri = geminiVerisi.candidates?.[0]?.content?.parts?.[0]?.text || "Çeviri yapılamadı.";

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