# Peanut Progress Log Index

## Current Tech Stack
- Frontend: React (CRA)
- Styling: Custom Inline CSS / Flat Minimalist Design
- AI: Google Gemini v1beta (gemini-2.5-flash) (Food Macro Analysis)

## Summary
Peanut Progress is a personalized fitness and nutrition tracking dashboard for Ellie and Martin. It uses Gemini AI to reduce the friction of logging meals by analyzing text descriptions and photos.

## History

### [2026-03-14] Mobile UX/UI Hotfixes | [Technical Details](./PROJECT_log-detail.md#log-20260314-mobile-hotfixes)
- Resolved an iOS Safari React closure bug preventing the dictation API from cleanly passing the transcribed voice string inside `VoiceInput`.
- Appended a `.mobile-hide` layout strategy to the master `App` component to dynamically render only the active user's dashboard cleanly for small viewport devices.

### [2026-03-14] Timezone Desync Hotfix | [Technical Details](./PROJECT_log-detail.md#log-20260314-timezone-hotfix)
- Discovered a critical UTC rollover discrepancy where mobile devices in late timezones evaluated `todayKey()` as "tomorrow".
- Patched `App.js` date utilities to manually subtract `getTimezoneOffset()` before running `toISOString()`.
- Guaranteed that Ellie and Martin's devices always fetch identical document chunks from Cloud Firestore regardless of location.

### [2026-03-14] Minimalist Organic Logo | [Technical Details](./PROJECT_log-detail.md#log-20260314-organic-logo)
- Generated a custom hand-drawn conceptual mockup of a peanut to match the chic aesthetic.
- Mathematically coded the sketch into a clean, scalable SVG format.
- Bound the SVG directly beside the main application 'Peanut Progress' text.

### [2026-03-14] Chic Custom Cursors | [Technical Details](./PROJECT_log-detail.md#log-20260314-chic-cursors)
- Injected flat, inline SVGs entirely via global CSS to replace standard OS pointers.
- The default cursor is now a sleek black circle (`#1a1a1a`).
- Actions (buttons, toggles, links) now trigger a minimalist four-pointed sparkle (`#d4a398`) to adhere to the playful yet sophisticated design rules.

### [2026-03-14] One-Click Quick Dictate | [Technical Details](./PROJECT_log-detail.md#log-20260314-quick-dictate)
- Abstracted the `VoiceInput` transcription component to support a minimal dashboard pill variant.
- Hand-wired a new asynchronous handler to skip the manual modal and stream voice input directly to Gemini.
- Automatically saves new meal macros straight to Firebase.

### [2026-03-14] Firebase Cloud Firestore Sync | [Technical Details](./PROJECT_log-detail.md#log-20260314-firebase-sync)
- Migrated the ephemeral `window._ppData` cache to a fully responsive Google Firebase Cloud backend.
- Hooked `useStorage` up using `onSnapshot` listeners to instantly broadcast changes across devices.
- Allowed multiple users (Ellie and Martin) to share and review data across multiple devices simultaneously completely free.

### [2026-03-12] Web Speech Dictation | [Technical Details](./PROJECT_log-detail.md#log-20260312-voice-dictation)
- Implemented a native Web Speech API `VoiceInput` component for instant food transcription.
- Seamlessly styled the component to fit the chic aesthetic (no emojis, flat buttons, pulse animation).
- Tied dictation outputs directly to the existing Gemini food parser inside the `FoodModal`.

### [2026-03-12] UI Redesign (Minimalist Chic) | [Technical Details](./PROJECT_log-detail.md#log-20260312-chic-redesign)
- Scrapped the dark mode glassmorphic UI based on user feedback.
- Migrated entirely to a crisp, minimal Light Theme (Alabaster background, pure white cards, bare-minimum `#eaeaea` borders).
- Swapped nested serif typography elements to a unified `Inter` font for a high-end, professional branding.
- Scoured `App.js` to remove all emoji icons (🌸, 💧, 🏃, 🔵, etc.) to enhance the serious tone, replacing them with capitalized tracking labels.

### [2026-03-12] Debugging API Connection (Migrate to Gemini 2.5) | [Technical Details](./PROJECT_log-detail.md#log-20260312-gemini-2-5-migration)
- User upgraded API billing to Tier One.
- Discovered `gemini-2.0-flash` is restricted for newly-upgraded accounts.
- Successfully migrated and tested the application using the `gemini-2.5-flash` model.

### [2026-03-12] Debugging API Connection (Gemini 2.0 Migration) | [Technical Details](./PROJECT_log-detail.md#log-20260312-gemini-2-0-migration)
- Discovered why the API was still failing (404 errors): `gemini-1.5-flash` was deprecated and removed from the `v1beta` endpoint.
- Migrated codebase (`App.js`) to use `gemini-2.0-flash`.
- Identified that the current API key is hitting a hard `429 Too Many Requests` limit (quota exhausted), requiring the user to wait, change keys, or upgrade.

### [2026-03-11] Fix Gemini API Parsing Error | [Technical Details](./PROJECT_log-detail.md#log-20260311-gemini-parse-fix)
- Added robust error handling to `analyzeFood` in `App.js` to catch bad API structures and invalid API keys (such as `your_api_key_here`).
- Prevent UI crashes such as `Cannot read properties of undefined (reading '0')`.

### [2026-03-11] Fix Gemini API Key Connection | [Technical Details](./PROJECT_log-detail.md#log-20260311-gemini-api-fix)
- Created `.env` and `.env.example` templates for API keys.
- Enhanced `App.js` to visibly display missing API key errors to the user instead of generic failures.

### [2026-03-11] Codebase Exploration & Docs Initialization | [Technical Details](./PROJECT_log-detail.md#log-20260311-init-docs)
- Explored the AI-powered React application (`App.js`).
- Identified architecture limits (in-memory state persistence).
- Initialized Master Logging Protocol documentation.
