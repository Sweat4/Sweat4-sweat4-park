/* =====================================================================
   OUTDOORPARK-APP – Übungskatalog (nur Übungen am Sweat4 Outdoor-Rack)
   Gleiche Struktur wie der Katalog der SWEAT4-App, damit Suche, Filter,
   Trainingspläne und Training unverändert funktionieren.

   Felder je Übung:
     id      eindeutige ID (bleibt fest – Videos und Pläne verweisen darauf)
     n       Übungsname · g Muskelgruppe/Kategorie · sg Untergruppe (optional)
     sub     Zielmuskel (kurz) · eq Equipment bzw. Rack-Bereich (Text)
     rack    Rack-Bereich-ID aus park-config.js (z. B. 'A') – für die Rack-Skizze
     prim/sec Muskeln (Schlüssel aus SW_MUSKELN)
     typ     dynamisch | isometrisch | plyometrisch · lvl Einsteiger | Mittel | Fortgeschritten | Profi
     unit    null = Wiederholungen · 's' = Sekunden · 'm' = Meter
     start   Ausgangsposition · exec Ausführungsschritte (Liste) · dir Bewegungsrichtung
     tips    Technik-Hinweise · errs häufige Fehler · breath Atmung · safety Sicherheit · param Trainingsparameter
     anim    immer null (keine 3D-Animationen der Trainings-App)
     demo3d  true = 3D-Vorführung am Rack vorhanden (Ablauf in park-demos.js, gleiche id)
     placeholder true = vorbereiteter Platzhalter, wird durch die echte Übung ersetzt
   Das Video steht NICHT hier, sondern in park-videos.js (gleiche ID) – so kann ein Video
   ausgetauscht werden, ohne die Übung zu verändern.

   ÜBUNG ERSETZEN: Eintrag mit gleicher id überschreiben (Name, Texte, Muskeln, rack …),
   placeholder entfernen. Pläne und Trainingsverlauf bleiben verknüpft.
   NEUE ÜBUNG: weiteren Eintrag anhängen.
   ===================================================================== */
