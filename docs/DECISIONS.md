# CRESUM Decision Log

This chronological log records approved decisions. The owning product, design, roadmap, and engineering documents remain the detailed sources of truth.

## 2026-10-10 — Progress comparison and readable chart details

Status: Approved — pending Git integration

- Show factual signed kg volume change against the immediately preceding
  rolling calendar window. Use directional green/red indicators, neutral
  equality/no-data states and no indicator for ALL; avoid strength claims.
- Keep comparison windows adjacent without double-counting the shared
  boundary. Compare completed-set volumes, with usable-record detection and
  an explicit unavailable state rather than a fabricated zero baseline.
- Move TOP PR before the value, align value trailing edges, use consistently
  stacked day/month dates, and dark semibold bar values with white backing
  against regular gray axis ticks. Explicitly retain dark exercise names.
- Preserve existing analytics, periods, History, workout state and schema.
  Browser fixtures stay separate; native layout still needs phone review.

Related: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`.

## 2026-10-10 — Progress typography detail pass

Status: Approved — pending Git integration

- Refine font size, weight and text color against the same selected overview
  reference. Use scoped Progress type roles: 20 pt card headings, 15 pt record
  names, 13 pt periods and 11 pt regular chart labels; preserve the 34 pt screen
  title and 40 pt volume statistic.
- Use black emphasis for headings/key values, existing readable secondary gray
  for metadata, regular-weight units, a secondary-gray unselected exercise
  prompt, and stronger selected-period/wordmark weight.
- Match the browser preview to native styles. Keep other screens, analytics,
  period semantics, stored workouts and test-only fixture separation intact.

Related: `DESIGN_SYSTEM.md`.

## 2026-10-10 — Progress overview mockup fidelity correction

Status: Approved — pending Git integration

- The user selected the overview screenshot as the exact Progress reference
  after reviewing the merged implementation. Correct the visual gaps: a single
  segmented period track with pale-blue selection, larger volume value,
  zero-based scaled chart with dashed grid, factual bar labels/short-month dates
  and narrower card insets.
- This supersedes the earlier full-blue period fill and 24 pt Progress card
  padding. Use a 40/48 pt statistic token and 16 pt Progress card insets.
- Keep analytics, identity, shared periods, full History and local schema v1.
  Demo values remain preview-only; normal-size charts fit seven bars, while
  large-text layouts may repeat the same scale across multiple plot rows.
- Match the browser adaptation to this native correction; device acceptance
  remains necessary for native sheets, Dynamic Type and dock behavior.

Related: `DESIGN_SYSTEM.md`, `PRODUCT.md`, `ROADMAP.md`.

## 2026-10-10 — Selected Progress mockups

Status: Approved — pending Git integration

- Use the approved overview, selected-exercise performance and workout-volume
  sheet mockups as Progress's presentation reference in the Home/Workout style.
- Lead with training volume, then estimated records and logged performance.
  Use existing tokens, spacious white cards, wrapping period controls, factual
  bar values and quiet logged-set/detail rows. Standardize the selected period
  to the existing primary-blue fill; generated controls vary slightly.
- Preserve calculations, identity, shared period semantics, all detail sheets,
  empty states, full History and local schema v1. Mockup data stays test-only;
  no new analysis tabs, muscle map, recommendations or analytics are included.
- Native sheets and Dynamic Type require phone acceptance.

Related: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`.

## 2026-10-10 — Reorder exercises in the active Workout program

Status: Approved — pending Git integration

- Expanded program rows support hold → light haptic and restrained jiggle →
  vertical drag → release to save the position. Stop motion after drop/cancel
  and keep the list open after reorder; regular tap still selects/collapses.
- Persist only the active session's order, retaining the current exercise by
  snapshot ID, set values/completions and rest deadline. Do not edit the source
  template, previous History, or schema v1. Progression uses the reordered list.
- Respect Reduce Motion, provide accessible Move up/Move down, and cancel
  interrupted or saving-disabled gestures. Native vibration/gesture/edge-scroll
  acceptance requires phone review; the chat demonstration uses test data.

