export function guessTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}