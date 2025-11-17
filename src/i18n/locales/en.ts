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
};

export type TranslationKeys = typeof en;
