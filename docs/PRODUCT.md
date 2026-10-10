# CRESUM — Product Definition

## Product

CRESUM is a mobile gym workout tracker for quickly recording training and understanding progress.

Core loop:
Start workout → choose exercise → log weight/reps → complete set → rest → continue → finish → History → Progress.

## Core user value

CRESUM should answer:

1. What am I doing today?
2. What did I do previously, and what should I log now?
3. Am I progressing over time?

## Target user

Recreational gym-goers and strength-training users who track sets, reps, weight, rest and progress.

## Principles

- Minimal friction for logging sets.
- Active workout usability beats decorative UI.
- Show previous performance when useful.
- Workout state must be resilient.
- Analytics should be understandable.
- Offline/local functionality is fundamental; cloud sync complements it.
- One obvious primary action per context.
- Premium visuals must not reduce usability.

## Architecture direction

CRESUM is modular, replaceable, and feature-driven across the app, not only on Home. Product areas should be independently evolvable where that improves safety and delivery, while stable domain rules stay separate from screen placement and experimental presentation. This is a boundary for future work, not permission for a broad rewrite or premature abstraction.

Feature flags control experiments, staged rollout, and operational enablement. Capabilities/entitlements control whether a user may access a product capability. They are different concerns and must not be used interchangeably.

## Navigation

Home · Workout · Progress · Profile

## Core v1

### Onboarding

On first launch without meaningful existing workout data, Welcome offers two distinct paths: **Personalize my training** (CRESUM will help me get started) and **Set up workouts myself** (skip personalization for now). The latter goes directly to the existing Guided Workout Builder and completes only after a custom workout is durably created. Cancel/Back do not complete onboarding. Built-in templates alone do not identify an existing user; an active workout, completed history, or a custom workout does. Existing users are never gated by the new flow.

Personalization is short and resumable: Goal (build muscle / get stronger / general fitness) → Experience (beginner / some experience / experienced) → Environment (gym / home / both) → optional age, height, and body weight → truthful completion → Home. Answers survive Back and app restart. Skipping personalization is reversible; Profile can reopen it later. The app learns progressively from performed workouts rather than demanding detailed training history, 1RM, target reps, working weights, or a favorite split up front.

Onboarding has its own versioned local state. It must not alter `fitflow_state_v1`, schema version 1, active workouts, historical snapshots, or the Workout Engine. Corrupt onboarding data cannot corrupt or block access to saved workouts/history. Demographic/body data do not determine an exact working weight. Calibration, baseline generation, and recommendations remain future work.

### Home

An existing workout-template entry and useful recent stats. Starting/resuming a workout is dominant; the template is not labeled as a recommendation.

Home's selected dashboard presentation shows workout count and training volume
over a rolling local-calendar window from the same local time 28 days ago
through now, both boundaries inclusive (not a calendar-month window). A Monday–Sunday
week shows actual completed sessions only, counts multiple workouts on a day,
and distinguishes today without implying a schedule or missed training. Exclude
unfinished, invalid and future-dated sessions from these recent projections and
the latest-workout card. The complete History remains available. Template
planned-set metadata is not performed work or a duration estimate. Do not seed
demo data or a fake user identity in production.

Dashboard content is composed of independent modules with stable identities. The
module's position must not own workout or analytics logic. The current Home
keeps its primary workout action, factual training summary, latest workout,
and workout templates; header and navigation remain structural. Future
reordering, visibility, supported-size selection, and saved layouts are not
part of the current Core implementation.

### Workout Engine

Start/resume; exercises; sets; weight; reps; previous context; completion; rest timer; editing where supported; exercise progression; Finish; persistence.

The active screen shows the current exercise rather than the whole program by
default. **All exercises** reveals the ordered program for selection; choosing
an exercise collapses it without changing entered or completed sets or the rest
deadline. Automatic progression and new sessions also use the focused view.
This is transient UI state; keep the existing Workout Engine, finish validation,
confirmation, offline persistence and recovery unchanged.

Weight entry should evolve into an adaptive system with Recommended, Keypad, and Wheel Picker modes while always preserving exact manual control. Quick weight adjustments should support equipment-aware increments rather than one universal increment; exact manual entry always overrides them. A complete increment table is not defined yet.

Future working-weight recommendations must primarily use history for the specific exercise. With insufficient exercise-specific history, CRESUM should show an honest unavailable/insufficient-history state instead of fabricating a confident load. Recommendations remain customizable and overrideable.

### Exercise Library

Find/select exercises and retain data required by workouts/history.

