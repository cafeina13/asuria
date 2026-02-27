export default async function handler(req, res) {


  const sifre = process.env.PASSWORD_ASURINE;

  const token = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "cafeina13";
  const REPO_NAME = "asuria";
  const jsonUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/apis.json`;

  // Sayfa yüklendiğinde listeyi getir (GET)
  if (req.method === "GET") {
    const getJson = await fetch(jsonUrl, {
      headers: { Authorization: `token ${token}` },
    });
    if (getJson.ok) {
      const data = await getJson.json();
      const apis = JSON.parse(
        Buffer.from(data.content, "base64").toString("utf-8"),
      );
      return res.status(200).json(apis);
    }
    return res.status(200).json([]); // Henüz dosya yoksa boş liste dön
  }

  // "Kaydet" butonuna basıldığında yeni ayarları kaydet (POST)
  if (req.method === "POST") {
    if (sifre !== req.body.password) {
      return res.status(401).json({ hata: "Yetkisiz erişim! Şifre yanlış." });
    }
    const yeniListe = req.body;

    const getJson = await fetch(jsonUrl, {
      headers: { Authorization: `token ${token}` },
    });
    let sha = null;
    if (getJson.ok) {
      sha = (await getJson.json()).sha;
    }

    const updateRes = await fetch(jsonUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "API durumları güncellendi",
        content: Buffer.from(JSON.stringify(yeniListe, null, 2)).toString(
          "base64",
        ),
        sha: sha,
      }),
    });

    if (updateRes.ok) return res.status(200).json({ success: true });
    return res.status(500).json({ error: "Kayıt başarısız" });
  }
}
