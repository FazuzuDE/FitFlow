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
| primaryTint   | `#EAF5FF`             | Subtle badges and rest surface |
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

Profile → Data includes a destructive **Reset local data** action using the existing `danger` token. Require confirmation that explicitly names local workouts, history, templates, active workout, personalization, and onboarding data and states the deletion is irreversible on this device. Cancel changes nothing. Show an error rather than a success or Welcome state if deletion fails. Do not label this action **Delete Account**.

Future Profile → **Account & Sync** is separate from Data. Signed out, explain optional account backup/cross-device sync and that workouts remain usable offline; offer Apple, Google, and Email entry. Signed in, show identity when appropriate, a plain-language status (Synced, Syncing…, Sync pending, Couldn’t sync, or Offline), Sync Now, and Sign Out. Authentication and sync state are separate: a sync error does not imply sign-out or failed workout logging. Keep routine sync unobtrusive; show a Home-level notice only for meaningful pending/problem states, for example “Sync pending — your data is safe on this device.” Avoid technical queue counts. Future confirmed Delete Account must be distinct from Sign Out and Reset local data; do not alter the current reset UI or behavior in this documentation task.

## 9. Workout UI

### Guided Workout Builder

Use one obvious primary action per focused step: Workout Name → Exercise Library single selection → planned sets/optional starting weight → ordered composition → Save Workout. Keep Back and Cancel distinct; Back retains the local draft, and Cancel confirms before discarding meaningful changes. Use existing type, color, spacing, radius and card tokens. Exact manual weight entry remains available; no inferred or recommended weight is shown here. Planned values must be labeled as editable starting values, not performed sets.

### Workout list interactions

For manageable workout rows, tap performs the primary Start/Resume action. Swipe left reveals only concise contextual actions; long press opens the complete action menu. An accessible More actions control exposes the same menu without gestures. Do not assign a swipe-right product action for symmetry. Custom rows use Edit (including rename), Duplicate, and confirmed Delete; built-in rows use Duplicate/Customize and Hide, never direct mutation or deletion of the canonical definition. Profile → Workout settings provides Restore for hidden built-ins. Use existing tokens, readable Dynamic Type layouts, compact-screen scrolling, and practical touch targets rather than permanent edit/delete buttons on every row.

For swipe presentation, stack matching full-row foreground and action-background layers with a constant 14 pt radius on all corners. Keep the closed Saved workouts list visually continuous; reveal only the right-side actions as the foreground moves.

### ExerciseCard

Order:

1. Current exercise position/muscle and **All exercises** control
2. Exercise name
3. Optional illustration
4. Previous performance/context
5. Set rows
6. Add-set/exercise actions

The active workout focuses on one exercise. Do not show all planned exercise
chips by default. **All exercises** expands the ordered program inside the
exercise card; **Collapse** hides it. Each row remains selectable, exposes the
current selection accessibly, and retains the completed-exercise check. Selecting
a row collapses the program. Automatic exercise progression and a new session
also return to the focused view. Expansion is temporary presentation state, not
part of the persisted workout. Disable program controls while saving.

### Exercise asset illustration direction

Future production artwork has two separate modes for the same exact exercise variant:

- **Exercise/Technique View:** communicates equipment, setup, grip, body position, and START/FINISH mechanics.
- **Anatomy/Muscle View:** communicates exact-variant muscle mapping on a grayscale body, using red only for highlights, stronger red for Primary, and a lower intensity of the same red family for Secondary.

Future exercise artwork uses a clean, premium CRESUM visual language on a clean white background with soft natural grounding/contact shadows rather than a heavy artificial studio floor. Choose the camera view for clear, correct exercise mechanics; keep character, equipment, framing, and style consistent across the library. The current ExerciseCard artwork is a placeholder, not a production asset.

