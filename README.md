# keel

Your personal tracker for gym, bulk, money, uni and learning. It's a web app you add to your iPhone home screen. All your data stays on your phone.

## Put it on your iPhone (GitHub Pages, free)

### 1. Create the repository (on your PC)
1. Go to https://github.com and sign up or sign in.
2. Click **+** (top right), then **New repository**.
3. Name it `keel` and leave it **Public**, because free GitHub Pages needs a public repo. Only the app's code is public, never your data.
4. Click **Create repository**.

### 2. Upload the files
1. On the new repo page, click **uploading an existing file**.
2. Open the `keel` folder on your PC and drag **everything inside it** into the browser: `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `README.md` and the `icons` folder.
3. Click **Commit changes**.

### 3. Turn on Pages
1. In the repo, go to **Settings**, then **Pages** (left sidebar).
2. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main**, and folder to **/ (root)**. Click **Save**.
3. Wait about a minute and refresh. The page shows your link, something like `https://YOUR-USERNAME.github.io/keel/`.

### 4. Install on the iPhone
1. Open that link in **Safari**. It must be Safari; Chrome on iPhone can't install it.
2. Tap the **Share** button (the square with an arrow), then **Add to Home Screen**, then **Add**.
3. Open **keel** from your home screen. It runs full screen and works offline.

## Your data
- Everything is saved on your phone, inside the home-screen app.
- **Back up regularly:** settings, then **export backup**, then save it to Files or iCloud Drive.
- New phone? Install the app again, then use settings, then **import**, and pick your backup.
- Deleting the app from your home screen deletes its data, so export first.

## Updating the app later
1. Edit the files, and in `sw.js` change `VERSION = 'keel-v1'` to `'keel-v2'` (then v3, and so on).
2. Upload the changed files to the GitHub repo again (drag and drop, then commit).
3. On your phone, open the app, close it fully and open it again. Your data is kept.

## Running it on your PC
In this folder, run `python -m http.server 5173`, then open http://localhost:5173.
