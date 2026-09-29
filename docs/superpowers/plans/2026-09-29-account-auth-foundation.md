# CRESUM Account/Auth Foundation Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional, offline-safe CRESUM authentication with in-app six-digit email OTP, recoverable sessions, and a truthful Profile account shell.

**Architecture:** A conditional Supabase adapter owns only auth/network/session storage; a small observable `AuthStore` owns presentation-safe auth state. The existing app owns that store independently of `WorkoutStore`, and Profile renders an Account section without gating local Core.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, `@supabase/supabase-js`, existing AsyncStorage, `react-native-url-polyfill`, Jest/react-test-renderer.

**Spec:** `docs/superpowers/specs/2026-09-29-account-auth-foundation-design.md`

## Global Constraints

- Start from clean `feature/account-auth-foundation` based on merged PR #18; preserve the spec commit and do not touch deferred Calibration PR #17.
- Keep CRESUM account-optional and offline-first. Auth loading/errors cannot gate onboarding, Workout, History, Progress, local templates, or local saves.
- Do not change `schemaVersion: 1`, `fitflow_state_v1`, Workout Engine/History semantics, or existing Reset local data behavior.
- Stage 1 has no workout sync, cloud schema/migrations, queue, tombstones, revisions, backup, multi-device merge, Delete Account, or active-workout backup.
- Email is `send OTP → enter exactly six digits → verify OTP → session`; no magic-link/deep-link callback. Supabase's external email template must include `{{ .Token }}`.
- Apple and Google are truthful disabled provider seams. No OAuth flow, native provider dependency, or client IDs in this PR.
- App configuration uses only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; neither tokens nor secret/service-role keys enter code, logs, UI, or commits.
- On React Native/non-web, the Supabase adapter alone owns one AppState listener per auth client: `active` starts auth auto-refresh, `inactive`/background stops it, and disposal removes the listener. No direct Supabase lifecycle calls in UI or `app/index.tsx`.
- Reuse existing Profile layout, `AppButton`, `GlassCard`, and design tokens. Keep ≥44×44 targets, accessible labels/states, and compact/Dynamic Type support.
- No official Core readiness change without an explicit existing metric; stop at one PR into `develop`, no merge.

## File map and interface contract

| File                                                                               | Responsibility                                                                                            |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `lib/auth-repository.ts`                                                           | Public identity and adapter contract; no workout imports.                                                 |
| `lib/supabase-auth.ts`                                                             | Optional config validation, official client creation, isolated auth storage, Supabase-to-adapter mapping. |
| `lib/auth-store.ts`                                                                | Stable observable auth snapshot, initialization, auth event handling, commands, and disposal.             |
| `components/AccountSection.tsx`                                                    | Profile-only account/OTP UI and local input state.                                                        |
| `components/ProfileSettings.tsx`                                                   | Insert Account & Sync section without changing Data/Workout actions.                                      |
| `app/index.tsx`                                                                    | Construct/initialize/subscribe to auth independently; pass account props to Profile.                      |
| `.env.example`                                                                     | Public values and `{{ .Token }}` setup note, no real credentials.                                         |
| `docs/PRODUCT.md`, `docs/DESIGN_SYSTEM.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md` | Only genuinely missing OTP/Stage 1 details and accurate implementation state after code passes.           |

Contract for Tasks 1-4: `AuthIdentity = { id: string; email: string | null }`; `AuthRepository = { getIdentity(): Promise<AuthIdentity | null>; onAuthChange(listener: (identity: AuthIdentity | null) => void): () => void; sendEmailOtp(email: string): Promise<void>; verifyEmailOtp(email: string, code: string): Promise<AuthIdentity>; signOut(): Promise<void>; dispose(): void }`. `AuthStore` receives `AuthRepository | null`; its stable snapshot is `{ status: 'initializing' | 'signed_out' | 'signed_in' | 'error'; configured: boolean; identity: AuthIdentity | null; error: string | null; busy: 'send' | 'verify' | 'sign_out' | null }`. Store exposes `getSnapshot(): AuthSnapshot`, `subscribe(listener: () => void): () => void`, `initialize(): Promise<void>`, `sendEmailOtp(email: string): Promise<void>`, `verifyEmailOtp(email: string, code: string): Promise<void>`, `signOut(): Promise<void>`, and `dispose(): void`. Exact internal private methods are implementation detail. `null` repository means unconfigured, not a Core startup failure.

## Review Focus

