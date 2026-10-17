# CRESUM Decision Log

## 2026-10-15 — Safe discard of an active workout

Status: Approved — implementation in focused PR, pending Git integration.

Continue the approved audit sequence after PR #47: allow confirmed discard of
the active workout even before the first completed set. Cancel preserves it;
confirmed discard removes only that active session after successful storage,
never creates History or completes a program slot, and retains routines and
existing History. Guard the captured session ID, pending writes and overlapping
mutations. Failed storage retains the session and exposes retry. Use the shared
destructive confirmation and return Home only after a durable success.

Related: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`.

## 2026-10-14 — Reliability audit: start with completion-time safety

Status: Approved — implementation in focused PR, pending Git integration.

The user approved starting with the most critical audit finding and continuing
in priority order. First reject invalid Finish timestamps before persistence,
retain the active workout and all logged data, explain the device-time issue,
and allow retry. Preserve schema/keys and strict non-destructive loading; do not
silently change timestamps. Next: safe discard of an accidentally started
workout. Remaining audit items stay separate from this fix.

Related: `PRODUCT.md`, `ROADMAP.md`.

## 2026-10-14 — Library exercise statistics and centered brand

Status: Approved — pending Git integration

- Implement the approved Library → Statistics → Logged sets mockup using saved
  completed sets, exact variant IDs and existing rolling periods.
- Expose estimated 1RM, period volume and top logged weight with honest missing
  comparison/empty states; paired sets retain both sides and have no 1RM.
- Use a shared centered CRESUM wordmark, preserving the light design system.
- No storage migration, recommendations, new artwork or cross-machine merging.

Related: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`

## 2026-10-13 — Activate approved Wheel / Keypad Set-entry mockup

Status: Approved; implementation in focused PR.

Incomplete weight/repetition cells open a shared draft sheet with native wheels, exact keypad, visible +/- steps, previous completed set and explicit Save/Cancel. Save edits values only; completion/rest remains separate. Preserve bilateral values, precise decimals, snapshot identities and stored history. Initial steps: barbell total 2.5 kg, dumbbell/kettlebell 1 kg, cable/machine 5 kg, fallback 2.5 kg; reps 1. Shared AppPicker owns native feedback. Empty fields open Keypad; explicit Wheel selection initializes missing values to 0 kg / 1 rep, not a recommendation. Recommendations, preference persistence and duration/distance logging are not included. Physical iPhone acceptance remains required.

Related: PRODUCT.md, DESIGN_SYSTEM.md, ROADMAP.md.

This chronological log records approved decisions. The owning product, design, roadmap, and engineering documents remain the detailed sources of truth.

## 2026-10-11 — Goal-based weekly training programs: approved initial basis

Status: Approved — pending Git integration; implementation not started.

- The user approved the researched basis for nine Gym programs: Build muscle,
  Get stronger and General fitness × Beginner, Some experience and Experienced.
  Corrections may follow; preserve the version of any already accepted plan.
- Sources: ACSM, NSCA, ACE, HSS and NHS primary materials. Program movements
  and extracted facts are traceable; the combined CRESUM matrix is our
  adaptation, not a published or validated nine-program package from them.
- Remove Training Environment from new personalization, default to Gym, and
  keep Home workouts manual. Read legacy answers/progress compatibly.
- Retain exercises absent from the library. Library expansion is the next
  prerequisite; do not drop/substitute movements or execute unknown IDs.
- Completion uses START! to accept the shown program and open Home, without
  starting a workout. Show truthful readiness and durable-save/error states.
- Preserve existing custom routines, active workouts, History, offline access
  and schema-v1 compatibility. Targets and actual results remain separate;
  no demographic-derived weights, timed work as reps or cardio estimated 1RM.
- Use versioned authored programs and idempotent acceptance/recovery. Planned
  weekly activity stays distinct from actual completed sessions; missed days
  do not double subsequent volume. Alternative frequency variants need checked
  prescriptions before they can be offered.

