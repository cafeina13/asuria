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

  // BASİT API ŞABLONUN
  const sablon = `
  const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";

export default async function handler(req, res) {

  try {
      const token = process.env.GITHUB_TOKEN;
    
    if (token) {
      // GitHub'daki listeyi doğrudan düz metin formatında okuyoruz
      const jsonCheckRes = await fetch("https://api.github.com/repos/cafeina13/asuria/contents/apis.json", {
        headers: { 
          'Authorization': \`token \${token}\`,
          'Accept': 'application/vnd.github.v3.raw' 
        }
      });

      if (jsonCheckRes.ok) {
        const apisList = await jsonCheckRes.json();
        
        // Kendi ismini listede arıyor
        const buApi = apisList.find(api => api.slug === "${slug}");
        
        // Eğer listede varsa ve panelden kapatılmışsa (isActive: false)
        if (buApi && buApi.isActive === false) {
          // GEMİNİ'YE GİTMEDEN DOĞRUDAN BELİRLEDİĞİN YAZIYI GÖNDER VE DUR
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

  // API JS DOSYASINI OLUŞTUR
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

  // APIS.JSON DOSYASINI GÜNCELLE
  const jsonUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/apis.json`;
  let apis = [];
  let sha = null;

  // Önce mevcut json dosyasını çekmeye çalış
  const getJson = await fetch(jsonUrl, {
    headers: { Authorization: `token ${token}` },
  });
  if (getJson.ok) {
    const data = await getJson.json();
    sha = data.sha; // Güncelleme yapmak için bu şifre (sha) gerekli
    apis = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
  }

  // Yeni API'yi listeye ekle (Varsayılan olarak aktif: true)
  apis.push({ apiName, targetUrl, slug, isActive: true });

  // Güncellenmiş listeyi tekrar GitHub'a kaydet
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
