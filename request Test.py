import requests


TestUrl = "https://api.open-meteo.com/v1/forecast?latitude=37.7648&longitude=30.5566&current_weather=true" # test 

def api_test_et_plain_text(URL):
    print("--- API Fabrikasına Bağlanılıyor ---")
    
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