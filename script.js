let helyesSzam = '';
let hiányzóIndex = -1;
let tippSzamlalo = 0;
let jatekElkezdodott = false;

// Képlet a magyar személyi azonosító ellenőrző számjegyének képzéséhez (egyszerűsítve)
// Az (1*S1 + 2*S2 + ... + 10*S10) összeg 11-gyel való osztási maradéka
// egyenlő a K (S11) számjegy értékével, ha S11 < 10.
// Az ellenőrző számjegy (K) képzésének pontos szabályai bonyolultabbak (pl. 11-es maradék esetén nem lehet 10 a sorszám),
// de a játékhoz elegendő a képlet fordított használata.
function ellenorzoSzamjegyKalkulacio(szamTomb) {
    let osszeg = 0;
    for (let i = 0; i < 10; i++) {
        // A súlyok 1-től 10-ig mennek: 1*S1, 2*S2, ..., 10*S10
        osszeg += (i + 1) * szamTomb[i];
    }
    const maradek = osszeg % 11;

    // Ha a maradék 10, akkor az ellenőrző számjegy képzése bonyolultabb,
    // de az egyszerű generálás kedvéért ezt a számot elvetjük/korrigáljuk,
    // VAGY az ellenőrző számjegy 10-es maradék esetén 0, ha a sorszám nem 999.
    // A valóságban ilyenkor a sorszámot nem adják ki. A játékban most csak 0-9 közötti K-t generálunk.
    return (maradek === 10) ? -1 : maradek; // -1-et ad vissza, ha érvénytelen lenne a formátum
}

// Véletlen személyi azonosító generálása a formátumot (M ÉÉHHNN SSSK) követve
function generalSzemelyiSzam() {
    let szam = [];

    // 1. jegy (M): Pl. 1=1900-as férfi, 2=1900-as nő, 3=2000-es férfi, 4=2000-es nő.
    // A dátummal összhangban kell lennie, de itt most egyszerűsítünk
    szam[0] = Math.floor(Math.random() * 4) + 1; // 1, 2, 3 vagy 4

    // 2-7. jegyek (ÉÉHHNN): Születési dátum
    // ÉÉ: 00-99 (a generált M-től függően: 1/2 esetén pl. 00-99; 3/4 esetén pl. 00-25 (a jövőbe ne menjünk)
    let evUtolsoKetJegy;
    let evszam;
    if (szam[0] === 1 || szam[0] === 2) {
        evUtolsoKetJegy = Math.floor(Math.random() * 97); // 00-96
        evszam = 1900 + evUtolsoKetJegy;
    } else {
        evUtolsoKetJegy = Math.floor(Math.random() * 26); // 00-25
        evszam = 2000 + evUtolsoKetJegy;
    }
    szam[1] = Math.floor(evUtolsoKetJegy / 10);
    szam[2] = evUtolsoKetJegy % 10;

    // HHNN: Hónap, Nap
    let honap = Math.floor(Math.random() * 12) + 1; // 1-12
    let nap;
    if (honap === 2) {
        // Szökőév ellenőrzés kihagyva az egyszerűség kedvéért
        nap = Math.floor(Math.random() * 28) + 1;
    } else if ([4, 6, 9, 11].includes(honap)) {
        nap = Math.floor(Math.random() * 30) + 1;
    } else {
        nap = Math.floor(Math.random() * 31) + 1;
    }

    szam[3] = Math.floor(honap / 10);
    szam[4] = honap % 10;
    szam[5] = Math.floor(nap / 10);
    szam[6] = nap % 10;

    // 8-10. jegyek (SSS): Sorszám (000-999), 100-300 generálása
    let sorszam = Math.floor(Math.random() * 300) + 100; // 100-399
    szam[7] = Math.floor(sorszam / 100);
    szam[8] = Math.floor((sorszam % 100) / 10);
    szam[9] = sorszam % 10;

    // 11. jegy (K): Ellenőrző számjegy
    const elsoTizSzam = szam.slice(0, 10);
    let K = ellenorzoSzamjegyKalkulacio(elsoTizSzam);

    // Ha a K képzés eredménye 10 (vagy -1), új számot generálunk, mert ez a formátum nem adható ki.
    if (K === -1) {
        return generalSzemelyiSzam();
    }

    szam[10] = K;

    return szam.join('');
}

