# CRESUM — Product Definition

The app display name is CRESUM; package/Expo slug use `cresum`. Existing local
data keys and installed application IDs remain stable across rebranding.
See [rebranding compatibility](./REBRANDING.md).

## Product

### Discard active workout — approved 2026-10-15

Active Workout offers an explicit Discard workout action, including before any
set is completed. Always confirm deletion of that session and its entered sets;
Keep training or dismissal makes no changes. Discard is separate from Finish
and never creates a History entry or marks a planned session complete. Preserve
existing History, routines and program assignments. Match the confirmation's
session ID, serialize behind pending writes, and navigate Home only after the
discard is durably saved. On failure retain the active session, show an error,
and allow retry. Prevent overlapping mutations while saving.

### Workout completion time safety — approved 2026-10-14

Finish must reject an invalid device timestamp or a finish time earlier than
the workout start before writing completed History. Keep the active workout,
logged sets and existing History; show an actionable device-time error in the
existing Finish confirmation and allow retry after the time is corrected.
Do not invent corrected timestamps or weaken saved-data validation. This
prevents new invalid completions; recovery of previously invalid documents is
a separate follow-up.

### Exercise statistics — approved 2026-10-14

Library cards provide separate Technique and Statistics actions; the exercise
detail sheet has both tabs. Saved completed sets are grouped by exact canonical
exercise/variant ID, including existing legacy aliases, never by label or shared
equipment. Periods: 1W, rolling 30-day 1M, 3M, 6M, 1Y, ALL. Metrics: estimated
1RM (best Epley estimate per workout), volume (sum of kg × reps, both sides
when recorded), top weight (maximum logged kg per workout). Weekly bars and
longer curves retain actual dates. Volume headline is the period sum; 1RM and
top weight headlines are period maxima. Compare to the immediately preceding
nonoverlapping period; missing data is explicit and ALL has no comparison.
Tap a point to inspect only that workout's completed sets for this exercise.
Repeated exercise snapshots in one workout contribute to one point. Counts
include valid completed samples only. Paired-side sets have no 1RM estimate;
zero-load sets do not imply a bodyweight 1RM. These eligibility rules apply equally to Progress records, logged performance and Library statistics. Equal estimates use later completion, then the stable encoded workout/exercise/set source key and saved indices; source weight/reps must agree between screens. TOP PR marks the largest eligible estimated record in the selected period, not a measured or newly achieved lifetime maximum. Empty/one-point states are honest.
Preserve History, schema and offline behavior; no fabricated production data.

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

On first launch without meaningful existing workout data, collect a trimmed display name in **Welcome to CRESUM → What should we call you?** before continuing. Next show optional **Body details** (calendar date of birth, height and starting body weight), then Goal → Experience → reviewed program → **START! → Home**. Gym is implicit. The Goal step also offers **Set up workouts myself** using the existing Guided Workout Builder. Cancel/Back do not complete onboarding. An active workout, completed history or custom workout identifies a legacy user; built-in templates alone do not. Existing users are not gated and can enter the new fields through Profile personalization. Stored names produce **Welcome back, {name}!** on Home; absent legacy names use a truthful generic greeting.

Save date of birth as a validated calendar date, not an age or UTC timestamp. Retain legacy age for compatible reads and adult-program eligibility; never infer a birthday from age. Birthday greetings are future work. Back/restart retain drafts. Body details remain optional and do not determine a working weight.

Onboarding has its own versioned local state. Corrupt onboarding data cannot corrupt or block access to saved workouts/history. Keep compatible reads of stored Home/Both answers and old environment-step progress; skip that obsolete step without losing other answers. Demographic/body data do not determine an exact working weight. Calibration and adaptive weight recommendations remain future work. The approved starter-program scope below supersedes the earlier deferral only for authored goal-based programs, not those adaptive features.

### Goal-based starter programs — implementation prepared, pending Git integration

The [approved program specification](superpowers/specs/2026-10-11-goal-training-programs-design.md)
defines nine Gym variants: three goals × three experience levels. It retains
the complete exercise prescriptions, weekly schedules and progression guidance.
This is an editable first baseline, adapted from ACSM, NSCA, ACE, HSS and NHS
materials; those organizations did not validate the resulting CRESUM programs.
The week is a repeatable training cycle, not a promise of results in seven days.

Use a versioned authored catalog, not free-form AI generation. Keep source
facts, CRESUM adaptations, proposed targets, accepted assignments and actual
results distinct. Missing exercises remain in the proposed plan with an explicit
unavailable status. Expand the library next; never silently substitute/drop
movements or pass unknown IDs to the Workout Engine. Cardio uses duration and
intensity guidance, not kg × reps or estimated 1RM. Do not invent initial weights.