window.SW_MUSKELN = {"chest":"Brustmuskel","frontDelt":"vordere Schulter","sideDelt":"seitliche Schulter","rearDelt":"hintere Schulter","traps":"Trapezmuskel (Nacken)","lats":"Latissimus (breiter Rücken)","upperBack":"oberer Rücken (Rhomboiden)","lowerBack":"unterer Rücken (Rückenstrecker)","biceps":"Bizeps","triceps":"Trizeps","forearms":"Unterarme","brachialis":"Brachialis (Oberarmmuskel unter dem Bizeps)","brachioradialis":"Brachioradialis (Oberarm-Speichen-Muskel)","abs":"gerader Bauchmuskel","obliques":"schräge Bauchmuskeln","glutes":"Gesäß","quads":"Quadrizeps (Oberschenkel vorne)","hamstrings":"Beinbeuger (Oberschenkel hinten)","adductors":"Adduktoren (Innenseite)","abductors":"Abduktoren (Gesäß seitlich)","calves":"Waden","hipFlexors":"Hüftbeuger"};
window.SW_GRUPPEN = ['Brust', 'Rücken', 'Schulter', 'Arme', 'Bauch', 'Beine', 'Gesäß', 'Ganzkörper', 'Funktionell'];
(function () {
  const FOLGT = 'Wird ergänzt, sobald die Übung festgelegt ist.';
  // Platzhalter: neutral beschriftet, damit niemand ihn für eine echte Übung hält
  const P = (id, g, nr, prim, sec, rack) => ({
    id, n: `Platzhalter · ${g} ${nr}`, g, sub: 'Übung folgt', eq: `Sweat4 Outdoor-Rack · Bereich ${rack} (Platzhalter)`, rack,
    prim, sec, typ: 'dynamisch', lvl: 'Einsteiger', unit: null, anim: null, placeholder: true,
    start: FOLGT, exec: [FOLGT], dir: FOLGT, tips: ['Technik-Hinweise folgen mit der echten Übung'], errs: ['Häufige Fehler folgen mit der echten Übung'],
    breath: '', safety: '', param: 'Trainingsparameter werden mit der echten Übung festgelegt.', alias: ['Platzhalter']
  });
  window.SW_KATALOG = [
    P('ph-brust-1', 'Brust', 1, ['chest'], ['frontDelt', 'triceps'], 'A'),
    P('ph-brust-2', 'Brust', 2, ['chest'], ['frontDelt', 'triceps'], 'B'),
    P('ph-ruecken-1', 'Rücken', 1, ['lats'], ['upperBack', 'biceps'], 'C'),
    P('ph-ruecken-2', 'Rücken', 2, ['upperBack'], ['lats', 'rearDelt'], 'D'),
    P('ph-schulter-1', 'Schulter', 1, ['frontDelt', 'sideDelt'], ['triceps', 'traps'], 'A'),
    P('ph-schulter-2', 'Schulter', 2, ['sideDelt', 'rearDelt'], ['traps'], 'B'),
    P('ph-arme-1', 'Arme', 1, ['biceps'], ['forearms'], 'C'),
    P('ph-arme-2', 'Arme', 2, ['triceps'], ['chest'], 'D'),
    P('ph-bauch-1', 'Bauch', 1, ['abs'], ['hipFlexors'], 'A'),
    P('ph-bauch-2', 'Bauch', 2, ['obliques', 'abs'], [], 'B'),
    P('ph-beine-1', 'Beine', 1, ['quads'], ['glutes', 'adductors'], 'C'),
    P('ph-beine-2', 'Beine', 2, ['hamstrings'], ['glutes', 'calves'], 'D'),
    P('ph-gesaess-1', 'Gesäß', 1, ['glutes'], ['hamstrings'], 'A'),
    P('ph-gesaess-2', 'Gesäß', 2, ['glutes', 'abductors'], ['quads'], 'B'),
    P('ph-ganzkoerper-1', 'Ganzkörper', 1, ['quads', 'glutes', 'lats'], ['abs', 'frontDelt'], 'C'),
    P('ph-ganzkoerper-2', 'Ganzkörper', 2, ['chest', 'quads'], ['abs', 'glutes'], 'D'),
    P('ph-funktionell-1', 'Funktionell', 1, ['abs', 'obliques'], ['forearms', 'glutes'], 'A'),
    P('ph-funktionell-2', 'Funktionell', 2, ['forearms', 'abs'], ['traps', 'calves'], 'B'),
    // Erste echte Rack-Übung mit 3D-Vorführung (park-demos.js, gleiche id)
    { id: 'tbar-front-squat', n: 'Front-Kniebeuge mit der T-Bar', g: 'Beine', sg: 'Grundübungen', sub: 'Quadrizeps · Gesäß',
      eq: 'T-Bar am Sweat4 Rack, Olympia-Stange mit Scheibe', rack: null, demo3d: true,
      prim: ['quads', 'glutes'], sec: ['adductors', 'abs', 'lowerBack', 'upperBack'], typ: 'dynamisch', lvl: 'Einsteiger', unit: null, anim: null,
      start: 'Stangenende der T-Bar mit beiden Händen vor dem Brustbein halten, Ellbogen zeigen nach unten. Füße etwa schulterbreit, Zehen leicht nach außen. Oberkörper aufrecht, Bauch fest.',
      exec: ['Einatmen und den Bauch fest anspannen.', 'Hüfte und Knie gleichzeitig beugen und kontrolliert nach unten gehen – die Knie zeigen in Richtung der Fußspitzen.', 'So tief gehen, bis die Oberschenkel etwa parallel zum Boden sind. Die Fersen bleiben am Boden, der Oberkörper bleibt aufrecht.', 'Über den ganzen Fuß kraftvoll, aber sauber nach oben drücken, bis Hüfte und Knie gestreckt sind.'],
      dir: 'Hüfte nach hinten unten, dann wieder nach oben. Die Stange bewegt sich auf einem Bogen um die T-Bar-Halterung und bleibt die ganze Zeit vor der Brust.',
      tips: ['Stange dicht am Brustbein halten', 'Knie in Richtung der Fußspitzen schieben', 'Fersen fest am Boden lassen', 'Oberkörper aufrecht, Blick nach vorne', 'Runter kontrolliert, hoch zügig'],
      errs: ['Knie fallen nach innen', 'Fersen heben ab', 'Rundrücken oder starkes Vorbeugen', 'Stange rutscht von der Brust weg', 'Zu wenig Tiefe'],
      breath: 'Vor dem Absenken einatmen und Spannung halten, beim Hochdrücken ausatmen.',
      safety: 'Stange vor dem Start fest in der T-Bar-Halterung einsetzen und die Scheibe mit einem Verschluss sichern. Beim Aufnehmen und Ablegen den Rücken gerade halten. Bei Schmerzen in Knie oder Rücken abbrechen.',
      param: '3–4 Sätze × 8–12 Wiederholungen · 90 Sek. Pause', alias: ['Landmine Front Squat', 'T-Bar Front Squat', 'Landmine Kniebeuge', 'T-Bar Kniebeuge'] },
    // Video zur Präsentation (mit KI erstellt, Runway) – park-videos.js
    { id: 'tbar-schulterdruecken', n: 'Schulterdrücken an der T-Bar', g: 'Schulter', sg: 'Grundübungen', sub: 'Schultern · Trizeps',
      eq: 'T-Bar am Sweat4 Rack, Olympia-Stange mit Scheibe', rack: null,
      prim: ['frontDelt', 'sideDelt'], sec: ['triceps', 'chest', 'abs'], typ: 'dynamisch', lvl: 'Einsteiger', unit: null, anim: null,
      start: 'Vor die T-Bar stellen, Füße etwa hüft- bis schulterbreit. Das Stangenende mit beiden Händen vor der Brust halten, Ellbogen unter den Händen. Bauch und Gesäß fest.',
      exec: ['Einatmen und Spannung aufbauen.', 'Die Stange mit beiden Armen schräg nach vorne oben drücken, bis die Arme fast gestreckt sind.', 'Oben kurz halten, ohne ins Hohlkreuz zu gehen.', 'Die Stange kontrolliert zurück vor die Brust führen.'],
      dir: 'Schräg nach vorne oben, entlang der Bahn der T-Bar, und kontrolliert zurück zur Brust.',
      tips: ['Rumpf fest, Rippen unten', 'Stange auf ihrer Bahn drücken, nicht senkrecht', 'Ellbogen kontrolliert führen', 'Langsam zurück zur Brust'],
      errs: ['Hohlkreuz beim Drücken', 'Schwung aus den Beinen', 'Schultern hochziehen', 'Stange fällt unkontrolliert zurück'],
      breath: 'Beim Hochdrücken ausatmen, beim Zurückführen einatmen.',
      safety: 'Stange fest in der T-Bar-Halterung einsetzen und die Scheibe sichern. Bei Schulterschmerzen abbrechen.',
      param: '3 Sätze × 8–12 Wiederholungen · 60–90 Sek. Pause', alias: ['Landmine Press', 'T-Bar Press', 'Landmine Schulterdrücken'] },
  ];
})();
