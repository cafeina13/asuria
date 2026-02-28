
  const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";

export default async function handler(req, res) {

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
          return response.status(200).send(KAPALI_YAZISI);
        }
      }
    }
  }
    catch (error) {return res.status(500).send("Hata oluştu: " + error.message);}

  try {
    const response = await fetch("https://catfact.ninja/fact");
    const data = await response.json();

    const havaRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current_weather=true");
    const havaData = await havaRes.json();
    
    const sicaklik = havaData.current_weather.temperature;
    const ruzgar = havaData.current_weather.windspeed;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    const cikti = `Kediii: ${data.fact}\n\nAnlık Hava Durumu:\nSıcaklık: ${sicaklik}°C\nRüzgar Hızı: ${ruzgar} km/h`;

    return res.status(200).send(cikti);

  } catch (e) {
    return res.status(500).send("Hata oluştu");
  }
}