Completion summarizes the actual proposed goal, strength-session frequency and
week. Let the user adjust the schedule before accepting; alternative frequency
prescriptions require checked variants rather than arbitrary removal of sessions.
Only say the program is ready when every required movement and target can be
executed. **START!** durably accepts the shown program and personalization, then
opens Home; it does not start an active workout. Repeated taps, retries and
restart recovery must not duplicate routines. Partial failure preserves a retry
path and access to existing Core data.

Re-personalization proposes a new assignment explicitly. It never overwrites
custom routines, active workouts or History. Preserve schema-v1 compatibility;
separate target reps/rest/laterality from entered and completed values before
enabling these programs. Keep the manual builder available. Planned sessions
are distinct from Home's factual completion calendar; missed sessions do not
double the next session's volume. The
[implementation plan](superpowers/plans/2026-10-11-goal-training-programs.md)
records the prerequisite and delivery sequence.

The implementation includes four required movement variants, nine catalog
revisions, target/actual separation, per-side logging, a recoverable acceptance
journal and a planned-week module. Left and right repetitions are entered
separately; paired-set volume sums the two actual counts and no combined Epley
estimate is shown. The unloaded Step-up records zero external load. Existing
legacy unilateral IDs keep their historical accounting.

Program installation writes an acceptance-ID marker alongside the complete
routine batch in the canonical schema-1 workout document. Pending recovery
recognizes edited/deleted routines as conflicts and never recreates them. All
new program state participates in local-data reset. The supported runtime is
this version or later; older clients do not preserve the optional marker.

The first delivery supports each variant's recommended frequency and editable
session dates within the plan week. Unchecked frequencies offer manual setup.
The beginner first-session reduction is an explicit optional choice. Calendar
and source references remain separate from performed strength statistics.
Native device, Dynamic Type, VoiceOver and offline phone review remain pending.

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
and workout templates; header and navigation remain structural. Home customization now supports locally saved module order and visibility via
an explicit Save/Cancel editor. The primary Start/Resume (or accepted program)
module is always visible; when active, the supplementary program stays directly
after Resume. Hidden modules do not change saved workouts, metrics or routines.
The header and navigation remain structural. Sizes remain the existing medium.
Unknown retired IDs are ignored and new modules are appended. Invalid/future
layout documents or read errors show the default Home without overwriting saved
preferences; offer Retry or an explicit Reset Home layout. Failed saves retain
the draft and previous applied layout. Home preferences are device-local,
independent of account, preserved by workout-data reset/full restore, and excluded
from v1 backup files and cloud sync. The editor can restore all default visibility
and order; Save is still required.

The approved drag follow-up also supports holding any visible Home block for
450 ms to enter inline editing with light haptic feedback and restrained wobble.
Dragging updates a local draft only. Done writes that draft; Cancel, Android Back
or leaving Home discards unsaved order. A canceled/interrupting drag never commits
its partial movement; backgrounding retains earlier draft edits. Disable inner
workout/calendar/profile actions while editing, including the release following
the activating hold. Keep primary workout and active supplementary program in
one movable group. Hidden or currently absent blocks retain preferences. The
existing Order & visibility sheet remains the accessible button alternative and
can save the same draft. Failed saves retain editing for retry; all mutations
remain local-layout-only. Reduce Motion suppresses wobble.

### Workout Engine

Start/resume; exercises; sets; weight; reps; previous context; completion; rest timer; editing where supported; exercise progression; Finish; persistence.

The active screen shows the current exercise rather than the whole program by
default. **All exercises** reveals the ordered program for selection; choosing
an exercise collapses it without changing entered or completed sets or the rest
deadline. Automatic progression and new sessions also use the focused view.
This is transient UI state; keep the existing Workout Engine, finish validation,
confirmation, offline persistence and recovery unchanged.

The expanded program supports hold-and-drag exercise reordering. Dropping
persists the new order in the current active workout through existing local
storage; it does not edit the source template or previous History. Preserve the
current exercise by snapshot ID (including duplicate library exercises), all
set values/completions and the rest deadline. Subsequent progression follows
the new order. A cancelled drag changes nothing; saving disables reordering.
Move up/Move down accessibility actions provide the same operation without a
drag. Expansion and drag feedback remain transient presentation state.

Weight entry should evolve into an adaptive system with Recommended, Keypad, and Wheel Picker modes while always preserving exact manual control. Quick weight adjustments should support equipment-aware increments rather than one universal increment; exact manual entry always overrides them. A complete increment table is not defined yet.

