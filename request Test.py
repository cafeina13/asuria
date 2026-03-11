import requests


TestUrl = "https://asuria.vercel.app/api/senveau" # test 

def api_test_et_plain_text(URL):    
    try:
        response = requests.get(URL)
        
        if response.status_code == 200: #200 ok
            gelen_veri = response.text
            print(f"Gelen Yanıt:\n{gelen_veri}")
        else:
            print(f"Hata Oluştu! Durum Kodu: {response.status_code}")
            print(f"Mesaj: {response.text}")

    except Exception as e:
        print(f"Bağlantı Hatası: {e}")

if __name__ == "__main__":
    api_test_et_plain_text(TestUrl)