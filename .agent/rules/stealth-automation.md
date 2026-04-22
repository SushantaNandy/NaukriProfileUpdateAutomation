---
trigger: always_on
---

# Stealth Automation Rules
- Always use `stealth` mode in Playwright to avoid bot detection.
- Never use default "AutomationControlled" flags.
- Use a persistent user data directory to maintain session state (cookies).
- Implement random delays between 2-5 seconds for every click/type action.
- Ensure the viewport is set to a standard resolution (e.g., 1920x1080).