Set-entry mockup approved 2026-10-13: tap an incomplete set's weight/reps to open Wheel / Keypad with a shared local draft, exact entry and +/- controls. Save writes values only; DONE separately completes the set/starts rest. Cancel/swipe/session or exercise changes discard drafts. Completed sets stay locked; left/right repetitions remain independent. Previous session means the same set ordinal in the newest finished matching workout; absent/uncompleted prior values are not invented. Use snapshot IDs, not positional indices, when saving; preserve History, source templates and rest deadlines.

Initial entry steps: barbell total load 2.5 kg, dumbbell/kettlebell 1 kg, cable/machine 5 kg, fallback 2.5 kg; repetitions 1. These are conveniences, not working-weight recommendations or universal machine plate sizes. The ordinary wheel grid is 0–500 kg / 1–100 reps, retaining valid exact/out-of-grid values; Keypad has no new cap. Empty values open Keypad; explicitly choosing Wheel initializes missing fields to 0 kg / 1 rep. Unloaded Bodyweight Step-up still requires 0 kg. Recommended mode, saved preferences and duration/distance logging remain future work.

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

List and inspect completed workouts accurately. Default to the latest three,
newest first, with a filter directly below the History heading, before the results. A separate filter window offers
mutually exclusive Recent workouts and Date range modes. Recent workouts starts
at 3; its scrolling wheel offers All instead of zero, then 1 through the number
of saved workouts. All retains access to the complete archive. Fewer than three
saved workouts simply show the available records.

Date range defaults to seven whole local-calendar dates including today. Select
From and To dates; both dates are inclusive. Reject a reversed range. Show
applies the draft and returns to History; Cancel or dismissal leaves the applied
filter unchanged. Picker Back discards only the unfinished picker selection.
Returning from workout details retains the applied filter. Filters are transient
presentation state and independent of the Progress period; saved snapshots,
completed sets and storage remain unchanged.

### Progress

Training Volume compares the selected rolling window with the immediately
preceding window of the same duration. 1M is the last 30 local-calendar days,
not calendar-month subtraction; 1W remains seven days and longer finite periods
retain calendar-month/year subtraction. The shared boundary rule applies to all. Let `start` be the existing
selected-period start and `previousStart` the same calendar subtraction from
`start`: current is `[start, now]`, previous is `[previousStart, start)`.
Boundary workouts belong to current only. The signed kilogram difference uses
the existing completed-set volume calculation, not workout counts, planned
sets or estimated strength. No percentage is introduced. Positive, negative
and zero changes mean higher, lower and unchanged recorded volume, not a claim
of strength improvement or decline. If the previous window has no usable
completed-set records (or a populated current window has none), show no data
for comparison. An empty current window can show a decline against recorded
previous volume. A recorded zero-volume baseline remains comparable. `ALL`
has no previous-window indicator. The History filter remains independent of this Progress period.
Treat machine-precision roundoff between equivalent decimal volumes as equality;
do not use a fixed minimum kg change. Normalize only unreliable digits of the
difference based on the completed-set and workout summation error bound, without
changing recorded weights or existing totals.

Prioritize total volume, workout frequency, PRs, weight/repetition progression, estimated 1RM (clearly labeled estimate), and muscle distribution when supported.

The selected Progress presentation foregrounds training volume, existing
estimated records, and selected-exercise logged performance. The shared
`1W / 1M / 3M / 6M / 1Y / ALL` period continues to scope these projections;
History uses its own independent filter. Keep every workout-volume and
estimated-point detail available, trained-exercise identity/selection intact,
and actual logged sets separate from their estimates. This is presentation
alignment: preserve calculations, the approved 30-day 1M/longer calendar periods, saved snapshots and local
schema v1; do not introduce new metrics or production demo data.

The selected overview uses a data-derived, zero-based kg scale. 1W keeps
recent-workout bars; 1M and longer periods show a chronological, shape-preserving
curve through every workout in the selected interval on a real timestamp axis.
Each point is one saved workout, including multiple workouts on the same day.
Do not insert rest-day zeros, accumulate/average values, extrapolate beyond the
first/last recorded point, or present interpolated values as logged work. Touch
selection and accessible previous/next actions reveal the actual workout/date/kg.
A single workout shows a point with an explicit no-curve-yet explanation. Chart scaling is presentation only; it must not round stored or
projected volumes, omit workouts from details, or change period boundaries.

Future Training Insights follow the hierarchy Result → Analysis → Suggestion. Interpretations must be cautious, actionable only when justified, and able to explain the principal signals through a “Why?” affordance without fake precision or invented scientific certainty.

A future Suggested Next Workout flow may use recent training history, estimated muscle load, goals, available equipment, and legitimate recovery information. Muscle load is one signal, not ground truth; the system must not simply choose the least-loaded muscle. The user can customize a suggestion before starting and the system can adapt from subsequent workouts.