Related: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`.

## 2026-10-10 — Selected Workout reference and focused program navigation

Status: Approved — pending Git integration

- Adopt the approved light Workout preview through the existing native screen:
  CRESUM header, elapsed badge, factual summary, spacious exercise card and
  tinted rest card. Keep English Core copy and existing catalog names.
- The user approved the preview with one correction: hide the planned exercise
  list by default. Show the current exercise and **All exercises** to expand
  the full ordered program. **Collapse** closes it; selecting an exercise,
  automatic progression and a new session return to the focused view.
- Expansion is local presentation state only. Preserve entered/completed sets,
  rest deadlines, add/remove-set confirmation, Exercise Library, Next exercise,
  finish/save confirmation, offline persistence and recovery. No fixture data,
  schema migration, new recommendation or pause feature is included.
- Synchronize the approved rules and implementation in a focused PR to
  `develop`; physical-device visual review remains separate from chat approval.

Related: `DESIGN_SYSTEM.md`, `PRODUCT.md`, `ROADMAP.md`.

## 2026-10-09 — Selected Home screenshot alignment

Status: Approved — pending Git integration

- The user selected the earlier greeting/dashboard screenshot as the Home
  reference and approved changing existing CRESUM code, Home first.
- Adopt its light spacious greeting, hero, paired summary cards and training
  week using existing native architecture and tokens. ChatGPT chrome is excluded.
- Four-week stats use trailing 28 local calendar days. Monday–Sunday completion
  marks derive from valid completed History, not a schedule; today is distinct.
- Do not hardcode identity, demo metrics, unsupported workout duration or a
  “Today” assignment. Keep existing English copy, latest results, templates,
  offline persistence and Start/Resume behavior. Other screen restyling remains
  separate. No storage migration, recommendation engine or Expo server launch.

Related: `DESIGN_SYSTEM.md`, `PRODUCT.md`, `ROADMAP.md`.

## 2026-10-05 — CRESUM Male Outfit Presets v1

Status: Approved

Decision: CRESUM Male Master identity is independent from clothing. Two approved Male outfit presets exist: `cresum-male-outfit-blue-gray-v1` revision `1` is active for the first-slice Male Technique profile; `cresum-male-outfit-black-v1` revision `1` is a stored alternative with the historical unspecified sock convention (`null`). Outfit selection is explicit, participates in provenance/hash/staleness and remains locked across START/FINISH. The approved reference image stays external; no binary asset or biomechanics/Core change is included.

Related: `EXERCISE_ASSETS.md`, `DESIGN_SYSTEM.md`, `lib/exercise-assets/specifications.ts`

## 2026-10-03 — First-slice Exercise Asset production profile boundary

Status: Approved — pending Git sync

Decision: Keep the existing Library/adapter authoritative for canonical variant identity and `EXERCISE_BIOMECHANICS.md` authoritative for general movement constraints. The first Male Technique View production profile may select consistent equipment geometry, wrapped thumbs and modest fixed torso presentation within those constraints, without backfilling catalog qualifiers or asserting universal biomechanics. The foundation produces deterministic packages and QA-bound immutable approval evidence; it does not generate images or authenticate human reviewers. Revised assets require a new draft/revision and full QA.

Related: `EXERCISE_BIOMECHANICS.md`, `EXERCISE_ASSETS.md`, `lib/exercise-assets/specifications.ts`

## 2026-10-03 — Lat Pulldown Biomechanics Specification v1

Status: Approved — pending Git sync

Decision: `EXERCISE_BIOMECHANICS.md` specifies the three exact Lat Pulldown variants as the biomechanics source of truth for future START/FINISH assets and QA. The legacy `lat-pulldown` remains unspecified. This documentation task does not generate or approve production images or change catalog muscle metadata.

Related: `EXERCISE_BIOMECHANICS.md`, `EXERCISE_LIBRARY.md`, `EXERCISE_ASSETS.md`

## 2026-10-03 — First exact Lat Pulldown variant pack

Status: Approved — pending Git sync

Decision: Add three separately identified Lat Pulldown configurations (wide pronated bar, close neutral V-handle, reverse/supinated grip) to the flat library and existing family adapter. Keep the original `lat-pulldown` unspecified and its legacy alias unchanged. Encode only justified grip, width, and attachment details; preserve separate Progress identities, schema v1, and historical snapshots. Exact biomechanics and production assets remain later stages.

Related: `EXERCISE_LIBRARY.md`, `EXERCISE_ASSETS.md`

## 2026-10-02 — Exercise Family / Variant architecture

Status: Approved

Decision: Evolve the existing 58-record flat catalog toward stable exercise families and mechanically meaningful variants. Preserve existing IDs and schema-v1 snapshots; generic old IDs retain unspecified meaning, while new exact variants get new IDs. Do not silently merge different variants in Progress. Implementation is future work.

Related: `PRODUCT.md`, `EXERCISE_LIBRARY.md`, `ROADMAP.md`

## 2026-10-02 — Exercise Asset production and naming

Status: Approved

Decision:

- Use separate START/FINISH and Male/Female assets with a naming direction based on family, variant, phase, and model, without muscle-group names or historical ID renames. Preserve pair and master-reference consistency; keep production status separate from catalog metadata.
- Preserve the future chain Exercise Library → Exercise Variant → Biomechanics Specification → Visual Specification → Prompt Builder → Image Generation → Biomechanics/Visual QA → Asset Tracker → Approved Production Asset. This sync defines no implementation schema, generator, Prompt Builder, Visual Specification, tracker, or production asset.

Related: `EXERCISE_ASSETS.md`, `EXERCISE_LIBRARY.md`, `DESIGN_SYSTEM.md`

## 2026-10-02 — Anatomy / Muscle View semantics

Status: Approved

Decision: Use gray neutral anatomy and one red family with stronger Primary and lighter Secondary intensity, mapped to the exact exercise variant. Male/Female share muscle and calculation semantics. Keep metadata, mapping, load calculation, and rendering separate; do not imply direct biological measurement. Rendering is future work.

Related: `DESIGN_SYSTEM.md`, `EXERCISE_LIBRARY.md`

## 2026-10-02 — Exercise Asset Biomechanics QA

Status: Approved

Decision: Technical correctness for the exact variant outranks visual beauty. An asset is approved only after the applicable biomechanics and START/FINISH consistency checks; generation alone is a draft. The dedicated asset document owns the acceptance gate and tracker lifecycle. QA integration is future work.

Related: `EXERCISE_ASSETS.md`, `AGENTS.md`

## 2026-10-02 — Modular, replaceable, feature-driven architecture

Status: Approved

Decision:

- Extend modular/replaceable boundaries beyond Home where they improve safety and independent evolution, while keeping domain logic separate from screen placement and avoiding a speculative rewrite.
- Reuse tokens/components. Feature Flags control experiments and rollout; capabilities/entitlements control availability and remain separate from billing sources.

Related: `PRODUCT.md`, `AGENTS.md`, `ROADMAP.md`

## 2026-10-02 — Motion supports meaning

Status: Approved

Decision:

- Make CRESUM feel alive, not animated: motion explains interaction, confirms action, or clarifies state change without slowing workout logging.
- A swipe-discovery hint is small, temporary, limited to the first suitable row, stops after discovery or a few visits, respects Reduce Motion, and can be controlled independently. Exact motion values remain experimental.

Related: `DESIGN_SYSTEM.md`

## 2026-10-02 — Muscle Load Concept Architecture v1

Status: Approved

Decision:

- Separate canonical taxonomy, exact variant mapping, factual completed sets, stimulus/contribution, raw and period aggregation, normalization, and rendering. The renderer does not calculate training meaning, and normalized UI values are never summed as raw load.
- Keep MuscleGroup separate from VisualRegion; Male/Female share analytical IDs and math. Identify mapping/model versions without approving final taxonomy, coefficients, formulas, thresholds, or migrations.

Related: `PROGRESS_ANALYTICS.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`

## 2026-10-02 — Entitlements, referrals, and recognition systems

Status: Approved

Decision:

- Keep plans/billing separate from capabilities/entitlements; paid and granted access remain distinguishable, and Feature Flags are not entitlements. Core logging, existing History, and own-data export are not subscription hostages.
- Referral value follows confirmed paid conversion and accounts for refunds; exact economics remain deferred.
- Keep Achievements/Badges/Challenges separate from commercial Rewards. Gamification supports genuine consistency without attention-heavy pressure; exact catalogs, XP, thresholds, plans, prices, and limits remain deferred.

Related: `PRODUCT.md`, `ROADMAP.md`, `AGENTS.md`

## 2026-09-29 — Account & Cloud Sync v1 architecture

Status: Approved

Decision:

- Keep CRESUM account-optional and offline-first. A local workout save succeeds independently of cloud sync; first sign-in merges valid local and cloud data rather than replacing either or asking users to choose a source.
- Target Supabase/Postgres with normalized user-owned entities, RLS, versioned migrations, stable offline IDs, explicit revisions, deletion tombstones, a durable entity-intent queue, pull/merge-before-push sync, idempotent retry, and entity-specific conflicts. Keep Core/local schema v1 behind a Sync Adapter/Mapper; active workouts remain device-local in Sync v1.
- Separate auth status from sync status and Sign Out from Reset local data and future Delete Account. Profile communicates simple sync state; temporary failures do not block local History/Progress or sign users out.
- Deliver Account/Auth Foundation, Cloud Schema + Sync Foundation, then History Backup + First Sync as separate PRs. Defer custom-workout/profile sync, conflict UX, account deletion, and any active-workout backup.
- Canonical Exercise Library metadata is product data, not per-user sync data; historical snapshots retain their meaning. Deferred, unmerged Calibration PR #17 is not a dependency or completed checkpoint.

Implementation: Documentation-only architecture sync; no Supabase code or Core readiness change.

Related: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`, `INFRASTRUCTURE.md`

