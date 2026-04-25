# Chrome Web Store Listing Draft

## Name

Gmail Scheduling Sidekick

## Short description

Create scheduling replies faster in Gmail with candidate times, templates, notes, and Calendar hold links.

## Detailed description

Gmail Scheduling Sidekick is a Gmail side panel assistant for schedule coordination.

It helps you:
- Generate candidate meeting times
- Create numbered scheduling replies
- Insert generated text into Gmail compose/reply
- Keep local work notes
- Open Google Calendar event creation screens for tentative holds
- Use Japanese or English UI

Calendar events are not saved automatically. The extension opens Google Calendar event creation screens so you can review and save only the holds you need.

The work memo is stored locally in Chrome extension storage for your current Chrome profile.

## Privacy summary

No personal data is collected, sold, transmitted, or shared.
Gmail message contents and Google Calendar contents are not transmitted to external servers.

## Permissions justification

- tabs: Finds Gmail tabs and opens Google Calendar event creation tabs.
- storage: Saves settings, local memo, and diagnostic logs.
- sidePanel: Displays the Gmail Scheduling Sidekick panel.
- scripting: Reserved for Gmail interaction support.
- https://mail.google.com/*: Inserts user-generated text into Gmail compose/reply.
- https://calendar.google.com/*: Opens Calendar event creation screens.