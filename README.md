# Taboo

A pass-the-phone Taboo party game, built as a Progressive Web App.

- **Frontend**: static PWA in [`docs/`](docs), hosted on GitHub Pages (Vue 3 from a CDN, no build step). It works offline once loaded, and phones can install it to the home screen.
- **Backend**: Google Apps Script bound to a Google Sheet ([`google-scripts-code/`](google-scripts-code)), deployed as a web app that returns JSON.
- **Auth**: anyone can play. To add, edit or delete cards, people sign in with Google (OAuth Client ID). The backend checks the Google ID token and only accepts emails listed on the sheet's **Editors** tab, which you manage from the **Taboo** menu in the sheet.

```
Phone (GitHub Pages PWA) ──GET  ?action=cards──────────────▶ Apps Script web app ──▶ "Cards" sheet
                         ──POST {idToken, action, ...}─────▶   verifies token, checks "Editors" sheet
```

## Sheet layout

| Sheet     | Columns                                                              |
|-----------|----------------------------------------------------------------------|
| `Cards`   | Word, Taboo (comma-separated), Difficulty (1–3), Deck, Updated By, Updated At |
| `Editors` | Email, Name, Added By, Added On (created automatically)             |

## Setup

### 1. Create the OAuth Client ID (Google Cloud Console)

1. Go to <https://console.cloud.google.com/>, then create or pick a project.
2. **APIs & Services → OAuth consent screen**: set it up as **External**, fill in the app name and support email, and **publish** it (an app in "Testing" mode only lets listed test users sign in). The app only uses the basic `openid email profile` scopes, so Google doesn't need to verify it.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `https://<your-github-username>.github.io`
     - `http://localhost:8000` (for local testing)
   - You don't need any redirect URIs.
4. Copy the **Client ID** (it ends in `.apps.googleusercontent.com`).

### 2. Set up the Apps Script backend (clasp)

The backend code is synced with [clasp](https://github.com/google/clasp). [`.clasp.json`](.clasp.json) links this repo to the sheet's script project, and [`appsscript.json`](google-scripts-code/appsscript.json) sets the web app to run as you with access for **Anyone**.

One-time setup: install clasp (`npm i -g @google/clasp`), run `clasp login`, and turn on the Apps Script API at <https://script.google.com/home/usersettings>.

| Command              | What it does                                                                |
|----------------------|-----------------------------------------------------------------------------|
| `npm run gas:push`   | Uploads `google-scripts-code/` to the project. The live web app doesn't change. |
| `npm run gas:deploy` | Pushes, then updates the existing web app deployment to a new version. The `/exec` URL stays the same. |
| `npm run gas:pull`   | Downloads the project. **This overwrites local files**, so only use it if you edited in the browser. |
| `npm run gas:open`   | Opens the project in the Apps Script editor.                               |

After a push that adds new permissions (such as the first push of this version, which calls `oauth2.googleapis.com`), open the sheet and use any **Taboo** menu item so you're asked to re-authorize. Do this **before** `gas:deploy`, otherwise the web app fails with "Authorization is required".

To create a deployment from scratch instead, go to **Deploy → New deployment → Web app** in the editor, then put its ID in the `gas:deploy` script in [`package.json`](package.json) and the URL in `docs/config.js`.

Reload the Google Sheet. A **Taboo** menu appears:
- **Set OAuth Client ID…**: paste the Client ID from step 1. This also clears the old password settings.
- **Manage editors…**: add or remove the Google accounts that can edit cards. You (the owner) are added automatically.
- **Check setup**: shows the Client ID, card count, editors and web app URL.

### 3. Publish the frontend on GitHub Pages

1. Put your web app URL into [`docs/config.js`](docs/config.js):
   ```js
   window.TABOO_CONFIG = { apiUrl: 'https://script.google.com/macros/s/AKfy.../exec' };
   ```
2. Commit and push.
3. On GitHub, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, and pick `main` / `/docs`.
4. Open `https://<your-github-username>.github.io/<repo-name>/` on your phone, then use **Share → Add to Home Screen** (iOS) or **Install app** (Android/Chrome).

### Local testing

```sh
python3 -m http.server 8000 -d docs
# open http://localhost:8000 (must be listed as an authorized origin for sign-in to work)
```

## Updating the app

Browsers cache the PWA files. When you change anything in `docs/`, bump `VERSION` in [`docs/sw.js`](docs/sw.js) (for example, `taboo-v2`) so installed copies download the new files. They switch to the new version the next time they're opened.

## Notes

- Google ID tokens expire after about 1 hour. When one expires, the app asks the editor to sign in again (One Tap usually makes this a single tap).
- Removing someone from **Editors** takes effect on their next save. Their sign-in token isn't enough on its own.
- Card data is cached on the device, so you can keep playing with no connection. Editing needs a connection.