Specification: [approved research and prescriptions](superpowers/specs/2026-10-11-goal-training-programs-design.md).
Delivery: [implementation plan](superpowers/plans/2026-10-11-goal-training-programs.md).
Owning rules: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`.

## 2026-10-11 — Selected Profile mockup

Status: Integrated in develop through PR #34 (merge `603a0b8549bc563c1e8a3afb748dfd6eb9296f9e`).

- The user approved Profile's generated light mockup and its implementation
  as a focused PR after Home, Workout and Progress alignment.
- Use the same brand/header language, readable type hierarchy and rounded white
  cards for existing workouts, conditional hidden-workout restoration,
  personalization, local data and About. Create follows the workout rows;
  Restore/reset are compact text actions and Personalization is a chevron row.
- Preserve all existing actions, menus, gestures, destructive confirmations,
  errors, real version metadata, offline data and the shared smooth up-arrow.
- Reuse Home's factual template projection for planned-set counts, including
  legacy defaults/unavailable references. Do not copy demo fixtures or infer
  performed sets. The mockup's About chevron is decorative, not a new route.
- No Account/Auth, cloud sync, new settings, Expo server or automatic merge.
  Native phone/Dynamic Type/gesture review remains required.

Related: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`.

## 2026-10-10 — Full-period volume curves and phone feedback

Status: Approved — pending Git integration

- 1M uses the last 30 local-calendar days for all Progress projections and the
  previous-period comparison. Longer periods retain their selected ranges.
- Keep 1W bars. From 1M onward, draw all saved workout volumes as a smooth
  shape-preserving curve on a real timestamp axis, without invented rest-day
  zeros or extrapolation. Sparse data remains explicit; selected points expose
  factual date/workout/kg details and accessible previous/next actions.
- Keep unavailable comparison in the same right-hand slot using compact
  “No data”, and explicitly darken Workout volumes heading/kg values.
- Preserve History, saved snapshots, analytics formulas and offline storage.

