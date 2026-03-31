
let mevcutApiler = [];

async function yukle() {
    const res = await fetch("/api/manage");
    const data = await res.json();
    mevcutApiler = data.apis ? data.apis : data;

    const listeDiv = document.getElementById("apiList");
    listeDiv.innerHTML = "";

    if (mevcutApiler.length === 0) {
        listeDiv.innerHTML = "<p>Henüz oluşturulmuş bir API yok.</p>";
        return;
    }

    mevcutApiler.forEach((api, index) => {
        listeDiv.innerHTML += `
                    <div class="api-item">
                        <div class="api-info">
                            <strong>${api.apiName}</strong>
                            <span>Asıl Adres: ${api.targetUrl}</span><br>
                            <span>Senin Adresin: /api/${api.slug}</span>
                        </div>
                        <div class="actions">
                            <label style="color: ${api.isActive ? "#10b981" : "#ef4444"}">
                                ${api.isActive ? "Aktif" : "Kapalı"}
                            </label>
                            <!-- Checkbox: onChange ile listedeki değeri anında güncelliyoruz -->
                            <input type="checkbox" ${api.isActive ? "checked" : ""} 
                                   onchange="durumDegistir(${index}, this.checked)">
                        </div>
                    </div>
                `;
    });
}

function durumDegistir(index, isChecked) {
    mevcutApiler[index].isActive = isChecked;
}

async function kaydet() {
    const btn = document.getElementById("saveBtn");
    btn.innerText = "Kaydediliyor...";
    btn.style.background = "#fbbf24";

    const res = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            apis: mevcutApiler,
            password: document.getElementById("password").value,
        }),
    });

    if (res.ok) {
        btn.innerText = "Başarıyla Kaydedildi!";
        btn.style.background = "#10b981";
        setTimeout(() => {
            btn.innerText = "Değişiklikleri Kaydet";
            yukle();
        }, 2000);
    } else {
        btn.innerText = "Hata Oluştu";
        btn.style.background = "#ef4444";
    }
}

yukle();