1. A malformed URL or a lone public config value must not instantiate a client or block local Core; Task 1 config tests pin this.
2. A delayed initial session read or auth event after sign-out/disposal must not resurrect a signed-in UI; Task 2 ordering tests pin this.
3. A successful OTP _send_ without a verified session must never show signed-in; Task 2 and Task 3 tests pin this.
4. Invalid/expired codes, resend rate limits, and offline errors must leave a recoverable code-entry path without affecting workouts; Task 3 tests pin this.
5. Sign Out and Reset local data must not cross-call or clear each other's storage; Task 4 integration tests pin this.
6. App background/foreground transitions and remount must not leave duplicate auto-refresh listeners; Task 1 and Task 4 lifecycle tests pin this.

---

### Task 1: Optional Supabase auth adapter and isolated persistence

**Files:** Create `lib/auth-repository.ts`, `lib/supabase-auth.ts`, `lib/__tests__/supabase-auth.test.ts`; modify `package.json`, `package-lock.json`, `.env.example`.

**Interfaces:** Consumes existing AsyncStorage only. Produces the `AuthIdentity`/`AuthRepository` contract above and `createSupabaseAuthRepository(config?: { url?: string; publishableKey?: string }): AuthRepository | null`. Export `AUTH_STORAGE_KEY = 'cresum_auth_v1'` for a collision test only; neither reset nor workout storage imports it.

- [ ] **Step 1: Write failing adapter tests.** `createSupabaseAuthRepository({})`, URL-only, key-only, and malformed URL return `null` without calling mocked `createClient`; valid public config creates one client with `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`, AsyncStorage, and `AUTH_STORAGE_KEY`; no workout/legacy key is used. Mock Supabase auth methods to assert `getSession` identity mapping, auth subscription/unsubscription, `signInWithOtp({ email })`, `verifyOtp({ email, token: code, type: 'email' })`, and `signOut`; Supabase errors reject without token-bearing messages or logging. Mock React Native `AppState`: non-web creates exactly one listener per adapter, `active` calls `startAutoRefresh()`, `inactive` and `background` call `stopAutoRefresh()`, and `dispose()` removes that listener. No-config adapter registers nothing. Repeated auth-store initialization does not add listeners; disposing/remounting does not leave stale listeners.

  Name cases `returnsNullWithoutCompletePublicConfig`, `usesIsolatedPersistentAuthStorage`, `mapsEmailOtpAndSessionEvents`, and `autoRefreshFollowsAppStateAndDisposes`. Pin representative assertions such as `expect(createSupabaseAuthRepository({ url: '', publishableKey: '' })).toBeNull()`, `expect(options.auth.storageKey).toBe(AUTH_STORAGE_KEY)`, `expect(auth.verifyOtp).toHaveBeenCalledWith({ email, token: '123456', type: 'email' })`, `expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1)` after `active`, `expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(2)` after `inactive` then `background`, and `expect(subscription.remove).toHaveBeenCalledTimes(1)` after `dispose()`.

- [ ] **Step 2: Run RED.** `npx jest lib/__tests__/supabase-auth.test.ts --runInBand`; expected failure because adapter exports do not exist (or package missing).
- [ ] **Step 3: Install only needed packages.** `npx expo install @supabase/supabase-js react-native-url-polyfill --npm`; retain existing AsyncStorage; inspect `git diff -- package.json package-lock.json` for unrelated direct upgrades. Add the repository factory and mapping with URL polyfill import. The adapter owns one non-web `AppState.addEventListener('change', ...)` for its client, forwards active/background changes to Supabase auth auto-refresh, and removes the subscription exactly once in `dispose()`; keep direct Supabase lifecycle calls out of UI/app code. Keep optional config access non-throwing. Add `.env.example` public names and the required OTP template note; do not add values.
- [ ] **Step 4: Run GREEN.** Same focused Jest command; expected all adapter tests pass. Run `npm run typecheck` and `npm run deps:check`; expected exit 0. If the package manager changes another direct dependency, investigate and narrow before proceeding.
- [ ] **Step 5: Commit.** Stage only Task 1 files and commit `Add optional Supabase auth adapter`.

### Task 2: Observable auth lifecycle and command state

**Files:** Create `lib/auth-store.ts`, `lib/__tests__/auth-store.test.ts`.

**Interfaces:** Consumes `AuthRepository | null` from Task 1. Produces `AuthStore`/`AuthSnapshot` contract above for Task 3 and Task 4. Errors presented to UI are safe user-facing messages; the repository's raw session/token stays private.

