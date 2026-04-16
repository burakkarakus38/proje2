/**
 * Generates an ISO 8601 UTC timestamp.
 * Per backend-rules.md: timestamp must be dynamically generated, never hardcoded.
 */
export const generateTimestamp = (): string => {
  return new Date().toISOString();
};
