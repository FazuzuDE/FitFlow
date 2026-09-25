# CRESUM Decision Log

This chronological log records approved decisions. The owning product, design, roadmap, and engineering documents remain the detailed sources of truth.

## 2026-09-25 — Guided Workout Builder

Status: Approved — pending Git sync

Decision:

- Create a custom Workout through focused steps: Workout Name → one Exercise Library selection → planned sets/optional starting weight → composition → Save Workout.
- Back preserves the local draft; only Save persists. Reuse the flow for custom workout editing where safe, retain built-in protection and explicit delete confirmation.
- Keep legacy templates valid through optional planned configuration in schema v1. Planned values may prefill a new workout but never count as completed work or rewrite history.

Implementation: Guided Workout Builder

Related: `PRODUCT.md`, `DESIGN_SYSTEM.md`, `WORKOUT_TEMPLATES.md`

## 2026-09-25 — Future first-workout calibration and adaptive progression

Status: Approved — pending Git sync

Decision:

- Future onboarding may lead into a conservative calibration/first workout, collect actual exercise-specific performance and simple perceived difficulty, establish a baseline, and adapt later proposed sets/load from actual history.
- Height, body weight, and sex alone do not justify a precise working weight. Recommendations must be explainable, avoid false precision, and always allow manual override; actual performed values remain historical truth. Muscle Map may be one signal, never ground truth.
- Calibration, difficulty feedback, and recommendations are not part of Guided Workout Builder and must not delay Core unnecessarily.

Implementation: Future, not this PR

Related: `PRODUCT.md`, `ROADMAP.md`

## 2026-09-25 — Modular dashboard / widget architecture

Status: Approved — pending Git sync

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

Status: Approved — pending Git sync

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
