// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/i18n/locales/en.ts
// English translations

export const en = {
  // Event messages
  event: {
    created: '✅ Event **{title}** created successfully!',
    updated: '✅ Event updated successfully!',
    cancelled: '❌ Event **{title}** has been cancelled.',
    deleted: '🗑️ Event deleted.',
    notFound: 'Event not found.',
    invalidTime: 'Invalid time format. Use DD.MM.YYYY HH:MM (e.g., "18.11.2025 18:30") or YYYY-MM-DD HH:MM (e.g., "2025-11-18 18:30")',
    title: '📅 {title}',
    description: 'Description',
    noDescription: 'No description provided',
    startTime: '📅 Start Time',
    leader: '👑 Leader',
    duration: '⏱️ Duration',
    plannedDuration: 'Planned raid time',
    durationMinutes: '{duration} minutes',
    status: '📊 Status',
    participants: '👥 Participants',
    composition: 'Raid Composition',
    empty: 'empty',
    waitlist: '📝 Waitlist',
    pendingApproval: 'Pending Approval',
    noParticipants: '_No signups yet_',
    full: '🔒 Event is full',
    slots: '{current}/{max}',
    unlimited: 'Unlimited',
  },
  
  // Participation messages
  participation: {
    joined: '✅ You have joined **{title}**!',
    left: '👋 You have left **{title}**.',
    movedToWaitlist: '📝 Event is full. You have been added to the waitlist.',
    movedFromWaitlist: '✅ A spot opened up! You have been moved from the waitlist to confirmed participants.',
    alreadyJoined: '⚠️ You have already joined this event.',
    notParticipant: '⚠️ You are not a participant of this event.',
    roleRequired: '⚠️ Please select a role first.',
    roleFull: '⚠️ The {role} role is full.',
    selectRole: 'Select your role',
    selectSpec: 'Select your specialization (optional)',
  },

  // Template messages
  template: {
    created: '✅ Template **{name}** created successfully!',
    updated: '✅ Template updated.',
    deleted: '🗑️ Template deleted.',
    notFound: 'Template "{name}" not found.',
    listTitle: '📋 Available Templates',
    noTemplates: 'No templates found. Create one with `/template create`',
  },

  // Button labels
  buttons: {
    join: '✅ Join',
    leave: '❌ Leave',
    edit: '✏️ Edit',
    approve: '✅ Approve',
    cancel: '🚫 Cancel Event',
    viewDetails: '📋 Details',
  },

  // Status labels
  status: {
    scheduled: 'Scheduled',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    confirmed: 'Confirmed',
    waitlist: 'Waitlist',
    pending: 'Pending Approval',
    declined: 'Declined',
  },

  // Error messages
  errors: {
    serverOnly: 'This command can only be used in a server.',
    noPermission: 'You do not have permission to perform this action.',
    invalidChannel: 'Invalid channel.',
    failed: 'An error occurred. Please try again.',
    notEventCreator: 'Only the event creator or administrators can edit this event.',
  },

  // Common
  common: {
    createdBy: 'Created by',
    unknown: 'Unknown',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    hours: 'h',
    minutes: 'min',
  },

  // Native Discord Events
  nativeEvents: {
    createdBy: 'Created by',
    startsInDays: 'Starts in {days} day',
    startsInDaysPlural: 'Starts in {days} days',
    startsInHours: 'Starts in {hours}h {minutes}m',
    startsInMinutes: 'Starts in {minutes} minute',
    startsInMinutesPlural: 'Starts in {minutes} minutes',
    eventStarted: 'Event started',
    viewEventInDiscord: 'View Event in Discord',
    signUps: 'Sign-ups',
    // Web UI
    title: 'Native Discord Events',
    createEvents: 'Create Discord Events',
    createEventsDescription: 'Automatically create native Discord scheduled events for your bot events with dynamic participant updates',
    benefitsTitle: 'Benefits of native Discord events:',
    benefit1: 'Events appear in Discord server calendar',
    benefit2: 'Members can mark as "Interested"',
    benefit3: 'Automatic participant count updates',
    benefit4: 'Events auto-complete or delete when finished',
  },

  // Statistics
  stats: {
    leaderboardTitle: '🏆 Event Participation Leaderboard',
    leaderboardSeparator: '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    leaderboardFooter: 'Min. {minEvents} events to qualify • Last updated',
    noParticipants: 'No participants yet',
    noParticipantsDescription: 'Participate in at least {minEvents} events to appear on the leaderboard!',
    completedAndNoShows: '**{completed}** completed • {noShows} no-shows',
    personalStatsTitle: '📈 Your Event Statistics',
    noPersonalStats: 'You haven\'t participated in any events yet!',
    eventsCompleted: 'Events Completed',
    noShows: 'No-Shows',
    score: 'Score',
    scorePoints: '{score} points',
    rank: 'Rank',
    rankValue: '#{rank}',
    notRanked: 'Not ranked',
    qualifyMessage: 'Complete {remaining} more events to qualify for ranking!',
    scoringSystem: 'Scoring: +3 per completed event, -2 per no-show',
    refreshButton: '🔄 Refresh',
    viewPersonalButton: '📊 My Stats',
    setupTitle: '⚙️ Statistics Setup',
    setupDescription: 'Configure statistics tracking for this server',
    currentSettings: 'Current Settings',
    enabled: 'Enabled',
    disabled: 'Disabled',
    statsChannel: 'Stats Channel',
    updateInterval: 'Update Interval',
    autoRole: 'Auto-Role for Top 10',
    minEventsRequired: 'Min. Events Required',
    notSet: 'Not set',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    statsEnabled: '✅ Statistics tracking has been **enabled**!',
    statsDisabled: '❌ Statistics tracking has been **disabled**.',
    statsSetupComplete: '✅ Statistics setup completed!',
    noShowMarked: '✅ Marked {username} as no-show for event **{eventTitle}**.',
    userNotFound: '❌ User {username} not found in this event.',
    eventNotFound: '❌ Event not found.',
    insufficientPermissions: '❌ You need to be an administrator or have the manager role to use this command.',
  },
};

export type TranslationKeys = typeof en;
