# Changelog — Akasha

Format: SemVer MAJOR.MINOR.PATCH. Date: AAAA-LL-ZZ.

## 2.1.0 — 2026-11-02 (reîmprospătare kit)

- Nou (kit): **Sincronizare între dispozitive** (`FFF.sync`) — în dialogul «Transparență» (clic pe versiune → Copie de siguranță): conectezi două dispozitive direct (WebRTC, cod/QR, fără server și fără cont) și își schimbă datele aplicației; cea mai recentă valoare câștigă, secretele (chei API, parole) nu se trimit, ștergerile nu se propagă. Aplicarea trece prin importul kitului (confirmare, chei permise, rollback).
- Nou (kit): **Istoric local — «mașina timpului»** (`FFF.history`) — instantanee automate ale datelor (IndexedDB, fără secrete), diferență față de starea curentă și restaurare reversibilă; «Șterge datele aplicației» șterge și istoricul.
- Module adăugate: `qr`, `p2p`, `sync`, `history` (+~140 KB). Versiunea aplicației nu se schimbă.

## 2.1.0 — 2026-11-01

- Corectat: adaptorul «Trimite la…» nu mai aruncă eroare când kitul FFF lipsește (gardian pe fiecare bloc; găsit de testul «fără kit» din CI).

Nou: «Trimite la…» (fff-kit, modulul FFF.bridge) — după orice export de fișier (GPX, ICS, CSV, Markdown) apare butonul «Trimite la…» către aplicațiile compatibile, iar importul de fișiere al aplicației primește plicuri .fff.json trimise de ele, cu confirmare înainte de import. Fără rețea, fără telemetrie.

## 2.0.1 — 2026-10-27

Doar texte și documentație (fără modificări de logică sau de mecanism quine).

- README (toate cele 8 limbi): adăugate liniile „Stare: stabil” și „Offline: complet”.
- README (toate cele 8 limbi): paragraf „Protecția datelor” care explică ce există deja: salvare automată de rezervă în `localStorage` (cheia `akasha:autosave:v1`, în `try/catch`), banner „Restaurează / Ignoră”, indicator „modificări nesalvate” și confirmarea la închiderea filei (`beforeunload`) cât timp există modificări nescrise într-un fișier. Se precizează că rezerva din browser nu înlocuiește fișierul reîncarnat.
- Metadate: `app.json` și blocul `fff-info` (versiune, dată, SHA-256 canonic); hash-urile CSP ale scripturilor inline au fost recalculate (conținutul scripturilor nu s-a schimbat).

## 2.0.0 — 2026-10-26

Graf de legături și sugestii de conexiuni (vezi README).
