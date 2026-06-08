const sozEl = document.getElementById("soz");
const yazarEl = document.getElementById("yazar");
const aciklamaEl = document.getElementById("aciklama");
const yenileBtn = document.getElementById("yenile");
const arkaPlanEl = document.getElementById("arka-plan");
const aiBtn = document.getElementById("ai-acikla");
const AI_BTN_ETIKET = "AI ile açıkla";

// O an ekranda olan söz. URL temizlense de paylaşım için elimizde kalsın diye burada tutuyoruz.
let aktifVeri = null;

function arkaPlanYenile() {
  const seed = Math.floor(Math.random() * 1000000);
  arkaPlanEl.classList.add("yukleniyor");
  const img = new Image();
  img.onload = () => {
    arkaPlanEl.style.backgroundImage = `url(${img.src})`;
    arkaPlanEl.classList.remove("yukleniyor");
  };
  img.onerror = () => arkaPlanEl.classList.remove("yukleniyor");
  img.src = `https://picsum.photos/seed/${seed}/1920/1080`;
}

function aciklamaSebebi(aciklama) {
  if (!aciklama) return null;
  const m = aciklama.match(/^\[(?:AI \d+ - )?(.+)\]$/);
  return m ? m[1] : null;
}

function goster(yazar, soz, aciklama) {
  sozEl.classList.remove("hata");
  sozEl.textContent = soz;
  yazarEl.textContent = yazar ? `- ${yazar}` : "";
  const sebep = aciklamaSebebi(aciklama);
  if (aciklama && !sebep) {
    aciklamaEl.textContent = aciklama;
    aciklamaEl.classList.remove("eksik");
    aciklamaEl.style.display = "block";
  } else if (sebep) {
    aciklamaEl.textContent = `Açıklama bulunamadı (${sebep})`;
    aciklamaEl.classList.add("eksik");
    aciklamaEl.style.display = "block";
  } else {
    aciklamaEl.textContent = "";
    aciklamaEl.classList.remove("eksik");
    aciklamaEl.style.display = "none";
  }
  document.title = yazar ? `${yazar} - Senveau` : "Senveau";

  // Gösterdiğimiz şeyi paylaşılabilir biçimde sakla (URL'yi temizlesek bile kaybolmasın).
  aktifVeri = { q: soz, y: yazar };
  if (aciklama && !aciklama.startsWith("[")) aktifVeri.a = aciklama;

  // AI butonu yalnızca gerçek açıklama yokken görünsün (refresh/yenile durumu).
  aiBtn.hidden = Boolean(aktifVeri.a) || !soz;
}

function tokenYap(veri) {
  // { q, y, a } -> "1.<base64url>". TextEncoder kullanıyoruz çünkü btoa
  // Türkçe karakterlerde (ç, ş, ğ, ı) patlar; önce UTF-8 byte'larına çeviriyoruz.
  const bytes = new TextEncoder().encode(JSON.stringify(veri));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return "1." + b64;
}

function tokenCoz(t) {
  // "1.<base64url>" -> { q, y, a }
  const nokta = t.indexOf(".");
  const surum = nokta >= 0 ? t.slice(0, nokta) : "";
  if (surum !== "1") throw new Error(`Bilinmeyen token sürümü: ${surum || "(yok)"}`);
  let b64 = t.slice(nokta + 1).replace(/-/g, "+").replace(/_/g, "/");
  b64 += "=".repeat((4 - (b64.length % 4)) % 4); // base64url padding'i atmıştı, geri ekle
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/*function urlGuncelle(yazar, soz, aciklama = "") {
  const veri = { q: soz, y: yazar };
  if (aciklama && !aciklama.startsWith("[")) veri.a = aciklama;
  history.replaceState(null, "", `${location.pathname}?t=${tokenYap(veri)}`);
}*/

function urlTemizle() {
  history.replaceState(null, "", location.pathname);
}

// Paylaşım butonu için: o an gösterilen sözden tam (token'lı) linki üretir.
// Adres çubuğu temiz olsa bile aktifVeri sayesinde linki yeniden kurabiliyoruz.
function paylasimUrl() {
  if (!aktifVeri) return location.href;
  return `${location.origin}${location.pathname}?t=${tokenYap(aktifVeri)}`;
}

async function stoicGetir() {
  const res = await fetch("https://www.stoic-quotes.com/api/quote");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const veri = await res.json();
  goster(veri.author, veri.text, "");
}

async function senveauGetir() {
  const res = await fetch("/api/senveau");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const idx = text.indexOf(",");
  if (idx < 0) {
    sozEl.textContent = text;
    return;
  }
  const yazar = text.slice(0, idx);
  const rest = text.slice(idx + 1);
  const sepIdx = rest.indexOf(" :: .");
  const soz = sepIdx >= 0 ? rest.slice(0, sepIdx) : rest;
  const aciklama = sepIdx >= 0 ? rest.slice(sepIdx + 5) : "";
  goster(yazar, soz, aciklama);
}

function hataGoster(e) {
  sozEl.classList.add("hata");
  sozEl.textContent = `Yüklenemedi: ${e.message}`;
  aiBtn.hidden = true;
}

// Talep üzerine AI açıklaması: o anki sözü sunucuya gönder, açıklamayı getir.
async function aiAcikla() {
  if (!aktifVeri || !aktifVeri.q) return;
  aiBtn.disabled = true;
  aiBtn.classList.add("yukleniyor");
  aiBtn.textContent = "Açıklanıyor…";
  try {
    const res = await fetch(`/api/senveau?soz=${encodeURIComponent(aktifVeri.q)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const aciklama = (await res.text()).trim();
    // "[AI 429 - ...]" gibi de gelebilir; goster bunu "bulunamadı (sebep)" olarak gösterir
    // ve gerçek açıklama gelmediği için butonu görünür bırakır (tekrar denenebilir).
    goster(aktifVeri.y || "", aktifVeri.q, aciklama);
  } catch (e) {
    aciklamaEl.textContent = `AI açıklaması alınamadı: ${e.message}`;
    aciklamaEl.classList.add("eksik");
    aciklamaEl.style.display = "block";
  } finally {
    aiBtn.disabled = false;
    aiBtn.classList.remove("yukleniyor");
    aiBtn.textContent = AI_BTN_ETIKET;
  }
}

async function yeniSozGetir() {
  yenileBtn.disabled = true;
  yenileBtn.classList.add("donerken");
  arkaPlanYenile();
  urlTemizle();
  try {
    await stoicGetir();
  } catch (e) {
    hataGoster(e);
  } finally {
    yenileBtn.disabled = false;
    setTimeout(() => yenileBtn.classList.remove("donerken"), 400);
  }
}

yenileBtn.addEventListener("click", yeniSozGetir);
aiBtn.addEventListener("click", aiAcikla);
arkaPlanYenile();

const params = new URLSearchParams(location.search);
const tParam = params.get("t");
const navGirisi = performance.getEntriesByType("navigation")[0];
const tarayiciYenileme = navGirisi?.type === "reload";

if (tarayiciYenileme) {
  urlTemizle();
  stoicGetir().catch(hataGoster);
} else if (tParam) {
  try {
    const veri = tokenCoz(tParam);
    urlTemizle();                          // token artık bellekte; adres çubuğunu temizle
    goster(veri.y || "", veri.q || "", veri.a || "");
  } catch (e) {
    // Bozuk/eksik token: link kopuk gelmiş olabilir, taze söz çekip yine de bir şey göster.
    console.error(`Token çözülemedi: ${e.message}`);
    senveauGetir().catch(hataGoster);
  }
} else {
  senveauGetir().catch(hataGoster);
}
