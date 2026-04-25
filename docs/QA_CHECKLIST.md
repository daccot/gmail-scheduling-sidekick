# QA Checklist

## Install

- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds
- [ ] `extension/` is generated
- [ ] Chrome loads `extension/` without manifest errors

## Gmail

- [ ] Side panel opens on Gmail
- [ ] Candidate generation works
- [ ] Manual candidate addition works
- [ ] Candidate deletion works
- [ ] Candidate copy works
- [ ] Reply template generation works
- [ ] Gmail insertion works when compose box is open
- [ ] Clear error is shown when compose box is not open

## Calendar

- [ ] Calendar event creation links open
- [ ] Event title is populated
- [ ] Event details are populated
- [ ] Start/end time are correct
- [ ] Busy/free setting behaves as expected

## Language

- [ ] Auto uses browser language
- [ ] Japanese forced setting works
- [ ] English forced setting works
- [ ] Options page language changes after setting change
- [ ] Side panel language changes after reload

## Storage

- [ ] Memo saves locally
- [ ] Memo persists after side panel close
- [ ] Memo clears correctly
- [ ] Settings persist
- [ ] Logs copy correctly

## Privacy

- [ ] No external API calls
- [ ] No analytics
- [ ] No tracking
- [ ] Privacy policy matches actual behavior

## Store readiness

- [ ] Permission list is minimal
- [ ] Store description matches actual behavior
- [ ] Screenshots prepared
- [ ] Privacy practices filled accurately