Related: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`.

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

- Treat Suggested Next Workout and the Recommendation Engine as future capabilities that must not delay CRESUM Core.
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

## 2026-10-10 — Compact History and independent filter

Approved by the user's implementation request: History defaults to three newest
saved workouts, with a filter below the results. A separate window offers a
recent-workout count wheel (All instead of zero, then 1…saved count) or an
inclusive From/To date range defaulting to seven calendar dates including today.
Circular green-check selectors choose one criterion. Show applies and returns;
cancelling leaves applied results unchanged. Picker Back discards unfinished
picker changes. Workout details retain the filter on return. Progress periods,
stored snapshots and schema v1 are unaffected; All exposes the full archive.
Status: approved — pending Git integration and native wheel/sheet/phone QA.

## 2026-10-11 — Compact exercise graph and section navigation

The user approved moving the History filter directly below its heading, before results; this supersedes the 2026-10-10 bottom placement. Logged exercise performance now presents the existing estimated 1RM series as weekly bars and selected-period curves from 1M onward, with all estimates and actual completed sets in separate detail sheets. The up-arrow appears after scrolling, first returns to the current section start, then to the page top; manual scrolling resets this sequence. Saved data, exercise identity, formulas and workout flow remain unchanged.

## 2026-10-11 — App-wide smooth return control

The user extended the approved up-arrow to all application pages and requested smooth upward scrolling similar in feel to ChatGPT. Use shared vertical scroll/list wrappers across screens and detail sheets, preserving the native ref and scroll/layout callbacks required by active-workout reordering. Native animated scroll supplies easing; Reduce Motion disables animation. Existing section/page two-step navigation remains; single-section lists return to their start. Horizontal filters, number wheels and their compact header scroller remain independent controls. Exact ChatGPT velocity is not measurable here; perceived pace requires device acceptance. No workout/domain/storage changes.

## 2026-10-11 — Starter-program implementation checkpoint

Following approval of PR #35, the nine Gym variants are implemented as a
versioned catalog. Four required exercise variants retain new stable identities;
unloaded Step-up is explicitly a CRESUM adaptation of the source movement.
Targets are separate snapshots from actual values. Paired left/right results
require both actual counts, include their sum in volume and exclude combined
Epley estimates. Existing saved unilateral accounting remains unchanged.

START! accepts the reviewed plan through a recoverable roll-forward journal,
installs its complete routine batch, saves personalization and opens Home with
no active session. A canonical installation marker prevents deleted or edited
routines from being overwritten during retry. The planned week is independent
of actual completion statistics and supports explicit slot-linked workouts.
Phone/accessibility review and GitHub integration are still outstanding.

## 2026-10-11 — Profile identity and body-weight follow-up

User requested the compact WORKOUTS wordmark entry and separate saved-routines page, consistent dark primary text, stored-name Home greeting and new first-run order: Welcome/name → optional DOB/height/weight → Goal → Experience → START!. DOB replaces age input with compatible legacy reads; birthday greetings remain deferred. Starting body mass seeds its own factual journal once; current measurements drive a neutral Progress curve independently of training volume. Existing management, manual setup, History and shared smooth return control remain. Status: implemented on feature branch, pending PR integration and physical-phone QA.

## 2026-10-11 — Shared Apple wheels, Profile library and monthly Home calendar

Approved for implementation by the user's explicit request. Replace date keyboard entry with shared day/month/year wheels and confirmed drafts. Use local native UIPickerView on iOS, discrete selection feedback and the system-managed wheel click, without undocumented sound IDs; shared snapping fallback elsewhere. Require physical-device/native-build validation. Profile opens the complete existing catalog through EXERCISE LIBRARY directly after WORKOUTS. Home displays its factual week above the primary workout and offers a full-month completion calendar. Preserve exercise identities, saved workouts and History semantics; no new planning subsystem.

## 2026-10-12 — Exercise Technique mockup approved; weight entry deferred

User approved Library right-hand square thumbnail + Technique label, page-sheet instructions and enlarged START/FINISH viewer. Requested source-grounded execution and common mistakes for all exercises; images remain placeholders until available. Implement a separate offline technique catalog with per-entry references/adaptation notes, preserve generic identities and Add/selection semantics, and reuse the guide from active Workout. No logging/storage rewrite or unreviewed image production. Native viewer image gestures/transitions await reviewed assets; current guide uses native slide and phase buttons. Weight-entry mockup is retained as a deferred draft. Pending focused PR integration and phone/editorial QA.

## 2026-10-13 — CRESUM technical branding with installation compatibility

Status: Approved — pending Git sync and repository administration

Decision:

- Extend the approved product rebrand to the app display name, npm package,
  Expo slug, current product documentation, and primary URL scheme.
- Keep existing storage keys, schema version 1, installed iOS/Android IDs,
  and the legacy URL scheme so rebranding cannot hide workouts or split the
  installed application. These are compatibility identifiers, not product copy.
- Rename the GitHub repository to `FazuzuDE/CRESUM` through an authorized
  administration surface, then update verified source URLs and local remotes.
  The content PR alone does not perform this administrative operation.

Related: `REBRANDING.md`

## 2026-10-15 — Audit follow-up: consistent estimated records

Continue the approved reliability audit after merged clock safety (#47) and active-workout discard (#48). Preserve Epley and periods, but apply positive external-load/non-paired estimate eligibility to Progress, logged performance and Library alike. Keep zero and paired logs/volume intact. Resolve equal estimates by later completion, encoded workout/exercise/set IDs and saved indices through a shared comparator. TOP PR remains the largest eligible estimate in the selected period, not a new measured/lifetime record. No historical rewrites, migrations or dependencies. Implementation on focused branch; native phone acceptance remains pending.

## 2026-10-15 — Offline file backup approved and implemented

User approved local export and confirmed safe restore before cloud backup. Versioned JSON includes the five local document families and active session; exclude auth/unrelated keys. Validate before preview, replace rather than merge, reject current active-session overwrite and unsaved changes, preserve memory on export/preflight failure. Persist/verify the exact old snapshot as a rollback journal before any replacement; recover before app loads and block writes if rollback is incomplete. Shared file adapters use SDK-matched native Files/share modules with a web fallback. Restore completion or an ambiguous committed-write error reloads coherent storage only after a saved-state preflight; newest sidecar errors are read live after draining. Physical native picker/share/crash acceptance remains pending.

## 2026-10-15 — Profile backup mockups approved for the next PR

After merging #50, the user requested Profile implementation matching the generated mockups in #51. Approved scope: one Backup & restore menu row, a dedicated backup page, every-workout/weekly/monthly automatic-backup options, additive file-based History import with preview and skipped duplicate workout IDs, and a separate full-replacement Restore all data action. Preserve existing History and all #50 recovery safeguards. Actual scheduling, copy destination and last-success status must be implemented truthfully; the UI must not imply unsupported background or cloud behavior. Status: implemented in #51 — pending Git integration. Actual copies alternate two verified native app-document files, ordered by sequence independently of wall-clock changes. Scheduling runs while open/next opened, defaults off and rechecks live policy after draining writes. Import reuses the rollback journal and preserves existing workout IDs. Reset disables policy while explicitly retaining saved files. Native phone acceptance remains pending.

## 2026-10-15 — Resume Account/Auth after merged Profile backup

User confirmed #51 merged and approved continuation toward staged cloud backup. Merge verified at `3e6a78895b5c11c01ffc5b097eabcc9afc71817f`. Reuse frozen auth checkpoint `618c7e202ec5e673a404c382c5438b3730682adf` through a new branch on current develop, preserving the original checkpoint. First focused PR integrates optional six-digit in-app Email OTP and a compact Profile Account page; keep one auth owner above LocalDataGate and exclude auth storage from Core backup/reset. Sign Out preserves workouts, Apple/Google stay disabled, and account connection makes no cloud-backup claim. Real custom-SMTP OTP and native session acceptance remain unverified. Cloud schema/RLS/queue and History first sync follow separately. Status: implemented and automated checks passed on integration branch — pending Git integration and external acceptance.

## 2026-10-15 — Development Email OTP settings confirmed

User authorized setup, connected Supabase and explicitly confirmed changing the existing development project's OTP from 8 digits / 3600 seconds to 6 digits / 600 seconds. The existing paused `cresum-dev` project was restored; healthy status, database connectivity and saved OTP parameters after Dashboard reload were verified. Public client config stays in the ignored local environment file. Email confirmation remains enabled. The user has no domain yet; custom SMTP is disabled and the current sign-in template sends a link, so domain/Resend setup, OTP templates, real delivery and native acceptance remain pending. No paid plan/domain purchase, real OTP email, schema/RLS migration or cloud sync was performed. Status: external settings applied — documentation pending Git integration.

## 2026-10-15 — Continue cloud foundation; defer domain/mail

User confirmed #52 merged (verified `8f2029430b7d19201d78e2a39f150e530da1a4c6`),
deferred domain purchase/SMTP and requested continued development. Continue the
approved Cloud Schema + Sync Foundation stage with normalized completed-history
tables, explicit owner RLS/grants, immutable identities, revisions/tombstones and
durable per-account local intent metadata. Preserve repeated nested historical
IDs by position. Guard late acknowledgements with account generation, entity ID
and local sequence. Reset clears metadata through the existing rollback flow;
auth/device identity and Core backup journal stay compatible. No transport is
activated and no migration is applied remotely before Git review/integration.
History publication/merge and recovery activation follow separately. Status:
implementation prepared on focused branch — pending Git integration and external acceptance.

## 2026-10-15 — GitHub rename verified

The owner renamed the repository to `FazuzuDE/CRESUM`. The new PR #52 URL and
`develop` merge commit were verified. Update current source links, the local
Git remote and picker podspec to the new address, preserving installed app IDs,
legacy storage keys and `fitflow://` compatibility. External repository-bound
integrations require their own verification. Status: links updated — pending
Git integration.