// A személyi szám megjelenítése a hiányzó számjeggyel
function megjelenitSzam(szam, hianyzoIndex) {
    const display = document.getElementById('szam-megjelenito');
    display.innerHTML = '';

    // Szigorúan 11 számjegyet jelenítünk meg
    for (let i = 0; i < 11; i++) {
        let jegy = szam.charAt(i);
        let span = document.createElement('span');
        span.classList.add('szamjegy');

        if (i === hianyzoIndex) {
            span.textContent = '?';
            span.classList.add('hianyzo');
        } else {
            span.textContent = jegy;
        }

        // Formátum megjelenítése szóközökkel: M ÉÉHHNN SSSK
        if (i === 0 || i === 6 || i === 9) {
            span.style.marginRight = '10px';
        }

        display.appendChild(span);
    }
}

// Játék inicializálása
function ujJatek() {
    tippSzamlalo = 0;
    document.getElementById('tipp-szamlalo').textContent = tippSzamlalo;
    document.getElementById('visszajelzes').textContent = '';
    document.getElementById('visszajelzes').className = '';
    document.getElementById('jatek-terulet').style.display = 'block';
    jatekElkezdodott = true;

    // Helyes szám generálása
    helyesSzam = generalSzemelyiSzam();

    // Véletlen hiányzó index kiválasztása (az utolsó ellenőrző számjegy nagyobb eséllyel hiányzik)
    const randomFaktor = Math.random();
    if (randomFaktor < 0.3) {
        // Ellenőrző számjegy hiányzik (K)
        hiányzóIndex = 10;
    } else if (randomFaktor < 0.6) {
        // Dátum rész hiányzik (ÉÉHHNN)
        hiányzóIndex = Math.floor(Math.random() * 6) + 1; // 1-től 6-ig
    } else {
        // Egyéb jegy hiányzik
        hiányzóIndex = Math.floor(Math.random() * 10); // 0-tól 9-ig
    }

    // Megjelenítés a hiányzó résszel
    megjelenitSzam(helyesSzam, hiányzóIndex);
}

// Tipp ellenőrzése
function tippEllenorzes() {
    if (!jatekElkezdodott) {
        document.getElementById('visszajelzes').textContent = 'Kattints az "Új Szám" gombra a kezdéshez!';
        document.getElementById('visszajelzes').className = 'rossz-tipp';
        return;
    }

    const tippInput = document.getElementById('tipp');
    const tippErtek = tippInput.value;

    if (tippErtek === '' || isNaN(tippErtek) || tippErtek.length !== 1) {
        document.getElementById('visszajelzes').textContent = 'Kérlek, adj meg egyetlen számjegyet (0-9).';
        document.getElementById('visszajelzes').className = 'rossz-tipp';
        return;
    }

    tippSzamlalo++;
    document.getElementById('tipp-szamlalo').textContent = tippSzamlalo;

    const helyesJegy = helyesSzam.charAt(hiányzóIndex);
    const visszajelzes = document.getElementById('visszajelzes');

    if (tippErtek === helyesJegy) {
        // Helyes tipp
        visszajelzes.textContent = `Gratulálok! 🎉 Elgondolkodva a megoldás: ${helyesJegy}.`;
        visszajelzes.classList.remove('rossz-tipp');
        visszajelzes.classList.add('jo-tipp');

        // Helyes szám megjelenítése
        megjelenitSzam(helyesSzam, -1);

        // Játék vége
        document.getElementById('jatek-terulet').style.display = 'none';
        jatekElkezdodott = false;

        setTimeout(() => {
            alert(`Sikeresen eltaláltad a számot ${tippSzamlalo} tippből!`);
        }, 100);

    } else {
        // Rossz tipp
        visszajelzes.textContent = '❌ Sajnos téves! Próbáld újra.';
        visszajelzes.classList.remove('jo-tipp');
        visszajelzes.classList.add('rossz-tipp');
    }

    tippInput.value = ''; // Tipp mező ürítése
    tippInput.focus(); // Fókusz visszaállítása
}

// Indításkor az újJáték meghívása
window.onload = ujJatek;