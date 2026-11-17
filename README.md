English (default) | [简体中文](README.zh-CN.md)

# SpeakBuddy

**Speak up — that's when you really learn.** (开口说，才真的会) A browser-based English speaking coach: interest-based placement, a personalized learning route, word-by-word shadowing feedback, and real-life role-play dialogues.

## Introduction

SpeakBuddy is a 100% static, single-page web app for practicing spoken English. There is **nothing to install, no account to create, and no server to talk to** — open it in a browser, allow the microphone, and start speaking. It runs entirely on built-in browser APIs (Web Speech synthesis/recognition, `getUserMedia` / `MediaRecorder`, Web Audio) with plain HTML, CSS and vanilla JavaScript: no dependencies, no build step, no backend. All learning data stays in your own browser (`localStorage`); there is no login, no telemetry, no AI/LLM API, and no native mobile app.

## Features

**Placement & personalized route**
- Onboarding: pick interest topics from 10 built-in topics and/or add your own custom topics (custom text is mapped to the closest topic; unmatched interests are honestly flagged as "course planning in progress").
- A ~1-minute adaptive placement test: 4 shadow-reading (speaking) items whose difficulty rises or falls with your score, plus 2 short comprehension multiple-choice questions that need no microphone.
- Result: level 1 / 2 / 3 (A2 Starter / B1 Intermediate / B2 Advanced). Interests decide *what* you learn, the level decides *where you start*; earlier stages unlock as optional warm-up. Re-testing only updates the level and route and keeps your interests, stars and XP.
- Course library: 8 thematic units / 24 lessons / 72 practice sentences with IPA, phoneme focus and per-sentence tips. The route selects and orders a subset of lessons across three difficulty stages by interest relevance; lessons unlock sequentially along your own route (already-cleared lessons stay replayable).

**Shadowing practice (跟读闯关)**
- Listen to the standard pronunciation (Web Speech TTS), then record yourself with the microphone (`getUserMedia` + `MediaRecorder`) while a real-time waveform is drawn from a Web Audio `AnalyserNode`.
- Browser `SpeechRecognition` produces a transcript; word-level alignment compares it to the reference and colors each word (correct / near / wrong / missing), with phoneme-based diagnosis tips.
- Three-dimensional score: **accuracy / fluency / completeness**, plus stars, XP, levels, combos and achievements.
- Self-recording playback: listen back to your own take after each sentence.

**Situational dialogue (情景对话)**
- 12 real-life scenarios (airport, cafe, small talk, directions, returns, clinic, stand-up, group project, job interview, polite disagreement, remote collaboration, invitations) with 4 turns each.
- The partner speaks first (TTS); you record a reply. Scoring combines **intent matching** (keyword groups + expression similarity, several acceptable answers per turn) with **delivery** (reuses the shadowing scorer).
- Hints, coach tips after each turn, and a "quick demo" that continues with a reference answer when no microphone is available.

**Gamification**
- XP and levels (one level per 200 XP), 3-star ratings, consecutive-score combos with an XP multiplier up to ×2.
- 6 achievements, a 7-day streak, 3 daily tasks and a daily chest with a 25–55 XP reward, plus synthesized sound effects, confetti and celebration popups.
- A **stats / progress page** (last-7-days activity, weak-phoneme review) and an **achievements page**.

**Data & privacy**
- Local-only storage (`localStorage`) with a redundant mirror for automatic recovery; nothing is uploaded.
- JSON backup export / import, a compact **sync code** (`SB1:` text) for cross-device migration, storage-status view, and a full data reset.

**Pronunciation**
- Web Speech API TTS with automatic local English voice selection, online MP3 fallback, and a settings modal for voice, rate, diagnostics, device test tone and engine reset.

## Quick start

```bash
git clone <this-repo-url> speak-buddy
cd speak-buddy
python3 -m http.server 8000
# or: npx serve
```

Open **http://localhost:8000** in Chrome or Edge.

- A local web server (or any HTTPS host) is recommended over opening `index.html` directly: microphone access and speech recognition require a **secure context** (`localhost` or HTTPS) plus microphone permission.
- **GitHub Pages:** there is no build step — just push the static files. The custom domain is set by [CNAME](CNAME): `speak-buddy.riemann-chow.cn`.

## Browser support

| Browser | Speech recognition | Pronunciation | Experience |
| --- | --- | --- | --- |
| Chrome / Edge | Full (`webkitSpeechRecognition`) | Local built-in voice, online MP3 as fallback | **Recommended** for real word-level scoring |
| Safari | Partial / unavailable | Built-in TTS when available, else online MP3 | Real scoring needs recognition; otherwise enable Experience mode |
| Firefox | Partial / unavailable | Online MP3 fallback | Real scoring needs recognition; otherwise enable Experience mode |

