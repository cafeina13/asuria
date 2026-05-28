let butSayisi = 0;
let otoButGucu = 0;
let manuelButGucu = 1;
let signedIn = false;

let akademisyenList = [
    { id: 0, name: "Fatih Hoca", cost: 10, effect: "Otomatik Büt", effectAciklama: "Her saniye 1 büt üretir", aktif: false, buff: ["adder", 1] },
    { id: 1, name: "Lain Hoca", cost: 50, effect: "Otomatik 5 Büt", effectAciklama: "Her saniye 5 büt üretir", aktif: false, buff: ["adder", 5] },
    { id: 2, name: "Fatma Hoca", cost: 300, effect: "Otomatik 20 Büt", effectAciklama: "Her saniye 20 büt üretir", aktif: false, buff: ["adder", 20] },
    { id: 3, name: "Sena Hoca", cost: 2000, effect: "Double Büt çarpanı (2x)", effectAciklama: "Büt çarpanını iki katına çıkarır, en son hesaplanır", aktif: false, buff: ["special", 2] },
    { id: 4, name: "Samet Hoca", cost: 3000, effect: "OtoBüt çarpanı +1", effectAciklama: "Büt çarpanına 1 ekler", aktif: false, buff: ["multiplier", 1] },
    { id: 5, name: "Erdem Hoca", cost: 12000, effect: "OtoBüt çarpanı +2", effectAciklama: "Büt çarpanına 2 ekler", aktif: false, buff: ["multiplier", 2] },
    { id: 6, name: "Gizem Hoca", cost: 100000, effect: "OtoBüt çarpanı +5", effectAciklama: "Büt çarpanına 5 ekler", aktif: false, buff: ["multiplier", 5] },
    { id: 7, name: "Jhonny Test", cost: 300000, effect: "Quadra Büt Çarpanı (4x)", effectAciklama: "Büt çarpanını 4 katına çıkarır, en son hesaplanır", aktif: false, buff: ["special", 4] },
    { id: 8, name: "Mordecai Hoca", cost: 1000000, effect: "OtoBüt çarpanı +10", effectAciklama: "Büt çarpanına 10 ekler", aktif: false, buff: ["multiplier", 10] },
    { id: 9, name: "Rektör Skips", cost: 4000000, effect: "OtoBüt çarpanı +20", effectAciklama: "Büt çarpanına 20 ekler", aktif: false, buff: ["multiplier", 20] },
    { id: 10, name: "Rigby KNK", cost: 10000000, effect: "OtoBüt çarpanı +50", effectAciklama: "Büt çarpanına 50 ekler", aktif: false, buff: ["multiplier", 50] },
    { id: 11, name: "Attack Shark", cost: -10000000, effect: "OtoBüt çarpanı +150", effectAciklama: "Büt çarpanına 50 ekler", aktif: false, buff: ["multiplier", 150] },
];

