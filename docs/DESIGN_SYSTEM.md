# CRESUM Design System v1.0

**Status:** approved baseline for CRESUM Core
**Stack:** React Native + Expo + TypeScript  
**Direction:** Light Premium / Apple-inspired iOS UI  
**Primary:** `#0A84FF`

## 1. Principles

CRESUM must feel fast, calm, precise and premium. Workout logging always has priority over decoration.

- Clarity first: weight, reps, sets, rest and progress are readable at a glance.
- One obvious primary action per screen.
- Low friction: large tap targets, sensible defaults, minimal typing, haptics.
- Light mode is the primary brand expression. Dark mode comes later as a system adaptation.
- Reuse tokens/components before creating new patterns.

## 2. Colors

| Token         | Value                 | Use                            |
| ------------- | --------------------- | ------------------------------ |
| primary       | `#0A84FF`             | CTA, selected nav, active data |
| secondary     | `#5E5CE6`             | Secondary analytics            |
| background    | `#F7F7F9`             | App background                 |
| surface       | `#FFFFFF`             | Cards/sheets                   |
| surfaceSubtle | `#F2F2F7`             | Secondary controls             |
| textPrimary   | `#111111`             | Main text                      |
| textSecondary | `#6E6E73`             | Metadata                       |
| textTertiary  | `#AEAEB2`             | Placeholder/inactive           |
| separator     | `rgba(60,60,67,0.12)` | Dividers                       |
| success       | `#34C759`             | Completed sets                 |
| warning       | `#FF9F0A`             | Warnings                       |
| danger        | `#FF3B30`             | Destructive/error              |

No neon palette. Gradients are not the default treatment.

## 3. Spacing — 8pt grid

```ts
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;
```

Normal screen horizontal inset: `16`. Major section gap: `24`.

## 4. Radius

```ts
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;
```

Cards normally use `20–24`; hero cards may use `28`.

## 5. Typography

Use the native/system font stack. On iOS this resolves naturally to San Francisco/SF Pro. Do not bundle a custom font merely to imitate SF Pro.

| Style       | Size | Weight | Line height |
| ----------- | ---: | -----: | ----------: |
| largeTitle  |   34 |    700 |          41 |
| title1      |   28 |    700 |          34 |
| title2      |   22 |    700 |          28 |
| title3      |   20 |    600 |          25 |
| headline    |   17 |    600 |          22 |
| body        |   17 |    400 |          24 |
| callout     |   16 |    400 |          21 |
| subheadline |   15 |    400 |          20 |
| footnote    |   13 |    400 |          18 |
| caption     |   12 |    500 |          16 |

Prefer tabular numerals for timers, weights and stats.

## 6. Surfaces / shadow / glass

Default card: white surface, radius `24`, padding `16–20`, no unnecessary border.

Suggested subtle shadow:

```ts
shadowColor: '#000000'
shadowOpacity: 0.06
shadowRadius: 16
shadowOffset: { width: 0, height: 6 }
```

Glass is an accent, not the entire UI. Use blur mainly for the floating bottom dock, overlays and compact floating controls. Target blur: roughly `20–30`, with readable contrast and opaque fallback.

## 7. Core components

**PrimaryButton:** height 56, radius 16, primary blue, white headline text, 20 horizontal padding, >=44x44 touch target, subtle press feedback + light haptic.

**SecondaryButton:** white/surfaceSubtle with dark text and matching geometry.

**IconButton:** 40–44 visual size, >=44x44 touch target, circular or 12–14 radius.

**Card:** radius 24, padding 16, one conceptual group per card.

**StatCard:** one primary value, one short label, optional trend.

**Numeric workout input:** large number, numeric keyboard, unit visually secondary, useful +/- controls, previous-set defaults where appropriate.

**Adaptive weight input:** support Recommended, Keypad, and Wheel Picker interaction modes when implemented. Exact manual entry is always available. Quick +/- controls use context-appropriate, equipment-aware increments and never prevent a precise override. Keep all modes within the existing light, premium iOS-inspired control language.

**Chips/segments:** height about 32–36, pill radius, clear selected state.

## 8. Navigation

Primary tabs: **Home · Workout · Progress · Profile**.

Active tab uses `primary`, inactive tabs `textSecondary`. A translucent/floating dock is allowed if it does not steal useful workout space. During an active workout, avoid navigation that can accidentally discard the session.

### Onboarding

Welcome presents the two approved choices with equal clarity: a primary **Personalize my training** action and a secondary **Set up workouts myself** action with explanatory copy. The self-setup choice is valid, not an error or permanent opt-out. Personalization uses one focused, scrollable step at a time: Goal → Experience → Environment → optional body details → completion. Back retains answers; controls have labels, selection state, and practical touch targets. The first-workout path uses the existing Guided Workout Builder. Completion copy must not imply that a workout, exact weight, or AI recommendation was generated. Profile keeps a later personalization entry. Use existing light theme tokens, safe-area layout, keyboard-aware scrolling, Dynamic Type-friendly text, and compact-screen spacing.

## 9. Workout UI

### Guided Workout Builder

Use one obvious primary action per focused step: Workout Name → Exercise Library single selection → planned sets/optional starting weight → ordered composition → Save Workout. Keep Back and Cancel distinct; Back retains the local draft, and Cancel confirms before discarding meaningful changes. Use existing type, color, spacing, radius and card tokens. Exact manual weight entry remains available; no inferred or recommended weight is shown here. Planned values must be labeled as editable starting values, not performed sets.

### ExerciseCard

Order:

1. Exercise name
2. Optional illustration
3. Previous performance/context
4. Set rows
5. Add-set/exercise actions

