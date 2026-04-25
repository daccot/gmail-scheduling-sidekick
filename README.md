# Gmail Scheduling Sidekick

A Chrome MV3 extension that helps create scheduling replies in Gmail.

## Features

- Gmail Side Panel assistant
- Flexible candidate time generation
  - Distributed candidates
  - Consecutive candidates
  - Manual candidate addition
- Numbered candidate output
- Reply templates
- Insert generated text into Gmail compose/reply body
- Local work memo
- Google Calendar event creation links for tentative holds
- Japanese / English UI
- Language setting:
  - Auto: browser language
  - Japanese
  - English

## Important: Calendar tentative holds

This extension opens Google Calendar event creation screens for candidate times.
Events are not saved automatically.
Review each Calendar screen and save only the tentative holds you need.

## Memo storage

Work memos are saved in Chrome extension local storage for this PC and Chrome profile.
They are not sent to external servers.
They are not automatically synced to another PC or another Chrome profile.

## Development

```bash
npm install
npm run build
```

The built Chrome extension is output to:

```text
extension/
```

Load `extension/` from `chrome://extensions/` using Developer Mode.

## GitHub quick start

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-user>/gmail-scheduling-sidekick.git
git push -u origin main
```

## Privacy

This extension does not collect, sell, transmit, or share personal data.
It does not transmit Gmail contents or Calendar contents to external servers.

## License

MIT