let kopyaList = [
    { id: 0, name: "Sıraya Not", cost: 100, effect: "Manuel Büt +1", effectAciklama: "Yazın çok kötü, her deneme +1 büt", aktif: false, buff: ["adder", 2] },
    { id: 1, name: "Kopya Kağıdı", cost: 500, effect: "manuel büt +10", effectAciklama: "Yazın hâlâ kötü, her deneme +10 büt", aktif: false, buff: ["adder", 50] },
    { id: 2, name: "Yanındakine Bakış", cost: 2000, effect: "Manuel büt +30", effectAciklama: "Yanındaki de bütünlemeye girdiğine göre, +30", aktif: false, buff: ["adder", 200] },
    { id: 3, name: "Önündekine bakış", cost: 10000, effect: "2 Kat Manuel Büt kazancı", effectAciklama: "Gözün bozuk, her denemede 2 kat büt (en son hesaplanır) ", aktif: false, buff: ["special", 2] },
    { id: 4, name: "Arkadaşınla Göz Teması", cost: 50000, effect: "Manuel Büt kazancı +20%", effectAciklama: "Arkadaşınla göz teması kurdun ama yanlış anladın, her denemede %20 daha fazla büt", aktif: false, buff: ["multiplier", 1.2] },
    { id: 5, name: "Hocaya Sor", cost: 200000, effect: "Manuel Büt kazancı +100", effectAciklama: "Hocaya soru sordun ama o da bütünlemeye girdiğine göre, her denemede +100 büt", aktif: false, buff: ["adder", 100] },
    { id: 6, name: "Kopya Çekme Sanatı", cost: 1000000, effect: "3 kat Manuel Büt kazancı çarpanı", effectAciklama: "Kopya çekme sanatında ustalaştın artık önümüzdeki bütlere bakıcaz, her denemede 3x büt", aktif: false, buff: ["multiplier", 3] },
    { id: 7, name: "Psişik Kopya", cost: 5000000, effect: "5 kat Manuel Büt kazancı çarpanı", effectAciklama: "Psişik güçlerinle kopya çekmeye başladın, her denemede 5x büt", aktif: false, buff: ["multiplier", 5] },
    { id: 8, name: "Sallama", cost: 10000000, effect: "-10 kat Manuel Büt kazancı çarpanı", effectAciklama: "Sallamaya başladın, artık bütlerin azlıyor, her denemede -10x büt", aktif: false, buff: ["special", -10] },
];
function updateOtoBut(yenidenHesapla = false) {
    if (!yenidenHesapla) {
        return otoButGucu;
    }

    let adder = 0;
    let multiplier = 1;
    let special = 1;

    for (let i = 0; i < akademisyenList.length; i++) {
        let hoca = akademisyenList[i];
        if (hoca.aktif && hoca.buff) {
            if (hoca.buff[0] === "adder") {
                adder += hoca.buff[1];
            } else if (hoca.buff[0] === "multiplier") {
                multiplier += hoca.buff[1];
            } else if (hoca.buff[0] === "special") {
                special = hoca.buff[1];
            }
        }
    }

    otoButGucu = (multiplier * special) * adder;
    return otoButGucu;
}


function updateManuelBut() {
    let adder = 0;
    let multiplier = 1;
    let special = 1;

    for (let i = 0; i < kopyaList.length; i++) {
        let kopya = kopyaList[i];
        if (kopya.aktif && kopya.buff) {
            if (kopya.buff[0] === "adder") {
                adder += kopya.buff[1];
            } else if (kopya.buff[0] === "multiplier") {
                multiplier += kopya.buff[1];
            } else if (kopya.buff[0] === "special") {
                special = kopya.buff[1];
            }
        }
    }
    multiplier = Math.round(multiplier)
    manuelButGucu = (multiplier * special) * adder;
    return manuelButGucu;
}

const leftHoverPanelCheck = document.getElementById('left-hover-check');
const leftHoverPanel = document.getElementById('left-hover-panel')
const leftHoverPanelContent = document.getElementById('left-hover-panel-content')
const saveButton = document.getElementById('btn-signSave')
const bg_dark = document.getElementById('bg-dark');


leftHoverPanelCheck.addEventListener('mouseenter', () => {
    bg_dark.classList.add('show');
    
    if (signedIn) {saveButton.style.display = 'flex';}
    else {saveButton.style.display = 'none';}

    leftHoverPanel.style.display = 'flex';
    setTimeout(() => {
        leftHoverPanel.classList.remove('close');
        leftHoverPanel.classList.add('show');
    }, 10);
});

leftHoverPanelContent.addEventListener('mouseleave', () => {
    bg_dark.classList.remove('show');
    leftHoverPanel.classList.remove('show');
    leftHoverPanel.classList.add('close');
    setTimeout(() => {
        leftHoverPanel.style.display = 'none';
    }, 300);
});



function updateGUI() {
    document.getElementById('but').textContent = butSayisi;
    document.getElementById('otobut').textContent = ` ${otoButGucu}/s`;
    document.getElementById('manuelbut').textContent = manuelButGucu
}

//Hover Pencere, Kayıt ol-----------------------------------------------
const btnSignUp = document.getElementById('btn-signUp');
const signUpModal = document.getElementById('sign-up-modal');
const closeSignUpModal = document.getElementById('close-sign-up-Modal');

btnSignUp.addEventListener('click', () => {
    signUpModal.style.display = 'flex';
});

closeSignUpModal.addEventListener('click', () => {
    signUpModal.style.display = 'none';
});