The current 58-record catalog and its stable exercise IDs remain the compatibility baseline. The approved model groups exercises into stable families and mechanically meaningful variants, so equipment, attachments, grip, support, laterality, technique, muscle mapping, and artwork can later describe an exact movement rather than only a broad name. Additive family/variant types and a partial catalog adapter exist; the flat catalog still serves Core. Production assets do not exist. See `EXERCISE_LIBRARY.md` for identity and compatibility rules and `EXERCISE_ASSETS.md` for production rules.

Existing saved workouts and History keep their original meaning. Specific existing IDs may become variants without changing stored identity; overly generic old IDs must not be retroactively assigned a particular grip, machine, attachment, or position. New exact variants receive new stable IDs. Progress must not silently combine materially different variants into one performance series. The current schema-v1 snapshots are not rewritten for catalog refinement.

Future artwork has two distinct user-facing modes for the same exact variant: Exercise/Technique View for setup and movement, and Anatomy/Muscle View for approved Primary/Secondary muscle communication. START and FINISH remain separate, consistent phases. This documentation sync does not implement assets, Visual Specification, Prompt Builder, generation, or tracking.

### Workout Templates

Create/edit/select reusable routines. User-facing creation is a guided Workout Builder: enter a Workout Name, choose one exercise from Exercise Library, configure planned sets and optional starting weight, then review the ordered composition, add more exercises, and Save Workout. Back preserves the local draft; only Save writes it. Planned values are editable starting points, never completed work.

In the manageable workout list, tapping a row starts that workout (or resumes the already-active session). A left swipe reveals concise quick actions; a long press opens all actions, with an accessible non-gesture alternative. Custom workouts can be edited (including renaming), duplicated, or deleted after confirmation. Built-in definitions cannot be edited, renamed, or deleted: users can duplicate one into an independent custom workout or hide it from My Workouts. Hidden built-ins can be restored from Profile. Hiding or deleting a template never removes or rewrites active/completed workout snapshots. Do not assign a swipe-right action without a separately approved use.

A future first-workout calibration may collect actual exercise-specific work and simple perceived difficulty to establish a baseline for later adaptive progression. Proposed sets/load must rely primarily on actual exercise history, be explainable and manually overrideable, and never replace actual performed values in History. Body measurements alone do not provide a precise working weight. This direction does not add calibration or recommendations to the current builder.

### History

List and inspect completed workouts accurately.

### Progress

Prioritize total volume, workout frequency, PRs, weight/repetition progression, estimated 1RM (clearly labeled estimate), and muscle distribution when supported.

Future Training Insights follow the hierarchy Result → Analysis → Suggestion. Interpretations must be cautious, actionable only when justified, and able to explain the principal signals through a “Why?” affordance without fake precision or invented scientific certainty.

A future Suggested Next Workout flow may use recent training history, estimated muscle load, goals, available equipment, and legitimate recovery information. Muscle load is one signal, not ground truth; the system must not simply choose the least-loaded muscle. The user can customize a suggestion before starting and the system can adapt from subsequent workouts.

### Local/offline

Core workout logging remains useful without network.

### Account + Sync

CRESUM is account-optional and offline-first. Onboarding, workout creation and logging, History, and Progress work without an account or network. Local workout persistence remains the critical path; cloud backup and multi-device sync complement it. A successful local save remains successful when sync fails: **sync failure is not workout failure**. The Workout Engine must not depend on Supabase availability or its table structure.

The optional CRESUM Account offers **Continue with Apple**, **Continue with Google**, and **Continue with Email**; email should favor passwordless OTP/magic-link UX over a primary password flow. Signing in and being fully synced are distinct states. A sync problem does not sign the user out or make local training data unavailable.

On first sign-in, **merge, do not replace**: preserve valid local training data, pull existing cloud data, and combine distinct entities without asking ordinary users to choose “Local or Cloud.” Stable IDs assigned before sync prevent duplicate copies of offline-created entities. Existing cloud data must never blindly overwrite local history. Later sync preserves separate completed workouts from separate devices; it does not apply destructive whole-workout last-write-wins. The active workout stays device-local in Sync v1, without a promise of live cross-device continuation.

Cloud direction is Supabase/Postgres with normalized user-owned entities rather than a cloud copy of the whole `fitflow_state_v1` document. Conceptual entities include the Auth user, profile, completed workouts and their exercise/set snapshots, custom workouts and their exercise configuration, preferences, and device/sync metadata. Authenticated users may access only their own cloud records, enforced by Row Level Security; database changes require versioned migrations, not undocumented Dashboard-only edits. Progress normally derives from factual History instead of becoming a separately synced source of truth. The canonical Exercise Library and equipment taxonomy are product data, not per-user cloud records; synced history may retain stable exercise/variant IDs and required historical snapshots without rewriting past meaning when the catalog changes. A Sync Adapter/Mapper separates existing Core/local models from cloud entities. This direction does not rewrite local schema v1 or define SQL tables yet.

