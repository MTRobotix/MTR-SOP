# End-to-end tests

`npm run e2e` builds the app for production, starts it on port 3100 with a throwaway PGlite database
(`.data/e2e`, wiped on every run) and drives it through Chromium with Playwright.

- Files run in name order with one worker; later files use what earlier ones created
  (`02-home` checks the empty states, `03-work` creates a project, hours and tasks).
- SOP content is read from `./content`. Tests never save SOP content, so the repo stays clean.
- No GitHub, hosted database or AI calls: `playwright.config.ts` blanks those variables.
- First run on a new machine: `npx playwright install chromium`.
- Add a test for every change to a page people use daily. Select by role, label or id, not by layout.
