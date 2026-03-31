export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Hata");

  const { targetUrl, apiName, slug } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const sifre = process.env.PASSWORD_ASURINE;

    if (sifre !== req.body.password) {
      return res.status(401).json({ hata: "Yetkisiz erişim! Şifre yanlış." });
    }

  const yasakliUzantilar = ["create", "manage", "index"];
  if (yasakliUzantilar.includes(slug.toLowerCase())) {
    return res.status(400).json({
      hata: `"${slug}" ismi sistem tarafından kullanılıyor. Lütfen başka bir uzantı seçin.`,
    });
  }

  const REPO_OWNER = "cafeina13";
  const REPO_NAME = "asuria";

  const sablon = `
  const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";

export default async function handler(req, res) {

  try {
      const token = process.env.GITHUB_TOKEN;
    
    if (token) {
      const jsonCheckRes = await fetch("https://api.github.com/repos/cafeina13/asuria/contents/apis.json", {
        headers: { 
          'Authorization': \`token \${token}\`,
          'Accept': 'application/vnd.github.v3.raw' 
        }
      });

      if (jsonCheckRes.ok) {
        const apisList = await jsonCheckRes.json();
        
        const buApi = apisList.find(api => api.slug === "${slug}");
        
        if (buApi && buApi.isActive === false) {
          return response.status(200).send(KAPALI_YAZISI);
        }
      }
    }
  }
    catch (error) {return res.status(500).send("Hata oluştu: " + error.message);}

  try {
    const response = await fetch("${targetUrl}");
    const data = await response.text();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(data);
  } catch (e) {
    return res.status(500).send("Hata oluştu");
  }
}`;

  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/api/${slug}.js`;
  await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `${slug} oluşturuldu`,
      content: Buffer.from(sablon).toString("base64"),
    }),
  });

  const jsonUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/apis.json`;
  let apis = [];
  let sha = null;

  const getJson = await fetch(jsonUrl, {
    headers: { Authorization: `token ${token}` },
  });
  if (getJson.ok) {
    const data = await getJson.json();
    sha = data.sha;
    apis = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
  }

  apis.push({ apiName, targetUrl, slug, isActive: true });

  await fetch(jsonUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "apis.json güncellendi",
      content: Buffer.from(JSON.stringify(apis, null, 2)).toString("base64"),
      sha: sha,
    }),
  });

  res.status(200).json({ sonuc: "Başarılı" });
}
