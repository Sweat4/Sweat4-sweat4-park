/* =====================================================================
   OUTDOORPARK-APP – Videos zu den Übungen
   Schlüssel = Übungs-ID aus park-katalog.js. Ein Video austauschen = nur diese Zeile ändern.

     file         Dateiname (zur Übersicht, z. B. 'brust-1.mp4')
     src          Video-Pfad oder -URL (z. B. 'videos/brust-1.mp4' oder https://…)
     poster       Vorschaubild (z. B. 'videos/brust-1.jpg') – optional
     orientation  'portrait' (Hochformat) | 'landscape' (Querformat) – optional, sonst automatisch

   Beispiel:
     'ph-brust-1': { file: 'brust-1.mp4', src: 'videos/brust-1.mp4', poster: 'videos/brust-1.jpg', orientation: 'portrait' },

   Solange src leer ist, zeigt die App einen neutralen Platzhalter „Video folgt“.
   ===================================================================== */
window.PARK_VIDEOS = {
  // noch keine Videos hinterlegt
};
