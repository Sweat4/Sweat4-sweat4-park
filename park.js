/* =====================================================================
   OUTDOORPARK-APP – Erweiterung der SWEAT4-App
   Die App selbst (index.html) ist eine unveränderte Kopie der SWEAT4-App mit wenigen,
   mit „PARK“ markierten Zeilen. Alles Park-Spezifische steht hier:
     - Sportler-Profil auf dem eigenen Handy (kein Konto, kein Trainer-Bereich)
     - Zugang per QR-Code (?zugang=…) mit vorbereiteter Schnittstelle ParkAccess
     - vier Rack-Programme (Übungen = Platzhalter aus park-katalog.js)
     - echte Videos statt 3D (park-videos.js) mit neutralen Platzhaltern
     - Rack-Skizze mit anklickbaren Bereichen (park-config.js)
   Wird nach dem App-Skript geladen, aber bevor die Datenbank geöffnet ist – alle
   Anpassungen gelten also schon für die erste Ansicht.
   ===================================================================== */
(function () {
  'use strict';
  const C = window.APP_CFG || {};
  const RACK = C.rack || { areas: [] };
  const AREA = id => (RACK.areas || []).find(a => a.id === id);
  const vid = id => { const v = (window.PARK_VIDEOS || {})[id]; return v && v.src ? v : null; };
  const isPH = e => !!(e && e.placeholder);

  /* ---------- zusätzliche Symbole ---------- */
  Object.assign(ICONS, {
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01'
  });

  /* ---------- Branding ---------- */
  if (C.colors) {
    const r = document.documentElement.style;
    if (C.colors.accent) r.setProperty('--accent', C.colors.accent);
    if (C.colors.accentSoft) r.setProperty('--accent-soft', C.colors.accentSoft);
  }
  const brand = () => C.logoImg ? `<div class="park-brand park-brand-img"><img src="${esc(C.logoImg)}" alt="${esc(C.name || '')}${C.tagline ? ' – ' + esc(C.tagline) : ''}"></div>` : `<div class="park-brand">${C.logoFull || C.logoMark || ''}<div><div class="park-name">${esc(C.name || 'Outdoorpark-App')}</div>${C.tagline ? `<div class="park-tag">${esc(T(C.tagline))}</div>` : ''}</div></div>`;

  /* ---------- Englisch für die neuen Texte ---------- */
  const EN = window.SW_I18N && SW_I18N.en;
  if (EN) {
    Object.assign(EN.groups || (EN.groups = {}), { 'Gesäß': 'Glutes', 'Ganzkörper': 'Full body', 'Funktionell': 'Functional' });
    Object.assign(EN.ui || (EN.ui = {}), {
      'Training am Outdoor-Rack': 'Training at the outdoor rack',
      'Dein Profil anlegen': 'Create your profile',
      'Dein Profil und deine Trainingsdaten werden nur auf diesem Handy gespeichert. Du brauchst kein Konto und kein Passwort.': 'Your profile and training data are stored on this phone only. No account or password needed.',
      'Vorname oder Spitzname': 'First name or nickname', 'Dein Ziel': 'Your goal', 'Ich trainiere als': 'I train as',
      'Muskelaufbau': 'Muscle building', 'Körperdefinition': 'Body definition', 'Fitness & Gesundheit': 'Fitness & health',
      'Frau': 'Woman', 'Mann': 'Man', 'keine Angabe': 'prefer not to say',
      'Ich habe den {g} und die {d} gelesen.': 'I have read the {g} and the {d}.', 'Gesundheitshinweis': 'Health notice', 'Datenschutzhinweise': 'privacy notice',
      'Profil anlegen': 'Create profile', 'Bitte gib deinen Namen ein.': 'Please enter your name.', 'Bitte bestätige die Hinweise.': 'Please confirm the notices.',
      'Schon ein Backup? Hier importieren': 'Already have a backup? Import it here',
      'Zugang über: {g}': 'Access via: {g}', 'Willkommen im {p}': 'Welcome to {p}',
      'Du bist in deinem persönlichen Trainingsbereich.': 'You are in your personal training area.', 'Zum Training': 'Go to training',
      'Trainingsprogramme': 'Training programmes', 'Programm auswählen': 'Choose a programme', 'Programm wechseln': 'Change programme', 'Aktives Programm': 'Active programme',
      'Noch kein Programm gewählt': 'No programme chosen yet', 'Empfohlen': 'Recommended',
      'Vier fertige Programme für das Outdoor-Rack. Die Übungen sind noch Platzhalter und werden ergänzt.': 'Four ready-made programmes for the outdoor rack. The exercises are still placeholders and will be added.',
      'Programm übernehmen?': 'Use this programme?', 'Übernehmen': 'Use programme', 'Programm übernommen': 'Programme selected',
      '{t} wird dein Trainingsplan.': '{t} becomes your training plan.', 'Dein bisheriger Plan wird ersetzt. Bereits eingetragene Trainings bleiben in deinem Verlauf.': 'Your current plan will be replaced. Workouts you already logged stay in your history.',
      'Aktiv · ansehen': 'Active · view', 'Programm ansehen': 'View programme', '{n} Tage': '{n} days', 'Übungen sind Platzhalter': 'Exercises are placeholders',
      'Rack-Übersicht': 'Rack overview', 'Aufbau, Bereiche und Übungen am Rack': 'Layout, areas and exercises at the rack', 'Übungskatalog': 'Exercise catalogue', 'Alle Rack-Übungen mit Video': 'All rack exercises with video',
      'Platzhalter – die Original-Grafik des Racks folgt': 'Placeholder – the original rack graphic will follow',
      '{n} identische Racks im Park · je {p} Personen': '{n} identical racks in the park · {p} people each',
      'Tippe auf einen Bereich, um die Übungen und Muskelgruppen zu sehen.': 'Tap an area to see its exercises and muscle groups.',
      'Bereiche und Zuordnungen sind Platzhalter, bis die echten Rack-Bereiche festgelegt sind.': 'Areas and assignments are placeholders until the real rack areas are defined.',
      'Muskelgruppen': 'Muscle groups', 'Übungen in diesem Bereich': 'Exercises in this area', 'Diesem Bereich sind noch keine Übungen zugeordnet.': 'No exercises assigned to this area yet.',
      'Video folgt': 'Video coming', 'Für diese Übung ist noch kein Video hinterlegt.': 'No video has been added for this exercise yet.',
      'Von vorne': 'Restart', 'Video abspielen': 'Play video', 'Video anhalten': 'Pause video',
      'Platzhalter – diese Übung wird noch festgelegt.': 'Placeholder – this exercise has not been defined yet.', 'Rack-Bereich': 'Rack area', 'Zur Rack-Übersicht': 'To the rack overview',
      'Mein Profil': 'My profile', 'Profil gespeichert': 'Profile saved', 'Speichern': 'Save', 'Deine Daten': 'Your data',
      'Deine Daten bleiben auf diesem Handy': 'Your data stays on this phone',
      'Profil und Trainingsdaten liegen nur auf diesem Handy, in einer eigenen Datenbank – getrennt von anderen Apps. Es gibt keinen Server und kein Konto.': 'Profile and training data are stored only on this phone, in a separate database – apart from other apps. There is no server and no account.',
      'Sicherung erstellen': 'Create backup', 'Sicherung importieren': 'Import backup',
      'Mit einer Sicherungsdatei nimmst du deine Daten auf ein neues Handy mit.': 'Use a backup file to take your data to a new phone.',
      'Profil & Daten löschen': 'Delete profile & data', 'Profil & Daten löschen?': 'Delete profile & data?',
      'Alle Daten auf diesem Gerät werden gelöscht. Zum Bestätigen LÖSCHEN eintippen.': 'All data on this device will be deleted. Type DELETE to confirm.', 'Löschen': 'Delete',
      'Zugang & Park': 'Access & park', 'QR-Zugang': 'QR access',
      'Die App öffnet sich über den QR-Code an der Drehtür. Eine Verbindung zur Zugangskontrolle besteht noch nicht – die App öffnet keine Tür.': 'The app opens via the QR code at the turnstile. There is no connection to the access control yet – the app does not open any door.',
      'Diese Datei ist keine Sicherung dieser App.': 'This file is not a backup of this app.', 'Sicherung einspielen?': 'Restore backup?', 'Sicherung vom {d} mit {n} Trainings. Die Daten auf diesem Handy werden dadurch ersetzt.': 'Backup from {d} with {n} workouts. The data on this phone will be replaced.', 'Einspielen': 'Restore', 'Sicherung eingespielt ✓': 'Backup restored ✓',
      'Jetzt trainieren': 'Train now', 'Stunde': 'hour', 'Monat': 'month', 'Jede weitere angefangene {m} Minuten: {p}': 'Each additional {m} minutes or part thereof: {p}', 'Ohne Abo · ohne Vertrag': 'No membership · no contract',
      'QR-Code scannen & starten': 'Scan QR code & start', 'Regelmäßig trainieren?': 'Training regularly?', 'Mit unseren Abos trainierst du günstiger und sicherst dir dein persönliches Stundenkontingent.': 'With our memberships you train for less and secure your personal hour allowance.',
      'Beliebteste Wahl': 'Most popular', '{n} Trainingsstunden inklusive': '{n} training hours included', 'entspricht {p} pro Stunde': 'equals {p} per hour', 'Abo auswählen': 'Choose membership',
      'Flexibel trainieren – ohne Abo': 'Train flexibly – no membership', '{n} Stunden': '{n} hours', 'Stundenkarte kaufen': 'Buy hour pass', 'Stundenkarte · {n} Stunden': 'Hour pass · {n} hours',
      'Preis': 'Price', 'Enthalten': 'Included', 'Pro Stunde': 'Per hour', '{n} Trainingsstunden pro Monat': '{n} training hours per month', '{n} Trainingsstunden': '{n} training hours',
      'Vertragsdetails & Zahlungsbedingungen': 'Contract details & payment terms', 'Die Vertrags- und Zahlungsbedingungen werden noch ergänzt.': 'The contract and payment terms will be added.',
      'Ich habe die Vertragsdetails und Zahlungsbedingungen gelesen.': 'I have read the contract details and payment terms.', 'Kostenpflichtig abschließen': 'Buy now (paid)', 'Bitte bestätige die Vertragsdetails.': 'Please confirm the contract details.',
      'Online-Abschluss ist noch nicht verfügbar. Bitte wende dich direkt an SWEAT4.': 'Online purchase is not available yet. Please contact SWEAT4 directly.', 'Die Bezahlung an der Drehtür ist noch nicht angebunden.': 'Payment at the turnstile is not connected yet.',
      'Öffne die Kamera deines Handys.': 'Open your phone camera.', 'Scanne den QR-Code an der Drehtür.': 'Scan the QR code at the turnstile.', 'Die App öffnet sich – du startest dein Training.': 'The app opens – you start your workout.',
      'Einzelzugang': 'Single access', 'Jede weitere angefangene {m} Minuten': 'Each additional {m} minutes or part', 'Preise & Abos': 'Prices & memberships',
      'Einstellungen': 'Settings', 'Dein Training': 'Your training', 'Deine Entwicklung': 'Your progress', 'Im Park': 'In the park'
    });
  }

  /* ---------- Rack-Bereiche als „Gerät“-Filter im Katalog ---------- */
  if (typeof EQ_CATS !== 'undefined') EQ_CATS.splice(0, EQ_CATS.length, ...(RACK.areas || []).map(a => [a.name, new RegExp('Bereich ' + a.id + '\\b')]));

  /* ---------- Vier Rack-Programme (Struktur wie die SWEAT4-Programme, Übungen = Platzhalter) ---------- */
  const N = id => { const e = (window.SW_KATALOG || []).find(x => x.id === id); return e ? e.n : id; };
  const Y = (id, sets, o) => X(N(id), sets, o);
  const PROGS = [
    { id: 'park-m-mass', title: 'Männer · Muskelaufbau', sub: 'Outdoor-Rack · 3 Trainingstage · 2 Min. Pause', rest: 120, days: [
      ['Oberkörper Druck', [Y('ph-brust-1', R(4, 8, 10)), Y('ph-brust-2', R(3, 8, 12)), Y('ph-schulter-1', R(4, 8, 10)), Y('ph-schulter-2', R(3, 10, 12)), Y('ph-arme-2', R(3, 10, 12))]],
      ['Oberkörper Zug', [Y('ph-ruecken-1', R(4, 8, 10)), Y('ph-ruecken-2', R(3, 8, 12)), Y('ph-arme-1', R(3, 10, 12)), Y('ph-funktionell-2', R(3, 10, 12)), Y('ph-bauch-1', R(3, 12, 15))]],
      ['Beine & Rumpf', [Y('ph-beine-1', R(4, 8, 10)), Y('ph-beine-2', R(3, 10, 12)), Y('ph-gesaess-1', R(3, 10, 12)), Y('ph-ganzkoerper-1', R(3, 8, 10)), Y('ph-bauch-2', R(3, 12, 15))]]] },
    { id: 'park-w-mass', title: 'Frauen · Muskelaufbau', sub: 'Outdoor-Rack · 3 Trainingstage · 90 Sek. Pause', rest: 90, days: [
      ['Beine & Gesäß', [Y('ph-gesaess-1', R(4, 8, 12)), Y('ph-beine-1', R(4, 8, 12)), Y('ph-gesaess-2', R(3, 12, 15)), Y('ph-beine-2', R(3, 10, 12))]],
      ['Oberkörper', [Y('ph-ruecken-1', R(3, 10, 12)), Y('ph-brust-1', R(3, 10, 12)), Y('ph-schulter-2', R(3, 12, 15)), Y('ph-arme-1', R(3, 12, 15)), Y('ph-arme-2', R(3, 12, 15))]],
      ['Ganzkörper & Rumpf', [Y('ph-ganzkoerper-1', R(3, 10, 12)), Y('ph-ganzkoerper-2', R(3, 10, 12)), Y('ph-gesaess-1', R(3, 12, 15)), Y('ph-bauch-1', R(3, 15)), Y('ph-funktionell-1', R(3, 12))]]] },
    { id: 'park-m-def', title: 'Männer · Körperdefinition', sub: 'Outdoor-Rack · 3 Trainingstage · Supersätze · 60 Sek. Pause', rest: 60, days: [
      ['Brust & Rücken', [Y('ph-brust-1', R(4, 10, 12), { ss: 'A' }), Y('ph-ruecken-1', R(4, 10, 12), { ss: 'A' }), Y('ph-brust-2', R(3, 12, 15), { ss: 'B' }), Y('ph-ruecken-2', R(3, 12, 15), { ss: 'B' }), Y('ph-bauch-1', R(3, 15), { ss: 'C' }), Y('ph-funktionell-1', R(3, 12), { ss: 'C' })]],
      ['Beine & Gesäß', [Y('ph-beine-1', R(4, 10, 12), { ss: 'A' }), Y('ph-gesaess-1', R(4, 10, 12), { ss: 'A' }), Y('ph-beine-2', R(3, 12, 15), { ss: 'B' }), Y('ph-gesaess-2', R(3, 12, 15), { ss: 'B' }), Y('ph-bauch-2', R(3, 15), { ss: 'C' }), Y('ph-ganzkoerper-2', R(3, 12), { ss: 'C' })]],
      ['Schulter & Arme', [Y('ph-schulter-1', R(4, 10, 12), { ss: 'A' }), Y('ph-arme-1', R(4, 10, 12), { ss: 'A' }), Y('ph-schulter-2', R(3, 12, 15), { ss: 'B' }), Y('ph-arme-2', R(3, 12, 15), { ss: 'B' }), Y('ph-ganzkoerper-1', R(3, 12), { ss: 'C' }), Y('ph-funktionell-2', R(3, 12), { ss: 'C' })]]] },
    { id: 'park-w-def', title: 'Frauen · Körperdefinition', sub: 'Outdoor-Rack · 3 Trainingstage · Zirkel & Supersätze · 60 Sek. Pause', rest: 60, days: [
      ['Ganzkörper-Zirkel', [Y('ph-ganzkoerper-1', R(3, 12, 15), { ss: 'A' }), Y('ph-gesaess-1', R(3, 12, 15), { ss: 'A' }), Y('ph-ruecken-1', R(3, 12, 15), { ss: 'A' }), Y('ph-bauch-1', R(3, 15), { ss: 'A' })]],
      ['Beine & Gesäß', [Y('ph-beine-1', R(4, 12, 15), { ss: 'A' }), Y('ph-gesaess-2', R(4, 12, 15), { ss: 'A' }), Y('ph-beine-2', R(3, 12, 15), { ss: 'B' }), Y('ph-gesaess-1', R(3, 12, 15), { ss: 'B' }), Y('ph-funktionell-1', R(3, 12), { ss: 'C' }), Y('ph-bauch-2', R(3, 15), { ss: 'C' })]],
      ['Oberkörper & Core', [Y('ph-brust-1', R(3, 12, 15), { ss: 'A' }), Y('ph-ruecken-2', R(3, 12, 15), { ss: 'A' }), Y('ph-schulter-2', R(3, 12, 15), { ss: 'B' }), Y('ph-arme-1', R(3, 12, 15), { ss: 'B' }), Y('ph-ganzkoerper-2', R(3, 12), { ss: 'C' }), Y('ph-bauch-1', R(3, 15), { ss: 'C' })]]] },
  ];
  SWEAT4_SYSTEM.splice(0, SWEAT4_SYSTEM.length, ...PROGS);
  Object.keys(PROG_META).forEach(k => delete PROG_META[k]);
  Object.assign(PROG_META, {
    'park-m-mass': { who: 'Männer', goal: 'Muskelaufbau', img: 'ph-brust-1', focus: 'Druck · Zug · Beine', sex: 'm', g: 'mass' },
    'park-w-mass': { who: 'Frauen', goal: 'Muskelaufbau', img: 'ph-gesaess-1', focus: 'Beine & Gesäß · Oberkörper · Ganzkörper', sex: 'w', g: 'mass' },
    'park-m-def':  { who: 'Männer', goal: 'Körperdefinition', img: 'ph-ganzkoerper-1', focus: 'Supersätze', sex: 'm', g: 'def' },
    'park-w-def':  { who: 'Frauen', goal: 'Körperdefinition', img: 'ph-funktionell-1', focus: 'Zirkel & Supersätze', sex: 'w', g: 'def' },
  });
  ['tpl-apply', 'backup', 'import'].forEach(a => TRAINER_ONLY.delete(a));   // der Sportler wählt sein Programm selbst und sichert seine Daten selbst
  const GOALS = { mass: 'Muskelaufbau', def: 'Körperdefinition', fit: 'Fitness & Gesundheit' };
  const recommended = c => { if (!c) return null; const g = c.parkGoal === 'fit' ? 'def' : c.parkGoal; return Object.keys(PROG_META).find(k => PROG_META[k].sex === c.sex && PROG_META[k].g === g) || null; };

  const _apply = applyTemplate;
  window.applyTemplate = function (cid, tplId) {
    _apply(cid, tplId);
    const plan = planOf(cid), t = SWEAT4_SYSTEM.find(x => x.id === tplId);
    if (plan && t) { plan.name = (C.short || 'Outdoorpark') + ' · ' + t.title; put('plans', plan); }
  };
  window.WorkoutPlanCard = function (t, cid, active) {
    const m = progMeta(t), rec = recommended(S.clients.get(cid)) === t.id && !active;
    return `<button class="pcard tap ${active ? 'on' : ''}" data-action="prog-open" data-cid="${cid}" data-tpl="${t.id}" aria-pressed="${active ? 'true' : 'false'}" aria-label="${esc(T(m.who) + ' ' + T(m.goal))} – ${T('Programm ansehen')}">
      <div class="pcard-media">${ExercisePreview(m.img, 'pcard-prev')}<span class="pcard-who">${esc(T(m.who))}</span>${active ? `<span class="pcard-check" aria-hidden="true">${ic('check', 16)}</span>` : rec ? `<span class="park-rec">${T('Empfohlen')}</span>` : ''}</div>
      <div class="pcard-body"><div class="pcard-title">${esc(T(m.goal))}</div>
        <div class="pcard-meta">${T('{n} Tage', { n: t.days.length })}</div>
        <div class="pcard-focus">${esc(m.focus)}</div>
        <div class="pcard-cta">${active ? T('Aktiv · ansehen') : T('Programm ansehen')} ${ic('arrow', 15)}</div></div></button>`;
  };
  window.openProgram = function (cid, tplId) {
    const t = SWEAT4_SYSTEM.find(x => x.id === tplId); if (!t) return;
    const m = progMeta(t), plan = planOf(cid), active = plan && plan.templateId === t.id;
    modal(`${esc(T(m.who))} · ${esc(T(m.goal))}`, `
      <div class="prog-sheet-meta"><span class="pill pill-gold">${esc(T(m.goal))}</span><span class="pill">${T('{n} Tage', { n: t.days.length })}</span>${t.rest ? `<span class="pill">${t.rest >= 120 ? t.rest / 60 + ' Min.' : t.rest + ' Sek.'} ${T('Pause')}</span>` : ''}<span class="pill">${T('Übungen sind Platzhalter')}</span></div>
      <div class="stack">${t.days.map(([n, exs], i) => TrainingDayCard(n, exs, i)).join('')}</div>
      <div class="sheet-actions sticky-actions"><button class="btn btn-primary" data-action="tpl-apply" data-cid="${cid}" data-tpl="${t.id}">${active ? `${ic('reset', 18)} ${T('Programm neu laden')}` : `${ic('check', 18)} ${T('Übernehmen')}`}</button></div>`);
  };
  A['tpl-apply'] = async el => {
    const cid = el.dataset.cid, t = SWEAT4_SYSTEM.find(x => x.id === el.dataset.tpl), has = clientDays(cid).length; if (!t) return;
    const m = progMeta(t);
    if (!await confirmDialog(T('Programm übernehmen?'), T('{t} wird dein Trainingsplan.', { t: `<b>${esc(T(m.who))} · ${esc(T(m.goal))}</b>` }) + (has ? '<br><br>' + T('Dein bisheriger Plan wird ersetzt. Bereits eingetragene Trainings bleiben in deinem Verlauf.') : ''), { ok: T('Übernehmen') })) return;
    applyTemplate(cid, t.id); closeModal(null); toast(T('Programm übernommen')); go('/');
  };

  /* ---------- Vorschaubild: Poster des echten Videos oder neutraler Platzhalter ---------- */
  window.PARK_PREVIEW = (id, cls = '') => {
    const v = vid(id);
    if (v && v.poster) return `<div class="xprev ${cls}"><img class="park-poster" src="${esc(v.poster)}" alt="" loading="lazy"></div>`;
    if (v) return `<div class="xprev xprev-video ${cls}"><span class="xprev-ph" aria-hidden="true">${ic('play', 26)}</span></div>`;
    return `<div class="xprev park-novid ${cls}"><span class="xprev-ph" aria-hidden="true">${ic('dumbbell', 26)}</span><span class="park-novid-t">${T('Video folgt')}</span></div>`;
  };
  window.ExerciseCard = function (e0) {
    const e = KL(e0), v = vid(e.id);
    return `<a class="xcard tap" href="#/uebung/${e.id}" aria-label="${esc(e.n)}">
      <div class="xcard-media">${ExercisePreview(e.id)}<span class="xcard-group">${esc(TG(e.g))}</span>${v ? `<span class="xcard-play" aria-hidden="true">${ic('play', 14)}</span>` : ''}</div>
      <div class="xcard-body"><div class="xcard-name">${esc(e.n)}</div>
        <div class="xcard-meta"><span>${esc(e.sub)}</span></div>
        <div class="xcard-eq">${esc(eqShort(e))}</div></div></a>`;
  };

  /* ---------- Übungsdetail: Platzhalter-Hinweis + Rack-Bereich ---------- */
  const _detail = ExerciseDetailView;
  window.ExerciseDetailView = function (e0) {
    let h = _detail(e0); const ar = AREA(e0.rack);
    const extra = `${isPH(e0) ? `<div class="park-ph-note">${ic('info', 16)} ${T('Platzhalter – diese Übung wird noch festgelegt.')}</div>` : ''}
      ${ar ? `<a class="park-area-link" href="#/rack/${ar.id}">${ic('cube', 15)} ${T('Rack-Bereich')}: <b>${esc(ar.name)}</b> · ${T('Zur Rack-Übersicht')}</a>` : ''}`;
    return h.replace('<div class="ud-head">', '<div class="ud-head">' + extra);
  };
  window.mountDetail3D = function () {};   // keine 3D-Animationen in dieser App

  /* ---------- Video-Komponente ---------- */
  window.mountDetailVideo = function (id) {
    const host = document.getElementById('ud-vstage'); if (!host) return;
    const v = vid(id), b = document.getElementById('ud-play');
    host.classList.add('park-vstage');
    if (!v) {
      host.innerHTML = `<div class="park-vph" role="img" aria-label="${T('Video folgt')}"><div class="park-vph-ic">${ic('dumbbell', 30)}</div><b>${T('Video folgt')}</b><span>${T('Für diese Übung ist noch kein Video hinterlegt.')}</span></div>`;
      if (b) b.hidden = true; return;
    }
    const ori = v.orientation === 'landscape' || v.orientation === 'portrait' ? v.orientation : '';
    host.innerHTML = `<video class="ud-video park-video" id="ud-video" src="${esc(v.src)}" ${v.poster ? `poster="${esc(v.poster)}"` : ''} playsinline loop muted controls preload="metadata" aria-label="${T('Übungsvideo')}"></video>`;
    const hero = host.closest('.ud-hero');
    const setOri = o => { host.dataset.ori = o; if (hero) { hero.classList.remove('park-ori-portrait', 'park-ori-landscape'); hero.classList.add('park-ori-' + o); } };
    if (ori) setOri(ori);
    const el = document.getElementById('ud-video');
    el.addEventListener('loadedmetadata', () => { if (!ori) setOri(el.videoWidth > el.videoHeight ? 'landscape' : 'portrait'); });
    el.addEventListener('error', () => { host.innerHTML = `<div class="park-vph"><div class="park-vph-ic">${ic('x', 28)}</div><b>${T('Das Video konnte nicht geladen werden.')}</b><span>${esc(v.file || v.src)}</span></div>`; if (b) b.hidden = true; }, { once: true });
    const ctl = document.querySelector('.ud-ctrl');
    if (ctl && !ctl.querySelector('[data-action="ud-replay"]')) ctl.insertAdjacentHTML('afterbegin', `<button class="icon-btn glass" data-action="ud-replay" aria-label="${T('Von vorne')}">${ic('reset', 18)}</button>`);
    if (b) { b.hidden = false; const sync = () => { b.innerHTML = el.paused ? ic('play', 18) : ic('pause', 18); b.setAttribute('aria-label', el.paused ? T('Video abspielen') : T('Video anhalten')); }; el.addEventListener('play', sync); el.addEventListener('pause', sync); sync(); }
    if (!REDUCED_MOTION()) el.play().catch(() => {});
  };
  A['ud-replay'] = () => { const el = document.getElementById('ud-video'); if (!el) return; el.currentTime = 0; el.play().catch(() => {}); };
  const _open3d = A.open3d;
  A.open3d = el => { UI.uebBack = location.hash.slice(1) || '/'; go('/uebung/' + el.dataset.id); };
  void _open3d;

  /* ---------- Zugang per QR-Code (Drehtür) ----------
     Schnittstelle für eine spätere echte Zugangsprüfung. Ohne Adresse in APP_CFG.access.verify
     meldet sie „nicht verbunden“. Es wird keine Tür geöffnet und keine Öffnung vorgetäuscht. */
  window.ParkAccess = {
    connected: () => !!(C.access && C.access.verify),
    gateName: g => ((C.access || {}).gates || {})[g] || g,
    async check(gate) {
      if (!this.connected()) return { connected: false, gate };
      try {
        const r = await fetch(C.access.verify, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ gate, app: C.appId }) });
        const d = await r.json().catch(() => ({})); return { connected: true, gate, ok: !!d.ok, info: d };
      } catch (e) { return { connected: true, gate, ok: false, error: String(e && e.message || e) }; }
    }
  };
  try {   // ?zugang=drehtuer → Zugangsbereich öffnen, Adresse aufräumen
    const qp = new URLSearchParams(location.search), g = qp.get((C.access || {}).param || 'zugang');
    if (g) { history.replaceState(null, '', location.pathname + '#/zugang/' + encodeURIComponent(g)); }
  } catch (e) {}

  /* ---------- Preise & Zugang (alle Beträge aus APP_CFG.prices) ---------- */
  const PR = C.prices || { single: {}, subs: [], cards: [] };
  const eur = v => new Intl.NumberFormat(LOC(), { style: 'currency', currency: PR.currency || 'EUR' }).format(v);
  // Preis für eine Trainingsdauer in Minuten (erste Stunde + jede angefangene Zusatz-Einheit) – Grundlage für eine spätere Abrechnung
  window.ParkPrice = {
    single(min) { const s = PR.single; if (!(min > 0)) return 0; const extra = Math.max(0, min - 60); return Math.round((s.perHour + Math.ceil(extra / s.extraBlockMin) * s.extraBlock) * 100) / 100; },
    perHour: x => Math.round((x.perMonth || x.price) / x.hours * 100) / 100,
    find: id => PR.subs.find(x => x.id === id) || PR.cards.find(x => x.id === id) || (id === 'single' ? Object.assign({ id: 'single' }, PR.single) : null)
  };
  function PriceBlock() {
    const s = PR.single;
    return `<section class="pz">
      <div class="pz-hero">
        <div class="pz-eyebrow">${T('Jetzt trainieren')}</div>
        <div class="pz-big">${eur(s.perHour)}<span> / ${T('Stunde')}</span></div>
        <div class="pz-sub">${T('Jede weitere angefangene {m} Minuten: {p}', { m: s.extraBlockMin, p: eur(s.extraBlock) })}</div>
        <div class="pz-note">${T('Ohne Abo · ohne Vertrag')}</div>
        <button class="btn pz-cta" data-action="pz-qr">${ic('lock', 20)} ${T('QR-Code scannen & starten')}</button>
      </div>
      <div class="pz-h"><h2>${T('Regelmäßig trainieren?')}</h2><p>${T('Mit unseren Abos trainierst du günstiger und sicherst dir dein persönliches Stundenkontingent.')}</p></div>
      <div class="pz-subs">${PR.subs.map(x => `<div class="pz-card ${x.popular ? 'pop' : ''}">${x.popular ? `<div class="pz-badge">${T('Beliebteste Wahl')}</div>` : ''}
        <div class="pz-name">${esc(x.name)}</div><div class="pz-price">${eur(x.perMonth)}<span> / ${T('Monat')}</span></div>
        <div class="pz-incl">${ic('check', 16)} ${T('{n} Trainingsstunden inklusive', { n: x.hours })}</div>
        <div class="pz-ph">${T('entspricht {p} pro Stunde', { p: eur(ParkPrice.perHour(x)) })}</div>
        <button class="btn ${x.popular ? 'btn-primary' : 'btn-ghost'} btn-block" data-action="pz-pick" data-id="${x.id}">${T('Abo auswählen')}</button></div>`).join('')}</div>
      <div class="pz-h"><h2>${T('Flexibel trainieren – ohne Abo')}</h2></div>
      <div class="pz-cards">${PR.cards.map(x => `<button class="pz-row" data-action="pz-pick" data-id="${x.id}"><span class="grow"><b>${T('{n} Stunden', { n: x.hours })}</b><small>${T('entspricht {p} pro Stunde', { p: eur(ParkPrice.perHour(x)) })}</small></span><span class="pz-rp">${eur(x.price)}</span></button>`).join('')}
        <button class="btn btn-ghost btn-block" data-action="pz-cards">${T('Stundenkarte kaufen')}</button></div>
    </section>`;
  }
  const NOPAY = () => `<div class="pz-nopay">${ic('info', 16)} ${T('Online-Abschluss ist noch nicht verfügbar. Bitte wende dich direkt an SWEAT4.')}</div>`;
  function pzDetail(id) {
    const x = ParkPrice.find(id); if (!x) return;
    const sub = !!x.perMonth, title = sub ? x.name : T('Stundenkarte · {n} Stunden', { n: x.hours });
    const rows = sub ? [[T('Preis'), `${eur(x.perMonth)} / ${T('Monat')}`], [T('Enthalten'), T('{n} Trainingsstunden pro Monat', { n: x.hours })], [T('Pro Stunde'), eur(ParkPrice.perHour(x))]]
      : [[T('Preis'), eur(x.price)], [T('Enthalten'), T('{n} Trainingsstunden', { n: x.hours })], [T('Pro Stunde'), eur(ParkPrice.perHour(x))]];
    modal(esc(title), `<div class="pz-dl">${rows.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>
      <div class="section-h" style="margin-top:14px"><h2>${T('Vertragsdetails & Zahlungsbedingungen')}</h2></div>
      ${x.terms && x.terms.length ? `<ul class="pz-terms">${x.terms.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : `<p class="muted" style="margin:0">${T('Die Vertrags- und Zahlungsbedingungen werden noch ergänzt.')}</p>`}
      <div class="sheet-actions">${x.checkout && x.terms && x.terms.length
        ? `<label class="park-check"><input type="checkbox" id="pz-ok"> <span>${T('Ich habe die Vertragsdetails und Zahlungsbedingungen gelesen.')}</span></label><button class="btn btn-primary btn-block" data-action="pz-buy" data-id="${x.id}">${T('Kostenpflichtig abschließen')}</button>`
        : NOPAY()}</div>`);
  }
  A['pz-pick'] = el => pzDetail(el.dataset.id);
  A['pz-cards'] = () => modal(T('Stundenkarte kaufen'), `<div class="pick-list">${PR.cards.map(x => `<button class="day-btn" data-action="pz-pick" data-id="${x.id}"><span class="grow"><span class="day-name">${T('{n} Stunden', { n: x.hours })}</span></span><b>${eur(x.price)}</b></button>`).join('')}</div>`);
  A['pz-buy'] = el => {
    const x = ParkPrice.find(el.dataset.id); if (!x || !x.checkout) return;
    if (!document.getElementById('pz-ok').checked) return toast(T('Bitte bestätige die Vertragsdetails.'));
    location.href = x.checkout;   // Weiterleitung zum Zahlungsanbieter (erst aktiv, wenn in park-config.js eingetragen)
  };
  A['pz-qr'] = () => {
    const s = PR.single;
    modal(T('QR-Code scannen & starten'), `<ol class="pz-steps"><li>${T('Öffne die Kamera deines Handys.')}</li><li>${T('Scanne den QR-Code an der Drehtür.')}</li><li>${T('Die App öffnet sich – du startest dein Training.')}</li></ol>
      <div class="pz-dl"><div><span>${T('Einzelzugang')}</span><b>${eur(s.perHour)} / ${T('Stunde')}</b></div><div><span>${T('Jede weitere angefangene {m} Minuten', { m: s.extraBlockMin })}</span><b>${eur(s.extraBlock)}</b></div></div>
      ${s.checkout ? '' : NOPAY().replace(T('Online-Abschluss ist noch nicht verfügbar. Bitte wende dich direkt an SWEAT4.'), T('Die Bezahlung an der Drehtür ist noch nicht angebunden.'))}`);
  };
  window.PriceBlock = PriceBlock;

  /* ---------- Profil anlegen (ohne Konto) ---------- */
  const fieldRow = (c = {}) => `
    <label class="field"><span>${T('Name')} *</span><input id="pk-name" maxlength="40" autocomplete="given-name" value="${esc(c.name || '')}" placeholder="${T('Vorname oder Spitzname')}"></label>
    <label class="field"><span>${T('Dein Ziel')}</span><select id="pk-goal">${Object.entries(GOALS).map(([k, v]) => `<option value="${k}" ${c.parkGoal === k ? 'selected' : ''}>${T(v)}</option>`).join('')}</select></label>
    <label class="field"><span>${T('Ich trainiere als')}</span><select id="pk-sex"><option value="w" ${c.sex === 'w' ? 'selected' : ''}>${T('Frau')}</option><option value="m" ${c.sex === 'm' ? 'selected' : ''}>${T('Mann')}</option><option value="" ${c.id && !c.sex ? 'selected' : ''}>${T('keine Angabe')}</option></select></label>`;
  const readFields = () => ({ name: (document.getElementById('pk-name') || {}).value.trim(), parkGoal: document.getElementById('pk-goal').value, sex: document.getElementById('pk-sex').value || null });
  function viewParkStart(gate) {
    return `<main class="wrap view park-start">
      ${brand()}
      ${gate ? '' : PriceBlock()}
      ${gate ? `<div class="park-gate">${ic('lock', 16)} ${T('Zugang über: {g}', { g: esc(ParkAccess.gateName(gate)) })}</div>` : ''}
      <div class="card stack">
        <h2 style="font-size:20px">${T('Dein Profil anlegen')}</h2>
        <p class="muted" style="margin:0">${T('Dein Profil und deine Trainingsdaten werden nur auf diesem Handy gespeichert. Du brauchst kein Konto und kein Passwort.')}</p>
        ${fieldRow()}
        <label class="park-check"><input type="checkbox" id="pk-ok"> <span>${T('Ich habe den {g} und die {d} gelesen.', { g: `<a href="#/rechtliches/gesundheit">${T('Gesundheitshinweis')}</a>`, d: `<a href="#/rechtliches/datenschutz">${T('Datenschutzhinweise')}</a>` })}</span></label>
        <button class="btn btn-primary btn-big" data-action="park-create">${ic('check', 20)} ${T('Profil anlegen')}</button>
      </div>
      <button class="btn btn-text btn-block" data-action="import" style="margin-top:12px">${ic('upload', 16)} ${T('Schon ein Backup? Hier importieren')}</button><input type="file" id="import-file" hidden>
      ${LegalLinks()}
    </main>`;
  }
  A['park-create'] = () => {
    const f = readFields();
    if (!f.name) return toast(T('Bitte gib deinen Namen ein.'));
    if (!document.getElementById('pk-ok').checked) return toast(T('Bitte bestätige die Hinweise.'));
    const c = { id: uid(), name: f.name, sex: f.sex, parkGoal: f.parkGoal, goals: T(GOALS[f.parkGoal]), notes: '', photo: null, createdAt: Date.now(), consentAt: Date.now() };
    put('clients', c); ensurePlan(c.id);
    put('meta', { id: 'role', value: 'client', clientId: c.id, since: Date.now(), park: true });
    go('/programme'); render();
  };

  /* ---------- Ansichten ---------- */
  function viewParkGate(gate) {
    const cid = roleInfo().clientId, c = S.clients.get(cid); if (!c) return null;
    return `<main class="wrap view park-start">${brand()}
      <div class="park-gate">${ic('lock', 16)} ${T('Zugang über: {g}', { g: esc(ParkAccess.gateName(gate)) })}</div>
      <div class="card stack" style="text-align:center"><div style="display:flex;justify-content:center">${avatar(c, 'xl')}</div>
        <h1 style="font-size:24px">${T('Willkommen im {p}', { p: esc(C.short || 'Outdoorpark') })}, ${esc((c.name || '').split(/\s+/)[0])}</h1>
        <p class="muted" style="margin:0">${T('Du bist in deinem persönlichen Trainingsbereich.')}</p>
        <a class="btn btn-primary btn-big" href="#/">${ic('play', 20)} ${T('Zum Training')}</a></div></main>`;
  }
  function viewPrograms() {
    const cid = roleInfo().clientId, plan = planOf(cid);
    return topbar({ back: '/', title: T('Trainingsprogramme'), sub: esc(C.name || '') }) + `<main class="wrap view">
      <p class="muted" style="margin:0 0 14px">${T('Vier fertige Programme für das Outdoor-Rack. Die Übungen sind noch Platzhalter und werden ergänzt.')}</p>
      <div class="pgrid">${SWEAT4_SYSTEM.map(t => WorkoutPlanCard(t, cid, plan && plan.templateId === t.id)).join('')}</div></main>`;
  }
  function rackSvg(sel) {
    const areas = RACK.areas || [];
    const media = RACK.image ? `<img class="park-rack-img" src="${esc(RACK.image)}" alt="${T('Rack-Übersicht')}">`
      : `<svg class="park-rack-img" viewBox="0 0 1000 620" role="img" aria-label="${T('Platzhalter – die Original-Grafik des Racks folgt')}"><rect x="12" y="12" width="976" height="596" rx="22" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="3" stroke-dasharray="14 10"/><text x="500" y="40" text-anchor="middle" font-size="22" fill="currentColor" fill-opacity=".45" font-family="system-ui,sans-serif">${T('Platzhalter – die Original-Grafik des Racks folgt')}</text></svg>`;
    return `<div class="park-rack">${media}${areas.map(a => `<a class="park-zone ${sel === a.id ? 'on' : ''}" href="#/rack/${a.id}" style="left:${a.x}%;top:${a.y}%;width:${a.w}%;height:${a.h}%" aria-label="${esc(a.name)}"><b>${esc(a.id)}</b><span>${esc(a.name)}</span></a>`).join('')}</div>`;
  }
  function viewRack(sel) {
    const a = AREA(sel), exs = a ? KAT().filter(e => e.rack === a.id) : [];
    const mus = [...new Set(exs.flatMap(e => e.prim))], groups = [...new Set(exs.map(e => e.g))];
    return topbar({ back: '/', title: T('Rack-Übersicht'), sub: T('{n} identische Racks im Park · je {p} Personen', { n: RACK.count || 4, p: RACK.perRack || '10–12' }) }) + `<main class="wrap view wrap-wide">
      ${rackSvg(sel)}
      <p class="muted" style="font-size:13px;margin:10px 0 0">${T('Tippe auf einen Bereich, um die Übungen und Muskelgruppen zu sehen.')} ${T('Bereiche und Zuordnungen sind Platzhalter, bis die echten Rack-Bereiche festgelegt sind.')}</p>
      ${a ? `<section class="section"><div class="section-h"><h2>${esc(a.name)}</h2></div>
        ${a.note ? `<p class="muted" style="margin:-4px 0 10px">${esc(a.note)}</p>` : ''}
        <div class="card stack"><div><div class="ud-mus-l">${T('Muskelgruppen')}</div><div class="mchips">${groups.map(g => `<span class="mchip p">${esc(TG(g))}</span>`).join('') || '–'}</div></div>
          ${mus.length ? `<div class="mchips">${mus.map(m => `<span class="mchip">${esc(MUSKEL(m))}</span>`).join('')}</div>` : ''}</div>
        <div class="section-h" style="margin-top:14px"><h2>${T('Übungen in diesem Bereich')}</h2></div>
        ${exs.length ? `<div class="xgrid">${exs.map(ExerciseCard).join('')}</div>` : `<div class="card muted">${T('Diesem Bereich sind noch keine Übungen zugeordnet.')}</div>`}</section>` : ''}
    </main>`;
  }
  window.viewClientHome = function () {
    const cid = roleInfo().clientId, c = S.clients.get(cid);
    if (!c) return viewParkStart('');
    const done = sessionsOf(cid, true), last = done[0], next = nextDay(cid), active = activeSession(cid), days = clientDays(cid);
    const plan = planOf(cid), prog = plan && plan.templateId && SWEAT4_SYSTEM.find(t => t.id === plan.templateId), first = (c.name || '').trim().split(/\s+/)[0];
    return topbar({ title: esc(C.short || C.name || 'Outdoorpark'), sub: T('Mein Training'), right: `<a class="icon-btn" href="#/data" aria-label="${T('Einstellungen')}">${ic('settings', 22)}</a>` }) + `<main class="wrap view">
      ${PriceBlock()}
      <div class="hero">${avatar(c, 'xl')}<div class="grow"><h1>${T('Willkommen zurück, {n}', { n: esc(first) })} 👋</h1>${c.goals ? `<div class="muted" style="margin-top:4px">🎯 ${esc(c.goals)}</div>` : ''}</div></div>
      <a class="card park-prog tap" href="#/programme">${ic('list', 22)}<div class="grow"><div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em">${T('Aktives Programm')}</div>
        <b>${prog ? esc(T(progMeta(prog).who)) + ' · ' + esc(T(progMeta(prog).goal)) : T('Noch kein Programm gewählt')}</b></div><span class="btn btn-sm ${prog ? 'btn-ghost' : 'btn-primary'}">${prog ? T('Programm wechseln') : T('Programm auswählen')}</span></a>
      <section class="section"><div class="section-h"><h2>${T('Dein Training')}</h2></div>
        ${next || last ? `<div class="muted" style="font-size:13px;margin:-4px 0 10px">${next ? T('Empfohlen laut Plan: {d}', { d: `<b>${esc(TD(next.name))}</b>` }) : ''}${last ? (next ? ' · ' : '') + T('Zuletzt: {d}', { d: esc(sessLabel(last)) }) : ''}</div>` : ''}
        ${active ? `<a class="btn btn-primary btn-big" href="#/train/${active.id}">${ic('play', 22)} ${T('Workout fortsetzen')}</a>`
          : next ? `<button class="btn btn-primary btn-big btn-next" data-action="start-day" data-cid="${cid}" data-did="${next.id}"><span class="nx-ic">${ic('play', 22)}</span><span class="nx-tx"><small>${T('Nächstes Workout')} · ${T('Tag')} ${days.indexOf(next) + 1}</small><b>${esc(TD(next.name) || T('Training'))}</b></span></button>`
          : `<a class="btn btn-primary btn-big" href="#/programme">${ic('list', 22)} ${T('Programm auswählen')}</a>`}
        ${days.length ? `<button class="btn btn-ghost btn-block" style="margin-top:8px" data-action="day-pick" data-cid="${cid}">${ic('reset', 18)} ${T('Training wechseln')}</button>` : ''}
        ${PausedList(cid)}
        <div class="card list-card" style="margin-top:12px">
          ${days.length ? `<a class="list-link" href="#/client/${cid}/planview">${ic('list')}<div class="grow"><b>${T('Aktueller Trainingsplan')}</b><div class="muted" style="font-size:13px">${TN(days.length, '{n} Trainingstag', '{n} Trainingstage')}</div></div></a>` : ''}
          ${last ? `<a class="list-link" href="#/session/${last.id}">${ic('check')}<div class="grow"><b>${T('Letztes Workout')}</b><div class="muted" style="font-size:13px">${fmtDate(last.date)} · ${esc(sessLabel(last))}</div></div></a>` : ''}
          <a class="list-link" href="#/client/${cid}/history">${ic('history')}<div class="grow"><b>${T('Trainingshistorie')}</b><div class="muted" style="font-size:13px">${TN(done.length, '{n} Workout', '{n} Workouts')}</div></div></a>
          <a class="list-link" href="#/client/${cid}/progress">${ic('chart')}<div class="grow"><b>${T('Kraft-Fortschritt')}</b><div class="muted" style="font-size:13px">${T('Gewichte & Volumen je Übung')}</div></div></a>
        </div>
        ${days.length > 1 ? `<div class="day-grid" style="margin-top:12px">${days.map((d, i) => `<button class="day-btn ${next && next.id === d.id ? 'next' : ''}" data-action="start-day" data-cid="${cid}" data-did="${d.id}"><span class="day-no">${i + 1}</span><span class="grow"><span class="day-name">${esc(TD(d.name))}</span><br><span class="muted" style="font-size:13px">${TN(exercisesOf(d.id).length, '{n} Übung', '{n} Übungen')}</span></span></button>`).join('')}</div>` : ''}
      </section>
      <section class="section"><div class="section-h"><h2>${T('Im Park')}</h2></div>
        <div class="card list-card">
          <a class="list-link" href="#/rack">${ic('cube')}<div class="grow"><b>${T('Rack-Übersicht')}</b><div class="muted" style="font-size:13px">${T('Aufbau, Bereiche und Übungen am Rack')}</div></div></a>
          <a class="list-link" href="#/uebungen">${ic('book')}<div class="grow"><b>${T('Übungskatalog')}</b><div class="muted" style="font-size:13px">${T('Alle Rack-Übungen mit Video')}</div></div></a>
        </div></section>
      <a class="privacy-pill" href="#/data">${ic('lock', 16)} ${T('Deine Daten bleiben auf diesem Handy')}</a>
      ${LegalLinks()}
    </main>`;
  };
  window.viewDataClient = function () {
    const c = S.clients.get(roleInfo().clientId) || {}, lb = (S.meta.get('lastBackup') || {}).value;
    return topbar({ back: '/', title: T('Einstellungen'), sub: esc(C.name || '') }) + `<main class="wrap view">
      <section class="section" style="margin-top:0"><div class="section-h"><h2>${T('Mein Profil')}</h2></div>
        <div class="card stack">${fieldRow(c)}<button class="btn btn-primary btn-block" data-action="park-profile-save">${ic('check', 18)} ${T('Speichern')}</button>
          <a class="btn btn-ghost btn-block" href="#/programme">${ic('list', 18)} ${T('Trainingsprogramme')}</a></div></section>
      <section class="section"><div class="section-h"><h2>${T('Deine Daten')}</h2></div>
        <div class="card stack"><div style="font-size:15px">🔒 ${T('Profil und Trainingsdaten liegen nur auf diesem Handy, in einer eigenen Datenbank – getrennt von anderen Apps. Es gibt keinen Server und kein Konto.')}</div>
          <button class="btn btn-ghost btn-block" data-action="backup">${ic('download', 18)} ${T('Sicherung erstellen')}</button>
          <button class="btn btn-ghost btn-block" data-action="import">${ic('upload', 18)} ${T('Sicherung importieren')}</button><input type="file" id="import-file" hidden>
          <div class="muted" style="font-size:13px">${T('Mit einer Sicherungsdatei nimmst du deine Daten auf ein neues Handy mit.')}${lb ? ' · ' + fmtDate(new Date(lb).toISOString().slice(0, 10)) : ''}</div></div></section>
      ${ThemeSection()}
      <section class="section"><div class="section-h"><h2>${T('Zugang & Park')}</h2></div>
        <div class="card stack" style="font-size:14px"><div><b>${T('QR-Zugang')}</b><div class="muted">${T('Die App öffnet sich über den QR-Code an der Drehtür. Eine Verbindung zur Zugangskontrolle besteht noch nicht – die App öffnet keine Tür.')}</div></div>
          <div class="muted">${T('{n} identische Racks im Park · je {p} Personen', { n: RACK.count || 4, p: RACK.perRack || '10–12' })}</div></div></section>
      <section class="section"><div class="section-h"><h2>${T('Rechtliches')}</h2></div><div class="card list-card">
        <a class="list-link" href="#/rechtliches/impressum">${ic('book')}<div class="grow"><b>${T('Impressum')}</b></div></a>
        <a class="list-link" href="#/rechtliches/datenschutz">${ic('lock')}<div class="grow"><b>${T('Datenschutz')}</b></div></a>
        <a class="list-link" href="#/rechtliches/gesundheit">${ic('check')}<div class="grow"><b>${T('Gesundheitshinweis')}</b></div></a></div></section>
      <section class="section"><div class="card stack"><button class="btn btn-danger-ghost btn-block" data-action="park-reset">${ic('trash')} ${T('Profil & Daten löschen')}</button></div></section>
    </main>`;
  };
  A['park-profile-save'] = () => {
    const c = S.clients.get(roleInfo().clientId); if (!c) return; const f = readFields();
    if (!f.name) return toast(T('Bitte gib deinen Namen ein.'));
    Object.assign(c, f, { goals: T(GOALS[f.parkGoal]) }); put('clients', c); toast(T('Profil gespeichert')); render();
  };
  A['park-reset'] = async () => {
    const v = await promptDialog(T('Profil & Daten löschen?'), { label: T('Alle Daten auf diesem Gerät werden gelöscht. Zum Bestätigen LÖSCHEN eintippen.'), placeholder: T('LÖSCHEN'), ok: T('Löschen') });
    if (!v || !isDel(v)) return;
    await sessionEnd(); await DB.replaceAll({}); PH.clear(); await loadAll(); LOCK.locked = false; UI.open = {}; go('/'); render();
  };

  /* Sicherung einspielen – gleiche Logik wie in der SWEAT4-App, Texte für Sportler */
  window.doImport = async function (file) {
    let obj;
    try { obj = JSON.parse(await file.text()); } catch (e) { return toast(T('Die Datei ist kein gültiges Backup.')); }
    if (!obj || obj.app !== CONFIG.APP_ID || !obj.data || !Array.isArray(obj.data.clients)) return toast(T('Diese Datei ist keine Sicherung dieser App.'));
    const ok = await confirmDialog(T('Sicherung einspielen?'), T('Sicherung vom {d} mit {n} Trainings. Die Daten auf diesem Handy werden dadurch ersetzt.', { d: `<b>${esc(new Date(obj.exportedAt).toLocaleString(LOC()))}</b>`, n: `<b>${(obj.data.sessions || []).length}</b>` }), { ok: T('Einspielen') });
    if (!ok) return;
    try { await DB.replaceAll(obj.data); PH.clear(); await loadAll(); UI.open = {}; LOCK.init = false; toast(T('Sicherung eingespielt ✓')); go('/'); render(); }
    catch (e) { dbError(e); }
  };

  /* ---------- Routen ---------- */
  const _routeExtra = routeExtra;
  window.routeExtra = function (p) {
    if (!isClientMode()) return p[0] === 'rechtliches' ? _routeExtra(p) : p[0] === 'preise' ? topbar({ back: '/', title: T('Preise & Abos') }) + `<main class="wrap view">${PriceBlock()}</main>` : viewParkStart(p[0] === 'zugang' ? decodeURIComponent(p[1] || '') : '');
    if (p[0] === 'zugang') return viewParkGate(decodeURIComponent(p[1] || ''));
    if (p[0] === 'programme') return viewPrograms();
    if (p[0] === 'preise') return topbar({ back: '/', title: T('Preise & Abos') }) + `<main class="wrap view">${PriceBlock()}</main>`;
    if (p[0] === 'rack') return viewRack(p[1] || '');
    if (['nachrichten', 'mitteilungen', 'zyklus', 'meldungen', 'kunde-setup'].includes(p[0])) return null;   // Trainer-/Betreuungsfunktionen gibt es hier nicht
    if (p[0] === 'client' && ['food', 'fragebogen', 'foto', 'lauf', 'body', 'check'].includes(p[2])) return null;
    return _routeExtra(p);
  };

  /* ---------- Stil ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .park-brand-img{display:block;margin:22px auto 18px;max-width:340px}.park-brand-img img{display:block;width:100%;height:auto}
  .brand img.logo-mark{height:26px;width:auto;display:block}
  .park-brand{display:flex;align-items:center;gap:14px;margin:18px 0 16px}.park-brand .logo-mark{height:44px;width:auto;color:var(--accent)}
  .park-name{font-size:22px;font-weight:800;letter-spacing:-.01em}.park-tag{color:var(--muted);font-size:14px}
  .park-gate{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--accent);background:var(--accent-soft);border-radius:12px;padding:8px 12px;margin-bottom:12px}
  .park-check{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.4}.park-check input{margin-top:3px;width:18px;height:18px;flex:none}.park-check a{color:var(--accent)}
  .park-prog{display:flex;align-items:center;gap:12px;margin:12px 0 4px;text-decoration:none;color:inherit}
  .park-novid{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:repeating-linear-gradient(135deg,var(--surface),var(--surface) 10px,var(--surface-2,#151515) 10px,var(--surface-2,#151515) 20px)}
  .park-novid .xprev-ph{position:static;transform:none;opacity:.5}.park-novid-t{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
  .park-poster{width:100%;height:100%;object-fit:cover;display:block}
  .park-rec{position:absolute;top:8px;right:8px;background:var(--accent);color:#111;font-size:11px;font-weight:800;border-radius:999px;padding:3px 8px;text-transform:uppercase;letter-spacing:.05em}
  .park-ph-note{display:flex;gap:8px;align-items:center;font-size:13px;border:1px dashed var(--border);border-radius:12px;padding:8px 12px;margin-bottom:10px;color:var(--muted)}
  .park-area-link{display:inline-flex;gap:6px;align-items:center;font-size:13px;color:var(--accent);margin-bottom:10px;text-decoration:none}
  .park-vstage{background:#000}
  .park-vstage .park-video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain!important;background:#000}
  .ud-hero.park-ori-portrait{aspect-ratio:auto!important;height:min(72vh,640px);width:min(100%,calc(min(72vh,640px) * 9 / 16));margin:0 auto}
  .ud-hero.park-ori-landscape{aspect-ratio:16/9!important}
  .ud .figsw{display:none!important}
  .ud-hero:has(.park-video) .ud-ctrl{top:10px;bottom:auto}
  .park-vph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;min-height:240px;padding:24px;color:var(--muted);border:2px dashed var(--border);border-radius:16px;margin:12px;width:calc(100% - 24px)}
  .park-vph b{color:var(--text,#eee);font-size:16px}.park-vph span{font-size:13px;max-width:280px}.park-vph-ic{opacity:.45}
  .park-rack{position:relative;width:100%;aspect-ratio:1000/620;color:var(--muted);border-radius:18px;overflow:hidden;background:var(--surface)}
  .park-rack-img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
  .park-zone{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:2px solid var(--border);border-radius:14px;background:rgba(127,127,127,.06);color:var(--text,#eee);text-decoration:none;transition:background .15s,border-color .15s}
  .park-zone b{font-size:22px;color:var(--accent)}.park-zone span{font-size:12px;color:var(--muted)}
  .park-zone.on,.park-zone:hover{border-color:var(--accent);background:var(--accent-soft)}
  .kat-figrow{display:none!important}
  .pz{margin:4px 0 22px}
  .pz-hero{position:relative;border-radius:22px;padding:22px 20px 20px;background:linear-gradient(150deg,#d4b074,#be9b5c 55%,#9c7c45);color:#111;box-shadow:0 10px 30px rgba(190,155,92,.25)}
  .pz-eyebrow{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
  .pz-big{font-size:46px;font-weight:900;letter-spacing:-.02em;line-height:1.05;margin-top:6px}.pz-big span{font-size:20px;font-weight:700}
  .pz-sub{font-size:15px;font-weight:600;margin-top:6px}.pz-note{font-size:13px;opacity:.75;margin-top:2px}
  .pz-cta{margin-top:16px;width:100%;min-height:56px;font-size:17px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;background:#111!important;color:#f3e3c4!important;border:0;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:10px}
  .pz-h{margin:26px 0 12px}.pz-h h2{font-size:18px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:0}.pz-h p{margin:6px 0 0;color:var(--muted);font-size:14px}
  .pz-subs{display:grid;gap:12px}
  .pz-card{position:relative;border:1px solid var(--border);border-radius:18px;padding:18px;background:var(--surface)}
  .pz-card.pop{border:2px solid var(--accent);padding-top:24px;box-shadow:0 0 0 4px var(--accent-soft)}
  .pz-badge{position:absolute;top:-12px;left:18px;background:var(--accent);color:#111;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;border-radius:999px;padding:4px 10px}
  .pz-name{font-size:14px;font-weight:800;letter-spacing:.1em;color:var(--accent)}
  .pz-price{font-size:32px;font-weight:900;margin:4px 0 8px;letter-spacing:-.01em}.pz-price span{font-size:15px;font-weight:600;color:var(--muted)}
  .pz-incl{display:flex;gap:8px;align-items:center;font-size:15px;font-weight:600}.pz-incl svg{color:var(--accent)}
  .pz-ph{font-size:13px;color:var(--muted);margin:4px 0 14px}
  .pz-cards{display:grid;gap:10px}
  .pz-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:1px solid var(--border);border-radius:16px;padding:14px 16px;background:var(--surface);color:inherit;font:inherit;cursor:pointer}
  .pz-row b{font-size:17px;display:block}.pz-row small{color:var(--muted);font-size:13px}.pz-rp{font-size:24px;font-weight:900}
  .pz-dl{display:grid;gap:8px;margin:4px 0}.pz-dl div{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--border);padding:8px 0;font-size:15px}.pz-dl span{color:var(--muted)}
  .pz-terms{margin:0;padding-left:18px;line-height:1.5}.pz-steps{margin:0 0 12px;padding-left:20px;line-height:1.7}
  .pz-nopay{display:flex;gap:8px;align-items:flex-start;font-size:14px;border:1px dashed var(--border);border-radius:12px;padding:10px 12px;color:var(--muted);width:100%}
  @media (min-width:720px){.pz-subs{grid-template-columns:repeat(3,1fr)}}`;
  document.head.appendChild(css);
})();
