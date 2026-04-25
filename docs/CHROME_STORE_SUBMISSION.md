# Chrome Web Store Submission Plan

## Positioning

Gmail Scheduling Sidekick is a productivity extension for Gmail users who frequently coordinate meetings or interviews.

It helps users prepare scheduling replies by generating candidate times, reply templates, local notes, and Google Calendar event creation links.

## Single purpose statement

Helps Gmail users create and manage scheduling replies faster.

## Short description

Create scheduling replies faster in Gmail with candidate times, templates, notes, and Calendar hold links.

## Detailed description

Gmail Scheduling Sidekick adds a scheduling assistant to Gmail.

Use it to:
- Generate candidate meeting times
- Create numbered scheduling replies
- Insert generated text into Gmail compose or reply boxes
- Keep local work notes
- Open Google Calendar event creation screens for tentative holds
- Use Japanese or English UI

Calendar events are not saved automatically. The extension opens Google Calendar event creation screens so you can review and save only the holds you need.

Work notes are stored locally in Chrome extension storage for your current browser profile.

## Permissions justification

### `tabs`

Used to find the active Gmail tab and open Google Calendar event creation tabs.

### `storage`

Used to save settings, local memo text, and diagnostic logs.

### `sidePanel`

Used to display the Gmail Scheduling Sidekick panel.

### `scripting`

Reserved for Gmail interaction support. If not used in the final manifest, remove it before submission.

### `https://mail.google.com/*`

Used only to insert user-generated scheduling text into an open Gmail compose or reply box.

### `https://calendar.google.com/*`

Used only to open Google Calendar event creation screens.

## Privacy practices

Suggested declarations:

- Does the extension collect personally identifiable information?
  - No
- Does it collect financial/payment information?
  - No
- Does it collect authentication information?
  - No
- Does it collect personal communications?
  - No
- Does it collect location?
  - No
- Does it collect web history?
  - No
- Does it sell or transfer user data?
  - No
- Is data used for purposes unrelated to the extension's single purpose?
  - No

## Review-risk notes

Before submission, consider removing `scripting` if the extension works without it.

The Chrome Web Store review is sensitive to overbroad permissions. Keep only permissions that directly support the current feature set.

## Store screenshots

Recommended screenshots:

1. Gmail with the Side Panel open
2. Candidate generation panel
3. Reply template output
4. Calendar hold explanation
5. Language setting screen

## Category

Productivity

## Language support

- Japanese
- English

## Support text

For support, please open an issue on GitHub.

## Changelog for first release

### v0.6.0

- Initial public release
- Gmail scheduling side panel
- Candidate time generation
- Reply templates
- Gmail text insertion
- Local memo
- Google Calendar event creation links
- Japanese/English UI
