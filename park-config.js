/* =====================================================================
   OUTDOORPARK-APP – zentrale Konfiguration (Branding, Speicher, Zugang, Rack)
   Hier stehen alle Werte, die du später selbst austauschst. Die übrige App
   muss dafür nicht verändert werden.
   ===================================================================== */
window.APP_CFG = {
  /* ---------- Branding (Platzhalter) ----------
     name/short: App-Name. logoMark/logoFull: eigenes Logo als SVG-Text (oder null = neutraler Platzhalter).
     colors: Akzentfarben (CSS-Werte). Leer lassen = Farben der SWEAT4-App. */
  name: 'SW4 Park',
  short: 'SW4 Park',
  tagline: 'The Outdoor Fitnesspark',
  logoImg: 'logo.png',     // ganzes Logo (Start, Zugang) – transparentes PNG
  logoMark: '<img class="logo-mark" src="logo-mark.png" alt="SW4">',   // kleines Zeichen oben links
  logoFull: null,          // null = es wird logoMark verwendet
  colors: { accent: '', accentSoft: '' },

  /* ---------- Daten (getrennt von der SWEAT4-Trainer-App) ---------- */
  dbName: 'sweat4-park',
  appId: 'sweat4-park',
  videoOnly: true,          // echte Videos statt 3D-Animationen

  /* ---------- QR-Code an der Drehtür ----------
     Der QR-Code enthält die Adresse der App mit dem Parameter ?zugang=… , z. B.
       https://DEINE-ADRESSE/park/?zugang=drehtuer
     Die App öffnet dann den Zugangsbereich. Eine echte Zugangskontrolle gibt es noch NICHT:
     verify ist absichtlich leer (null). Sobald ein Server/Drehtür-System existiert, wird hier
     eine Adresse eingetragen, die den Zugang prüft (Antwort {ok:true|false}). Die App öffnet
     keine Tür und täuscht keine Türöffnung vor. */
  access: {
    param: 'zugang',
    gates: { drehtuer: 'Drehtür Eingang' },
    verify: null              // z. B. 'https://zugang.example.workers.dev/check' – noch nicht vorhanden
  },

  /* ---------- Rack-Skizze ----------
     image: Pfad zu deiner Original-Grafik (z. B. 'rack.png') – null = neutraler Platzhalter.
     areas: anklickbare Bereiche. Position in Prozent der Grafik (x, y, w, h).
     Namen und Beschreibungen sind Platzhalter, bis du die echten Bereiche festlegst.
     Übungen werden über das Feld rack (z. B. 'A') im Übungskatalog zugeordnet. */
  rack: {
    image: null,
    count: 4,                  // vier identische Racks im Park
    perRack: '10–12',          // Personen pro Rack
    areas: [
      { id: 'A', name: 'Bereich A', note: 'Bezeichnung folgt', x: 6, y: 10, w: 40, h: 38 },
      { id: 'B', name: 'Bereich B', note: 'Bezeichnung folgt', x: 54, y: 10, w: 40, h: 38 },
      { id: 'C', name: 'Bereich C', note: 'Bezeichnung folgt', x: 6, y: 54, w: 40, h: 38 },
      { id: 'D', name: 'Bereich D', note: 'Bezeichnung folgt', x: 54, y: 54, w: 40, h: 38 }
    ]
  }
};