Do not combine START and FINISH into one production panel. A phase pair keeps the same model identity, proportions, clothing, equipment, attachment, grip, camera/view, framing, background, and rendering language. Create and approve a reference phase before deriving its companion, then inspect both together. Biomechanical correctness has priority over aesthetic polish.

The Male Master character identity is consistent across the library: same face, short brown hair, clean-shaven appearance, young-adult age type, athletic/fit build, realistic proportions and overall identity. Clothing belongs to a separately selected approved outfit preset, not the immutable character; switching outfits does not create a new Male Master. The current first-slice preset is blue-gray, with black retained as an approved alternative; outfit details and pair locks are owned by `EXERCISE_ASSETS.md`. Keep premium semi-realistic 3D language, a clean white background and soft contact shadows. Avoid heavy cinematic lighting, dirty textures and noisy surfaces. Female presentation follows the same consistency architecture and movement/muscle semantics; its specific master appearance remains to be approved.

Anatomy/Muscle View keeps the same Primary/Secondary meaning across START and FINISH; pose or framing must not imply that a mapped muscle exists or contributes only in one phase. Do not add redundant labels inside the image when the UI provides context, overpaint broad red areas, or highlight muscles from a related generic exercise instead of the exact variant. The visual mode does not change exercise identity or calculation meaning. Detailed START/FINISH and biomechanics acceptance rules live in `EXERCISE_ASSETS.md`.

### SetRow

Current Core columns: `SET | KG | REPS | DONE`; previous performance is shown
above the rows. A separate per-row previous column remains future work.

Completion must be easy to hit during training. Completed state uses `success` without reducing readability.

### RestTimer

Use a `primaryTint` surface with a prominent remaining time and wrapping,
paired `−15s/+15s` and Restart/Skip rest controls. After expiry use Rest complete
and Continue. Preserve the existing deadline-based recovery and completion
haptic. Pause is not implemented in Core and must not be implied by the UI.

### Finish Workout

Deliberate primary action. Normal Finish summarizes and saves. Destructive abandonment requires confirmation.

## 10. Charts / Progress

Primary series `primary`; comparison uses `secondary` or neutral gray. Subtle grid lines, no 3D, no decorative gradients, always show units and touch-friendly selected points.

Core metrics: total volume, workout count, PRs, exercise weight progression, estimated 1RM, training frequency. Estimated 1RM must be explicitly labeled as an estimate.

Future Muscle Heat Map views use a standard red intensity convention. They visualize estimated training load or stimulus only—not literal muscle growth, injury, medical recovery, or a biological measurement. Keep canonical muscle data, load calculation, and visual rendering as separate layers.

Future Anatomy / Muscle View uses one anatomical language: gray for the neutral body and non-engaged muscles, red only for activated muscles, with stronger/more saturated red for Primary and a lighter intensity of the same red family for Secondary. Do not use rainbow muscle categories or redundant in-image labels when the app UI supplies context. Highlighting must follow the exact exercise variant, not merely its family. Male and Female models share muscle IDs, mapping, intensity meaning, calculation meaning, and visual logic. Keep variant mapping, load calculation, and rendering separate; neither Anatomy nor Muscle Heat Map is a direct biological measurement.

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
  Training Week Module: Monday–Sunday with factual completed-day marks
  Latest Workout Module: factual saved result or empty state
  Workout Templates Module: other existing templates and Start actions
  Bottom Dock
