# CRESUM — Development Roadmap

This is priority guidance, not a claim that items are unimplemented. Inspect the repository first.

## Objective

Stable Core:
Onboarding → Home → Workout → Sets → Rest → Finish → History → Progress.

## P0 — Core

### Reliability audit follow-up — approved 2026-10-14

Clock safety (#47), active-workout discard (#48) and consistent estimated records
(#49) are integrated. Local file export/restore (#50), Profile automatic local copies/additive History import (#51), and optional Account/Auth (#52) are integrated. The next focused delivery is Cloud Schema + Sync Foundation; domain/SMTP setup is deliberately deferred.
Cloud backup remains separate; physical native Files/share and interrupted-restore
acceptance is required before release.

Deliver the audit improvements in focused PRs, beginning with the reproduced
device-clock rollback failure: reject invalid Finish timestamps, preserve the
active workout, and verify persistence/restart/retry. Next address confirmed
discard of an accidentally started workout while keeping History and routines.
Continue through analytics consistency and backup/recovery as separate changes.
Native-build/device validation remains a distinct release requirement.

1. **Workout Engine** — reliable start/resume, logging, editing, rest timer, persistence, exactly one valid completion, tests.
2. **Exercise Library** — browse/search/select; stable references and consistent metadata.
3. **Workout Templates** — guided create/select/edit routines with planned sets/optional starting weight, without corrupting historical workouts.
4. **History** — accurate completed-session list and details.
5. **Progress** — real saved-data metrics: volume, PRs, progression, estimated 1RM, readable charts.
6. **Local persistence/offline** — core logging does not depend on network; recover data according to current architecture.
7. **Account + Sync** — optional Supabase/Postgres backup and multi-device sync, staged behind reliable local storage. Do not replace working local persistence or make workout logging network-dependent.

### Account + Cloud Sync v1 sequence

Implement in separate focused PRs, not one combined feature:

1. **Account/Auth Foundation:** Supabase client seam, auth session state, Account/Profile shell, Apple/Google/Email auth seams, signed-in/out behavior. No workout cloud sync yet.
2. **Cloud Schema + Sync Foundation:** versioned database migrations, user-owned Row Level Security, normalized entities, stable identity/revisions, device ID, and durable local sync metadata/queue. No broad feature expansion.
3. **History Backup + First Sync:** completed-workout upload/download, merge-first sign-in, idempotent retry, offline recovery, and physical multi-device validation where possible.

Later, separately approved work may sync custom workouts, preferences/profile, add conflict UX, account deletion and deeper recovery/diagnostics. Active-workout backup is not part of Sync v1 and needs separate approval. This documentation sync does not increase official Core readiness.

## P1 — Product polish

### Goal-based starter programs — implementation prepared 2026-10-11

The user approved the [nine-variant research/specification](superpowers/specs/2026-10-11-goal-training-programs-design.md)
as the initial basis, with later corrections allowed. Gym is default, the
Environment question is removed, missing exercises are retained, and completion
uses **START! → Home**. This is approved scope, not implemented readiness.

Delivery follows the [implementation plan](superpowers/plans/2026-10-11-goal-training-programs.md):

1. Next, extend the exercise library with the required verified movements;
   broader library coverage continues through focused variant packs. Preserve
   stable IDs and distinguish floor glute bridge from hip thrust.
2. Author the versioned nine-program catalog with source attribution and
   explicit unresolved mappings; do not publish shortened executable programs.
3. Add compatible target reps/rest/laterality support before connecting programs
   to the existing kg/reps logger. Keep duration-based cardio guidance separate.
4. Implement durable, idempotent assignment and schedule recovery, including
   local-reset handling, without replacing existing routines or history.
5. Connect the streamlined onboarding, START! acceptance and a separate planned
   Home module; verify offline/restart/error and phone accessibility behavior.

Free-form AI generation, calibration PR #17, adaptive working-weight selection,
cloud sync and production exercise images are outside this delivery. Alternate
frequency prescriptions need refinement before enabling a frequency selector;
schedule-day changes must retain recovery and weekly-volume meaning.

### Other Core polish

- Approved 2026-10-14: Library exercise Statistics with existing periods,
  estimated 1RM / volume / top weight and point-to-workout logged-set drilldown;
  shared centered CRESUM branding. Preserve variant IDs and factual offline
  History. Physical-device chart/sheet/large-text acceptance follows.

- Shared day/month/year wheels replace date keyboards; all future value wheels use
  AppPicker. Local UIKit module uses native Apple wheel appearance/audio and
  selection feedback; verify with a native build on a physical iPhone. Browser,
  Android and Expo Go retain a snapping accessible fallback. Profile gets a separate
  browse-only EXERCISE LIBRARY entry after WORKOUTS. Home calendar moves above the
  workout and opens a factual full-month calendar. No scheduling or storage migration.

- Profile identity/body-weight follow-up: compact WORKOUTS wordmark entry opens
  a dedicated routines page; named Welcome → optional DOB/height/weight → Goal
  → Experience → START!; Home uses the stored name. Progress keeps a separate
  persistent body-weight curve and measurement sheet. Retain conditional restoration,
  personalization row, quiet destructive local reset, and static real-version
  About. Preserve management gestures, confirmations and the shared up-arrow.
  Physical-phone layout, gestures, safe area and Dynamic Type review remains
  required; no Account/Auth or Sync implementation is part of this UI task.

- Approved app-wide up-arrow on vertical pages/detail sheets, smooth native return with Reduce Motion support and retained workout reorder scrolling. Physical-phone animation pace/keyboard/safe-area review remains required.
- Approved compact exercise performance graph, separate logged-set details, and two-step section/page up navigation; native scrolling and large-text acceptance remain phone-review tasks.
- Approved History compact list and independent filter below the heading: latest three by default,
  count wheel with All / 1…saved count, or inclusive From/To dates defaulting to
  seven local-calendar dates. Show applies; cancellation preserves results.
  Native wheel/sheet and Dynamic Type acceptance remains a phone-review task.

- Approved Progress detail pass: previous-window volume comparison, inline
  TOP PR, consistent day/month dates and distinct chart value/scale labels.
  Follow-up: 30-day 1M and full-period curves from 1M onward, stable missing-data
  comparison placement and readable Workout volumes sheet colors.

- Onboarding Foundation: resumable lightweight personalization or direct first-workout creation through the Guided Workout Builder, separate versioned local state, legacy-user bypass, and later Profile re-entry. Authored starter programs now follow the approved sequence above; calibration and adaptive recommendations remain separate future work.
- Home Dashboard using real app data and `docs/DESIGN_SYSTEM.md`.
- Selected Home reference alignment: greeting/hero, paired four-week stats,
  and factual Monday–Sunday completion view first. Active Workout follows in
  a separate focused PR: matching header/cards/rest surface and current-exercise
  focus with an expandable program. Progress and Profile remain separate later
  tasks; preserve existing Core behavior.
- Expanded Workout program reordering: hold, restrained jiggle/light haptic,
  vertical drag and accessible Move up/Move down, persisting only the active
  session order. Native gesture/scroll and Reduce Motion review is required;
  source-template editing remains a separate task.
- Modular dashboard foundation for existing Home content. The 2026-10-17 follow-up adds
  transactional reorder/show-hide and device-local persistence, with a protected
  primary action and retryable read/write failure states. Existing medium sizes
  remain. Size selection and synced layouts remain separate work; the approved hold-and-drag follow-up is described below.
- Essential Settings/Profile.
- Selected Progress reference alignment: volume-first overview, estimated
  records, trained-exercise performance and the existing workout-volume sheet
  in the Home/Workout style. Preserve calculations, shared periods and complete
  History; native sheet/Dynamic Type acceptance remains a phone-review task.
  Correct overview fidelity to the selected screenshot: segmented periods,
  pale selection, larger volume and a scaled chart with grid/dated values.
- UI consistency, interaction states, haptics, accessibility, phone-sized layouts.

## P2 — Release readiness

Device/development builds, error handling, store assets/metadata, privacy/permissions, subscriptions/paywall if required, RevenueCat if used, App Store/Google Play preparation.

## Later

- Exercise Library / Asset evolution, in separate focused PRs: approved documentation sync → family/variant model and types → non-destructive adapter for the existing 58-record catalog → a small set of verified high-value variants → reviewed Biomechanics Specification → separately designed Visual Specification → Prompt Builder → Image Generation → Biomechanics/Visual QA → Asset Tracker → Approved Production Asset → gradual catalog expansion. Preserve stable IDs, historical snapshots, and schema v1 throughout. This documentation sync creates only the architectural foundation; it does not implement any stage, data model, generator, prompt tooling, tracker, or production image.
- Adaptive Weight Input with Recommended, Keypad, and Wheel Picker modes, equipment-aware quick increments, and exact manual override. Timing and the complete increment table remain unscheduled.
- Approved Wheel / Keypad Set editor (2026-10-13): implement transactional Save/Cancel, shared native picker, exact values and bilateral preservation now. Physical phone acceptance follows. Recommended weights, saved input preferences and complete equipment increment configuration remain later work.
- Muscle Load and the red-intensity Muscle Heat Map, following the documented taxonomy → variant mapping → factual sets → stimulus/contribution → raw and period aggregation → normalization → renderer separation. Final taxonomy, coefficients, formulas, and thresholds require separate approval.
- App-wide modular/replaceable feature boundaries and a capability/entitlement foundation should be introduced through focused needs, not a broad rewrite. Keep Feature Flags separate from access rights before adding commercial gating.
- Future monetization, referrals, Achievements/Badges/Challenges, and commercial Rewards require separate product design. Establish entitlement semantics before plans/paywalls; keep recognition systems separate from commercial rewards.
- Training Insights using Result → Analysis → Suggestion and explainable “Why?” details.
- Apple Health/Health Connect, watches, AI Coach, social, nutrition, advanced gamification, and Oracle marketing/analytics/auxiliary services.

## Future

- First-workout calibration and adaptive progression: conservative initial work → actual exercise-specific performance and simple perceived difficulty → baseline → explainable, overrideable proposed sets/load informed by actual history. Body measurements alone are not enough for a precise working weight; actual logged values remain truth. This is not part of the Guided Workout Builder. PR #17 Calibration v1 is deferred for UX redesign, remains unmerged, and is not an Account & Sync dependency.
- Suggested Next Workout and its Recommendation Engine: Workout → Muscle Load → Muscle Map → Training Insight → Suggested Next Workout → Customize → Start Workout → Adapt.
- Recommendation Engine architecture may be anticipated, but implementation must not delay CRESUM Core. Muscle load is one input rather than ground truth.

## Working method

One focused feature/fix per task and PR:
inspect → smallest scope → implement → validate → phone review for UI → commit/PR → checkpoint.

If unfinished Codex changes exist, finish or safely checkpoint them before a new large feature.

After a clean checkpoint, sensible UI sequence:

1. establish/reuse theme tokens from `docs/DESIGN_SYSTEM.md`;
2. Home Dashboard only;
3. validate;
4. Active Workout and Progress as separate tasks.

Do not turn this into a broad rewrite.

### Exercise Technique follow-up — 2026-10-12

Approved Library/Technique/full-screen mockup is implemented as a focused offline guide layer for the 65 current exercises, with source mappings and explicit adaptations. Square thumbnails and START/FINISH positions remain placeholders pending reviewed assets. Preserve browse vs selection actions, stable identities and existing logging. Next: editorial review by a qualified coach for variant-specific guidance, physical-phone acceptance, then separately integrate approved exact-variant images and image gestures/transitions. Adaptive weight-entry mockup is deferred and retained; no cloud/auth or calibration work is added.

### Profile backup follow-up — merged #51 on 2026-10-15

PR #50 merged into develop at d747ac24da19d2f54f2ac816519e8213f88a958c, providing protected full restore. Its approved Profile, automatic-copy and additive History-import follow-up was delivered in #51.

PR #51 is merged at `3e6a78895b5c11c01ffc5b097eabcc9afc71817f`, with the dedicated Profile flow, validated additive History import and native two-slot verified local copies. Automatic copies default off and run only while open/next opened; weekly/monthly are not OS background jobs. Saved copies survive Core reset, which disables the policy. Automated durability, scheduling, import and UI regression checks accompany implementation. Physical-phone file-picker/share, app lifecycle, accessibility and storage acceptance remain next; cloud backup remains separate.

### Account/Auth integration — merged #52 on 2026-10-15

Resume the preserved Stage 1 checkpoint `618c7e202ec5e673a404c382c5438b3730682adf` through a new focused branch based on merged #51; do not rewrite the frozen branch or replace newer Core/UI files. Reuse its optional six-digit Email OTP, session store and Supabase seam. Add a compact Account page to the current Profile and keep its owner independent of local restore/remounts. Preserve Sign Out/reset separation, all local backup protections and offline Core. Implementation/checks are prepared in the follow-up PR; real custom-SMTP OTP and physical-device session acceptance remain pending.

After this foundation is accepted, deliver Cloud Schema + Sync Foundation and then History Backup + First Sync as separate PRs. No active-workout sync, Oracle deployment, custom-workout conflict UX, Calibration PR #17 or provider OAuth is added here. See `ACCOUNT_AUTH.md` and the integration plan.

External setup checkpoint: `cresum-dev` restored and healthy; user-approved Email OTP length 6 / expiry 600 seconds verified after Dashboard reload. The public config is local-only. No domain is owned yet, custom SMTP remains disabled and OTP mail templates/delivery remain pending; choose a domain and configure Resend before real email acceptance.

PR #52 merged at `8f2029430b7d19201d78e2a39f150e530da1a4c6`. The user explicitly
deferred domain purchase/mail configuration and requested continued development.

### Cloud Schema + Sync Foundation — merged #53 on 2026-10-15

Prepare normalized completed-history/device tables, owner RLS and revision/
tombstone contracts with executable PostgreSQL tests. Add dormant account-scoped
durable intent metadata, device identity and reset/backup boundaries. Keep the
app's transport inactive and migrations unapplied remotely until reviewed and
integrated. Next: History mapping, atomic aggregate writes/pulls, merge-first
sign-in, idempotent retry and recovery integration. Real mail, physical-device
and multi-device acceptance remain independent prerequisites for release. See
`CLOUD_SYNC.md` and `superpowers/plans/2026-10-15-cloud-sync-foundation.md`.

### History Backup + First Sync: atomic protocol — 2026-10-15

PR #53 merged at `c1f757280e3ec247d5ca353a4c373af4ad6a0bca`. Deliver
History mapping, atomic publication, per-owner ordered pulls and idempotent
receipts as the first focused protocol PR. Keep the app transport inactive.
Next integration must add account provenance, merge without replacement,
durable mutation IDs, recovery writer draining/cursor reconciliation and
Account & Sync status/manual action before enabling cloud traffic.

### Release gate: independent disaster recovery — deferred by user

Before release, configure encrypted off-platform database copies, access and
retention controls, and perform a documented restore drill. Supabase downtime
must leave offline Core usable. Device-local archive files do not protect
against loss of the device; preserve file export to a separate destination.
The user explicitly postponed this infrastructure work until release. No
independent database backup or restore drill is configured by the protocol PR.

### History Backup + First Sync — integration after merged54

PR54 merged at `84e7fe59bb03337084e38c8380c058f317c0af32`. Its exact
protocol migration is now applied to cresum-dev with canonical source version
`20261015181021`; public RPC grants and closed direct writes are verified.
No fixture users or workouts were sent. Implement Account & Sync enable/resume,
manual/foreground/history triggers, per-account provenance, durable requests,
verified Core merges and recovery pause/drain on the new focused branch.

Release gates remain real custom-SMTP OTP and physical-device/native-build,
multi-device/offline acceptance, conflict-resolution UX follow-up, private
receipt/feed capacity/retention and independent off-platform database recovery.
The user deferred domain/mail and independent backups. Do not treat automated
checks or a synced empty account as proof of production readiness.

### Workout UUID hardening — approved 2026-10-16

After merged #55, switch new app-started workout identities from timestamp/random
strings to device-generated UUID v4 using the existing crypto dependency. Preserve
all saved IDs, Core v1 and file-backup compatibility. Keep this as a focused PR
before the separately proposed conflict-resolution UI. Device/native-build QA
remains required; this step adds neither automatic timestamp-based resolution
nor sequential user-visible workout numbering.

### History conflict resolution after #56

PR #56 merged at `505a0692e0f444f400db8e383e3ab26246304ec2`. The proposed
conflict resolver now builds on secure new-workout UUIDs and retains all legacy
IDs. See `superpowers/specs/2026-10-16-history-conflict-resolution-design.md`.
The simplified two-choice comparison UX is approved, with Decide later and
secondary Keep both. Implementation follows the history-conflicts plan. Time is
contextual information, not automatic resolution authority, and unknown historical
edit times must remain unknown. Native/device acceptance remains a separate gate.

PR #57 merged at `c3dc820cdb1cc2da14f21219077a725f11df3448`. The exact
conflict-resolution migration is applied to cresum-dev under source version
`20261016111714`; owner/session/revision guards and client grants are verified.
No remote fixture records or emails were created. See CLOUD_SYNC for deployment
evidence. Native/two-device acceptance remains pending.

The focused comparison-summary follow-up closes the deferred completed-set count
and recorded-volume omission, reusing existing domain calculations and making
missing/partial coverage explicit. It preserves individual set details and all
choice/recovery behavior. No schema, sync-protocol or storage change is required.

### Account deletion — server foundation after merged #59

PR #59 merged at `584fcd8bfd803aca94fdd26ca5f28cd4d7bf298e`.
The next focused branch prepares the verified owner-bound Edge endpoint and
populated PostgreSQL cascade/isolation contracts. Existing Auth foreign keys
remove owner history/feed/receipts without a schema migration. No live account
is deleted, no endpoint is deployed and no client button is exposed in this stage.
Next: Profile confirmation, durable sync pause/drain, account-fenced local session
cleanup and truthful interrupted-deletion recovery; then deployment of reviewed
source and physical-device acceptance. See ACCOUNT_AUTH and the deletion spec.
Domain/mail and independent disaster recovery remain deferred release work.

### Account deletion — Profile integration after merged #60

The server foundation is merged at `6661552099f2b60ed61feca164a68d51582aa203`.
The next client branch connects account-named typed confirmation, durable owner
deletion state, sync pause/drain, matching-session cleanup and interrupted-request
recovery without changing local Core or ownership provenance. It also closes the
#60 SDK error-translation test gap. The default build keeps deletion unavailable.
After this PR is reviewed/merged, separately deploy the reviewed function, verify
gateway/Auth behavior with an explicitly authorized test account, then enable the
build-time rollout flag. Native/two-device/mail and retention checks remain open.

### Account deletion — deployed, acceptance pending after #61

PR #61 merged at `16e7f1d64af4a051bd6d2d71a7e1812a30b994a3`.
The reviewed function is deployed to cresum-dev as active version 1 with JWT
verification enabled. Source readback, OPTIONS and unauthenticated rejection are
verified; see ACCOUNT_AUTH for the checkpoint. No live test user was created or
deleted. Keep the rollout flag off until an authorized disposable user's real
session verifies owner guards and successful deletion, followed by native-device
acceptance. The connected tools cannot create/sign in an Auth test user.

### User-directed autonomous task — 2026-10-17

The user postponed the authenticated deletion acceptance/Dashboard task and
requested work that can be implemented and checked without their participation.
Keep deletion rollout disabled. Deliver Home layout customization in one focused
PR with automated persistence, Save/Cancel, recovery, primary-action and program
regressions. Physical-device layout/accessibility acceptance remains a release
check; neither native acceptance nor account-deletion acceptance is claimed.

### Home hold-and-drag — approved after merged #63

PR #63 merged at `b5bb65d1b2d75aea367b3e5846622bb0a78a3ad2`.
User approved long-hold editing, light feedback/wobble, vertical dragging and
Done/Cancel, retaining the accessible arrow alternative and Reduce Motion.
Implement within Home using the existing layout repository and gesture/viewport
scroll dependencies. Verify draft-only mutation, save/retry/cancel, interrupted
late drops, protected workout actions and native JS exports. Physical gesture,
haptic and accessibility acceptance remains a release check.

# Approved factual participation slice — 2026-10-17

After Home drag editing (#64), the user approved Muscle Map mockups and asked
for implementation. Deliver factual completed primary/secondary set counts in
Progress using existing taxonomy and mappings. This is separate from deferred
Muscle Load/stimulus/recovery/recommendation work and does not approve any
coefficients, new anatomical taxonomy or normalized red-intensity scale.
Native visual/accessibility acceptance remains open before release.

### Muscle Map source and mask preparation — 2026-10-17

Prepare the user-selected anatomical front/back source with modesty insert and
17 independently editable draft muscle-group layers. Preserve common image
coordinates and existing IDs; deliver source, masks, clipped texture references
and offline review. Review contours/anatomy and native compositing before
replacing the merged schematic map. The subsequent 3D-source direction below is
now approved. Live 3D, Female model and stimulus/recovery calculations remain
separate stages.

### Anatomical 3D source evaluation — approved 2026-10-17

Next, evaluate a source with individually identifiable muscles, anatomy review,
compatible asset rights and a reproducible render/mask export. Prove a small
sample (chest, lats and quadriceps) before adapting all 17 groups. Keep neutral
render, visible ID masks and shading aligned. Retain the current application
renderer while this source is evaluated. #66 remains a draft checkpoint of the
chosen appearance, manual mask experiment and review tooling; those contours
are not the final anatomical source. Evaluation is read-only until a candidate
is selected; importing a library does not automatically approve its anatomy or
license suitability. No automatic merge of the checkpoint is authorized.

### Current steering: continue with 2D — 2026-10-17

The user has no 3D file yet and requested working with 2D. Defer model production
and registration. Refine the selected image's chest, lats and quadriceps masks
first using anatomy references and visible landmarks, preserve source alignment,
and expose editable visible substructures. Keep the 17 catalog groups unchanged.
The generated image and manual fitting remain a draft, not exact segmentation.
The future 3D-source direction above is retained but is not a dependency for
this 2D review. Keep #66 in Draft until visual/anatomical acceptance.