## 2026-10-15 — History protocol after merged #53; disaster recovery at release

User confirmed #53 merged and requested continued development. Merge verified
at `c1f757280e3ec247d5ca353a4c373af4ad6a0bca`. Split History first-sync at
the atomic server protocol boundary: lossless Core mapping, owner-scoped
revision checks, idempotent mutation receipts, complete aggregate publication
and ordered pulls precede app activation/recovery/account-provenance wiring.
Public wrappers are invokers; narrowly privileged implementations stay private
and direct client writes are revoked by the new migration. No active-session
sync or additional account client is introduced.

The user explicitly deferred independent backup infrastructure until release;
record off-platform database copies and a verified restore drill as a release
gate, retaining offline Core and file export. Status: protocol prepared —
pending Git integration; app sync and real email remain inactive/unaccepted.

## 2026-10-15 — Activate completed-history sync after merged54

User confirmed54 merged; verified `84e7fe59bb03337084e38c8380c058f317c0af32`.
Continue the approved History integration in Profile Account & Sync. Explicit
Enable assigns unowned history to the selected account; durable account claims
keep known other-account history separate. Pull first, preserve local divergence,
use stable request fingerprints/tokens, then verify Core writes before advancing
cursors. Bind every SDK request to the captured user's token, with a15s deadline.
Use lazy SDK-matched expo-crypto SHA-256/UUID, preserving offline Core.

Import/restore/reset persist a cloud pause and drain writes without waiting on
network replies. Resume does a full reconciliation. Reset retains metadata-only
account links and pause/auth/device identity; file export excludes them. Temporary
archive/export operations only suspend. The existing protocol is deployed to dev,
with its generated timestamp reconciled by exact SQL hash to the committed
version. No fixture users or real email was created/sent. Status: implementation
on focused branch, pending final checks/review/Git integration and external QA.

