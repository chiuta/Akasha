# Akasha

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · **Deutsch** · [Magyar](README.hu.md)

**Version:** 1.1.1 · **Zuletzt aktualisiert:** 2026-10-18

Oberflächensprachen: **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

Offline-Akasha-Chronik: ein Quine in einer einzigen HTML-Datei, das sich mit allen eingebetteten Einträgen neu verkörpert.

**Online:** https://chiuta.github.io/Akasha/

![Screenshot](screenshot.png)

## Was es ist

Akasha ist ein persönliches Register von Einträgen (Gedanken, Ereignisse, Wissen, Erinnerungen, Visionen, Fragen) in einer einzigen Datei `index.html`. Es ist ein *Quine*: Wenn Sie auf „Reinkarnieren“ drücken, schreibt die Anwendung eine neue Kopie ihrer selbst (`akasha.html`) mit allen aktuellen Einträgen, die in die Datei eingebettet sind. Die neue Datei ist die Anwendung plus Ihre Daten.

## Funktionen

- Einträge mit Titel, Kategorie (Gedanke, Ereignis, Wissen, Erinnerung, Vision, Frage), „Resonanz“, Schlagwörtern und Inhalt mit einfacher Formatierung (`**fett**`, `*kursiv*`, `` `Code` ``, Listen, Überschriften).
- Suche, Filterung nach Kategorien und Schlagwörtern, Sortierung (Zuletzt geändert, Zuletzt erstellt, Resonanz, Alphabetisch).
- Bearbeiten, Duplizieren und Löschen von Einträgen; Menü mit „Archiv“ und „Statistiken“ (Einträge, Wörter, eindeutige Schlagwörter, abgedeckte Tage, Aufschlüsselung nach Kategorien).
- „Eigenen Code ansehen“: zeigt den vollständigen Quelltext, den die Anwendung bei der Reinkarnation schreibt (kopieren oder herunterladen).
- „Integrität prüfen“: prüft die Fixpunkt-Eigenschaft (byte-identischer Re-Export), das einmalige Vorhandensein des Datenblocks und das erneute Laden aller Einträge.
- „JSON exportieren“, „Markdown exportieren“ (eine einzige Datei `akasha-records.md`, mit alphabetisch geordneten Überschriften) und „Importieren (JSON / .html)“.
- Verknüpfungen zwischen Einträgen: `[[Titel]]` im Inhalt wird zu einem Link auf den Eintrag mit diesem Titel (Groß-/Kleinschreibung egal; Links ohne Ziel sind abgeblendet), und in der Detailansicht erscheint die Liste „Erwähnt in“ (Rückverweise).
- Drucken: die Schaltfläche „Drucken“ in der Detailansicht eines Eintrags; Schwarz-Weiß-Druckstil (ohne Menüs und Hintergrund).
- Sternenhintergrund, der ein-/ausgeschaltet werden kann (im dunklen Thema); das helle Thema folgt der Systemeinstellung.
- Automatische Sicherheitsspeicherung im Browser, mit einem Hinweis „Wiederherstellen / Ignorieren“ für Änderungen, die neuer sind als die Datei; Warnung beim Schließen, wenn nicht gespeicherte Änderungen vorliegen.
- Oberfläche in 58 Sprachen (einschließlich Rumänisch), mit Unterstützung für Rechts-nach-links-Schrift (ar, he, fa, ur).

## Neue Funktionen (v1.1.0)

