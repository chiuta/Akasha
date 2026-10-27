# Changelog — Akasha

Format: SemVer MAJOR.MINOR.PATCH. Date: AAAA-LL-ZZ.

## 2.0.1 — 2026-10-27

Doar texte și documentație (fără modificări de logică sau de mecanism quine).

- README (toate cele 8 limbi): adăugate liniile „Stare: stabil” și „Offline: complet”.
- README (toate cele 8 limbi): paragraf „Protecția datelor” care explică ce există deja: salvare automată de rezervă în `localStorage` (cheia `akasha:autosave:v1`, în `try/catch`), banner „Restaurează / Ignoră”, indicator „modificări nesalvate” și confirmarea la închiderea filei (`beforeunload`) cât timp există modificări nescrise într-un fișier. Se precizează că rezerva din browser nu înlocuiește fișierul reîncarnat.
- Metadate: `app.json` și blocul `fff-info` (versiune, dată, SHA-256 canonic); hash-urile CSP ale scripturilor inline au fost recalculate (conținutul scripturilor nu s-a schimbat).

## 2.0.0 — 2026-10-26

Graf de legături și sugestii de conexiuni (vezi README).
