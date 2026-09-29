# CRESUM Account/Auth Foundation — Stage 1 Design

Status: approved conversational design, pending written-spec review. Base: `develop` after PR #18. This document narrows the approved Account & Cloud Sync v1 architecture to its first implementation stage; `docs/PRODUCT.md`, `docs/DESIGN_SYSTEM.md`, and `docs/ROADMAP.md` remain the product sources of truth.

## Outcome and boundaries

A person can keep using onboarding, Workout, History, Progress, and local templates without an account or network. Profile offers an optional CRESUM Account. With a configured Supabase project, the person can request a six-digit email OTP, enter and verify it in the app, recover the resulting session after relaunch, and sign out. Account connection never implies workout backup. Apple and Google appear as truthful unavailable entry seams until their native/provider configuration is separately completed.

This stage does not add workout cloud sync, database tables or migrations, a sync queue, tombstones, revisions, multi-device merge, History backup, active-workout backup, custom-workout sync, Delete Account, or Calibration PR #17. It does not change `schemaVersion: 1`, `fitflow_state_v1`, the Workout Engine, or existing Reset local data behavior.

## Alternatives considered

1. **Chosen — small auth store plus Supabase adapter.** A Profile-facing store owns session state and commands; a single adapter owns Supabase calls and persistence. This keeps auth independent of local Core and mockable in tests.
2. Direct calls from Profile to a Supabase singleton would use fewer files but couple presentation, lifecycle, and error handling; it would make offline/Core isolation harder to prove.
3. A general account-and-sync framework would anticipate later stages but add unimplemented state and misleading UI now.

## Components and data flow

- An optional client factory reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. It creates the official `@supabase/supabase-js` client only when both public values are present and valid. No service-role key or production credentials are committed. Missing or malformed configuration yields a usable local app with an explicit account-unavailable state, not a startup crash.
- The client uses React Native-compatible session storage and an auth-specific storage key, separate from workout, onboarding, hidden-built-in, and future sync keys. Session persistence and token refresh follow Supabase's React Native guidance. Tokens are never logged, shown in UI, or written to workout storage.
- A narrow auth adapter exposes session read, auth-event subscription, `sendEmailOtp(email)`, `verifyEmailOtp(email, code)`, and `signOut()`. An auth store turns these into stable `initializing`, `signed_out`, `signed_in`, and recoverable `error` presentation states, with basic user identity. Authentication state has no `synced` value. Initialization or network failure cannot hold the app-wide workout loading state or block local navigation.
- The root app owns one auth store alongside, but independent of, `WorkoutStore`. Only the Profile account section consumes its state and commands. Existing workout persistence and local reset do not call the auth store. The signed-in section says the account is connected and cloud workout backup is not enabled yet.

## Email OTP interaction

The signed-out section shows the optional/offline message and an Email entry. A valid email triggers Supabase `signInWithOtp`; success at this step means only “code sent,” never “signed in.” The person enters exactly six digits and submits `verifyOtp` with email type. Only a verified Supabase session changes the app to signed-in. The same email may request another code; resend reports its own loading, success, rate-limit, or network error. Invalid or expired code remains on the entry step with a clear error and a resend path. Offline/network errors never affect local workouts. Inputs and buttons have accessible labels, disabled/loading states, and practical touch targets.

Stage 1 uses no magic-link or deep-link callback. The Supabase email template must send `{{ .Token }}` as a six-digit OTP; the default magic-link template is insufficient. Environment documentation will state this external setup requirement. Manual end-to-end testing requires a configured Supabase project, public app values, email provider/template, and a reachable network. Automated tests use fakes and require no credentials.

Apple and Google remain visible but disabled with explanatory readiness text; they never show success, launch a partial OAuth flow, or create a session. Their future adapter boundary may be named, but no native provider dependency or client ID is added in Stage 1.

## Sign-out, reset, and errors

Sign Out changes the auth session only. It does not call `Reset local data`, clear workout/history keys, remove an account, or claim cloud data was deleted. Failure is shown as an auth error rather than a false signed-out success. Existing Reset local data continues to remove the approved local Core keys and return to Welcome; this PR does not silently extend it to auth storage. Whether a future reset should also sign out or whether subsequent sync should restore local data is a separate product decision before sync is enabled.

The account section handles initial loading, unconfigured state, signed out, OTP sending/code entry, invalid/expired code, resend, network failure, signed in, and sign-out failure. Errors stay local to account UI unless they prevent session recovery; they never masquerade as workout save errors. Avoid retaining OTP code beyond the entry interaction.

## Profile UI and documentation

Place Account & Sync in existing Profile, separate from Data and Workout settings. Reuse `AppButton`, `GlassCard`, theme typography/colors/spacing, and the existing bounded scrolling layout. No new visual language or fake sync status. Update only source-of-truth text needed to record the approved six-digit in-app OTP and Stage 1's actual shipped status; do not rewrite the Account & Cloud Sync v1 architecture or change official Core readiness without an explicit model-based reason.

## Verification and review

Use test-driven additions for optional configuration, auth initialization/event changes, persistence abstraction, Email send/verify/resend/error, truthful Apple/Google seams, Profile signed-out/signed-in/accessibility, sign-out preserving local workouts/history, and Core usability without credentials or under auth failure. Mock the adapter; no test contacts Supabase. Run the full repository tests, TypeScript, ESLint, Prettier, Expo config/dependency checks, Expo Doctor, iOS/Android JS export, and `git diff --check`. Review specifically for secret leakage, token logging, auth/Core coupling, fake sync success, reset/sign-out confusion, false provider success, and Calibration/PR #17 scope changes. Physical iPhone validation covers OTP and session relaunch with a real test project plus offline Core behavior.