- **Vorlesen** (Sprachsynthese des Browsers, `speechSynthesis`, über `FFF.tts`): Die Schaltfläche in der Fußzeile der Detailansicht eines Eintrags spricht den Titel, dann den Text; ein zweiter Klick beendet es; das Schließen des Panels beendet die Stimme. Die Sprache der Stimme folgt der Oberflächensprache. Hat der Browser keine Stimme für diese Sprache (oder keine Sprachsynthese), erscheint eine Meldung und es wird nichts gesprochen. Qualität und Verfügbarkeit der Stimmen hängen vom System ab.
- **QR-Code für einen Eintrag**: In der Detailansicht wird ein QR-Code erzeugt (Präfix `akasha1:` + JSON mit Titel, Kategorie, Resonanz, Schlagwörtern und Text) von höchstens 1000 Byte. Längerer Text wird **gekürzt, mit Warnung** („X von 6300 Zeichen“); es wird keine Kapazität vorgetäuscht, die der Code nicht hat. Im Menü fügt „QR aus einem Bild lesen“ einen **neuen Eintrag** hinzu (er überschreibt keinen); der Inhalt wird validiert (Kategorie, Resonanz, Längen), und defektes JSON oder ein fremder QR-Code werden abgelehnt.
- **Barrierefreiheit**: Panel mit „Größerer Text“ (Zoom 1,2) und „Hoher Kontrast“ (auch im hellen Thema); die Einstellungen werden lokal gespeichert und nicht in die reinkarnierten Kopien eingebettet.
- **Kit**: Dialog „Transparenz“ und `.fff.json`-Sicherung (Module `core`, `label`, `bundle`, `qr`, `tts`). Da die Anwendung ein Quine ist, warnt der Dialog, dass die Daten in der reinkarnierten Datei nicht in `localStorage` gelangen und daher nicht in der `.fff.json`-Sicherung enthalten sind; die maßgebliche Quelle bleibt „Reinkarnieren“.
- **Sprachen und Übersetzungen**: Die neuen Texte sind auf Rumänisch und Englisch geschrieben, mit ungarischen und deutschen Varianten; die übrigen Sprachen verwenden für die neuen Funktionen Englisch. Die Übersetzungen (hu, de) sind automatisch und **nicht von Muttersprachlern geprüft**; das Kit enthält Texte in 8 Sprachen, ebenfalls nicht muttersprachlich geprüft.

## Bedienungsanleitung

1. Öffnen Sie `index.html` im Browser.
2. Drücken Sie „Einschreiben“ (oder die Taste `N`), füllen Sie Titel, Kategorie, Resonanz, Schlagwörter und Inhalt aus und dann „Speichern“.
3. Suchen Sie mit dem Suchfeld (Taste `/`) oder filtern Sie über das Panel „Kategorien“ / „Schlagwörter“; ändern Sie die Reihenfolge unter „Sortieren“.
4. Öffnen Sie einen Eintrag, um ihn zu bearbeiten, zu duplizieren oder zu löschen.
5. **Um die Daten zu behalten:** Drücken Sie „Reinkarnieren“ (`Strg+S` / `Cmd+S`). Der Browser lädt `akasha.html` herunter; öffnen Sie beim nächsten Mal diese Datei, denn sie enthält alle Einträge.
6. Für Sicherungen: Menü „JSON exportieren“; zum Laden von Daten: „Importieren (JSON / .html)“.
7. Für die Sprache verwenden Sie die Sprachauswahl der Oberfläche (Beschriftung „Sprache“).
8. Weitere Kurzbefehle: `Esc` schließt den Dialog oder das Menü; Ein-Tasten-Kurzbefehle (`N`, `/`) sind deaktiviert, während Sie in ein Feld schreiben.

## Datenschutz und Netzwerk

- Das „Ohne-Grenzen“-Kit (`fff-kit`, Module `core, label, bundle, qr, tts`) ist in `index.html` eingefügt: Es stellt keine Netzwerkanfragen. Der Dialog „Transparenz“ (Klick auf die Version) zeigt das deklarierte Netzwerk (0 externe Anfragen), die Schlüssel in `localStorage`, den SHA-256 der Datei und bietet eine `.fff.json`-Sicherung (optional mit Passwort verschlüsselt, AES-GCM). QR-Codes werden lokal erzeugt und gelesen; das Lesen erfolgt nur aus einem vom Benutzer gewählten Bild, ohne Kamera.
- Das Vorlesen nutzt die Sprach-Engine des Systems; manche Systeme können sie an einen Netzwerkdienst des Anbieters senden — die Anwendung hat darauf keinen Einfluss.

- Die Anwendung enthält keine Netzwerkaufrufe (kein `fetch`, keine CDNs oder externen Ressourcen) und kontaktiert keinen Drittanbieter-Host.
- Die Daten werden im Datenblock innerhalb der HTML-Datei gehalten (maßgebliche Quelle). Zusätzlich enthält `localStorage` eine automatische Sicherung (Schlüssel `akasha:autosave:v1`), die nach der Reinkarnation gelöscht wird.
- Es gibt keine Analysefunktionen; die Anwendung selbst zeigt „Telemetrie: 0“ und „Abhängigkeiten: 0“.

