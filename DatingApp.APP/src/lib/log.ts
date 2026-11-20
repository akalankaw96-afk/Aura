/**
 * The only place the web app writes to the browser console (S05-T06, BUG-021).
 * Development builds show the message; production builds stay quiet (no stray logs for members to see).
 * Use it inside `catch` blocks that can safely carry on, so a failure is never silently swallowed while developing.
 */
const DEV = process.env.NODE_ENV !== "production";

export const log = {
  warn(message: string, detail?: unknown) {
    // eslint-disable-next-line no-console
    if (DEV) console.warn(`[vk] ${message}`, detail ?? "");
  },
  error(message: string, detail?: unknown) {
    // eslint-disable-next-line no-console
    if (DEV) console.error(`[vk] ${message}`, detail ?? "");
  },
};
