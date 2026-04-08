
const KAPALI_YAZISI = "Bu API şu anda Dans Etmeye gitti ne zaman gelir belli değil.";

export default async function handler(req, res) {

  
  const token = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "cafeina13";
  const REPO_NAME = "asuria";
  const jsonUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/users.json`;
  const jsonLocalUrl = "http://localhost:3000/users.json" 
  /*
  try {

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
  catch (error) { return res.status(500).send("Hata oluştu: " + error.message); }
*/
  const username = req.query.username;
  const password = req.query.password;


  if (req.method === "GET") {
    const getJson = await fetch(jsonLocalUrl, {
      /*headers: { Authorization: `token ${token}` },*/
    });

    if (getJson.ok) {
      const usersGet = await getJson.json();
      /*const users = JSON.parse(
        Buffer.from(data.content, "base64").toString("utf-8"),
      );*/
      //const users = JSON.parse(data);
      const users = usersGet.users;
      let user;
      if (users[username].trustMeBroPassword === password)
        user = users[username];
      else
        return res.status(401).json({ hata: "Yetkisiz erişim! İsim ve Şifre Eşleşmedi!" });
      return res.status(200).json(user);
    }
    return res.status(500).json([]);
  }

  if (req.method === "POST") {

  }
}