- **Microphone + secure context:** `getUserMedia` and speech recognition work only on `localhost` or HTTPS; grant the microphone permission when prompted.
- **Autoplay policy:** browsers require a user gesture before a page may speak. The click first unlocks audio synchronously; if the voice list is not ready yet, the utterance itself is issued on the next tick. Either way, pressing play produces audio without any in-app setting.
- Browsers without the built-in speech engine automatically fall back to online audio pronunciation. Browsers without speech recognition cannot produce a real score: silent / unrecognized takes show a 0-point result with a one-click **Experience mode** switch that enables clearly-labelled simulated scoring.

## How scoring works

1. **Transcript & alignment.** The recognized text is normalized (contractions, punctuation) and tokenized, then aligned to the reference with a Needleman–Wunsch-style dynamic-programming pass plus edit-distance word similarity. Each reference word is marked `correct`, `near`, `wrong` or `missing`; extra words are also detected.
2. **Three dimensions.**
   - *Accuracy* (52%): how well the words match.
   - *Fluency* (24%): speaking duration vs. an ideal pace, pause count, and volume.
   - *Completeness* (24%): how much of the sentence was covered (missing / extra words).
   - Weighted total → 0–100 → stars (≥88 = 3★, ≥72 = 2★, ≥55 = 1★) → XP and combo.
3. **Honest no-speech handling.** Silent or unrecognized recordings are **not** given a passing score. If no speech is recognized, the result shows **"没有听到你的声音，本次不计分"** ("no speech detected, no score this time") with **0 points**, no XP / stars / combo, and a **retry** button.
4. **Experience mode (体验模式, also called demo mode).** Toggle it on manually (or from the no-speech result) and scores become clearly-labelled **simulated** values (XP halved) so you can still walk through the full flow. It is never enabled automatically, so a silent attempt can never quietly receive a passing score. Real scores are never mixed with simulated ones.
5. **Dialogue scoring.** Intent match (62%) + delivery (38%, reusing the shadowing scorer) → total, stars and coach feedback.

## Pronunciation / TTS

- Pronunciation uses the browser's Web Speech `speechSynthesis`. A **local English voice is auto-selected and saved on load**, and a stalled playback is retried once with the browser's default voice at normal rate.
- A short silent clip is **played synchronously inside the click** to satisfy the autoplay policy; the utterance follows (on the next tick if the voice list is still loading), and a click on play always produces audio.
- If the built-in engine **fails to start (or the browser has none)**, the app automatically falls back to an **online MP3 pronunciation**: one continuous clip for the whole sentence, tried against Baidu Fanyi TTS, Google Translate TTS and Youdao `dictvoice` in that order. These are **third-party public endpoints, not part of this project or operated by it**, and they require network access; the app itself ships no audio files. Only the fixed sentence text is sent, never your recording. These endpoints apply hotlink protection — a cross-site `<audio>` request carrying a `Referer` gets an empty body, 404 or 500 — so `index.html` sets a document-wide `<meta name="referrer" content="no-referrer">`. Without it the online fallback silently fails in every browser.
- The **settings modal** (headphone icon, 发音设置) still lets you manually pick an English voice and rate, run **diagnostics** (engine support, voice counts, engine state, last attempt), play a **device test tone** (Web Audio, bypasses the speech engine), **reset the engine**, audition a sample sentence, and restore defaults. Clicking a word chip also speaks that single word.

## Data & privacy

All data is stored **only in your browser's `localStorage`** — no backend, no account, no server-side copy:

| Key | Contents |
| --- | --- |
| `speakbuddy.v1` | Progress: interests, placement, route, lessons, dialogues, XP, levels, combos, streak, daily tasks, achievements, settings |
| `speakbuddy.v1.mirror` | Redundant mirror used to auto-recover a corrupted / deleted main save |
| `speakbuddy.tts.v1` | TTS voice and rate preference |

Data is scoped to the **origin** (protocol + host + port). Clearing browser data, incognito windows, a different browser/device, or switching between `file://`, `http://localhost:8000` and a different port/domain gives you a separate, empty store. The **"My learning records" (我的学习记录)** modal lets you:

- view storage status and record counts;
- **export a JSON backup** file and **import** one (full daily details);
- **copy / paste a sync code** (`SB1:` + base64 of a compact backup) to migrate progress across addresses or devices without a file;
- **reset all learning data** (clears everything and returns to onboarding).

