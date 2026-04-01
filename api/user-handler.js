
  const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";

export default async function handler(req, res) {

  try {
      const token = process.env.GITHUB_TOKEN;
    
    if (token) {
      const jsonCheckRes = await fetch("https://api.github.com/repos/cafeina13/asuria/contents/apis.json", {
        headers: { 
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3.raw' 
        }
      });

      if (jsonCheckRes.ok) {
        const apisList = await jsonCheckRes.json();
        
        const buApi = apisList.find(api => api.slug === "user-handler");
        
        if (buApi && buApi.isActive === false) {
          return response.status(200).send(KAPALI_YAZISI);
        }
      }
    }
  }
    catch (error) {return res.status(500).send("Hata oluştu: " + error.message);}

  try {
    const response = await fetch("katana");
    const data = await response.text();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(data);
  } catch (e) {
    return res.status(500).send("Hata oluştu");
  }
}