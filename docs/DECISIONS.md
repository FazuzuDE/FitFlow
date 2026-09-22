# FitFlow Decision Log

This chronological log records approved decisions. The owning product, design, roadmap, and engineering documents remain the detailed sources of truth.

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