### Local/offline

Core workout logging remains useful without network.

### Account + Sync

CRESUM is account-optional and offline-first. Onboarding, workout creation and logging, History, and Progress work without an account or network. Local workout persistence remains the critical path; cloud backup and multi-device sync complement it. A successful local save remains successful when sync fails: **sync failure is not workout failure**. The Workout Engine must not depend on Supabase availability or its table structure.

The optional CRESUM Account offers **Continue with Apple**, **Continue with Google**, and **Continue with Email**; email should favor passwordless OTP/magic-link UX over a primary password flow. Signing in and being fully synced are distinct states. A sync problem does not sign the user out or make local training data unavailable.

On first sign-in, **merge, do not replace**: preserve valid local training data, pull existing cloud data, and combine distinct entities without asking ordinary users to choose “Local or Cloud.” Stable IDs assigned before sync prevent duplicate copies of offline-created entities. Existing cloud data must never blindly overwrite local history. Later sync preserves separate completed workouts from separate devices; it does not apply destructive whole-workout last-write-wins. The active workout stays device-local in Sync v1, without a promise of live cross-device continuation.

Cloud direction is Supabase/Postgres with normalized user-owned entities rather than a cloud copy of the whole `fitflow_state_v1` document. Conceptual entities include the Auth user, profile, completed workouts and their exercise/set snapshots, custom workouts and their exercise configuration, preferences, and device/sync metadata. Authenticated users may access only their own cloud records, enforced by Row Level Security; database changes require versioned migrations, not undocumented Dashboard-only edits. Progress normally derives from factual History instead of becoming a separately synced source of truth. The canonical Exercise Library and equipment taxonomy are product data, not per-user cloud records; synced history may retain stable exercise/variant IDs and required historical snapshots without rewriting past meaning when the catalog changes. A Sync Adapter/Mapper separates existing Core/local models from cloud entities. This direction does not rewrite local schema v1 or define SQL tables yet.

Synced entities need stable IDs generated before upload. Mutable records need explicit revision/version information; `updated_at` alone is not sufficient conflict protection. Deletions need tombstones or `deleted_at` semantics so a previously offline device cannot resurrect a deleted entity; tombstone retention policy remains to be designed. Conflict handling is entity-specific: preserve completed history; keep active workouts local; detect concurrent custom-workout edits by revision rather than silently overwriting them; controlled last-write-wins may suit low-risk preferences; profile/body updates may be versioned, while body-weight measurements belong in separate factual records. Exact custom-workout conflict UX is deferred.

Sync v1 uses a durable local queue of **entity intent** (type, ID, operation/state, pending status, and local/base revision where needed), not raw HTTP requests as the product abstraction. After a successful local write, mark the entity pending; pull remote changes, merge safely, push pending local changes, then acknowledge cloud state/cursors. Read/map the current entity before upload as appropriate. Stable IDs and idempotent upserts must make a server-success/client-timeout retry safe. Sync may run after sign-in, app launch/foreground, network restoration, Finish Workout, custom-workout or important preference changes, and manual **Sync Now**; do not upload every in-progress set edit or require realtime/WebSocket sync in v1. Temporary offline/timeouts/server/rate-limit failures remain pending for safe retry; auth errors, revision conflicts, and invalid payloads require distinct handling rather than blind infinite retry.

Profile will have an **Account & Sync** section. Signed out: explain optional sign-in, backup/cross-device value, and offline availability. Signed in: show identity where appropriate, simple status (**Synced**, **Syncing…**, **Sync pending**, **Couldn’t sync**, **Offline**), **Sync Now**, and **Sign Out**. Normal sync should be mostly invisible; show Home-level messaging only for meaningful pending/problem states, with reassurance that data is safe on this device. Do not expose mutation counts or transport details to ordinary users.

**Sign Out**, **Reset local data**, and future **Delete Account** remain separate operations. Sign Out changes authentication, not account existence. Reset deletes device-local data; its exact restore-from-cloud behavior after reset requires later implementation design and does not silently change the current reset flow. Delete Account is a separate confirmed destructive cloud-account/data flow governed by product/privacy policy.

### Account/Auth Stage 1 integration — 2026-10-15

After merged #51, integrate the preserved `618c7e2` auth checkpoint on current develop. Profile's compact **Account** entry opens a separate scrollable page. Email sign-in uses exactly six digits inside the app; successful send is not authentication. Apple/Google remain disabled. Account connected explicitly says cloud workout backup is not enabled yet. Missing public configuration and auth/network errors leave all local Core and file-backup features usable.