//Kayıt ol
const nameUpTextBox = document.getElementById('username-up-box');
const passwordUpTextBox = document.getElementById('password-up-box');
const kayitOlBTN = document.getElementById('btn-signUp-check');

kayitOlBTN.addEventListener('click', async () => {
    const name = nameUpTextBox.value.trim();
    const password = passwordUpTextBox.value;

    if (!name || !password) {
        showToast("İsim ve şifre boş bırakılamaz.");
        return;
    }

    try {
        const res = await fetch('/api/user-handler', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: name, password }),
        });

        if (res.ok) {
            signedIn = true;
            nameIn = name;
            passwordIn = password;
            butSayisi = 0;
            akademisyenList.forEach(h => h.aktif = false);
            kopyaList.forEach(k => k.aktif = false);
            updateOtoBut(true);
            updateManuelBut();
            manuelButGucu = manuelButGucu === 0 ? 1 : manuelButGucu;
            document.getElementById('username-dyn').textContent = name;
            updateGUI();
            closeSignUpModal.click();
            showToast(`Hoş geldin ${name}!`);
        } else {
            const veri = await res.json();
            showToast(`Kayıt reddedildi: ${veri.hata}`);
        }
    } catch (e) {
        showToast(`Kayıt hatası: ${e.message}`);
    }
})

// Hover Pencere, Giriş yap---------------------------------------------
const btnSignIn = document.getElementById('btn-signIn');
const signInModal = document.getElementById('sign-in-modal');
const closeSignInModal = document.getElementById('close-sign-in-Modal');

btnSignIn.addEventListener('click', () => {
    signInModal.style.display = 'flex';
});

closeSignInModal.addEventListener('click', () => {
    signInModal.style.display = 'none';
});

const nameInTextBox = document.getElementById('username-in-box');
const passwordInTextBox = document.getElementById('password-in-box');
const girisBTN = document.getElementById('btn-signIn-check');

let nameIn = nameInTextBox.value;
let passwordIn = passwordInTextBox.value;

girisBTN.addEventListener('click', async () => {
    nameIn = nameInTextBox.value != "" ? nameInTextBox.value : "sherlock" ;
    passwordIn = passwordInTextBox.value;

    const getJson = await fetch(`/api/user-handler?username=${encodeURIComponent(nameIn)}&password=${encodeURIComponent(passwordIn)}`);
    const userHanger = await getJson.json();
    if (getJson.ok){
        signedIn = true;
        document.getElementById('username-dyn').textContent = userHanger.name;
        closeSignInModal.click();

        butSayisi = userHanger.score;

        const acikAkademisyen = new Set(userHanger.upgrades.up1 || []);
        akademisyenList.forEach(h => { h.aktif = acikAkademisyen.has(h.id); });

        const acikKopya = new Set(userHanger.upgrades.up2 || []);
        kopyaList.forEach(k => { k.aktif = acikKopya.has(k.id); });


        updateManuelBut();
        updateOtoBut(true);
        manuelButGucu = manuelButGucu === 0 ? 1 : manuelButGucu;
        updateGUI();

        showToast(`Kimlik değiştirildi, Yeni kullanıcı ${userHanger.name}`)

    }
    else if (getJson.status == 500) {alert("Json Kapalı")}
    else if (getJson.status == 401) {alert(userHanger.hata)}
});

//Render Akademisyen satın alma ekranı --------------------------------
function renderKadro() {
    const shopList = document.getElementById('kadro-list');
    shopList.innerHTML = "";

    akademisyenList.forEach((hoca, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';

        let btnText = hoca.aktif ? "Derste" : `Kesinleştir<br>(${hoca.cost} Büt)`;
        let btnDisabled = hoca.aktif ? "disabled" : "";

        itemDiv.innerHTML = `
                    <div class="item-left">
                        <span class="item-name">${hoca.name}</span>
                        <span class="item-effect">${hoca.effect}</span>
                    </div>
                    <div class="item-middle">
                        <span class="item-desc">${hoca.effectAciklama}</span>
                    </div>
                    <div class="item-right">
                        <button class="buy-btn" onclick="kesinlestir(${index})" ${btnDisabled}>${btnText}</button>
                    </div>`;
        shopList.appendChild(itemDiv);
    });
}

