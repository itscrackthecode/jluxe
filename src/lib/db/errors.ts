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