- [ ] **Step 1: Write failing store tests with a deferred fake repository.** Assert unconfigured initialization becomes `signed_out`/`configured: false`; a configured store starts `initializing`, restores identity, reacts to sign-in/sign-out events, and unsubscribes on disposal. Assert rejected initial read becomes an `error` snapshot without throwing into app startup; retrying `initialize` can recover. Assert successful send leaves the store `signed_out`; verify changes to `signed_in` only with an identity. Assert invalid/expired verify, resend/network failure, and sign-out failure expose safe errors without claiming success; successful sign-out yields `signed_out` without touching any Core repository. Assert a delayed initial read/event after a newer auth event, sign-out, or `dispose` cannot republish stale identity; duplicate busy commands do not create overlapping requests.

  Name cases `keepsUnconfiguredCoreUsable`, `sendDoesNotSignIn`, `ignoresStaleSessionAfterSignOut`, and `disposesAuthSubscription`. Pin `expect(store.getSnapshot().status).toBe('signed_out')` after send, `expect(store.getSnapshot().identity).toBeNull()` after a stale resolution, and `expect(unsubscribe).toHaveBeenCalledTimes(1)` after dispose.

- [ ] **Step 2: Run RED.** `npx jest lib/__tests__/auth-store.test.ts --runInBand`; expected failure because `AuthStore` is absent.
- [ ] **Step 3: Implement `AuthStore` to the exact contract.** Match `WorkoutStore`'s stable `getSnapshot`/`subscribe` pattern; publish immutable snapshots, guard operation overlap, dispose the auth-event listener and call `repository.dispose()` once, and use a generation/revision guard for stale async completions. Do not import workout modules or mutate AsyncStorage directly.
- [ ] **Step 4: Run GREEN.** Focused Jest and `npm run typecheck`; expected exit 0 and every lifecycle case passes.
- [ ] **Step 5: Commit.** Stage only Task 2 files and commit `Add independent auth session store`.

### Task 3: Truthful Account & Sync Profile UI with in-app OTP

**Files:** Create `components/AccountSection.tsx`, `lib/__tests__/account-section.test.tsx`; modify `components/ProfileSettings.tsx`, `lib/__tests__/profile-settings-screen.test.tsx`.

**Interfaces:** Consumes `AuthSnapshot` and `AuthStore` command functions from Task 2 via `AccountSectionProps = { snapshot: AuthSnapshot; sendEmailOtp(email: string): Promise<void>; verifyEmailOtp(email: string, code: string): Promise<void>; signOut(): Promise<void> }`. Add optional `account?: AccountSectionProps` to `ProfileSettingsProps` so existing direct component tests remain usable; `app/index.tsx` supplies it in Task 4.

- [ ] **Step 1: Write failing component tests.** Signed out: show optional account/offline copy, Email action, and disabled Apple/Google with readiness explanations. Unconfigured: Email cannot submit and no fake success. Entering valid email and pressing Send shows busy then code-entry success text, not signed-in; invalid email does not call send. Code field accepts only six digits before Verify is enabled; invalid/expired verification and offline failure leave code-entry/resend reachable, without displaying token. Resend calls send for the same email and shows loading/error. A signed-in snapshot shows identity and `Cloud backup not enabled yet`, never `Synced`, plus Sign Out; failed sign-out remains truthful. Check accessible button labels/states, 44×44 minimum targets, and compact/scrollable composition. Update the existing Profile test's old `not.toContain('Sign in')` assertion to the new truthful Account shell and preserve its other Workout/Data/About assertions.

  Name cases `signedOutAccountIsOptional`, `otpSendIsNotAuthentication`, `invalidCodeKeepsResend`, `signedInNeverClaimsSync`, and `providersAreDisabled`. Pin `expect(sendEmailOtp).not.toHaveBeenCalled()` for invalid email, `expect(verifyEmailOtp).toHaveBeenCalledWith(email, '123456')` only for six digits, and `expect(renderedText).not.toContain('Synced')`. Pass a signed-out `account` prop into the direct `ProfileSettings` test so its updated assertion actually exercises the new section.

- [ ] **Step 2: Run RED.** `npx jest lib/__tests__/account-section.test.tsx lib/__tests__/profile-settings-screen.test.tsx --runInBand`; expected new Account tests fail before UI exists.
- [ ] **Step 3: Implement UI.** Use existing tokens, `GlassCard`, `AppButton`, `TextInput`, and Profile's `ScrollView`; keep OTP email/code in component memory and clear code on sign-in/unmount or email change. `accessibilityRole`/labels and busy/disabled states must be truthful. No deep-link handler or OAuth calls. Insert Account & Sync separately from Data and preserve Reset local data confirmation.
- [ ] **Step 4: Run GREEN.** Same focused Jest and `npm run typecheck`; expected exit 0.
- [ ] **Step 5: Commit.** Stage only Task 3 files and commit `Add truthful Account and OTP Profile UI`.

