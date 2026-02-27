export default async function handler(request, response) {
  // CORS Ayarları
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Content-Type", "text/plain; charset=utf-8"); // Çıktıyı düz metin yapıyoruz

  if (request.method === "OPTIONS") return response.status(200).end();

  try {
    // 1. Çalışan Stoic API'den sözü al (Bu kısım her zaman çalışmalı)
    const sozYaniti = await fetch("https://stoic-quotes.com/api/quote");
    if (!sozYaniti.ok) throw new Error("Stoic API şu an kapalı.");

    const sozVerisi = await sozYaniti.json();
    const orijinalSoz = sozVerisi.text;
    const yazar = sozVerisi.author;

    // 2. Gemini Kısmı (Hata alsa da kodu durdurmayacak şekilde tasarlıyoruz)
    let aciklama = "";
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        const komut = `Şu sözü en fazla 2 cümleyle açıkla. Sadece düz metin ver, açıklama dışında bir şey yazma: "${orijinalSoz}"`;

        const geminiYaniti = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: komut }] }],
              generationConfig: { temperature: 0.1 },
            }),
          },
        );

        // Eğer yanıt 429 (Too Many Requests) veya başka bir hata koduysa
        if (geminiYaniti.status === 429) {
          aciklama = "[Kota doldu]";
        } else if (!geminiYaniti.ok) {
          aciklama = "[Yapay zeka şu an meşgul]";
        } else {
          const geminiVerisi = await geminiYaniti.json();
          // Gemini JSON içinde hata dönerse kontrol et
          if (geminiVerisi.error) {
            aciklama = "[Günlük limit aşıldı]";
          } else {
            aciklama =
              geminiVerisi.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
              "[Açıklama yapılamadı]";
          }
        }
      } catch (geminiHata) {
        // Gemini API'sine ulaşılamazsa buraya düşer
        aciklama = "[Bağlantı hatası: Açıklama alınamadı]";
      }
    } else {
      aciklama = "[API Key bulunamadı]";
    }

    // 3. Son Çıktı Formatı
    // İster kota dolsun ister dolmasın, yazar ve söz her zaman gönderilir.
    const sonCikti = `${yazar},${orijinalSoz} :: . ${aciklama}`;

    return response.status(200).send(sonCikti);
  } catch (error) {
    // Sadece Stoic API çökerse buraya düşer
    console.error("Hata Detayı:", error.message);
    return response.status(500).send(`Sistem Hatası: ${error.message}`);
  }
}