//Render kopya çeşidi satın alma ekranı ---------------------------------
function renderKopyaSheet() {
    const shopList = document.getElementById('kopya-list');
    shopList.innerHTML = "";

    kopyaList.forEach((kopya, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';

        let btnText = kopya.aktif ? "Uygulanıyor" : `Uygula<br>(${kopya.cost} Büt)`;
        let btnDisabled = kopya.aktif ? "disabled" : "";

        itemDiv.innerHTML = `
                    <div class="item-left">
                        <span class="item-name">${kopya.name}</span>
                        <span class="item-effect">${kopya.effect}</span>
                    </div>
                    <div class="item-middle">
                        <span class="item-desc">${kopya.effectAciklama}</span>
                    </div>
                    <div class="item-right">
                        <button class="buy-btn" onclick="kopyaCek(${index})" ${btnDisabled}>${btnText}</button>
                    </div>`;
        shopList.appendChild(itemDiv);
    });
}

// Akademisyen kesinleştirme satın alma sırasında çalışacak kodlar------
function kesinlestir(index) {
    let hoca = akademisyenList[index];

    if (!hoca.aktif && butSayisi >= hoca.cost) {
        butSayisi -= hoca.cost;
        hoca.aktif = true;

        updateOtoBut(true);
        updateGUI();
        renderKadro();
        showToast(`${hoca.name} derse girdi!`);
    } else if (butSayisi < hoca.cost) {
        showToast("Yeterli büt yok! Biraz daha az çabala...");
    }
}

//Kopya satın alma sırasında çalışacak kodlar --------------------------
function kopyaCek(index) {
    let kopya = kopyaList[index];

    if (!kopya.aktif && butSayisi >= kopya.cost) {
        butSayisi -= kopya.cost;
        kopya.aktif = true;

        updateManuelBut();
        updateGUI();
        renderKopyaSheet();
        showToast(`${kopya.name} uygulanıyor!`);
    } else if (butSayisi < kopya.cost) {
        showToast("Yeterli büt yok! Biraz daha az çabala...");
    }
}


saveButton.addEventListener('click', async () => {
    if (!signedIn) {
        showToast("Önce turnikeden geçmelisin.");
        return;
    }

    const up1 = akademisyenList.filter(h => h.aktif).map(h => h.id);
    const up2 = kopyaList.filter(k => k.aktif).map(k => k.id);

    try {
        const res = await fetch('/api/user-handler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: nameIn,
                password: passwordIn,
                score: butSayisi,
                upgrades: { up1, up2 },
            }),
        });

        if (res.ok) {
            const veri = await res.json();
            showToast(`Kaydedildi: ${veri.score} büt`);
        } else if (res.status === 401) {
            const veri = await res.json();
            showToast(`Kayıt reddedildi: ${veri.hata}`);
        } else {
            showToast(`Kayıt başarısız (HTTP ${res.status})`);
        }
    } catch (e) {
        showToast(`Kayıt hatası: ${e.message}`);
    }
});

document.getElementById('main-btn').addEventListener('click', () => {
    butSayisi += manuelButGucu;
    updateGUI();
});

const btnAkademisyen = document.getElementById('btn-akademisyen');
const kadroModal = document.getElementById('kadro-modal');
const closeKadroModal = document.getElementById('close-kadroModal');

btnAkademisyen.addEventListener('click', () => {
    renderKadro();
    kadroModal.style.display = 'flex';
});

closeKadroModal.addEventListener('click', () => {
    kadroModal.style.display = 'none';
});

const btnKopya = document.getElementById('btn-kopya');
const kopyaModal = document.getElementById('kopya-modal');
const closeKopyaModal = document.getElementById('close-kopyaModal');

btnKopya.addEventListener('click', () => {
    renderKopyaSheet();
    kopyaModal.style.display = 'flex';
    kopyaModal.style.opacity = 1;
});

closeKopyaModal.addEventListener('click', () => {
    kopyaModal.style.display = 'none';
    kopyaModal.style.opacity = 0;
});


setInterval(() => {
    let saniyelikKazanc = otoButGucu
    if (saniyelikKazanc > 0) {
        butSayisi += saniyelikKazanc;
        updateGUI();
    }
}, 1000);


function showToast(mesaj) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = mesaj;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
