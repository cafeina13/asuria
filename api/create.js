export default async function handler(req, res) {
  // Sadece form gönderildiğinde çalış
  if (req.method !== "POST") return res.status(405).send("Hata");

  const { targetUrl, slug } = req.body; // Formdan gelen URL ve Uzantı
  const token = process.env.GITHUB_TOKEN; // GitHub yetki anahtarın

  // SENİN İSTEDİĞİN ÇOK BASİT ŞABLON (Yeni oluşacak dosyanın içeriği)
  const sablon = `
export default async function handler(req, res) {
  try {
    const response = await fetch("${targetUrl}");
    const data = await response.text();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(data);
  } catch (e) {
    return res.status(500).send("Hata oluştu");
  }
}`;

  // GitHub'a "Dosya Oluştur" isteği gönderiyoruz
  const url = `https://api.github.com/repos/cafeina13/asuria/contents/api/${slug}.js`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `${slug} API oluşturuldu`,
      content: Buffer.from(sablon).toString("base64"), // Dosya içeriğini şifreliyoruz (GitHub böyle ister)
    }),
  });

  if (response.ok) {
    res.status(200).json({ sonuc: "Tamamdır! API oluşturuldu." });
  } else {
    res.status(500).json({ sonuc: "GitHub hatası oluştu." });
  }
}
