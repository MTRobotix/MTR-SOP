// Shared by playwright.config.ts (to create the first admin) and the tests (to sign in). Test-only values.
export const PORT = 3100;
export const ADMIN = { email: "e2e-admin@example.com", password: "e2e-password-1", name: "Erin Tester" };
export const VIEWER = { email: "e2e-viewer@example.com", password: "e2e-password-2", name: "Vera Viewer" };