```

`Start Workout` is dominant. Home is not a social feed. Detailed analytics belong in Progress.

### Selected Home reference — 2026-10-09

The user's selected CRESUM greeting/dashboard screenshot supersedes the prior
Home presentation reference only. Keep the light background, black spaced brand
wordmark and small “TRAIN. TRACK. GROW.” tagline, large greeting with secondary
copy, round Profile entry, spacious white hero with a blue badge, prominent blue
Start/Resume action, two adjacent white statistic cards, and a compact training
week. Reuse native type, radius, spacing, shadows and components; small screens
and larger text may wrap the statistic cards rather than clip them.

Summary cards use the same trailing four-week window, not all-time totals.
The week starts on Monday; blue checks indicate actual completed workouts and
an outlined date indicates today. Dates without completed sessions remain
neutral, not planned or missed workouts. Day accessibility labels announce date,
completion count and today. Refresh time-sensitive data on foreground and once
per minute. No editable dashboard or new scheduling system is included.

Use a neutral greeting/profile icon until a real user name is available. Do not
hardcode the screenshot's name, initials, dates or statistics. Template metadata
may show available exercise and planned-set counts; omit unsupported duration
estimates and “Today” claims. Keep current English Core copy and catalog names;
the Russian screenshot approves presentation, not an app-wide localization.
ChatGPT chrome in the screenshot is not app chrome. Existing latest-workout and
template modules remain below the week; other screens are separate future tasks.

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

### Selected Workout reference alignment

Use the same spaced CRESUM identity/tagline as Home, with a large workout title,
compact tinted elapsed-time badge, and factual completed-set/volume summary.
Keep the current exercise in a spacious white card with `radius.xxl` and
`spacing.lg` padding. Program navigation is collapsed by default as specified
above. Numeric fields and completion controls remain at least 44 pt; completed
fields use the success border and a filled success check with readable text.
Reuse native tokens and shared controls. Header, program rows and action groups
may wrap for compact screens and larger text. Keep Add set, confirmed Remove
set, Exercise Library, Next exercise, Finish confirmation and saving/error
states. Do not introduce fixture data, illustrations, a pause function or new
workout rules as part of this presentation alignment.

## 13. Progress blueprint

Top filters: `Overview · Strength · Volume · Muscles`.

Progress periods: `1W · 1M · 3M · 6M · 1Y · ALL`. Default: `1M`. One selected period scopes Progress metrics; History remains the complete archive. Finite periods are rolling local-calendar windows `[start, now]` with both boundaries inclusive. `ALL` includes valid completed workouts through `now`; future-dated workouts do not contribute.

Overview hierarchy: total volume chart → workouts → PRs → estimated 1RM/strength trend → meaningful average working weight → muscle-group distribution.

Do not display a metric merely because it is calculable.

## 14. Motion / haptics

Motion should make CRESUM feel alive, not animated. Use it to explain an interaction, confirm an action, preserve spatial continuity, or clarify a state transition. Avoid decorative loops, long springy movement, and animation that slows logging. Button-press guidance of roughly 100–160ms and card/sheet guidance of roughly 180–260ms are starting points, not a frozen motion specification.

A swipe-discovery hint may appear only on the first suitable row, remain small and temporary, stop after discovery or a few relevant visits, respect Reduce Motion, and be independently toggleable from the underlying swipe action. Exact distance, timing, visit count, and easing remain experimental rather than product contracts.

Light haptic confirms selection, success haptic confirms a completed set or saved workout, and warning haptic supports destructive confirmation. Motion and haptics never substitute for visible state or accessible labels. Respect reduced-motion preferences throughout.

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

### Core demo alignment

The source-aligned Core demo is the visual reference for the existing native
application. Main scroll content in Home, Workout, Progress, and Profile uses a
centered width of at most 600 pt, with the existing 16 pt screen inset. The active
workout now uses the focused, expandable program described in section 9 instead
of permanently visible exercise chips. Progress period chips wrap onto additional
lines instead of requiring horizontal scrolling. Recent workout volume columns also wrap, retaining chronological
order, readable dates, and accessible value labels. Home template previews are
content-driven rather than truncated to two lines; volume summaries retain
fractional kilograms instead of rounding to whole kilograms.

Adopt the demo's presentation through existing native components and tokens.
Existing functionality absent from the demo remains available, including
onboarding, workout management gestures, library filters, detailed analytics,
confirmations, persistence, and recovery. Do not replace factual app data with
demo fixtures or introduce a separate browser client for this alignment.

This document is the source of truth for CRESUM Core UI until explicitly revised.
