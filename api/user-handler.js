import { promises as fs } from "fs";
import path from "path";

const USERS_PATH = path.join(process.cwd(), "users.json");
const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";
const KONFIG_CACHE_SURE_MS = 60_000;

let konfigCache = { zaman: 0, isActive: true };

async function konfigAktifMi(token) {
  const simdi = Date.now();
  if (simdi - konfigCache.zaman < KONFIG_CACHE_SURE_MS) return konfigCache.isActive;

  const headers = { Accept: "application/vnd.github.v3.raw" };
  if (token) headers.Authorization = `token ${token}`;

  try {
    const res = await fetch(
      "https://api.github.com/repos/cafeina13/asuria/contents/apis.json",
      { headers }
    );
    if (!res.ok) {
      console.error(`Konfig okunamadı: GitHub ${res.status}`);
      return konfigCache.isActive;
    }
    const veri = await res.json();
    const liste = Array.isArray(veri) ? veri : veri.apis || [];
    const buApi = liste.find((a) => a.slug === "user-handler");
    const isActive = buApi ? buApi.isActive !== false : true;
    konfigCache = { zaman: simdi, isActive };
    return isActive;
  } catch (hata) {
    console.error(`Konfig hatası: ${hata.message}`);
    return konfigCache.isActive;
  }
}

async function kullanicilariOku() {
  const icerik = await fs.readFile(USERS_PATH, "utf-8");
  return JSON.parse(icerik);
}

function jsonBicimle(veri) {
  const json = JSON.stringify(veri, null, 2);
  return json.replace(/\[\s+([^[\]{}]+?)\s+\]/g, (m, ic) => {
    const items = ic.split(",").map((s) => s.trim());
    return "[" + items.join(",") + "]";
  });
}

async function kullanicilariYaz(veri) {
  await fs.writeFile(USERS_PATH, jsonBicimle(veri) + "\n", "utf-8");
}

function bedenAl(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const aktif = await konfigAktifMi(process.env.GITHUB_TOKEN);
  if (!aktif) return res.status(200).json({ hata: KAPALI_YAZISI });

  try {
    const veri = await kullanicilariOku();
    const users = veri.users;

    if (req.method === "GET") {
      const username = req.query.username;
      const password = req.query.password;

      const user = users[username];
      if (!user || user.trustMeBroPassword !== password) {
        return res.status(401).json({ hata: "Yetkisiz erişim! İsim ve Şifre Eşleşmedi!" });
      }
      return res.status(200).json(user);
    }

    if (req.method === "PUT") {
      const beden = bedenAl(req);
      const { username, password } = beden;

      if (!username || !password || typeof username !== "string" || typeof password !== "string") {
        return res.status(400).json({ hata: "İsim ve şifre gerekli." });
      }
      if (users[username]) {
        return res.status(409).json({ hata: "Bu isim zaten kayıtlı." });
      }

      users[username] = {
        name: username,
        trustMeBroPassword: password,
        score: 0,
        upgrades: { up1: [], up2: [] },
      };

      await kullanicilariYaz(veri);
      return res.status(201).json({ sonuc: "Kayıt başarılı", name: username });
    }

    if (req.method === "POST") {
      const beden = bedenAl(req);
      const { username, password, score, upgrades } = beden;

      const user = users[username];
      if (!user || user.trustMeBroPassword !== password) {
        return res.status(401).json({ hata: "Yetkisiz erişim! İsim ve Şifre Eşleşmedi!" });
      }

      if (typeof score === "number") user.score = score;
      if (upgrades && typeof upgrades === "object") user.upgrades = upgrades;

      await kullanicilariYaz(veri);
      return res.status(200).json({ sonuc: "Kaydedildi", name: user.name, score: user.score });
    }

    return res.status(405).json({ hata: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ hata: "Sistem hatası: " + e.message });
  }
}