### 2026-10-16 — Secure IDs for new workouts approved

The user approved UUID v4 for new workouts after reviewing the existing
timestamp/Math.random generator and owner-scoped cloud identity. Inject lazy
expo-crypto randomUUID through WorkoutStore's existing engine ID-factory seam.
Preserve every existing ID through load/resume/Finish/export/import; do not
migrate historical data or add dependencies/schema changes. Secure-generation
failure leaves Core unchanged rather than silently using the weak generator.
Native crypto is now also used on new offline workout starts; new device builds
must include the already-declared module. Conflict-resolution design remains a
separate proposal, not an approved implementation in this change.

### 2026-10-16 — Simplified conflict-resolution UX approved

The user approved automatic ordinary merges and an explicit comparison only for
genuine divergence, with per-version choice and Decide later. Keep both moves
under More options with a duplicate-statistics warning. Time remains context,
not automatic overwrite authority. Confirm replacement, refresh stale choices,
and preserve account/active/recovery boundaries. This supersedes the earlier
proposal to emphasize Keep both as the main action. Implementation proceeds
through the focused design/plan and PR workflow, with native/device QA separate.

Implementation uses one atomic owner-scoped server resolution with exact private
replay snapshots, replacing the proposed multi-publication client saga. Stable
metadata-only device intents recover timeout/ambiguous Core writes before normal
sync. A new UUID is created once for Keep both; only the root identity changes.
Receipt storage/retention and native acceptance remain release gates. No live
database changes are included in branch implementation.

### 2026-10-16 — Merged conflict protocol deployed to cresum-dev

After the user merged PR #57 and resumed development, apply its exact SQL to the
existing cresum-dev project. Verify predecessor/source hashes, owner/session and
revision guards, authenticated-only execution and unchanged direct-write grants.
Align only the connector-generated migration record with the committed canonical
version after an exact name/hash match; do not rerun the migration. Probe with
transactions that roll back and do not create fixture accounts/workouts or send
email. Security-advisor findings match the prior baseline. Native/two-device/mail
and disaster-recovery release gates remain unchanged; the source preview is not
evidence that those gates passed.

### 2026-10-16 — Complete the approved comparison summaries

After deployment verification, the user resumed development of the remaining
comparison-card summary item. Show completed-set count and recorded volume on
both version cards using the existing engine/metrics helpers. Exclude unfinished
sets, preserve valid zero-weight volume, and distinguish unavailable volume from
partial coverage. This completes the already approved comparison design rather
than changing resolution choices or saved data. Keep the implementation focused
on presentation and tests; no new dependency, schema or protocol is needed.

## 2026-10-16 — Account deletion server foundation after #59

- User confirmed #59 merged and requested continued development after the account-management roadmap discussion.
- Deliver server deletion and client confirmation as separate focused PRs. The server target comes from verified Auth, with a matching expected-account confirmation guard and hard-delete API.
- Preserve all local Core data/files/provenance. Verify owner cascades and another account's exact snapshots in disposable PostgreSQL.
- This branch does not deploy the endpoint, delete live accounts, expose a Profile button or claim device acceptance. Client lifecycle/confirmation remains the next delivery.

## 2026-10-16 — Profile account deletion after merged #60

- User confirmed #60 merged and approved continuing with Profile confirmation, sync stopping and local-data preservation.
- Add typed DELETE tied to the named account. Keep the build-time rollout disabled until reviewed server deployment/gateway verification; do not deploy or delete live users in this client task.
- Persist metadata-only pending/confirmed state outside Core backup/reset, fence owner sync across restart, and require a matching server acknowledgement before owner-specific session cleanup.
- Preserve local workouts/files/provenance and account B on late account-A completion. Recover confirmed cleanup locally without repeating deletion; unconfirmed network outcomes remain truthful and require explicit user retry.
- Reuse existing tokens/coordinator, add no dependency/schema migration, and close #60's additional SDK error-translation regression coverage.

## 2026-10-16 — Deployment checkpoint after merged #61

- User approved the next account-deletion rollout stage. Reviewed function source
  deployed to cresum-dev, active version 1, verify_jwt enabled; exact source
  readback, preflight and unauthenticated rejection verified.
