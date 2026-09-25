# Modular Dashboard Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing polished Home content into independent modules in a small, deterministic grid without changing its visible workflow.

**Architecture:** Keep Safe Area, Home header, and Dock structural. Project saved workout/template data outside the grid; render primary workout, training summary, latest workout, and template modules by stable ID through a two-column row composer. Current modules support only the full-width `medium` size; the grid also understands a half-width `small` size for later use, without exposing customization.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, Jest, react-test-renderer.

**Spec:** `docs/PRODUCT.md`, `docs/DESIGN_SYSTEM.md`, `docs/ROADMAP.md`, and the approved Modular Dashboard decision recorded in `docs/DECISIONS.md`.

## Global Constraints

- Preserve Home appearance and Start/Resume semantics from PR #12.
- No drag/drop, user resizing, layout persistence, new metrics, or other-screen redesign.
- Keep persistence schema v1 and `fitflow_state_v1` unchanged.
- Use existing spacing/theme tokens and shared cards/buttons.

## Review Focus

- Active workout: Resume remains first and secondary Start actions remain disabled.
- Missing exercise references: unavailable templates remain visible but cannot start.
- Out-of-order History: the latest completed workout is selected by `finishedAt`.
- Long names/Dynamic Type: grid height remains content-driven, never clipped to a fixed row height.
- Odd half-width row: does not stretch the final item or cause horizontal overflow.

---

### Task 1: Stable Home projection and module identity

**Files:** Create `lib/home-dashboard.ts`; test `lib/__tests__/home-dashboard.test.ts`; modify `app/index.tsx` to consume the projection after tests pass.

**Interfaces:** `projectHomeDashboard(history, activeWorkout, templates)` returns total volume, latest workout, featured template, remaining templates, and existing exercise details. `HOME_WIDGET_LAYOUT` identifies `primary`, `summary`, `latest`, `templates` in fixed order, each with supported/default `medium` size.

- [x] Write failing tests for latest-by-date, available featured template, active workout, and deterministic IDs/order.
- [x] Run `npm test -- --runTestsByPath lib/__tests__/home-dashboard.test.ts`; verify failure due to missing projection.
- [x] Implement the projection using existing `volume` and `findExercise`, without changing store/domain behavior.
- [x] Run the focused test and full `npm test`.

### Task 2: Token-based grid and Home modules

**Files:** Create `components/DashboardGrid.tsx` and `components/HomeDashboard.tsx`; modify `app/index.tsx`; test `lib/__tests__/dashboard-grid.test.tsx` and extend `lib/__tests__/home-dashboard-screen.test.tsx`.

**Interfaces:** `DashboardGrid` accepts ordered `{ id, size, content }` items; `small` occupies one of two columns and `medium` occupies both. `HomeDashboard` receives the existing Home props and renders four existing content modules in the stable order. All current modules use `medium`.

- [x] Write failing grid tests for two small items sharing a row, an odd small item occupying half a row, and a medium item taking a full row without fixed height.
- [x] Run `npm test -- --runTestsByPath lib/__tests__/dashboard-grid.test.tsx`; verify expected failure.
- [x] Implement the minimal row composer with `spacing.lg`, flex children, and no absolute positioning or fixed height.
- [x] Extend Home behavioral tests to assert module identity/order and unchanged Start/Resume/metrics; watch them fail before extracting Home.
- [x] Extract existing Home content into focused module components, leaving screen structure outside the grid.
- [x] Run focused tests and full `npm test`.

### Task 3: Final validation and review

**Files:** Only in-scope files above and the approved documentation sync.

- [x] Review diff for visual/behavior preservation and classify Critical/Important/Minor findings.
- [x] Run `npm run check`, `npx expo-doctor`, `npm run export:check`, and `git diff --check`.
- [x] Fix only in-scope Critical/Important regressions and rerun checks.
      Publication (commit, push, one PR to `develop`, CI) is recorded by GitHub rather than this plan. Do not merge.
