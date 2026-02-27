export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Sadece POST');

  const { slug, apiName } = req.body;
  const token = process.env.GITHUB_TOKEN; // Vercel'e eklediğin anahtar
  const REPO_OWNER = "cafeina13"; // GitHub kullanıcı adın
  const REPO_NAME = "asuria"; // Repo adın

  // Yeni API dosyası için şablon (Senin kullandığın kodun aynısı)
  const template = `
export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  try {
    const res = await fetch("https://stoic-quotes.com/api/quote");
    const data = await res.json();
    const geminiKey = process.env.GEMINI_API_KEY;
    const prompt = "Bu sözü Türkçe açıkla: " + data.text;
    const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" + geminiKey, {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({contents: [{parts: [{text: prompt}]}]})
    });
    const gData = await geminiRes.json();
    const desc = gData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[Kota Dolu]";
    return response.status(200).send(data.author + "," + data.text + "::. " + desc);
  } catch (e) {
    return response.status(500).send("Hata: " + e.message);
  }
}`;

  // GitHub API'sine dosyayı yükle emri veriyoruz
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/api/${slug}.js`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `${apiName} API'si oluşturuldu`,
      content: Buffer.from(template).toString('base64'), // Dosya içeriğini base64 yapmalıyız
    })
  });

  if (response.ok) {
    res.status(200).json({ mesaj: `Başarılı! API Adresiniz: https://asuria.vercel.app/api/${slug}` });
  } else {
    const hata = await response.json();
    res.status(500).json({ hata: hata.message });
  }
}