## 2026-09-25 — Guided Workout Builder

Status: Approved

Decision:

- Create a custom Workout through focused steps: Workout Name → one Exercise Library selection → planned sets/optional starting weight → composition → Save Workout.
- Back preserves the local draft; only Save persists. Reuse the flow for custom workout editing where safe, retain built-in protection and explicit delete confirmation.
- Keep legacy templates valid through optional planned configuration in schema v1. Planned values may prefill a new workout but never count as completed work or rewrite history.

Implementation: Guided Workout Builder

Related: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `WORKOUT_TEMPLATES.md`

## 2026-09-25 — Future first-workout calibration and adaptive progression

Status: Approved

Decision:

- Future onboarding may lead into a conservative calibration/first workout, collect actual exercise-specific performance and simple perceived difficulty, establish a baseline, and adapt later proposed sets/load from actual history.
- Height, body weight, and sex alone do not justify a precise working weight. Recommendations must be explainable, avoid false precision, and always allow manual override; actual performed values remain historical truth. Muscle Map may be one signal, never ground truth.
- Calibration, difficulty feedback, and recommendations are not part of Guided Workout Builder and must not delay Core unnecessarily.

Implementation: Future, not this PR

Related: `PRODUCT.md`, `ROADMAP.md`

## 2026-09-25 — Modular dashboard / widget architecture

