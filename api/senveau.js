export default async function handler(request, response) {
  // CORS Ayarları
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") return response.status(200).end();

  try {
    // 1. Çalışan Stoic API'den sözü al
    const sozYaniti = await fetch("https://stoic-quotes.com/api/quote");
    if (!sozYaniti.ok) throw new Error(`Stoic API hatası! Durum: ${sozYaniti.status}`);
    const sozVerisi = await sozYaniti.json();
    
    const orijinalSoz = sozVerisi.text; 
    const yazar = sozVerisi.author;

    // 2. Gemini API Key Kontrolü
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY Vercel ayarlarında bulunamadı!");
    }

    // 3. Gemini 3 Flash Preview API İsteği
    const komut = `Bir API gibi davran. Şu bilgece stoik sözü Türkçeye çevir ve derin ama kısa bir açıklama ekle: "${orijinalSoz}"`;
    
    // URL'de model ismini gemini-3-flash-preview olarak güncelledik
    const geminiYaniti = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: komut }] }] }),
      }
    );

    const geminiVerisi = await geminiYaniti.json();

    if (geminiVerisi.error) {
      throw new Error(`Gemini 3 Hatası: ${geminiVerisi.error.message}`);
    }

    const aciklamaliCeviri = geminiVerisi.candidates?.[0]?.content?.parts?.[0]?.text || "Çeviri şu an yapılamıyor.";

    // 4. JSON formatında temiz çıktı gönder
    return response.status(200).json({
      yazar,
      orijinal_soz: orijinalSoz,
      turkce_aciklama: aciklamaliCeviri.trim(),
      model: "Gemini 3 Flash Preview" // Hangi modelin çalıştığını görmek için ekledim
    });

  } catch (error) {
    console.error("Hata Detayı:", error.message);
    return response.status(500).json({
      hata: "API işlenirken bir sorun oluştu.",
      detay: error.message,
    });
  }
}