# UX decisions — the app

One entry per decision: **decision · problem · principle · refused · cost · signal**. Reviewed on the iOS simulator (iPhone 17, iOS
26) against dev.yasakia.com; the screens are the same destinations, under the same addresses, as the web console
(`apps/web/lib/console-nav.ts` and `docs/UX_DECISIONS.md` of krizaka/yasakia).

## 1. Four tabs, in the order of the journey

- **Decision.** The tab bar is Talk · Photos · Batch · Introductions (today Talk and Batch exist; Photos and Introductions follow, in
  this order). The account is a sheet from the header, never a tab. Home is the Talk.
- **Problem.** The web console has five destinations (Home, Talk, Photos, Batch, Introductions); a phone's bottom bar holds four
  comfortably under a thumb, and « Home » there only redirects to Talk.
- **Principle.** The tab bar tells the product's story; one-handed reach (the bar is at the bottom, primary actions in the lower
  half); the same words and the same order as the web.
- **Refused.** A fifth « Settings » tab; a hamburger drawer; a different journey on the phone than on the web.
- **Cost.** The account is one tap further (header avatar → sheet).
- **Signal.** A QA run from sign-in to a first message without the keyboard hiding an action.

## 2. The keyboard never covers the action

- **Decision.** Sign-in, the composer and the introduction's thread keep their primary button above the keyboard
  (`KeyboardAvoidingView`), and the screen scrolls to the focused field.
- **Problem.** On a 393 pt-wide phone the sign-in's button sits at 44 % of the screen height; the keyboard takes the lower half.
- **Principle.** One thumb, one column: nothing the person needs is ever behind the keyboard.
- **Refused.** A modal sign-in; a second « Continue » step.
- **Cost.** A little extra layout code per form.
- **Signal.** The simulator run in `docs/`: sign-in, first message, first batch — no hidden button.

## What the review found (2026-10-20)

- **Builds and launches.** A Release build for the iOS simulator (`pod install` then `xcodebuild -sdk iphonesimulator`, ~6 min on
  an M-series Mac) installs and launches on the simulator; the sign-in screen renders in the Yasakia brand, English.
- **Open — Photos and Introductions are not built.** The app stops after Talk and Batch: no photo upload (the rules of 4 to 6
  photos, 2 of the face), no introduction thread, no media messages. Until they exist the journey of the web is not the journey of
  the phone: `mobile.ux-review` stays open on that.
- **Open — keyboard automation.** Taps on the sign-in fields did not focus them under Maestro 2.11 on the iOS 26 simulator, so the
  signed-in screens were not walked on a simulator in this review. Whether this is the runner or the app's `TextField` (no
  accessibility label / hit slop) is to be checked on a device.
