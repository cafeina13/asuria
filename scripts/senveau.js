const sozEl = document.getElementById("soz");
const yazarEl = document.getElementById("yazar");
const aciklamaEl = document.getElementById("aciklama");
const yenileBtn = document.getElementById("yenile");
const arkaPlanEl = document.getElementById("arka-plan");

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
}

/*function urlGuncelle(yazar, soz, aciklama = "") {
  const params = new URLSearchParams({ y: yazar, q: soz });
  if (aciklama && !aciklama.startsWith("[")) {
    params.set("a", aciklama);
  }
  history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
}*/

function urlTemizle() {
  history.replaceState(null, "", location.pathname);
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
arkaPlanYenile();

const params = new URLSearchParams(location.search);
const qParam = params.get("q");
const yParam = params.get("y");
const aParam = params.get("a");
const navGirisi = performance.getEntriesByType("navigation")[0];
const tarayiciYenileme = navGirisi?.type === "reload";

if (tarayiciYenileme) {
  urlTemizle();
  stoicGetir().catch(hataGoster);
} else if (qParam) {
  goster(yParam || "", qParam, aParam || "");
} else {
  senveauGetir().catch(hataGoster);
}
