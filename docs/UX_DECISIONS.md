# UX decisions — the app

One entry per decision: **decision · problem · principle · refused · cost · signal**. Reviewed on the iOS simulator (iPhone 17, iOS
26) against dev.yasakia.com; the screens are the same destinations, under the same addresses, as the web console
(`apps/web/lib/console-nav.ts` and `docs/UX_DECISIONS.md` of krizaka/yasakia).

## 1. Five tabs, the web's five destinations, as data

- **Decision.** The tab bar is Home · Talk · Photos · Batch · Introductions — the same five, in the same order and under the same
  addresses as the web console (`apps/web/lib/console-nav.ts` of krizaka/yasakia). They are data (`src/lib/nav.ts`), the bar is
  built from them, and `src/lib/__tests__/nav.test.ts` holds the shape (at most five, the journey's order, no « Account » tab).
  The account is a utility, never a tab. The label of the last one is « Intros » so five labels fit under a thumb at 393 pt.
- **Problem.** The first review kept four tabs and let Home redirect to Talk, so the phone's journey was not the web's: Photos and
  Introductions did not exist, and a person coming back saw a conversation, not where things stand.
- **Principle.** The navigation tells the product's story (talk → photos → batch → introductions); one-handed reach (the bar is at
  the bottom); the same words, order and rules as the web.
- **Refused.** A fifth « Settings » tab; a hamburger drawer; a different journey on the phone than on the web; a Home that only redirects.
- **Cost.** Five items is the most a bottom bar holds; « Introductions » is shortened to « Intros » in the bar (the screen says it in full).
- **Signal.** A QA run walks all five tabs without a hidden label (`.maestro/walk.yaml`, EN and FR, dark and light).

## 2. The keyboard never covers the action

- **Decision.** Sign-in, the composer and the introduction's thread keep their primary button above the keyboard
  (`KeyboardAvoidingView`), and the screen scrolls to the focused field.
- **Problem.** On a 393 pt-wide phone the sign-in's button sits at 44 % of the screen height; the keyboard takes the lower half.
- **Principle.** One thumb, one column: nothing the person needs is ever behind the keyboard.
- **Refused.** A modal sign-in; a second « Continue » step.
- **Cost.** A little extra layout code per form.
- **Signal.** The simulator run in `docs/`: sign-in, first message, first batch — no hidden button.

## 3. Photos: the web's rules, nothing edited, the reason in words

- **Decision.** The Photos tab holds the person's own photos (4 to 6, at least 2 where the face is the subject), each one checked by
  Orazaka. Under the grid: the state of the set, the two counts, and for each photo its status (« Face detected », « No face here »,
  « Checking… ») and, when something is wrong, the reason in a sentence (screenshot, text written on it, may be under 18…). « Continue
  to my batch » opens only once the whole set has passed. The photo goes up as it was picked: no crop, no filter; type and size
  (10 MB) are told before the upload; the bytes go to the server's signed upload and land on Bunny.
- **Problem.** A phone person adds photos in a hurry; a silent refusal or an editor that changes their face is worse than a clear « no ».
- **Principle.** Honest and plain: a reason, never a score; the same consent to compare faces as on the web (asked first, withdrawn any time).
- **Refused.** An in-app editor or beauty filter; a numeric confidence; uploading before the type and size are known.
- **Cost.** A refused photo costs a round trip to the library; the HEIC of the library is asked as JPEG (`compatible` representation).
- **Signal.** Component tests (`photos.screen.test.tsx`) hold the status and the reasons; the simulator walk shows 4 photos, 2 of the face.

## 4. Introductions: humans talk, each message has its signal

- **Decision.** A list (live first) and a thread. The composer is the only way to write: the AI proposes nothing and never reads the
  thread. Each text message carries the web's authenticity signal above it — one of four words (« Written by hand », « Uncertain »,
  « Probably generated », « Too short to judge »), never a number — and pressing it says what it means and that it can be wrong. The
  composer counts how a message arrives (typed or pasted, how fast) as counters only; the server reads them with the text. Photo
  messages show; video and voice say they play on the web for now. « Continue » is offered while the introduction is open.
- **Problem.** A classifier score shown as a verdict hurts people (it is wrong on short and French texts).
- **Principle.** A signal, not a verdict; it never holds a message back; the person's words are theirs.
- **Refused.** A suggested reply; a percentage; blocking a message on its signal.
- **Cost.** Video and voice messages cannot be recorded or played on the phone yet (the criterion `journey.media-messages` stays open).
- **Signal.** `intros.screen.test.tsx`, `composer-signals.test.ts` and the simulator walk (thread with a photo and a voice message).

## What the review found (2026-10-20, second pass)

- **Built and walked.** A Release build for the iOS 26 simulator installs, signs in as the persona Camille (a fictional adult), and
  every signed-in screen was walked against dev.yasakia.com in English and French, dark and light: clips and screenshots in the PR.
- **Fixed — endless loader.** When the secure store could not be read (a build without keychain access) the app stayed on « Loading »
  forever: the read had no `catch`. It now falls to the sign-in (`auth.test.tsx`).
- **Fixed — keyboard automation.** Taps on the sign-in fields did not focus them under Maestro 2.11 on the iOS 26 simulator. The
  causes were three, none in the runner: the app had no test ids (the fields now carry `signin-email`, `signin-password`,
  `signin-submit`); the simulator's hardware keyboard was connected (`defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool false`);
  and the app never got past its loader (above). The flows are in `.maestro/`; credentials come from the environment, the session is
  stored so the walk reuses it (the sign-in is limited to 10 per hour per address), and the recordings never show an e-mail.
- **Fixed — status bar.** A header with a back button drew under the status bar; the back is now a quiet button in the content.
- **Open.** Video and voice messages (record and play); the debrief on the phone; an Android walk-through.
