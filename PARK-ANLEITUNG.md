# Outdoorpark-App – Anleitung (Version 1, Grundgerüst)

Eigenständige App für den Sweat4 Outdoorpark. Technische Grundlage ist die SWEAT4-App
(Stand v49/v50). Die SWEAT4-App selbst wurde dafür **nicht verändert**.

## Dateien

| Datei | Inhalt | Wer ändert sie? |
|---|---|---|
| `index.html` | Kopie der SWEAT4-App mit wenigen Zeilen, die mit `PARK` markiert sind (eigene Datenbank, eigene Speicher-Schlüssel, Videos statt 3D, Platzhalter-Logo) | nur bei App-Updates |
| `park-config.js` | **App-Name, Logo, Farben, QR-Zugang, Rack-Bereiche** | du |
| `park-katalog.js` | **Übungskatalog** (derzeit 18 Platzhalter in 9 Kategorien) | du |
| `park-videos.js` | **Videos** je Übung (Datei, Pfad/URL, Vorschaubild, Hoch-/Querformat) | du |
| `park.js` | Park-Funktionen: Profil, Zugang, Programme, Video-Player, Rack-Skizze, Startseite | nur bei Änderungen der Funktionen |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | Offline-Fähigkeit, App-Symbol (Platzhalter) | Symbole später ersetzen |
| `sprache-en.js`, `lebensmittel.js` | aus der SWEAT4-App übernommen | – |

## Hochladen

Eigenes Repository anlegen, z. B. `Sweat4/sweat4-park`, alle Dateien hineinladen und GitHub Pages
einschalten. Adresse dann z. B. `https://sweat4.github.io/sweat4-park/`.

## QR-Code an der Drehtür

Der QR-Code enthält die App-Adresse mit `?zugang=drehtuer`, z. B.
`https://sweat4.github.io/sweat4-park/?zugang=drehtuer`

- Erstes Scannen: Profil anlegen (Name, Ziel, Frau/Mann, Bestätigung Gesundheits- und Datenschutzhinweis), danach Programm wählen.
- Später: „Willkommen im Outdoorpark“ → „Zum Training“.
- **Es gibt noch keine Verbindung zur Drehtür.** Die App öffnet keine Tür und täuscht keine Öffnung vor.
  Vorbereitet ist die Schnittstelle `ParkAccess` (in `park.js`). Sobald es ein Zugangssystem gibt, wird in
  `park-config.js` unter `access.verify` dessen Adresse eingetragen.

## Login

Kein Konto, kein Passwort: Jeder Sportler legt sein Profil auf dem **eigenen Handy** an. Die Daten bleiben
auf dem Handy (eigene Datenbank `sweat4-park`). Handywechsel über „Einstellungen → Sicherung erstellen /
importieren“. Sicherungen der Park-App lassen sich nicht in die SWEAT4-App einspielen und umgekehrt.

## Übung ersetzen

In `park-katalog.js` den Eintrag mit derselben `id` überschreiben (Name, Kategorie `g`, Texte, Muskeln,
`rack`) und `placeholder: true` entfernen. Pläne und Trainingsverlauf bleiben über die `id` verknüpft.
Neue Übungen einfach anhängen. Kategorien stehen in `SW_GRUPPEN`.

## Video hinzufügen oder austauschen

Video in einen Ordner `videos/` im Repository legen und in `park-videos.js` eintragen:

```js
'ph-brust-1': { file: 'brust-1.mp4', src: 'videos/brust-1.mp4', poster: 'videos/brust-1.jpg', orientation: 'portrait' },
```

Hochformat und Querformat werden automatisch erkannt (`orientation` ist optional). Empfehlung: MP4 (H.264),
kurz, ohne Ton, unter ca. 10 MB pro Video. Videos von einem anderen Server (https://…) sind ebenfalls erlaubt.
Ohne Video zeigt die App „Video folgt“ – ohne Abspielknopf.

## Rack-Skizze

`park-config.js → rack.image` auf deine Grafik setzen (z. B. `'rack.png'`) und die Bereiche `areas`
(Name, Beschreibung, Position in Prozent) an die echten Bereiche anpassen. Übungen erscheinen in einem
Bereich, wenn ihr Feld `rack` die Bereichs-ID enthält. Derzeit: neutraler Platzhalter mit Bereich A–D.

## Programme

Vier Programme in `park.js` (Abschnitt „Vier Rack-Programme“): Männer/Frauen × Muskelaufbau/Körperdefinition,
je 3 Trainingstage. Aufbau wie in der SWEAT4-App (Sätze, Wiederholungsbereiche, Pausen, Supersätze/Zirkel).
Die Übungen verweisen auf die Platzhalter – nach dem Ersetzen der Übungen im Katalog stimmen die Programme
automatisch. Sätze/Wiederholungen bitte zusammen mit den echten Übungen festlegen.

## Branding

`park-config.js`: `name`, `short`, `tagline`, `logoMark` (SVG-Text), `colors.accent`. Außerdem `<title>` und
`apple-mobile-web-app-title` in `index.html`, Name in `manifest.webmanifest`, Symbole `icon-180/192/512.png`.

## Bewusst nicht enthalten (Trainer-/Betreuungsfunktionen der SWEAT4-App)

Kundenverwaltung, Nachrichten, Push, Fragebogen, Ernährung, Körpermessungen/Fotos, Laufprogramme,
Zyklus-Modul. Sie hängen in der SWEAT4-App am Trainer bzw. am Briefkasten und sind hier ausgeblendet.

## Technischer Hinweis zur Trennung

Laufen beide Apps unter derselben Adresse `sweat4.github.io`, sind die **Daten** sicher getrennt (eigene
Datenbank, eigene Speicher-Schlüssel). Den **Offline-Zwischenspeicher** räumt die SWEAT4-App bei ihren Updates
allerdings komplett auf (so ist ihr bestehender Service Worker gebaut). Die Park-App lädt ihn dann einfach neu,
solange Internet da ist. Saubere Lösung später: eigene Domain/Subdomain für die Park-App.