### SetRow

Recommended columns: `SET | PREVIOUS | KG | REPS | ✓`

Completion must be easy to hit during training. Completed state uses `success` without reducing readability.

### RestTimer

Functional, not decorative: prominent remaining time, pause/skip where useful, `+15s/-15s`, completion haptic, recoverable while navigating inside the active workout.

### Finish Workout

Deliberate primary action. Normal Finish summarizes and saves. Destructive abandonment requires confirmation.

## 10. Charts / Progress

Primary series `primary`; comparison uses `secondary` or neutral gray. Subtle grid lines, no 3D, no decorative gradients, always show units and touch-friendly selected points.

Core metrics: total volume, workout count, PRs, exercise weight progression, estimated 1RM, training frequency. Estimated 1RM must be explicitly labeled as an estimate.

Future Muscle Heat Map views use a standard red intensity convention. They visualize estimated training load or stimulus only—not literal muscle growth, injury, medical recovery, or a biological measurement. Keep canonical muscle data, load calculation, and visual rendering as separate layers.

Future Training Insight presentation follows Result → Analysis → Suggestion. Recommendations and insights provide a “Why?” explanation of their principal signals without implying unsupported precision.

## 11. Home blueprint

Purpose: answer “What should I do now, and how am I progressing?”

Dashboard-style content uses a constrained, mobile-first grid of independent
modules. Modules have stable identities and explicit supported sizes; the grid
owns placement, while modules own size-specific presentation and neither owns
workout/domain logic. Use design-system spacing, predictable alignment, and
content-driven height so Dynamic Type does not overflow. Wider layouts remain
bounded rather than stretching cards indefinitely. Safe Area, screen identity,
primary navigation, and essential global actions stay structural. This is
inspired by the organization of iOS Home Screen widgets, not their visual
appearance or actual system widgets. Do not use arbitrary x/y positioning or
pixel resizing. Current Home retains its polished appearance and may use only
one supported size per module; more sizes and user customization are future work.

```text
Safe Area
  Header: CRESUM identity + greeting
  Primary Workout Module: Resume active workout or Start an existing template
  Training Summary Module: factual completed workouts + total volume
  Latest Workout Module: factual saved result or empty state
  Workout Templates Module: other existing templates and Start actions
  Bottom Dock
```

`Start Workout` is dominant. Home is not a social feed. Detailed analytics belong in Progress.

## 12. Active Workout blueprint

```text
Safe Area
  Header: workout name + elapsed time/menu
  Exercise Header
    name + previous result + optional details
  Sets
    SetRow...
    [+ Add Set]
  Rest Timer when active
  [Log Set / contextual primary action]
  Next Exercise / Finish Workout
```

Current exercise and next action must always be obvious. Do not hide weight/reps behind multiple modals. Preserve session state across rerenders/backgrounding. Haptic after logging a set.

## 13. Progress blueprint

Top filters: `Overview · Strength · Volume · Muscles`.

Progress periods: `1W · 1M · 3M · 6M · 1Y · ALL`. Default: `1M`. One selected period scopes Progress metrics; History remains the complete archive. Finite periods are rolling local-calendar windows `[start, now]` with both boundaries inclusive. `ALL` includes valid completed workouts through `now`; future-dated workouts do not contribute.

Overview hierarchy: total volume chart → workouts → PRs → estimated 1RM/strength trend → meaningful average working weight → muscle-group distribution.

Do not display a metric merely because it is calculable.

## 14. Motion / haptics

Button press: ~100–160ms. Card/sheet transition: ~180–260ms. Avoid long springy animations during logging. Light haptic for selection, success haptic for completed set/saved workout, warning for destructive confirmation. Respect reduced-motion preferences.

## 15. States / accessibility

Every data component considers loading, empty, populated, error, offline (where relevant), disabled and pressed/selected.

Minimum target `44x44`; support Dynamic Type where practical; never rely on color alone; accessible labels for icon-only controls; textual summaries for important chart values; one-handed workout usability.

## 16. Rules for Codex/developers

1. Read this file before implementing/restyling UI.
2. Reuse theme tokens; no magic color values in screen components.
3. Reuse shared components before screen-local duplicates.
4. Do not globally change visual language inside a feature PR.
5. No dark-neon/cyberpunk styling.
6. No new gradient/font/shadow/spacing scale without updating this document and tokens.
7. Keep business logic separate from presentation where practical.
8. UI changes must not break Workout Engine state/persistence.
9. Test phone-sized layouts, not web only.
10. Loading/empty/error/interaction states are part of completion.

## 17. Suggested structure

```text
docs/
  DESIGN_SYSTEM.md
src/
  theme/
    colors.ts
    spacing.ts
    typography.ts
    radius.ts
    shadows.ts
    index.ts
  components/
    ui/
      AppButton.tsx
      AppCard.tsx
      IconButton.tsx
      SegmentedControl.tsx
      StatCard.tsx
    workout/
      ExerciseCard.tsx
      SetRow.tsx
      RestTimer.tsx
```

Do not restructure a working repository solely to match this example; adapt it to the current architecture.

## 18. Definition of Done — visual work

A UI task is complete when it follows this system, introduces no arbitrary duplicate tokens, respects iPhone safe areas/touch targets/states, matches the approved light direction, passes TypeScript/tests/CI, and does not regress workout functionality.

## 19. Current visual baseline

The approved baseline is the light CRESUM concept: airy white/light-gray surfaces, Apple-like hierarchy, `#0A84FF` primary actions, rounded premium cards, restrained glass, with **Home, Active Workout and Progress** as the first key visual references.

This document is the source of truth for CRESUM Core UI until explicitly revised.
