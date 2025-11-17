// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/utils/errors.ts
// Custom error classes for better error handling

export class BotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BotError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConfigError extends BotError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class DatabaseError extends BotError {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class CommandError extends BotError {
  constructor(message: string) {
    super(message);
    this.name = 'CommandError';
  }
}

export class ValidationError extends BotError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends BotError {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends BotError {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'PermissionError';
  }
}
