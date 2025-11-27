// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/services/participation.ts
// Event participation service - orchestrator

/**
 * Event Participation Service
 * 
 * Manages user participation in events:
 * - Joining/leaving events
 * - Role/spec selection
 * - Waitlist management
 * - Participant approval (for events requiring approval)
 * - Promotion from waitlist
 */

// Re-export types
export type { 
  JoinEventParams, 
  ParticipationResult, 
  ApprovalResult 
} from './participation/types.js';

// Re-export all public functions
export { joinEvent } from './participation/join.js';
export { leaveEvent } from './participation/leave.js';
export { updateParticipantRole } from './participation/update-role.js';
export { approveParticipants, rejectParticipants } from './participation/approval.js';
export { promoteParticipant, promoteNext } from './participation/promote.js';

// Re-export waitlist utilities (used by other services)
export { promoteFromWaitlist, reindexWaitlist } from './participation/waitlist.js';
