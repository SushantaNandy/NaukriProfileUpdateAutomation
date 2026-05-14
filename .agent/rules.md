# NaukriBoost — Agent Rules

## Communication
1. **Ask before executing**: If there is any doubt or ambiguity about what to do, ASK the user first. Do not assume or guess.
2. **Explain before running commands**: Before running any command (npm install, git, file deletions, etc.), explain what the command does and why it's needed. Wait for confirmation on destructive or significant commands.
3. **No silent changes**: Never modify, delete, or create files without clearly stating what's being changed and why.

## Change Tracking
4. **Update CHANGELOG.md**: After every session, update `CHANGELOG.md` at the project root with all changes made — files created, modified, deleted, and commands executed.
5. **Diff awareness**: When modifying existing files, show what's changing (old vs new) before applying the edit.

## Code Quality
6. **Stealth mode always**: All Playwright automation must use stealth mode (per user rules in `stealth-automation.md`). Never use default automation flags.
7. **No hardcoded credentials**: All secrets go in `.env` or environment variables. Never commit credentials.
8. **Comments and documentation**: Add JSDoc-style comments to all functions. Preserve existing comments.
9. **Consistent naming**: Use camelCase for JS variables/functions, PascalCase for React components, kebab-case for CSS classes.

## Git Workflow
10. **Feature branches**: All new work goes on a feature branch (e.g., `feat/xyz`). Never commit directly to `main`.
11. **Confirm before branch operations**: Ask before creating, switching, or merging branches.

## Architecture
12. **Separation of concerns**: Keep existing automation engine (`pages/`, `utils/`, `tests/`) separate from the new web app (`client/`, `server/`).
13. **Mock-first frontend**: Frontend should work with mock data first. Backend integration comes as a separate step.
14. **Free tier priority**: Use free-tier services only (SQLite, Gemini free API, local storage) unless user explicitly approves paid services.

## Testing & Verification
15. **Browser verify**: After building UI, always verify in the browser before marking as complete.
16. **Don't break existing automation**: Changes to the new web app must never break the existing Playwright automation scripts or GitHub Actions workflow.
