/* =====================================================================
   OUTDOORPARK-APP – Videos zu den Übungen
   Schlüssel = Übungs-ID aus park-katalog.js. Ein Video austauschen = nur diese Zeile ändern.

     file         Dateiname (zur Übersicht, z. B. 'brust-1.mp4')
     src          Video-Pfad oder -URL (z. B. 'videos/brust-1.mp4' oder https://…)
     poster       Vorschaubild (z. B. 'videos/brust-1.jpg') – optional
     orientation  'portrait' (Hochformat) | 'landscape' (Querformat) – optional, sonst automatisch
     ai           true = mit KI erstellt → die App zeigt den Hinweis „Mit KI erstellt“

   Beispiel:
     'ph-brust-1': { file: 'brust-1.mp4', src: 'videos/brust-1.mp4', poster: 'videos/brust-1.jpg', orientation: 'portrait' },

   Solange src leer ist, zeigt die App einen neutralen Platzhalter „Video folgt“.
   ===================================================================== */
window.PARK_VIDEOS = {
  // Präsentations-Video: mit KI erstellt (Runway), Hinweis wird angezeigt
  'tbar-schulterdruecken': { file: 'tbar-schulterdruecken.mp4', src: 'tbar-schulterdruecken.mp4', poster: 'tbar-schulterdruecken.jpg', orientation: 'portrait', ai: true },
};