The approved Email OTP expiry is 600 seconds (10 minutes). Development-project OTP length and expiry were saved and verified on 2026-10-15 after explicit confirmation; email delivery and OTP templates still require domain/Resend/custom-SMTP setup. These saved parameters do not establish a working email sign-in flow by themselves.

Keep one auth owner above local-data recovery/remounts, with isolated session persistence, foreground refresh and cleanup. Sign Out preserves workouts; Reset local data preserves auth and explains this. Auth storage never enters export/import/restore. The original checkpoint remains frozen; this is a focused integration, not cloud sync or a production-readiness claim. Real SMTP/OTP/session and physical-phone acceptance remain pending; see `ACCOUNT_AUTH.md`.

### Cloud Schema + Sync Foundation — 2026-10-15

After merged #52, prepare four normalized owner-scoped cloud tables for devices
and completed workout/exercise/set snapshots. Preserve legacy text IDs and
repeated nested IDs using saved positions. Enforce explicit revisions, immutable
identity, tombstones and RLS with owner-inclusive foreign keys; deny anonymous
access and client physical deletion.

Durable local sync metadata is partitioned by account. Coalesced entity intent,
account generations and sequence tokens protect newer work from late responses;
retryable failures stay pending while auth/conflict/invalid failures stay
distinct. No tokens, workout payloads or raw transport errors enter metadata.
Local reset clears this metadata while preserving device identity and auth.
Metadata stays outside Core backup/import/restore and schema v1 is unchanged.

This stage is dormant: no scheduler, upload/download, Synced state or remote
migration application is introduced. Domain/SMTP setup is deferred by the user.
History sync must add atomic aggregate publication, mapping, recovery integration
and cursor reconciliation before activation; see `CLOUD_SYNC.md`.

### Settings/Profile

Essential account/app preferences only.

Profile contains a compact **WORKOUTS** entry styled like the CRESUM wordmark. Tapping opens a separate saved-routines page with existing Start/Resume, create, edit, duplicate, hide/restore and confirmed delete behavior. Keep Training preferences, Local data and About on Profile. Save or explicitly cancel an active routine draft before returning to Profile. Template metadata remains factual planned data; it does not enter History. Use the real app version and existing personalization entry; no account/sync feature is introduced.

Profile → Data offers **Reset local data**, a confirmed destructive action that removes all local CRESUM workouts, history, templates, active workout, personalization, onboarding data, and body-weight measurements from this device, then returns to Welcome. Cancel leaves data unchanged. A failed reset must not claim success; attempt recovery of removed local values and retain the current in-memory session. This is separate from a future cloud **Delete Account** action.

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

### Compact Progress navigation — 2026-10-11

Logged exercise performance presents the existing estimated 1RM per workout as a compact graph: weekly bars, curves from 1M onward over the selected rolling period. Actual completed weights/reps remain available in a separate View logged sets sheet; all estimates remain accessible. No calculations or saved exercise identities change. A floating up button appears after scrolling: first tap returns to the current section start, second tap to the page top. Manual scrolling resets this sequence.

### App-wide return navigation — 2026-10-11

The up-arrow is a shared application element on all vertically scrollable pages and detail sheets, including onboarding, Home, Workout, Progress, Profile and exercise/template selection. It appears after scrolling, first returns to the current measured section (or the top in a single-section list), then to page top. Returning uses smooth native scrolling by default; manual dragging interrupts native motion and resets the sequence. Respect Reduce Motion. Horizontal filters and value-picker wheels retain their own interaction and do not get a page-return button. This changes presentation only, preserving workout state and reorder edge-scrolling.

### Ограничения назначения стартовой программы

Readiness требует явно объявленный тип учёта repetitions. Plank (duration) и Farmer’s Carry (distance) не становятся исполняемыми силовыми назначениями из-за одного наличия ID; их старый ручной сценарий не является поддержкой нового измерения. Повреждённые рекомендации кардио и структура программы блокируют восстановление программы, сохраняя доступ к Core. В General fitness зашагивания имеют диапазон 8–12 (Beginner) или 8–15 (Some/Experienced) на сторону.

Возраст остаётся необязательным. Если указанный возраст меньше 18, автоматические взрослые программы недоступны; ручная настройка сохраняется. Проверка действует в предложении, принятии и восстановлении pending-предложения. Она не заменяет сбор медицинских ограничений. Восстановление и START! выполняются последовательно, поэтому предыдущая программа не подтверждает принятие новой.

### Body-weight measurements — 2026-10-11

