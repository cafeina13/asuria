
const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";

export default async function handler(req, res) {

  const sehir = req.query.sehir;

  try {
    const token = process.env.GITHUB_TOKEN;

    if (token) {
      // GitHub'daki listeyi doğrudan düz metin formatında okuyoruz
      const jsonCheckRes = await fetch("https://api.github.com/repos/cafeina13/asuria/contents/apis.json", {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3.raw'
        }
      });

      if (jsonCheckRes.ok) {
        const apisList = await jsonCheckRes.json();

        // Kendi ismini listede arıyor
        const buApi = apisList.find(api => api.slug === "bored");

        // Eğer listede varsa ve panelden kapatılmışsa (isActive: false)
        if (buApi && buApi.isActive === false) {
          return res.status(200).send(KAPALI_YAZISI);
        }
      }
    }
  }
  catch (error) { return res.status(500).send("Hata oluştu: " + error.message); }

  try {

    let fetchUrl = `https://api.open-meteo.com/v1/forecast?latitude=37.7648&longitude=30.5566&current_weather=true`;
    if (sehir) {
      const sehirKoordinatlari = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(sehir)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'Asuria-Weather-App' }});
      const koordinatData = await sehirKoordinatlari.json();
      if (koordinatData.length !== 0) {
        fetchUrl = `https://api.open-meteo.com/v1/forecast?latitude=${koordinatData[0].lat}&longitude=${koordinatData[0].lon}&current_weather=true`;
      }
    }
    
    const [havaResponse, kediResponse] = await Promise.all([
      fetch(fetchUrl),
      fetch("https://catfact.ninja/fact")
    ]);


    const [kediFact ,havaData] = await Promise.all([
      kediResponse.json(),
      havaResponse.json()
    ]);

    const sicaklik = havaData.current_weather.temperature;
    const ruzgar = havaData.current_weather.windspeed;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    const cikti = `Kediii: ${kediFact.fact}\nAnlık ${sehir ? sehir.charAt(0).toUpperCase() + sehir.slice(1) : "Isparta"} Hava Durumu:\nSıcaklık: ${sicaklik}°C\nRüzgar Hızı: ${ruzgar} km/h`;

    return res.status(200).send(cikti);

  } catch (e) {
    return res.status(500).send("Hata oluştu : " + e.message);
  }
}