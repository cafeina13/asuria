export default async function handler(request, response) {
  // CORS Ayarları
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") return response.status(200).end();

  try {
    // 1. Çalışan Stoic API'den sözü al
    const sozYaniti = await fetch("https://stoic-quotes.com/api/quote");
    if (!sozYaniti.ok)
      throw new Error(`Stoic API hatası! Durum: ${sozYaniti.status}`);
    const sozVerisi = await sozYaniti.json();

    const orijinalSoz = sozVerisi.text;
    const yazar = sozVerisi.author;

    // 2. Gemini API Key Kontrolü
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY Vercel ayarlarında bulunamadı!");
    }

    const komut = `sözü Türkçeye çevir ve altına en fazla 2-3 cümlelik derin bir açıklama ekle. 
    KURAL: Sadece düz metin olarak cevap ver. Asla JSON formatı, Markdown veya kod bloğu kullanma.
    Söz: "${orijinalSoz}"`;

    const geminiYaniti = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: komut }] }],
          // Cevabın daha yaratıcı değil, daha doğrudan olması için sıcaklığı (temperature) düşürebiliriz
          generationConfig: {
            temperature: 0.1,
          },
        }),
      },
    );

    const geminiVerisi = await geminiYaniti.json();

    if (geminiVerisi.error) {
      throw new Error(`Gemini 3 Hatası: ${geminiVerisi.error.message}`);
    }

    const aciklamaliCeviri =
      geminiVerisi.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Çeviri şu an yapılamıyor.";

    /////////////////////////// ${aciklamaliCeviri.trim()}
    const sonCikti = `${yazar},${orijinalSoz} `;

    // 4. JSON formatında temiz çıktı gönder
    return response.status(200).send(sonCikti);
  } catch (error) {
    console.error("Hata Detayı:", error.message);
    return response.status(500).json({
      hata: "API işlenirken bir sorun oluştu.",
      detay: error.message,
    });
  }
}