Restoring overwrites current records; keep a backup or sync code before switching address or clearing data.

## Project structure

| File | Role |
| --- | --- |
| [index.html](index.html) | App shell, boot markup, plain `<script>` / stylesheet tags with `?v=14` cache-busting |
| [css/styles.css](css/styles.css) | All styling: design tokens, layout, components, animations (plain CSS, no preprocessor) |
| [js/data.js](js/data.js) | Course content: 8 units / 24 lessons / 72 sentences, phoneme knowledge base, achievements, daily goal |
| [js/store.js](js/store.js) | `localStorage` store: XP/levels, combos, streak, daily tasks/chest, achievements, compact backup export/import, reset |
| [js/route.js](js/route.js) | Built-in interest topics + custom-topic mapping; builds the personalized 3-stage learning route |
| [js/speech.js](js/speech.js) | TTS (`speechSynthesis`) and ASR (`SpeechRecognition`) wrappers, voice ranking, settings, diagnostics, engine reset |
| [js/recorder.js](js/recorder.js) | `getUserMedia` + `MediaRecorder` capture, live waveform/levels, acoustic metrics, self-recording blob URL, simulated fallback |
| [js/scoring.js](js/scoring.js) | Word alignment, accuracy/fluency/completeness scoring, stars/XP/combo, simulated results, phoneme diagnosis |
| [js/assessment.js](js/assessment.js) | Placement test: 4 adaptive speaking items + 2 choice items, grading into levels 1/2/3 |
| [js/dialogue.js](js/dialogue.js) | 12 scenarios / 48 turns, intent matching + delivery evaluation |
| [js/app.js](js/app.js) | Main app: hash router, all views, onboarding, practice, dialogue, stats, achievements, modals, toggles |
| [js/fx.js](js/fx.js) | Synthesized sound effects, confetti, celebration popup, number count-up, device test tone |
| [CNAME](CNAME) | GitHub Pages custom domain: `speak-buddy.riemann-chow.cn` |
| [LICENSE](LICENSE) | Apache License 2.0 |
| [README.md](README.md) / [README.zh-CN.md](README.zh-CN.md) | This bilingual documentation set |

## Development notes

- **No build step.** Edit any file and reload; serve the folder with any static server.
- **Cache busting:** when you edit JS/CSS, bump the `?v=N` query strings on the `<link>` and `<script>` tags in [index.html](index.html) (currently `?v=14`) so browsers pick up the new files.
- **Code style:** ES5-style JavaScript; every module is an IIFE that attaches to a single global namespace, e.g. `window.SB.data`, `window.SB.store`, `window.SB.speech`, `window.SB.scoring`, `window.SB.dialogue`. Script load order in `index.html` matters (data → speech → recorder → scoring → assessment → dialogue → store → route → fx → app).
- **Routing:** hash router (`#/home`, `#/practice/<lessonId>`, `#/dialogue[/<scenarioId>]`, `#/stats`, `#/achievements`, `#/finish/<lessonId>`).
- **Deployment:** it is a fully static site; pushing to GitHub Pages (with the `CNAME` file) is enough.

## License

Licensed under the **Apache License 2.0** — see [LICENSE](LICENSE).

## FAQ

- **No sound after clicking play?** Click once more (a user gesture unlocks autoplay); if the app shows a 「点一下重播」/「点一下开启」/「听这一句并开启」 button, that single click is all that is needed — there is nothing to configure inside the app. Then open 发音设置 → "测设备音量" (device test tone) and "重置语音引擎" (engine reset). If the local engine cannot start, the app switches to online MP3 automatically; that fallback needs an internet connection. If both still fail, check the network: corporate proxies, offline use, and ad blockers (which may block `dict.youdao.com`, `fanyi.baidu.com`, `translate.google.com`) are the usual causes. Chrome/Edge → icon left of the address bar → **Site settings → Sound → Allow**, Safari → Settings → Websites → Auto-Play → **Allow All Auto-Play**, plus system volume/output device. There is no in-app switch to configure.
- **No score / "no speech detected"?** Check that the mic permission is granted, you are on `localhost`/HTTPS, and you are using Chrome or Edge; speak clearly and press **retry**. This 0-point result is intentional — silence is never given a passing score.
- **Microphone denied or no mic?** Pronunciation still works (local engine or online MP3), and **Experience mode (体验模式)** provides clearly-labelled simulated scores so you can still explore every screen.

---

SpeakBuddy is a static, dependency-free learning toy: recognition, scoring and storage happen locally in the browser. If the built-in speech engine fails, the sentence text is sent to a third-party TTS endpoint to play an online MP3; your recording and learning data never leave the device.