Synced entities need stable IDs generated before upload. Mutable records need explicit revision/version information; `updated_at` alone is not sufficient conflict protection. Deletions need tombstones or `deleted_at` semantics so a previously offline device cannot resurrect a deleted entity; tombstone retention policy remains to be designed. Conflict handling is entity-specific: preserve completed history; keep active workouts local; detect concurrent custom-workout edits by revision rather than silently overwriting them; controlled last-write-wins may suit low-risk preferences; profile/body updates may be versioned, while future body-weight measurements belong in separate factual records. Exact custom-workout conflict UX is deferred.

Sync v1 uses a durable local queue of **entity intent** (type, ID, operation/state, pending status, and local/base revision where needed), not raw HTTP requests as the product abstraction. After a successful local write, mark the entity pending; pull remote changes, merge safely, push pending local changes, then acknowledge cloud state/cursors. Read/map the current entity before upload as appropriate. Stable IDs and idempotent upserts must make a server-success/client-timeout retry safe. Sync may run after sign-in, app launch/foreground, network restoration, Finish Workout, custom-workout or important preference changes, and manual **Sync Now**; do not upload every in-progress set edit or require realtime/WebSocket sync in v1. Temporary offline/timeouts/server/rate-limit failures remain pending for safe retry; auth errors, revision conflicts, and invalid payloads require distinct handling rather than blind infinite retry.

Profile will have an **Account & Sync** section. Signed out: explain optional sign-in, backup/cross-device value, and offline availability. Signed in: show identity where appropriate, simple status (**Synced**, **Syncing…**, **Sync pending**, **Couldn’t sync**, **Offline**), **Sync Now**, and **Sign Out**. Normal sync should be mostly invisible; show Home-level messaging only for meaningful pending/problem states, with reassurance that data is safe on this device. Do not expose mutation counts or transport details to ordinary users.

**Sign Out**, **Reset local data**, and future **Delete Account** remain separate operations. Sign Out changes authentication, not account existence. Reset deletes device-local data; its exact restore-from-cloud behavior after reset requires later implementation design and does not silently change the current reset flow. Delete Account is a separate confirmed destructive cloud-account/data flow governed by product/privacy policy.

### Settings/Profile

Essential account/app preferences only.

Profile → Data offers **Reset local data**, a confirmed destructive action that removes all local CRESUM workouts, history, templates, active workout, personalization, and onboarding data from this device, then returns to Welcome. Cancel leaves data unchanged. A failed reset must not claim success; attempt recovery of removed local values and retain the current in-memory session. This is separate from a future cloud **Delete Account** action.

Profile → Workout settings lists hidden built-in workouts with a Restore action. Reset local data also clears this device's hidden-workout preferences, restoring the standard built-in catalog on first run.

### Future access, monetization, and rewards

Plans and billing are commercial concerns; capabilities/entitlements are the app's access contract. Subscriptions, promotions, referral rewards, and administrative grants may produce entitlements, but paid and granted access must remain distinguishable. Do not introduce a primitive global `user.isPro` rule or treat a Feature Flag as proof of entitlement.

Future paid value should be additive. Core workout logging, access to existing History, and export of the user's own data must not be held hostage to a subscription. Exact Free/paid bundles, prices, limits, trials, Lifetime offers, and founding cohorts remain unapproved.

A referral reward is earned only after a confirmed paid conversion, not registration, and must account for refunds or reversals. Referrer and referred user are separate participants. Exact eligibility windows, amounts, duration, and limits remain future decisions.

Achievements, Badges, and Challenges recognize training behavior; commercial Rewards grant or affect value. Keep those concepts separate even if a future experience connects them. Legacy badges may remain compatible. Gamification should reinforce genuine consistency and useful milestones without attention-heavy pressure, fabricated progress, or replacing factual History. The catalog, XP model, thresholds, streak rules, and rewards are deferred.

## Not Core now

AI Coach, social/community, nutrition, Apple Watch/Wear OS, Oracle marketing infrastructure, and advanced gamification unless explicitly reprioritized.

## Design

Canonical rules: `docs/DESIGN_SYSTEM.md`.
CRESUM is light, premium, calm, Apple-inspired rather than copied, restrained with glass effects, and optimized for readable workout numbers and practical controls.

## Core success

A user can start a workout, log sets, use rest timer, finish without data loss, find it in History after reopening, and see meaningful progress from saved data.
