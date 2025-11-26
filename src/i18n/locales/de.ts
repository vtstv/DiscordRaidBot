// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/i18n/locales/de.ts
// German translations (Deutsche Übersetzungen)

export const de = {
  // Event messages
  event: {
    created: '✅ Event **{title}** erfolgreich erstellt!',
    updated: '✅ Event erfolgreich aktualisiert!',
    cancelled: '❌ Event **{title}** wurde abgesagt.',
    deleted: '🗑️ Event gelöscht.',
    notFound: 'Event nicht gefunden.',
    invalidTime: 'Ungültiges Zeitformat. Verwenden Sie TT.MM.JJJJ HH:MM (z.B. "18.11.2025 18:30") oder JJJJ-MM-TT HH:MM (z.B. "2025-11-18 18:30")',
    title: '📅 {title}',
    description: 'Beschreibung',
    noDescription: 'Keine Beschreibung vorhanden',
    startTime: '📅 Startzeit',
    leader: '👑 Leiter',
    duration: '⏱️ Dauer',
    plannedDuration: 'Geplante Raid-Zeit',
    durationMinutes: '{duration} Minuten',
    status: '📊 Status',
    participants: '👥 Teilnehmer',
    composition: 'Raid-Zusammensetzung',
    empty: 'leer',
    waitlist: '📝 Warteliste',
    pendingApproval: 'Ausstehende Genehmigung',
    noParticipants: '_Noch keine Anmeldungen_',
    full: '🔒 Event ist voll',
    slots: '{current}/{max}',
    unlimited: 'Unbegrenzt',
  },
  
  // Participation messages
  participation: {
    joined: '✅ Sie haben sich für **{title}** angemeldet!',
    left: '👋 Sie haben **{title}** verlassen.',
    movedToWaitlist: '📝 Event ist voll. Sie wurden zur Warteliste hinzugefügt.',
    movedFromWaitlist: '✅ Ein Platz ist frei geworden! Sie wurden von der Warteliste zu den bestätigten Teilnehmern verschoben.',
    alreadyJoined: '⚠️ Sie haben sich bereits für dieses Event angemeldet.',
    notParticipant: '⚠️ Sie sind kein Teilnehmer dieses Events.',
    roleRequired: '⚠️ Bitte wählen Sie zuerst eine Rolle aus.',
    roleFull: '⚠️ Die Rolle {role} ist voll.',
    selectRole: 'Wählen Sie Ihre Rolle',
    selectSpec: 'Wählen Sie Ihre Spezialisierung (optional)',
  },

  // Template messages
  template: {
    created: '✅ Vorlage **{name}** erfolgreich erstellt!',
    updated: '✅ Vorlage aktualisiert.',
    deleted: '🗑️ Vorlage gelöscht.',
    notFound: 'Vorlage "{name}" nicht gefunden.',
    listTitle: '📋 Verfügbare Vorlagen',
    noTemplates: 'Keine Vorlagen gefunden. Erstellen Sie eine mit `/template create`',
  },

  // Button labels
  buttons: {
    join: '✅ Beitreten',
    leave: '❌ Verlassen',
    edit: '✏️ Bearbeiten',
    approve: '✅ Genehmigen',
    cancel: '🚫 Event absagen',
    viewDetails: '📋 Details',
  },

  // Status labels
  status: {
    scheduled: 'Geplant',
    active: 'Aktiv',
    completed: 'Abgeschlossen',
    cancelled: 'Abgesagt',
    confirmed: 'Bestätigt',
    waitlist: 'Warteliste',
    pending: 'Ausstehende Genehmigung',
    declined: 'Abgelehnt',
  },

  // Error messages
  errors: {
    serverOnly: 'Dieser Befehl kann nur auf einem Server verwendet werden.',
    noPermission: 'Sie haben keine Berechtigung, diese Aktion auszuführen.',
    invalidChannel: 'Ungültiger Kanal.',
    failed: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    notEventCreator: 'Nur der Event-Ersteller oder Administratoren können dieses Event bearbeiten.',
  },

  // Common
  common: {
    createdBy: 'Erstellt von',
    unknown: 'Unbekannt',
    none: 'Keine',
    yes: 'Ja',
    no: 'Nein',
    hours: 'Std',
    minutes: 'Min',
  },

  // Statistics
  stats: {
    leaderboardTitle: '🏆 Teilnahme-Rangliste',
    leaderboardSeparator: '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    leaderboardFooter: 'Mind. {minEvents} Events erforderlich • Zuletzt aktualisiert',
    noParticipants: 'Noch keine Teilnehmer',
    noParticipantsDescription: 'Nehmen Sie an mindestens {minEvents} Events teil, um in der Rangliste zu erscheinen!',
    completedAndNoShows: '**{completed}** abgeschlossen • {noShows} nicht erschienen',
    personalStatsTitle: '📈 Ihre Event-Statistiken',
    noPersonalStats: 'Sie haben noch an keinen Events teilgenommen!',
    eventsCompleted: 'Abgeschlossene Events',
    noShows: 'Nicht erschienen',
    score: 'Punkte',
    scorePoints: '{score} Punkte',
    rank: 'Rang',
    rankValue: '#{rank}',
    notRanked: 'Nicht gerankt',
    qualifyMessage: 'Schließen Sie {remaining} weitere Events ab, um sich für die Rangliste zu qualifizieren!',
    scoringSystem: 'Punktesystem: +3 pro abgeschlossenem Event, -2 pro Nichterscheinen',
    refreshButton: '🔄 Aktualisieren',
    viewPersonalButton: '📊 Meine Statistiken',
    setupTitle: '⚙️ Statistik-Einrichtung',
    setupDescription: 'Statistik-Tracking für diesen Server konfigurieren',
    currentSettings: 'Aktuelle Einstellungen',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    statsChannel: 'Statistik-Kanal',
    updateInterval: 'Aktualisierungsintervall',
    autoRole: 'Auto-Rolle für Top 10',
    minEventsRequired: 'Mind. Events erforderlich',
    notSet: 'Nicht gesetzt',
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    statsEnabled: '✅ Statistik-Tracking wurde **aktiviert**!',
    statsDisabled: '❌ Statistik-Tracking wurde **deaktiviert**.',
    statsSetupComplete: '✅ Statistik-Einrichtung abgeschlossen!',
    noShowMarked: '✅ {username} wurde als nicht erschienen für Event **{eventTitle}** markiert.',
    userNotFound: '❌ Benutzer {username} wurde in diesem Event nicht gefunden.',
    eventNotFound: '❌ Event nicht gefunden.',
    insufficientPermissions: '❌ Sie müssen Administrator sein oder die Manager-Rolle haben, um diesen Befehl zu verwenden.',
  },
};

export type TranslationKeys = typeof de;
