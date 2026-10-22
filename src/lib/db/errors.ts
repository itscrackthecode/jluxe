export function hasPostgresErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === code;
}

export function getPostgresErrorContext(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return { errorName: error instanceof Error ? error.name : 'UnknownError' };
  }

  const candidate = error as Record<string, unknown>;
  const fields = ['code', 'table', 'column', 'constraint', 'dataType', 'routine'] as const;
  const context: Record<string, string> = {
    errorName: error instanceof Error ? error.name : 'UnknownError',
  };
  for (const field of fields) {
    const value = candidate[field];
    if (typeof value === 'string' && value.length > 0) context[`database${field[0].toUpperCase()}${field.slice(1)}`] = value;
  }
  return context;
}

/** Diagnostics scoped to CareerJob writes. Never include PostgreSQL detail,
 * query text, or bound values, which can contain user-submitted content. */
export function getCareerJobSaveErrorContext(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return { errorName: error instanceof Error ? error.name : 'UnknownError' };
  }

  const candidate = error as Record<string, unknown>;
  const context: Record<string, string> = {
    errorName: error instanceof Error ? error.name : 'UnknownError',
  };
  if (typeof candidate.code !== 'string' || !/^[0-9A-Z]{5}$/.test(candidate.code)) return context;

  context.databaseCode = candidate.code;
  for (const field of ['table', 'column', 'constraint'] as const) {
    const value = candidate[field];
    if (typeof value === 'string' && value.length > 0) context[`database${field[0].toUpperCase()}${field.slice(1)}`] = value;
  }
  if (typeof candidate.message === 'string' && candidate.message.length > 0) {
    context.databaseMessage = candidate.message.slice(0, 500);
  }
  if (typeof candidate.position === 'string' && /^\d+$/.test(candidate.position)) {
    context.databasePosition = candidate.position;
  } else if (typeof candidate.position === 'number' && Number.isInteger(candidate.position) && candidate.position > 0) {
    context.databasePosition = String(candidate.position);
  }
  return context;
}