- Keep client rollout off pending a real disposable test-user session and
  successful owner-bound deletion, then device acceptance. No existing user was
  deleted; no test user or email was created. See ACCOUNT_AUTH for evidence.

## 2026-10-17 — Autonomous Home customization follow-up

- User postponed Dashboard/test-account deletion acceptance and requested another
  task deliverable without their participation. Deletion remains off.
- Selected the roadmap Home customization follow-up: transactional Save/Cancel,
  accessible move buttons, optional block visibility, protected primary action,
  and local persistence. Default restoration includes all blocks.
- Implementation choices: retain medium sizes and the existing grid; keep active
  program details next to Resume. Preferences survive workout reset/restore and
  stay outside backup v1/cloud. No new dependencies. Errors preserve workouts
  and saved preferences, with explicit retry/reset. Native acceptance is separate.

## 2026-10-17 — Home hold-and-drag editing approved

- After merging #63, user approved the proposed long-hold → wobble/haptic →
  drag → Done/Cancel interaction. Keep arrows as accessible alternative and
  honor Reduce Motion.
- Extend the existing local layout without changing workout state or schema.
  Inline editing guards child actions and keeps Resume/program as one block.
  The fixed edit bar preserves card position on activation; use measured heights
  and existing edge-scroll controls. Save is explicit and retryable.
- Existing sheet edits the same draft; device gesture/VoiceOver/haptic validation
  remains separate from automated source-level/native JS export checks.

# 2026-10-17 — Factual Muscle Map implementation approved

- User approved the mockup and instructed implementation. Reuse existing 17
  muscle IDs and primary/secondary catalog mappings without reclassifying them.
- Extend Progress with local read-only participation, three periods, schematic
  front/back regions and traceable completed-set details. No stored derived data.
- Count each completed journal row once, regardless of load or bilateral reps;
  retain separate per-muscle roles, aliases and exact exercise identities.
- SVG geometry is original schematic artwork, not copied third-party anatomy.
  Use Expo-compatible react-native-svg for native rendering. A realistic 3D
  anatomical asset, medical validation and native acceptance are not claimed.
- Stimulus formulas, fatigue/recovery and recommendations remain deferred.

## 2026-10-17 — Muscle Map visual revision approved

- User found the first map visually weak while its interaction appeared to work,
  and approved continuing with a curved anatomical-style SVG refinement.
- Revise original silhouette/group geometry and fixed shading in the open #65;
  retain existing counts, source-set details, periods and catalog semantics.
- Keep all 17 groups selectable through text alternatives, use unique gradient
  IDs for simultaneous overview/detail maps, and restrict calf highlights to the
  posterior calf rather than mislabeling the anterior shin.
- Rebuild the in-conversation preview for acceptance; no automatic merge.

## 2026-10-17 — Anatomical source selected; per-group layers requested

- After merged #65, the user selected the detailed grayscale anatomical
  front/back character and approved the small smooth central modesty insert.
- Requested independent muscle layers for future load-map changes. Keep the
  existing 17 group IDs, a shared canvas, source integrity and separate view/side
  parts. Deliver editable draft masks and a review tool before app integration.
- Appearance selection does not approve anatomical correctness or draft masks.
  No stimulus/recovery calculation, exercise mapping or runtime renderer changes.

## 2026-10-17 — Individually separated anatomical 3D source approved

- User approved evaluating an anatomical 3D model with separate muscles as the
  source for precise aligned front/back images, visible masks and shading.
- Preserve selected character appearance, modesty insert and existing 17 group
  semantics; individual anatomical objects may aggregate into one app group.
- Current manual masks are an experiment, not anatomical ground truth. #66 is
  retained as an unmerged draft checkpoint; this approval does not authorize its
  merge or production use of its contours.
- Validate source anatomy, separation, rights and export with a small sample
  before full adaptation. App may retain 2D presentation; live 3D/deep anatomy
  and training-stimulus algorithms are not part of this approval.

## 2026-10-17 — 3D unavailable; continue 2D

- User explicitly directed continuing with 2D while no 3D model is available.
  Defer 3D production/registration and retain it as a future option.
- Refine chest/lats/quadriceps on the selected unchanged source with anatomy
  reference notes, explicit anatomical sides and visible component masks.
- Keep #66 as Draft. Manual fitting and reference reading do not constitute
  exact anatomical segmentation or expert approval; catalog and app stay stable.