Status: Approved

Decision:

- Compose dashboard content from independent, stable-identity modules in a
  constrained grid with explicit supported sizes. Placement never owns domain
  logic; screen structure such as the header and navigation stays structural.
- Use the polished Home as the first consumer without changing its workout
  behavior or factual content. Inspired by iOS widget organization, not its
  visual design or system widgets.
- Defer reorder/show-hide, size controls, drag/drop, layout persistence/sync,
  and any schema change to separately approved work.

Implementation: Modular Dashboard Foundation

Related: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`

## 2026-09-24 — Exercise-specific Estimated 1RM series

Status: Approved

Decision:

- For a selected exercise, show one explicitly estimated Epley 1RM point per completed workout: the highest valid completed-set estimate for that exercise in that workout.
- Date the point by workout `finishedAt` and retain the source weight × reps. For equal estimates, prefer later `completedAt`, then stable ID/order. Zero is valid; one point is not a trend.
- Reuse the selected Progress period and stable exercise identity. Do not claim measured strength, percentage growth, or a new PR definition.

Implementation: Exercise-Specific Estimated 1RM Time-Series

Related: `PROGRESS_ANALYTICS.md`

## 2026-09-23 — Training volume visualization

Status: Approved

Decision:

- Keep at most seven recent, separately dated workout-volume bars in the selected Progress period, with a way to inspect every qualifying workout in that period.
- Identify full-period entries by saved completion date/time, workout name, and volume in kilograms; do not merge same-day workouts.
- Represent zero volume as zero height, not a fabricated positive bar. Keep History independent.

Rationale:

- Make the existing volume visualization truthful without defining another analytics metric.

Implementation: Training Volume Visualization

Related: `PROGRESS_ANALYTICS.md`

## 2026-09-23 — Exercise-specific logged performance

Status: Approved

Decision:

- The first exercise-specific Progress view shows factual saved performance over time: workout date, completed valid sets, weight and repetitions.
- Do not infer strength growth from weight alone or add a Strength Score, percentage improvement, or an unapproved "best set" metric.
- Keep Estimated 1RM explicitly estimated; a new Estimated 1RM trend is outside this task.

Rationale:

- Let users inspect what they actually logged without imposing an unsupported interpretation.

Implementation: Exercise-Specific Logged Performance Foundation

Related: `PROGRESS_ANALYTICS.md`

## 2026-09-23 — CRESUM product brand

Status: Approved

Decision:

- Change the user-facing product name from FitFlow to CRESUM.
- Defer technical identifiers and persistence naming to a separate focused migration task.

Rationale:

- Establish the approved product identity without risking existing storage or platform configuration.

Implementation: Product documentation now; technical rename later

Related:

- `PRODUCT.md`
- `DESIGN_SYSTEM.md`

## 2026-09-23 — Progress periods

Status: Approved

Decision:

- Use `1W · 1M · 3M · 6M · 1Y · ALL`, defaulting to `1M`.
- Finite periods roll back from explicit `now` by the corresponding local-calendar week, month(s), or year, with end-of-month and leap-year clamping.
- Include both ends of `[start, now]`; `ALL` includes all valid completed workouts through `now`; future workouts are excluded.
- Select periods by completed workout `finishedAt`. The selection scopes Progress analytics while History remains the complete archive.

Rationale:

- Keep period metrics truthful across timezone and calendar transitions without altering saved workouts.

Implementation: Progress Period Foundation

Related:

- `DESIGN_SYSTEM.md`
- `PROGRESS_ANALYTICS.md`

## 2026-09-21 — Adaptive Weight Input

Status: Approved

Decision:

- Support Recommended, Keypad, and Wheel Picker modes while retaining exact manual entry.
- Allow equipment-aware quick increments without defining a universal or complete increment table yet.
- Base future recommended weights primarily on exercise-specific history, expose customization, and prefer an insufficient-history state over a fabricated confident load.

Rationale:

- Preserve fast premium interactions without taking precise control or honest uncertainty away from the user.

Implementation: Later

Related:

- `PRODUCT.md`
- `DESIGN_SYSTEM.md`
- `ROADMAP.md`

## 2026-09-21 — Muscle Heat Map semantics

Status: Approved

Decision:

- Use a standard red intensity convention for estimated training load or stimulus.
- Do not present the visualization as literal growth, injury, medical recovery, or biological measurement.
- Keep canonical muscle metadata, load calculation, and rendering separate.

Rationale:

- Make intensity legible while avoiding unsupported physiological claims.

Implementation: Later

Related:

- `DESIGN_SYSTEM.md`
- `ROADMAP.md`

## 2026-09-21 — Explainable Training Insights

Status: Approved

Decision:

- Present Training Insights as Result → Analysis → Suggestion.
- Support a “Why?” explanation of the principal signals without fake precision or invented scientific certainty.

Rationale:

- Keep future guidance understandable, cautious, and actionable.

Implementation: Later

Related:

- `PRODUCT.md`
- `DESIGN_SYSTEM.md`
- `ROADMAP.md`

## 2026-09-21 — Suggested Next Workout timing and inputs

Status: Approved

Decision:

- Treat Suggested Next Workout and the Recommendation Engine as future capabilities that must not delay FitFlow Core.
- Allow recent history, estimated muscle load, goals, equipment, and legitimate recovery information as signals.
- Never treat the Muscle Heat Map as ground truth or simply select the least-loaded muscle.
- Preserve Customize before Start Workout and adaptation after subsequent workouts.

Rationale:

- Keep current Core delivery focused while retaining a safe path to personalized guidance.

Implementation: Future

Related:

- `PRODUCT.md`
- `ROADMAP.md`

## 2026-09-21 — Approved decision Git sync workflow

Status: Approved

Decision:

- Use Approved → Approved — pending Git sync → Codex documentation sync → implementation/checks → commit/PR → GitHub canonical after integration.
- Store durable rules in their owning repository documents and use this file only as the chronological record.

Rationale:

- Prevent approved decisions from existing only in transient conversation history.

Implementation: Now

Related:

- `AGENTS.md`

## 2026-09-25 — Onboarding Foundation and persistence boundary

Status: Approved

Decision:

- Welcome offers Personalize my training and Set up workouts myself as distinct paths; self-setup reuses the Guided Workout Builder and completes only after successful custom-workout creation.
- Personalization collects goal, experience, environment, and optional body details in resumable steps; Skip is not a permanent opt-out and Profile can reopen it.
- Persist only onboarding version, status, step, and partial answers under a separate local key. Keep `fitflow_state_v1` and `schemaVersion: 1` unchanged.
- Active workouts, history, or custom workouts bypass first-run onboarding; built-in templates alone do not. Damaged onboarding storage must not corrupt or block workout/history storage.
- Do not infer exact working weights from demographics. Calibration and Recommendation Engine remain future work.

Rationale:

- Give new users a low-friction, truthful start while preserving existing users' data and Workout Engine invariants.

Implementation: PR #16 Onboarding Foundation

Related:

- `PRODUCT.md`
- `DESIGN_SYSTEM.md`
- `ROADMAP.md`

## 2026-09-25 — Complete local data reset

Status: Approved

Decision:

- Profile → Data exposes **Reset local data** with destructive styling and explicit confirmation. It is not **Delete Account**; the two actions remain separate when Account + Cloud Sync arrives.
- After pending writes settle, temporarily back up the raw values of `fitflow_state_v1`, `cresum_onboarding_v1`, `fitflow_history`, `fitflow_active`, and `fitflow_templates`; delete and verify them. The separately approved hidden-built-in preference is also included in the complete device reset. Only then clear in-memory state and return to the true first-run Welcome screen.
- On failure, attempt to restore the backed-up values, retain the current in-memory state, and show an error. Cancel is a no-op. Keep workout persistence at schema version 1.

Rationale:

- Ensure a real device-local reset without accidental loss or re-import of legacy data, while avoiding a misleading cloud-account deletion claim.

Implementation: PR #16 Onboarding Foundation

Related:

- `PRODUCT.md`
- `DESIGN_SYSTEM.md`

## 2026-09-25 — Workout list contextual interactions

Status: Approved

Decision:

- A manageable workout row uses tap for Start/Resume, swipe left for concise quick actions, and long press for all available actions; provide an accessible non-gesture menu and leave swipe right unassigned.
- Custom workouts support Edit (including rename), Duplicate, and confirmed Delete. Built-in definitions remain immutable; Duplicate/Customize creates an independent custom workout, while Hide removes the built-in from the visible list without deleting its canonical definition.
- Persist hidden built-in IDs separately from workout schema v1, restore them from Profile, and clear that preference during Reset local data. Hide/delete never rewrites active or historical workout snapshots.

Rationale:

- Make workout management compact and native-feeling while preserving canonical built-ins, historical truth, and the existing persistence boundary.

Implementation: PR #16 Onboarding Foundation (focused UX correction)

Related:

- `PRODUCT.md`
- `DESIGN_SYSTEM.md`
- `WORKOUT_TEMPLATES.md`

## 2026-10-09 — Align the existing native app with the Core demo

Status: Approved — pending Git integration

Decision:

- Adopt the latest source-aligned Core demo as the presentation reference for the existing React Native/Expo application. Keep the working app in the existing repository and architecture.
- Use wrapping exercise/period selectors and recent-volume columns, bounded centered screen content, full Home template previews, and fractional Home volume summaries. Reuse the current theme and native components.
- Preserve existing features absent from the demo for later integration. Keep actual workout/history data, offline persistence, active-workout recovery, onboarding, library and workout management, and detailed analytics intact. No separate web client or storage migration is part of this change.

Rationale:

- Make the approved demo presentation part of the working app without removing capabilities or replacing real data with simulated state.

Related:

- `DESIGN_SYSTEM.md`
