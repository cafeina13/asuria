export default async function handler(request, response) {
  // Hangi sitelerin bu API'ye erişebileceğini belirtir.
  // '*' işareti "herkes erişebilir" demektir. Bu genel API'ler için güvenlidir.
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    return response.status(200).end();
  }

  try {
    // Orijinal API'den çekilecek sözü al
    const sozYaniti = await fetch("https://api.stoic-quotes.com/v1/quotes");
    const sozVerisi = await sozYaniti.json();
    const orijinalSoz = sozVerisi.data[0].body;
    const yazar = sozVerisi.data[0].author;

    //Gemini kullanarak bu sözü çevir ve açıklamak için gemini API anahtarını al
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // Gemini'a göndereceğimiz komut
    const komut = `sen bir api çıktısı olacaksın o yüzden uzatma sadece Şu stoik sözü Türkçeye çevir ve kısaca ne anlama geldiğini açıkla: "${orijinalSoz}"`;

    const geminiYaniti = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: komut }] }] }),
      },
    );

    // Gemini'den gelen cevabı işle
    const geminiVerisi = await geminiYaniti.json();
    const aciklamaliCeviri = geminiVerisi.candidates[0].content.parts[0].text;

    // gönderilecek son formatı oluştur
    const sonuc = {
      yazar: yazar,
      orijinal_soz: orijinalSoz,
      turkce_aciklama: aciklamaliCeviri,
    };

    // JSON ve blirlediğimiz formatta cevabı gönder
    response.status(200).json(sonuc);
  } catch (error) {
    // Bir hata olursa, hatayı bildir
    response
      .status(500)
      .json({ hata: "API işlenirken bir sorun oluştu.", detay: error.message });
  }
}
