
async function createAPI() {
    const status = document.getElementById('status');
    const payload = {
        targetUrl: document.getElementById('targetUrl').value,
        apiName: document.getElementById('apiName').value,
        slug: document.getElementById('slug').value,
        password: document.getElementById('password').value
    };

    if (!payload.targetUrl || !payload.slug || !payload.password) return alert("Eksik alan bırakmayın!");

    status.className = '';
    status.innerText = "GitHub'a bağlanılıyor ve dosya oluşturuluyor...";
    status.style.display = 'block';

    try {
        const res = await fetch('/api/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
            status.className = 'success';
            status.innerHTML = `<b>${payload.apiName}</b> hazır!<br>Adres: <a href="/api/${payload.slug}" style="color:white" target="_blank">/api/${payload.slug}</a><br><small>Vercel'in dosyayı tanıması 1-2 dk sürebilir.</small>`;

            // İşlem bitince kutuları temizle
            document.getElementById('targetUrl').value = '';
            document.getElementById('apiName').value = '';
            document.getElementById('slug').value = '';
            document.getElementById('password').value = '';
        } else {
            throw new Error(data.hata || "Bilinmeyen hata");
        }
    } catch (err) {
        status.className = 'error';
        status.innerText = "Hata: " + err.message;
    }
}