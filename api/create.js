const REPO_OWNER = "cafeina13";
const REPO_NAME = "asuria";
const YASAKLI_SLUGLAR = new Set([
  "create", "manage", "index", "senveau", "user-handler", "handler", "bored",
]);
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function handlerSablonu(slug, targetUrl) {
  const slugJson = JSON.stringify(slug);
  const targetJson = JSON.stringify(targetUrl);
  return `const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";

export default async function handler(req, res) {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      const jsonCheckRes = await fetch("https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/apis.json", {
        headers: {
          Authorization: \`token \${token}\`,
          Accept: "application/vnd.github.v3.raw",
        },
      });
      if (jsonCheckRes.ok) {
        const veri = await jsonCheckRes.json();
        const apisList = veri.apis ? veri.apis : veri;
        const buApi = apisList.find((api) => api.slug === ${slugJson});
        if (buApi && buApi.isActive === false) {
          return res.status(200).send(KAPALI_YAZISI);
        }
      }
    }
  } catch (error) {
    return res.status(500).send("Hata oluştu: " + error.message);
  }

  try {
    const response = await fetch(${targetJson});
    const data = await response.text();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(data);
  } catch (e) {
    return res.status(500).send("Hata oluştu");
  }
}
`;
}

async function githubPut(url, token, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const metin = await res.text().catch(() => "");
    throw new Error(`GitHub ${res.status}: ${metin.slice(0, 200)}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ hata: "Method not allowed" });

  const { targetUrl, apiName, slug, password } = req.body || {};
  const sifre = process.env.PASSWORD_ASURINE;
  const token = process.env.GITHUB_TOKEN;

  if (!sifre || sifre !== password) {
    return res.status(401).json({ hata: "Yetkisiz erişim! Şifre yanlış." });
  }
  if (!targetUrl || !apiName || !slug) {
    return res.status(400).json({ hata: "Eksik alan: targetUrl, apiName ve slug gerekli." });
  }
  if (!SLUG_REGEX.test(slug)) {
    return res.status(400).json({ hata: "Slug sadece küçük harf, rakam ve tire içerebilir (örn. hava-durumu)." });
  }
  if (YASAKLI_SLUGLAR.has(slug.toLowerCase())) {
    return res.status(400).json({ hata: `"${slug}" ismi sistem tarafından kullanılıyor. Başka bir uzantı seçin.` });
  }
  if (!token) {
    return res.status(500).json({ hata: "GITHUB_TOKEN tanımlı değil. Sunucu konfigürasyonu eksik." });
  }

  const apisUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/apis.json`;
  const yeniApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/api/${slug}.js`;

  try {
    const getApis = await fetch(apisUrl, { headers: { Authorization: `token ${token}` } });
    if (!getApis.ok) {
      return res.status(502).json({ hata: `apis.json okunamadı: GitHub ${getApis.status}` });
    }
    const apisData = await getApis.json();
    const apisSha = apisData.sha;
    const mevcutIcerik = Buffer.from(apisData.content, "base64").toString("utf-8");
    const apisJson = JSON.parse(mevcutIcerik);
    const apisList = apisJson.apis || [];

    if (apisList.some((a) => a.slug === slug)) {
      return res.status(409).json({ hata: `"${slug}" zaten kayıtlı.` });
    }

    const sablon = handlerSablonu(slug, targetUrl);
    await githubPut(yeniApiUrl, token, {
      message: `${slug} oluşturuldu`,
      content: Buffer.from(sablon).toString("base64"),
    });

    apisList.push({ apiName, targetUrl, slug, isActive: true });
    await githubPut(apisUrl, token, {
      message: "apis.json güncellendi",
      content: Buffer.from(JSON.stringify({ apis: apisList }, null, 2)).toString("base64"),
      sha: apisSha,
    });

    return res.status(200).json({ sonuc: "Başarılı", slug });
  } catch (e) {
    return res.status(502).json({ hata: e.message });
  }
}
