# Peanut Progress Log Index

## Current Tech Stack
- Frontend: React (CRA)
- Styling: Custom Inline CSS / Glassmorphism
- AI: Google Gemini v1beta (gemini-2.5-flash) (Food Macro Analysis)

## Summary
Peanut Progress is a personalized fitness and nutrition tracking dashboard for Ellie and Martin. It uses Gemini AI to reduce the friction of logging meals by analyzing text descriptions and photos.

## History

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