## Lokale Ausführung / offline

Laden Sie `index.html` herunter und öffnen Sie sie direkt aus dem Dateisystem (`file://`), ohne Server. Kein Internet erforderlich.

## Lizenz

MIT-Lizenz für den Code und die Struktur der Anwendung — siehe Datei `LICENSE`. Eventuelle in der Datei enthaltene Drittanbieter-Bibliotheken behalten ihre eigenen Lizenzen.

## Audit

Audit: 2026-10-10 — geprüft mit Playwright und axe-core; im Code geprüft: kein `fetch`/CDN. Der Import nicht vertrauenswürdiger Einträge (JSON mit `</script>`, `<img onerror>`) wurde getestet: Der Text wird maskiert, und der Datenblock wird mit `<` → `<` serialisiert. Behoben: Auf schmalen Bildschirmen fehlten die seitlichen Ränder (20 px). Hinweis: Der Name „Akasha/Akasha-Chronik“ ist nur thematisch — die Anwendung ist ein Notizwerkzeug, ohne esoterischen Anspruch.

## Verlauf / Changelog

- 1.1.1 — 2026-10-18: Der Import von Registern ändert die Einstellung „Sterne“ nicht mehr (`meta.stars` aus der Datei wird ignoriert); entsprechender Test.
- 1.1.0 — 2026-10-14: Vorlesen, QR-Code für einen Eintrag (Erzeugung + Lesen aus einem Bild), Barrierefreiheits-Panel (größerer Text, hoher Kontrast; Kontrast im hellen Thema behoben), „Ohne-Grenzen“-Kit (Transparenz + `.fff.json`-Sicherung). Tests: `tests/fff-r8.test.mjs`.

- 1.0.4 — 2026-10-12: Die Version und das Datum der letzten Aktualisierung werden in der Anwendung angezeigt (Fußzeile, mit übersetzter Beschriftung).
- v1.0.3: automatisches **helles Thema** (`prefers-color-scheme: light`; das dunkle bleibt Standard; kein manueller Umschalter, daher keine neuen Texte zu übersetzen); der Sternenhintergrund wird im hellen Thema ausgeblendet. Die Kategoriefarben im Text sind jetzt CSS-Variablen (`--cat`), im hellen Thema für den Kontrast abgedunkelt. Behoben: Das Feld mit dem Quellcode („Eigenen Code ansehen“) ließ sich mit der Tastatur nicht scrollen (es hat jetzt `tabindex="0"` und einen Namen). CSP-Hash neu berechnet; „Integrität prüfen“ gelingt in beiden Themen; axe-core = 0 Verstöße bei 1280 und 360 px in beiden Themen, auch in Dialogen.
- v1.0.2: Die Vorschau in der Liste entfernt keine Bindestriche mehr aus Wörtern (z. B. „re-export“), sondern nur die Markierungen am Zeilenanfang; hinzugefügt wurden „Markdown exportieren“, `[[Titel]]`-Links mit „Erwähnt in“, die Schaltfläche „Drucken“ und ein Druckstil (neue Texte in 7 Sprachen; die übrigen verwenden Englisch). CSP: Hash neu berechnet.
- Barrierefreiheit: Der Titel „Akasha“ ist h1, die seitlichen Panels sind h2, Einträge verwenden `role="button"` nicht mehr auf `<article>` (jetzt `<div>`), die Sternen-Canvas ist für Screenreader ausgeblendet; axe-core = 0 Verstöße bei 1280 und 360 px.
- Eine CSP-Richtlinie wurde hinzugefügt (`<meta>`: Skripte nur per Hash, `connect-src 'none'`); die Prüfung „Quine-Integrität“ (Fixpunkt) bleibt erfolgreich.
- Die Vorschau eines Eintrags, der Text der Art `<script …` enthält, wird als einfacher Text (maskiert) angezeigt, nicht interpretiert; ihre Kürzung ist nur kosmetisch.

## Autor

Alexio — Alexandru-Ionuț Chiuță. Kontakt: alexio@trom.tf

## English summary

Akasha is a single-file offline "akashic record": a quine that, on "Reincarnate" (Ctrl/Cmd+S), writes a fresh copy of itself with all records embedded. It has search, tags, categories, JSON import/export, an integrity check, and a UI in 58 languages. It makes no network requests; an autosave backup is kept in localStorage.