Progress includes **Body weight** with initial/current kg, a neutral change since the first measurement, a date-based curve over the selected Progress period and **Add measurement**. Onboarding starting weight seeds the independent local journal once when setup completes; later profile edits never rewrite it. Each saved current weight adds a positive kg value and actual recording timestamp. Do not derive body mass from lifted volume or label gain/loss as success/failure. One measurement shows a point and an honest insufficient-trend message; empty periods and missing/corrupt data remain explicit. Writes and reads are serialized; retry preserves the baseline and successful reset clears the journal, while failed reset recovery refreshes visible measurements. No cloud sync or fabricated production measurements.

### Shared wheels, Profile library and Home calendar — 2026-10-11

Date inputs use a shared day/month/year wheel instead of a date keyboard. Date of birth is optional, bounded by today, and remains a validated local YYYY-MM-DD calendar date. Shorter months and non-leap years clamp the day; Done applies, Cancel/dismiss discards the local draft, and Clear date leaves it absent. Program start and History From/To use the same wheels; filters retain their independent drafts and inclusive date logic. All current and future value wheels share AppPicker.

On iOS, a local Expo module hosts Apple's UIPickerView, with discrete selection feedback and native wheel audio governed by system settings. It requires a native build containing that module; Expo Go, Android and browser use the accessible snapping fallback. Do not force audio, use undocumented system-sound IDs, or claim browser audio is native. Device validation is still required.

Profile places **EXERCISE LIBRARY** immediately after **WORKOUTS**, using the same compact wordmark entry. It opens the complete existing searchable/filterable catalog as a separate browse page with Back; browse mode has no Add action and does not change an active workout or template. Existing workout/builder selection sheets remain intact.

Home order is greeting → Your week → primary workout/program → four-week summary → latest workout → other templates. **Month** opens a full Monday-first calendar with previous/next month controls. Blue dates mark actual saved completions only; selecting a day lists all its completed sessions and recorded volumes, or an honest empty state. This calendar does not create a scheduling system or mark planned/missed days as completed.

### Exercise Technique — approved mockup implementation 2026-10-12

Exercise Library shows exercise names/metadata on the left and a square thumbnail with a quiet **Technique** label on the right. In browse mode, name and thumbnail open the same guide. During selection/Add, Technique remains a separate read-only action; it never selects, appends, edits or completes an exercise. The same entry is available for the current Workout exercise when its catalog identity resolves.

The offline Technique page sheet contains the exact exercise name, existing muscle/equipment metadata, START/FINISH presentation, Setup, Movement, Key checks and expandable Common mistakes/Sources. Expanding the illustration opens a full-screen viewer; returning retains the selected phase and instruction/search/filter context. Closing/dismissing never changes logged values, rest deadlines or History. Instructions are original concise summaries of identified references; explicit adaptation notes distinguish source demonstrations from CRESUM equipment/grip variants. Generic legacy IDs remain unspecified, never silently assigned an exact grip or machine.

All 65 current catalog IDs have technique entries. Readable source-derived guidance is not individualized assessment or clinician approval. Machine-specific placards govern setup controls and unsupported machine geometry. This stage does not change prescriptions, loads, measurement types, exercise IDs or schema v1. Source links open externally with a recoverable failure message; the instructional text remains offline.

There are no approved production images yet. Keep honest square placeholders in Library and START/FINISH positions in Technique/viewer. Do not generate, substitute unrelated images, pretend to zoom a missing image, or imply an unreviewed illustration is a verified movement demonstration. Reviewed exact-variant assets/pinch zoom and shared-thumbnail image expansion belong to subsequent image integration. Weight-entry work remains deferred, with its draft preserved separately.

### Local file backup and restore — 2026-10-15

Profile offers **Export backup** and **Restore backup**. A versioned CRESUM JSON file includes complete local workouts/history/templates/active session, program state, personalization/onboarding, body-weight measurements and hidden built-ins; unrelated storage and auth data are excluded. Files contain unencrypted personal data. Native export opens the system share sheet; the user must select a save destination. Closing sharing does not prove a copy was saved. Web uses a local download. Cloud backup/sync remains separate.

Import validates every document before showing date/counts/active-session summary and **Replace with backup / Keep current data**. Restoration replaces the local snapshot rather than merging it. Block replacement while a current active workout exists or data is unready/unsaved. Keep exact saved identities and historical snapshots; reject incompatible versions, duplicate identities, incomplete/corrupt files and oversized input (20 MiB file / 10 million JSON characters).

Drain queued writes and hide/disable writable screens during file operations, preserving in-memory drafts on export or preflight failure. Before replacing local keys, durably save/verify the exact previous values in a rollback journal; verify all replacement values before clearing the journal. Failed/interrupted restores roll back, and startup recovery precedes repository loading. Incomplete recovery blocks writes behind Retry recovery. After a successful restore, or a storage-ambiguous restore after a verified saved preflight, reload all repositories only once coherent storage is available. This also applies after recovery retry.

