# GitHub Publishing Guide

## Do not upload only the ZIP

GitHub should contain the extracted source code, not just a ZIP file.

Use the ZIP only for:
- testing the Chrome extension locally
- attaching a packaged build to a GitHub Release
- sharing a temporary test build

## Recommended repository name

```text
gmail-scheduling-sidekick
```

## First publish

```bash
cd GmailSchedulingSidekick

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-user>/gmail-scheduling-sidekick.git
git push -u origin main
```

## Recommended GitHub settings

- Visibility: Public if you want portfolio/product exposure
- License: MIT
- Issues: ON
- Discussions: optional
- Wiki: OFF unless needed
- Releases: ON

## Release workflow

1. Update version in:
   - `package.json`
   - `public/manifest.json`
2. Build:

```bash
npm run build
```

3. Zip the `extension/` folder.
4. Create a GitHub Release.
5. Attach the built ZIP.

## Suggested branch model

```text
main      stable
dev       active development
feature/* individual features
```

For your current stage, `main` only is acceptable.
