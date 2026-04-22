---
description: Automates the daily profile refresh on Naukri.com
---

1. Navigate to 'https://www.naukri.com/'.
2. Check if the session is active. If not, use the saved 'auth_state.json' to inject cookies.
3. Navigate directly to the Profile Page: 'https://www.naukri.com/mnjuser/profile?id=&altresid'.
4. **Resume Update:**
   - Locate the current resume 'sushantaresume.pdf'.
   - Trigger the 'Delete' action and confirm.
   - Rename local 'sushantaresume.pdf' to 'sushantaresume1.pdf'.
   - Upload 'sushantaresume1.pdf' to the resume upload input.
5. **Headline Update:**
   - Click the edit icon next to the Resume Headline.
   - Append a '.' to the end of the current text and click 'Save'.
   - Click 'Edit' again, remove the '.' and click 'Save'.
6. Verify the 'Last Updated' timestamp on the profile and log a success message.