### Profile backup and additive History import — 2026-10-15

After PR #50, the user approved a dedicated **Backup & restore** menu entry in Profile and requested implementation in the next focused PR. The Profile entry opens a separate page rather than embedding all backup controls in the Profile overview. Retain existing workouts, Exercise Library, personalization, local reset and About behavior.

The dedicated page offers **Export backup**, **Import history**, and separate **Restore all data**. History import previews the validated file, completed-workout count, new-workout count and existing-workout count before an explicit import action. Add completed workouts without deleting current History; skip existing stable workout IDs. Preserve current records when IDs collide, exercise identities and historical snapshots. Do not import active sessions, templates or profile/program settings through history-only import. Full restore retains PR #50's confirmed replacement and recovery protections.

Automatic backup is disabled by default. Native iOS/Android copies alternate between two verified files in the app documents directory. **Every workout** checks for newly saved completed workout IDs; **Weekly** checks seven calendar days since the last copy; **Monthly** checks the next calendar month, clamping shorter months. The first enabled copy requires completed History. Checks run after loading, on foreground return and each minute while open; wait for active workouts and queued writes. Read current policy and latest copy again before writing. Failed copies retain the last verified copy and retry on a later check. Last local copy reports only verified app-local success, with **Export saved copy** as the recovery/export path. An unreadable alternate does not hide a healthy copy; new writes stop until both slots can be safely inspected.

These are app-local copies, not iCloud or guaranteed closed-app background jobs. Web supports manual files only. Device loss/uninstall requires an exported file. **Reset local data** disables automatic copies but retains the saved files, as stated in its confirmation; policy is device-local and excluded from full backup/restore. Existing restore journal keys remain compatible.

Implementation prepared in #51; native picker/share, device file durability, VoiceOver and Dynamic Type acceptance remain physical-phone checks.

### History sync publication protocol — 2026-10-15

The staged first-sync implementation uses atomic aggregate publication with
revision compare-and-swap and durable mutation receipts. Repeating a request
with the same mutation ID and arguments returns its original result, without
rewriting newer history. Changed arguments under the same token are rejected.
Owner-serialized changes are pulled in sequence order with string bigint
cursors and complete snapshots/tombstones. Direct client table writes are
closed when this protocol migration is integrated, so app changes cannot bypass
the feed. Core/cloud mapping preserves historical identities and actual values.

This protocol does not itself activate app synchronization. The integration
must preserve local history, track ownership on account switching, and drain
writers around import/restore/reset before enabling upload or advancing cursors.
Independent off-platform database backups and tested restoration are a release
prerequisite, explicitly deferred by the user until that stage.

### History Backup + First Sync — app integration 2026-10-15

After merged54, Account & Sync offers explicit **Enable cloud backup** before
adding this device's unassigned completed history to that account. Then launch,
foreground, completed-history changes and **Sync Now** run pull/merge/push.
Transient retries run up to five times while foregrounded with increasing
30s..5min delays; there is no realtime or OS background-job promise. Account
connection alone does not imply a successful cloud copy. Synced covers completed
history linked to this account, not active sessions, routines or settings.

Merge distinct workouts without replacing local History. Apply remote edits or
tombstones only against an unchanged known local base. Same-ID divergence,
other-account ownership or active-ID collision preserves local data and prevents
false Synced. Conflicts remain explicit until safely resolved; no destructive
last-write-wins or in-app conflict resolver is introduced. Both local/cloud
copies remain kept; users can export local history independently.

Sign Out retains local History. A device-local metadata-only provenance ledger
keeps known account-A workouts out of account-B uploads. It stores owner IDs,
entity IDs, hashes, revisions and request fingerprints, not tokens or payloads.
It and a durable pause marker remain outside file backups and survive local reset
alongside the already-retained auth/device identity. Reset removes workout data
and queued intents, not cloud history or backup-account links.

Import/full restore/reset pause cloud before changing data, fence old replies
and drain local writes. **Resume cloud backup** explicitly performs a fresh full
merge; reset does not immediately refill History from cloud. Export/automatic
archive creation only suspends/drains sync temporarily. Offline workout saves
remain independent of cloud errors. SHA-256/UUID support uses lazy SDK-matched
expo-crypto; native-build and real-device/mail acceptance remain required.

### New workout identity — approved 2026-10-16

New workouts started through the app receive a cryptographically random UUID v4
on the device before their first local save. This works offline without an
account. WorkoutStore supplies the existing SDK-matched expo-crypto generator
to the pure engine's ID-factory seam; initial exercise/set snapshot IDs use the
same factory, while catalog/library IDs retain their meaning.