### Task 4: Independent app wiring, Core regressions, and decision sync

**Files:** Modify `app/index.tsx`, `lib/__tests__/profile-settings-screen.test.tsx`, `lib/__tests__/local-data-reset-screen.test.tsx`, `docs/PRODUCT.md`, `docs/DESIGN_SYSTEM.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md` only where needed.

**Interfaces:** Consumes `createSupabaseAuthRepository`, `AuthStore`, and `AccountSectionProps`. Produces one auth store per app instance, initialized in a separate effect and subscribed through `useSyncExternalStore`; passes snapshot/commands to `ProfileSettings`. No auth state enters the existing `ready/onboardingReady/hiddenReady` gate or `resetLocalData` call.

- [ ] **Step 1: Write failing integration tests.** With absent config, App finishes local load, Profile explains account unavailability, and Home/Workout/History remain usable. With fake restored session, Profile shows identity and no sync claim after mount/relaunch; auth initialization remains independent of workout ready. With a fake auth error, local Workout/History still load. Successful Sign Out changes only auth UI and leaves `fitflow_state_v1`, active workout, and History raw values unchanged; Reset local data still removes only its previously approved keys and returns to Welcome, without calling Sign Out or deleting `cresum_auth_v1`. Remount/unmount the app with a fake auth repository and assert disposal leaves no duplicate/stale auth/AppState subscription; active/inactive transitions do not affect `WorkoutStore` readiness or local history. Keep the existing Guided Builder/onboarding/reset regressions intact.

  Name cases `unconfiguredAuthDoesNotGateHome`, `authFailureDoesNotGateHistory`, `signOutPreservesWorkoutState`, and `resetDoesNotSignOut`. Mock `createSupabaseAuthRepository` at the module boundary in these integration tests; pin `expect(await AsyncStorage.getItem(STATE_KEY)).toBe(savedWorkoutState)` after Sign Out and `expect(signOut).not.toHaveBeenCalled()` after Reset.

- [ ] **Step 2: Run RED.** `npx jest lib/__tests__/profile-settings-screen.test.tsx lib/__tests__/local-data-reset-screen.test.tsx --runInBand`; expected new integration assertions fail before app wiring.
- [ ] **Step 3: Wire app.** Construct the optional repository and `AuthStore` lazily alongside `WorkoutStore`. Pass `{ url: process.env.EXPO_PUBLIC_SUPABASE_URL, publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY }` explicitly so Expo can statically inline the public values. Initialize/dispose in its own effect, keep auth snapshot out of Core loading predicates, pass only account props to Profile. Avoid changes to existing reset implementation. Add only the newly approved six-digit OTP/template behavior and truthful Stage 1 status to owning docs; do not duplicate the full architecture or change readiness.
- [ ] **Step 4: Run GREEN.** Focused Jest, `npm run typecheck`, and `npx prettier --check` on touched docs/UI files; expected exit 0. Inspect `git diff origin/develop --name-only` for Calibration or unrelated files.
- [ ] **Step 5: Commit.** Stage only Task 4 files and commit `Wire optional auth into Profile and document Stage 1`.

### Task 5: Whole-branch validation and focused review

**Files:** No planned product edits; only in-scope fixes if validation/review finds a Critical or Important defect.

**Interfaces:** Consumes all earlier tasks; produces a verified branch ready for one PR into `develop`.

- [ ] **Step 1: Run exact validation.** `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run config:check`, `npm run deps:check`, `npm run export:check`, `npx expo-doctor`, and `git diff origin/develop...HEAD --check`; also `npm run check` as the repository CI-equivalent. Expected every command exits 0; record test/suite count and iOS/Android export result.
- [ ] **Step 2: Focused review.** Inspect `git diff origin/develop...HEAD` against the spec and Review Focus: no auth gate on Core, credentials/token leakage, incorrect session persistence, false sync or provider success, sign-out/reset crossover, email dead ends, navigation regressions, or Calibration files. Add failing tests before any Critical/Important fix, then rerun focused and full checks. Record Minor issues separately.
- [ ] **Step 3: Commit any in-scope review fixes, then verify clean tree.** No unrelated changes; exact feature commits remain on `feature/account-auth-foundation`.
- [ ] **Step 4: Push and open one PR targeting `develop` if GitHub tooling permits; otherwise return the compare URL if PR creation returns 403.** Never merge or enable auto-merge. Report manual setup and physical iPhone scenarios (configured OTP send/verify/resend, session relaunch, offline Core, Sign Out retains data), and clearly mark Apple/Google as seams and cloud workout sync as absent.
