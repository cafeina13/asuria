
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
          // GEMİNİ'YE GİTMEDEN DOĞRUDAN BELİRLEDİĞİN YAZIYI GÖNDER VE DUR
          return response.status(200).send(KAPALI_YAZISI);
        }
      }
    }
  }
    catch (error) {return res.status(500).send("Hata oluştu: " + error.message);}

  try {
    const response = await fetch("https://www.boredapi.com/api/activity");
    const data = await response.text();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(data);
  } catch (e) {
    return res.status(500).send("Hata oluştu");
  }
}