The workout ID remains unchanged through resume, completion, sync, export and
import. Existing active/history IDs are never regenerated or migrated. The cloud
continues to scope identity by `(user_id, workout_id)` and enforce owner access
and revision/content checks. UUIDs reduce accidental collision risk; they are
not authorization credentials or sequential workout numbers.

Secure UUID generation loads lazily when starting a new workout, including
without cloud opt-in. It requires the native crypto module in the device build,
but no network. Restoring and finishing existing sessions do not generate IDs.
If secure generation fails, do not create/save a weak-ID fallback workout.

### History conflict resolution — UX approved 2026-10-16

Keep normal merges automatic: combine distinct workout IDs, deduplicate identical
content, and reconcile a single changed side against its known common base.
Only independently divergent versions require a user decision. Show the actual
exercise/set differences and two Keep this version actions, plus Decide later.
Put Keep both as separate workouts under More options and warn that both count
in Progress. No choice is preselected. Confirm replacement/deletion explicitly.
Workout/edit/server times are contextual; never choose a winner by time or invent
missing historical edit times. Refresh a stale comparison before applying a
choice. Preserve owner separation, active sessions and offline Core. See the
approved conflict-resolution design. Implemented on the focused feature branch;
native/device acceptance remains pending. After PR #57 merged, its exact database
migration was applied and verified on cresum-dev on 2026-10-16.

Comparison cards also show completed-set count and recorded volume using the
existing workout-domain calculations shared with Progress. Unfinished sets do
not enter these totals. A completed set can still count when weight/repetition
data cannot support volume: show Volume unavailable if none are measurable, or
explicit coverage when the recorded total is partial. Valid zero-weight volume
remains zero. Summary display does not change saved history or choose a version.

### Account deletion — staged server foundation, 2026-10-16

Continue account management after merged #59 in focused stages. The server
foundation accepts an explicit deletion confirmation tied to a verified matching
account, then hard-deletes the Auth user and its cascaded cloud History/private
sync records. Local workouts, active sessions, routines, saved files and ownership
provenance remain unchanged. This stage adds no in-app deletion action or live
deployment. Client confirmation, durable sync pause, session cleanup and ambiguous
failure recovery are the next separate delivery. Never claim exported copies,
other devices' local data, platform logs or backups disappear with account deletion.

### Account deletion — Profile client follow-up, 2026-10-16

After merged #60, Profile > Account & Sync offers an account-named deletion
confirmation with typed DELETE. Local active workouts, History, routines, saved
files and ownership provenance stay. The action remains unavailable until reviewed
server deployment is verified and its build-time rollout flag is enabled.

Deletion durably fences the owner and pauses cloud before network access. A lost
or invalid reply stays unconfirmed across restart; never auto-retry deletion or
silently resume that owner's cloud backup. Only a verified matching server reply
allows owner-specific session cleanup. A late A response must not clear or report
deletion of B. Confirmed cleanup can recover locally without another server delete.
Account metadata failure blocks account traffic, not offline training. Exports,
other devices' local copies and provider backups are not removed by this action.

# Factual Muscle Map — approved 2026-10-17

Progress includes Overview and Muscles. Muscles shows an original schematic
front/back map, all 17 existing catalog muscle groups, and source-set details.
Periods are current workout (otherwise latest completed), 7 local-calendar days,
and 28 local-calendar days. History periods use finished-workout timestamps;
unfinished sessions contribute only to Workout. Only completed set timestamps
inside the session are counted. Zero-load and bilateral rows each count once.

Primary and secondary counts use current catalog mappings, including established
aliases. Unknown exercises remain in the unique completed-set total but display
a coverage notice and never receive guessed muscle mappings. A set can involve
multiple muscles; muscle counts must not be summed as a unique total.
No stimulus coefficients, recovery estimates, intensity normalization, medical
claims, recommendations, schema changes or history rewrites are introduced.

### Anatomical 3D source direction — approved 2026-10-17

Use a reviewed anatomical 3D source with individually identifiable muscles to
produce consistent front/back views, visible-surface masks and shading layers.
Keep the selected grayscale character with modesty insert as the appearance
reference; the generated image and manual masks are not anatomical ground truth.
Map multiple anatomical objects to the existing 17 catalog groups without
changing exercise mappings, saved history or participation calculations.
The initial app presentation may remain 2D. Interactive rotation and deep-layer
anatomy views require separate product work. Hidden muscles must not be painted
over an unrelated visible surface. Source selection must verify anatomy,
object separation, usable pose, export workflow and asset licensing.

Current steering (2026-10-17): 3D is unavailable, so continue the 2D source/mask
review. The future model-derived workflow remains an option; it is not required
to improve current visible contours. Editable anatomical subparts aggregate
into the existing groups and do not create new set/activation measurements.
