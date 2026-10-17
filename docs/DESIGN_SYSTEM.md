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

| Token         | Value                 | Use                                        |
| ------------- | --------------------- | ------------------------------------------ |
| primary       | `#0A84FF`             | CTA, selected nav, active data             |
| primaryTint   | `#EAF5FF`             | Subtle badges and rest surface             |
| secondary     | `#5E5CE6`             | Secondary analytics                        |
| background    | `#F7F7F9`             | App background                             |
| surface       | `#FFFFFF`             | Cards/sheets                               |
| surfaceSubtle | `#F2F2F7`             | Secondary controls                         |
| textPrimary   | `#111111`             | Main text                                  |
| textEmphasis  | `#000000`             | Progress reference headings and key values |
| textSecondary | `#6E6E73`             | Metadata                                   |
| textTertiary  | `#AEAEB2`             | Placeholder/inactive                       |
| separator     | `rgba(60,60,67,0.12)` | Dividers                                   |
| success       | `#34C759`             | Completed sets                             |
| warning       | `#FF9F0A`             | Warnings                                   |
| danger        | `#FF3B30`             | Destructive/error                          |

No neon palette. Gradients are not the default treatment.

Volume comparison text uses `volumeIncrease: #1B7F37` and
`volumeDecrease: #C62828`, keeping small signed values readable on white.

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
| statistic   |   40 |    700 |          48 |
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

**Set editor — approved 2026-10-13:** white page-sheet surface, dark Set title with blue Cancel, factual previous-session line, pale segmented Wheel / Keypad, uppercase labels, selected-value bands, pale-blue +/- with visible steps and full-width blue `Save · weight kg × reps`. Shared transient draft, independent left/right values and exact decimals. Reuse AppPicker: native UIKit wheels, accessibility, system click and selection haptics; no private/custom sound. Do not nest vertical virtualized wheels in a vertical ScrollView. Header/footer can scroll, wheel height is flexible, narrow bilateral controls wrap. Physical iPhone keyboard/dismissal/VoiceOver/Dynamic Type acceptance remains required.

**Chips/segments:** height about 32–36, pill radius, clear selected state.

## 8. Navigation

Primary tabs: **Home · Workout · Progress · Profile**.

Active tab uses `primary`, inactive tabs `textSecondary`. A translucent/floating dock is allowed if it does not steal useful workout space. During an active workout, avoid navigation that can accidentally discard the session.

### Onboarding

Welcome uses a dark CRESUM wordmark, **Welcome to CRESUM**, a short greeting, **What should we call you?** and one labeled name input. Continue requires a nonempty trimmed name. Then show optional **Body details**: date of birth (day/month/year wheels, stored YYYY-MM-DD), height and initial body weight. Goal and Experience follow, with manual setup available from Goal. Use one focused keyboard-aware scrollable step at a time. Back retains answers; Gym is implicit and the obsolete Environment question is skipped compatibly. Profile personalization can edit the same fields without gating legacy users.

Approved completion uses **You're ready to start** and a primary **START!**
button in the existing PrimaryButton style, leading to Home after durable
acceptance. Show a compact factual program summary and access to the proposed
week/schedule before acceptance. This is an authored starter program, not an AI
or inferred-weight claim. Until the complete program is executable, show honest
availability copy rather than declaring it ready; keep manual setup available.
Loading, save failure and Retry preserve the proposed program. Separate target
rep ranges, rest guidance and per-side instructions from actual numeric inputs;
never present a target as a completed result. Home shows planned activity
separately from its actual-completion calendar. These rules are approved for
implementation; this documentation update does not change screens yet.

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

In the expanded program, holding a row activates vertical drag with one light
haptic and a small temporary jiggle. Other rows make room as the held row moves;
release commits its position and stops motion, leaving the program open. A
normal tap still selects and collapses. Respect Reduce Motion by omitting the
jiggle and animated settling while retaining reordering. Expose Move up/Move
down accessibility actions; do not add permanent editing buttons to every row.
Use measured row heights for wrapping names and Dynamic Type. Cancel an
unfinished drag on interruption, backgrounding, layout changes or saving.

Reordering changes the active workout only, preserving the selected exercise's
snapshot ID, entered/completed sets and rest deadline. Templates and existing
History are unchanged. Scroll long programs near viewport edges during a drag.

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

Place a quiet destructive text action, **Discard workout**, below Finish; keep
Finish as the primary action. It remains available with zero completed sets.
Use the shared opaque confirmation sheet: **Discard workout?**, explicit loss
of the active session and entered sets, **Discard workout** / **Keep training**.
Explain that existing History and saved routines remain. Disable confirmation
actions/dismissal while saving, use **Discarding…**, keep errors in the sheet,
and return Home after successful persistence. Reuse AppButton tokens and touch
targets; no new modal or destructive color system.

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
  Training Week Module: Monday–Sunday completion marks + Month action
  Primary Workout Module: Resume active workout or Start an existing template
  Training Summary Module: factual completed workouts + total volume
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
per minute. The Home customization follow-up below adds a separate editor; calendar counts remain factual.

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

Progress periods: `1W · 1M · 3M · 6M · 1Y · ALL`. Default: `1M` (30 local-calendar days). One selected period scopes Progress metrics; History uses its own independent filter, with the complete archive available through All. Finite periods are rolling local-calendar windows `[start, now]` with both boundaries inclusive. `ALL` includes valid completed workouts through `now`; future-dated workouts do not contribute.

Overview hierarchy: total volume chart → workouts → PRs → estimated 1RM/strength trend → meaningful average working weight → muscle-group distribution.

Do not display a metric merely because it is calculable.

### Selected Progress references — 2026-10-10

The approved mockups align the existing Progress overview, selected-exercise
performance and workout-volume sheet with Home/Workout. Use the spaced CRESUM
identity/tagline, large Progress title, secondary explanation and wrapping
period controls. The user's selected overview screenshot is the exact visual
reference: use one `surfaceSubtle` segmented track, a `primaryTint` selection
and primary-blue selected text. Keep effective targets at least 44 pt and allow
an adaptive wrapped arrangement for large text.

Make Training Volume the dominant white card, followed by Estimated 1RM and
Logged exercise performance. Progress cards use `radius.xxl`, `spacing.md`
padding and existing soft shadows, with the `statistic` token for the dominant
volume value. Use a 16 pt Progress section gap and a compact header so the
overview preserves the screenshot's proportions. For 1W, recent workout bars retain chronological order and show factual
values above them, short-month dates below, a readable zero-based kg scale and
subtle dashed horizontal grid. Fit all seven in one plot at normal phone sizes;
if larger text requires multiple rows, repeat the same scale for each row.
Use secondary for older bars and primary for the latest; do not fabricate trend
percentages or copy the mockups' demo values. Derive scale ticks from data and
preserve finite dimensions for zero, fractional and very large volumes.

Progress typography uses the system font and the scoped `progressTypography`
roles below. These refine the selected reference without resizing other screens.

| Role                           | Size / line height | Weight            | Color                           |
| ------------------------------ | ------------------ | ----------------- | ------------------------------- |
| Screen title                   | 34 / 41            | 700               | textEmphasis                    |
| Volume statistic               | 40 / 48            | 700               | textEmphasis                    |
| Card heading                   | 20 / 25            | 700               | textEmphasis                    |
| Exercise record name           | 15 / 20            | 600               | textPrimary                     |
| Estimated record value         | 17 / 22            | 700               | textEmphasis                    |
| Volume unit                    | 20 / 25            | 400               | textSecondary                   |
| Screen explanation             | 15 / 20            | 400               | textSecondary                   |
| Card explanation / source sets | 13 / 18            | 400               | textSecondary                   |
| Period                         | 13 / 18            | 400; selected 600 | textSecondary; selected primary |
| Uppercase volume label         | 11 / 16            | 600               | textSecondary                   |
| Chart ticks / short months     | 11 / 16            | 400               | textSecondary                   |
| Chart values                   | 12 / 16            | 600               | textPrimary                     |
| Chart day                      | 13 / 18            | 500               | textPrimary                     |
| CRESUM wordmark                | 13 / 18            | 700               | textEmphasis                    |
| Tagline                        | 11 / 16            | 400               | textSecondary                   |

The wordmark uses 4 pt tracking; the tagline and volume label use 1 pt.
Keep chart numerals tabular and derive label room from the chart type role.
An unselected exercise prompt uses textSecondary; the chosen exercise uses
textPrimary, both in the 16 / 21 regular callout style. Metadata stays readable
with the existing secondary gray rather than low-contrast tertiary gray.
Units and dates use regular weight. The chart's “Recent workouts” heading
remains 13 / 18 semibold textPrimary. Blue identifies actions, selection and
the existing active estimated-value emphasis; it does not color metadata.
All type still follows native font scaling and wrapping.

### Progress comparison and chart readability — 2026-10-10

Place the recorded-volume difference to the right of the large total, using a
small up arrow plus a signed kg amount for an increase, a down arrow for a
decrease, and neutral “No change” for equality. Use `volumeIncrease` /
`volumeDecrease` text tokens (readable green/red on white) and textSecondary
for neutral/unavailable states. Add the quiet “vs previous period” context.
When unavailable, show compact “No data” in the same right-hand slot; retain
full unavailable-comparison accessibility copy. For ALL omit the indicator.
Keep signed numbers and directional accessibility copy so color is not the
only signal. Allow the summary to wrap below the total on small screens or
large text, consistently across states. At standard phone width the missing-data
state must not create a second summary row. Use the 11 pt chart role for the
quiet comparison context and a shrinkable comparison column. This is a volume
comparison, not a strength score.

Put TOP PR before the estimated value in the same right-aligned group; preserve
the common trailing edge of all values. Wrap the group if accessibility text
requires it. Record names remain explicitly textPrimary.

Every chart date uses two lines: 13 / 18 medium-weight textPrimary day above
11 / 16 regular textSecondary short month, centered under its bar. Values
above bars use the `chartValue` role (12 / 16 semibold textPrimary) with an
opaque surface backing so grid lines cannot pass through their glyphs. Keep
axis ticks 11 / 16 regular textSecondary; do not bold the scale or place values
inside bars. Reserve label room using the value font, including wrapped large
values. Keep actual numeric values and bar proportions unchanged.

Keep the trained-exercise selector, clearly estimated per-workout values and
their source weight/reps distinct from actual logged sets. Present logged sets
as quiet numbered rows inside a separate View logged sets sheet. Keep the exercise overview compact with an explicitly labelled estimated 1RM graph: weekly bars, and a curve from 1M onward using the selected period. From 1M onward, use a primary-blue smooth curve through all selected workouts
on a real date axis, with the same zero-based kg scale. 1M spans the last 30
days; 3M/6M/1Y/ALL span their selected interval. Preserve factual point values
and monotonic interpolation between neighbours, without overshoot or false
rest-day zeros. Show four quiet day/month date ticks at normal size (two at
larger text), actual selected workout details below, and a single point when
a trend cannot yet be drawn. Long histories include year context.

The existing Workout volumes sheet retains every
workout in the selected period, readable date/name/value rows and Close. Its
heading and kg values use explicit textEmphasis, names textPrimary and dates
textSecondary. Mirror these explicit colors in the browser adaptation to prevent
host dark-mode heading/value rules from reducing contrast.
Preserve all estimate/detail sheets, empty states and access to the complete History archive.
This reference does not add the blueprint's future analysis tabs, muscle map,
new analytics or illustrations. Native sheets and Dynamic Type need phone QA.

### Selected Profile reference — 2026-10-11

Align Profile with the selected Home/Progress language: dark spaced CRESUM
wordmark, quiet tagline, a 34 pt screen title and readable gray explanation.
Use the existing background/surface, 16 pt screen/card insets, 24 pt section
gaps, 28 pt card radius and soft card shadow. Card headings use the existing
20/25 title3 role with 700 weight; metadata uses the 13/18 footnote role and
textSecondary. Adapt wrapping to compact screens and Dynamic Type.

Profile uses a compact white WORKOUTS entry, with the same dark, bold, spaced caption typography as the CRESUM wordmark. Its separate saved-routines page keeps compact named rows, factual planned
metadata, neutral ellipsis controls, subtle dividers and a blue Create Workout
action after the list. Preserve left swipe, long press and accessible menus;
the editor and all existing actions stay available. Remove duplicated outside
headings/uppercase section labels rather than adding nested card surfaces.

Hidden workouts is conditional, with a wrapping name and compact blue Restore
text action, labelled accessibly with its workout name. Training preferences
uses a surfaceSubtle Personalization row and decorative blue chevron. Local
data uses a quiet danger-colored Reset local data text action with the existing
confirmation/error behavior. All actions retain at least 44 pt touch targets
and pressed/disabled feedback. About remains a static CRESUM/real-version card;
the generated mockup's About chevron does not authorize a new destination.
Retain the existing dock and shared smooth two-step up-arrow; the arrow is
hidden at page top. No global theme or functional scope change is included.

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

### Centered brand and exercise statistics — approved 2026-10-14

Use shared BrandHeader: dark spaced CRESUM centered on main pages, onboarding
and Library/detail. Put the existing tagline below when present; compact detail
headers omit it. Preserve safe areas and separate close/back targets; avoid
absolute positioning. Library keeps its right square placeholder and quiet
Technique / Statistics actions separate from selection/Add. Detail uses both
tabs, existing periods, three metric segments, a white chart card with dark
headline and inline comparison, plus compact workout/set counts. Graph selection
opens read-only Logged sets; Back retains exercise, metric and period. Reuse
smooth upward navigation, text colors and large-text wrapping. Native
sheet/dismissal/VoiceOver/chart/Dynamic Type acceptance remains a device check.

The approved baseline is the light CRESUM concept: airy white/light-gray surfaces, Apple-like hierarchy, `#0A84FF` primary actions, rounded premium cards, restrained glass, with **Home, Active Workout and Progress** as the first key visual references.

### Core demo alignment

The source-aligned Core demo is the visual reference for the existing native
application. Main scroll content in Home, Workout, Progress, and Profile uses a
centered width of at most 600 pt, with the existing 16 pt screen inset. The active
workout now uses the focused, expandable program described in section 9 instead
of permanently visible exercise chips. Progress uses the segmented track and
scaled chart described in section 13, with adaptive wrapping for large text
rather than horizontal scrolling. Home template previews are
content-driven rather than truncated to two lines; volume summaries retain
fractional kilograms instead of rounding to whole kilograms.

Adopt the demo's presentation through existing native components and tokens.
Existing functionality absent from the demo remains available, including
onboarding, workout management gestures, library filters, detailed analytics,
confirmations, persistence, and recovery. Do not replace factual app data with
demo fixtures or introduce a separate browser client for this alignment.

This document is the source of truth for CRESUM Core UI until explicitly revised.

### Account deletion confirmation — 2026-10-16

Profile > Account & Sync places a quiet destructive text action after ordinary
account controls. The inline confirmation names the account and requires typed
DELETE before **Permanently delete account**, with **Keep account** available
before submission. Reuse AppButton/input/type/spacing tokens, preserve a readable
vertical phone layout, and reset the confirmation on account changes. Disable
overlapping actions while deleting and announce success/error text accessibly.

Explain that local workouts, routines and saved files remain, while exported files,
other devices' local copies and provider backups are outside this action. With
rollout disabled, show a disabled action and honest availability copy. Unconfirmed
deletion replaces normal sync/Resume controls with a recovery explanation and an
explicit retry. Confirmed local-cleanup failure offers **Retry session cleanup**,
not a second cloud deletion. Never show success for a timeout or a stale owner's
response in a newly connected account.

### History filter — 2026-10-10

Show three recent workout cards by default; put the filter directly below the History heading, before the list,
including empty results. Open an opaque native sheet with two clear criteria:
Recent workouts and Date range. Before each criterion show a circular selector;
the active one has a green success fill and dark readable check. Expose mutually
exclusive radio state accessibly. Keep the existing English Core copy.

The number field opens an iOS-style snapping wheel: All, then 1 through the
saved-workout count, initially 3 (or the available maximum in a smaller archive).
Center the selected row on a subtle band, preserve font scaling, and offer
accessible increment/decrement actions. Dates open shared day/month/year wheels with
From/To selection; default to today and six previous local dates. Both boundary
dates are included. Show is the primary blue action below the criteria; reversed
ranges show an error and disable Show. Back/Cancel must not apply unfinished
changes. Use existing theme tokens, practical touch targets, safe area and
scrolling for compact screens and larger text. Preserve saved-workout details.
Native wheel scrolling, sheet dismissal and Dynamic Type require phone review.

### Progress navigation — 2026-10-11

Use a 48 pt circular surface up-arrow above the dock after scrolling. First tap moves to the current section start, second to the page top; a manual scroll resets the sequence. Respect Reduce Motion. Retain section spacing. Bound the logged-sets sheet heading to two visible lines with its full accessible label so large text cannot obscure the scrollable details.

### Shared return-to-top control — 2026-10-11

Use the same 48 pt circular up-arrow on every vertical screen and detail sheet, above the page dock or sheet bottom inset, with extra content padding to keep the last action reachable. It uses shared AppScrollView/AppFlatList components and the existing color/radius/shadow tokens. The first tap returns to a measured section start, the second to the page top; single-section lists return to their start immediately. Motion uses the platform native animated scroll with its easing, rather than instantaneous jumps. Respect system Reduce Motion, retaining fast non-animated return when enabled. Exact ChatGPT timing is not a specified/measured constant; tune perceived pace through physical-device review. Hide the control during active program dragging. Do not change wheel-picker or horizontal-filter behavior.

### Identity and body-weight presentation — 2026-10-11

Use explicit `textPrimary` for headings, exercise/routine names and form labels throughout pages and sheets. `textSecondary` is for subtitles, dates and explanatory context; pale tertiary text never substitutes for a primary heading. Browser previews must scope product classes and explicitly set product text colors so host dark-mode rules cannot overwrite the app's light theme.

Home displays the stored name in **Welcome back, {name}!**. The body-weight card uses existing Progress title, statistic, unit and chart roles. Show initial/current kg and neutral signed change; no green/red value judgement for body mass. Reuse the native curve with a padded measurement-specific vertical range; never invent zero readings between measurements. Add measurement opens the existing page-sheet style with one labeled decimal kg input and Save/Cancel. Shared smooth upward navigation remains on the new routine page and measurement sheet. Physical-phone keyboard, safe-area, Dynamic Type and gesture review remains outstanding.

### Apple wheel and calendar presentation — 2026-10-11

Every existing/future wheel uses AppPicker: native UIPickerView on supported iOS builds, shared accessible snapping fallback elsewhere. Date columns are always day, localized full month, year; the center row is selected, with native perspective/fading and a quiet selection band. Keep system typography and readable dark selected values. Selection feedback occurs for changed user-selected rows, never on mount, prop synchronization or unchanged boundary selections. Audio belongs to the native wheel and honors system settings; no synthetic/private sound API. Respect platform feedback availability and Reduce Motion. Date entry opens an opaque page sheet with dark heading, Done, Cancel and optional Clear date; scrolling details use shared upward navigation, wheel columns do not. Native font scaling, audio, haptics and actual device feel remain acceptance checks.

EXERCISE LIBRARY matches WORKOUTS' compact white card and dark bold spaced wordmark, immediately below it. The separate browse page retains native search, muscle/equipment filters, readable names and shared up-arrow, with Back to Profile and no inert Add buttons.

Move the compact factual week above the primary workout card. Add a blue Month text action with a >=44 pt target. Full month opens in an opaque sheet: dark heading, blue chevrons, full month/year, Monday-first seven-column grid, actual-completion blue marks, distinct today outline and pale selected-date background. Include textual completion counts in date accessibility labels and saved session details below; quiet empty state for dates without saved completions. Reuse theme tokens and allow larger text to expand row height.

### Exercise Technique — approved 2026-10-12

Follow the selected three-state mockup: Library → Technique sheet → full-screen image viewer. Library uses a dark CRESUM wordmark, large-title Exercise Library heading, search and compact filters; selected filter chips use primaryTint/primary rather than solid blue. Quiet white rounded rows place readable exercise text left and a 76 pt square rounded thumbnail right, with a small blue Technique label underneath. Browsing name opens the guide; selection/Add stays below the row's text and separate from the thumbnail action. Wrap long names and large text; never squeeze the font to preserve one line.

Technique is an opaque white native page sheet with restrained grabber, dark title and 44 pt close target. Use the exact exercise title, secondary muscle/equipment line, responsive square image region and pale START/FINISH segments with 44 pt targets. Setup, Movement and Key checks stay visible; Common mistakes and Sources reveal on demand. Source titles are blue links; publisher/adaptation notes remain readable secondary text. Preserve the shared smooth up-arrow on vertically scrollable sheets and full-screen viewer. The current Workout header reuses the same right-hand thumbnail entry.

Until reviewed image pairs exist, show an explicitly labeled Image coming soon placeholder and a truthful Illustration unavailable full-screen state. Phase buttons retain their state between sheet/viewer. Use native modal slide motion now; do not imply a native shared-image transition, pinch zoom or image-swipe demonstration exists without real assets. Native phone/sheet/dismissal/VoiceOver/Dynamic Type QA remains required.

### Local data backup controls

Profile → Backup & restore uses existing GlassCard, AppButton and Confirmation components and theme tokens. Export/Restore are secondary controls; replacement confirmation is destructive and includes creation date, saved counts and active-session presence. Explain plaintext personal data and explicit save destination. Active workouts disable restore with a reason while export stays available. Picking/validation, operation progress, errors and Retry recovery are accessible. Hide writable app content from touch and accessibility while an operation runs, retaining its state until successful replacement.

### Profile backup mockup follow-up — approved 2026-10-15

Replace the expanded backup-control block in the Profile overview with one **Backup & restore** menu row, archive icon, secondary description and chevron. It opens a dedicated vertically scrollable page using the existing BrandHeader, AppScrollView, GlassCard, AppButton and shared theme tokens. Preserve centered CRESUM branding, light surfaces, dark readable text, touch targets and large-text wrapping.

The backup page follows the approved mockup: factual last-backup summary, clear **Export backup** and **Import history** actions, automatic-backup enable control, and mutually exclusive **Every workout / Weekly / Monthly** choices. Keep **Restore all data** separate from additive history import. Explain actual scheduling and storage limits without showing unsupported cloud status.

History import shows the chosen filename/date, validation status and three factual counts: workouts in file, new workouts and already in history. Explain that current History stays and existing IDs are skipped. Primary action names the actual number to import; choose-another-file and cancellation remain available. Preserve explicit validation, empty, error, saving and retry states. Use **Last local copy** for the verified app-local archive, with **Export saved copy** when available. Explain app-open scheduling, device-loss/uninstall limits and plaintext files. Reset confirmation states that saved copies remain and automatic backup switches off. Native phone layout and accessibility acceptance remain required.

### Account entry and Email OTP — 2026-10-15

Preserve the approved compact Profile layout and Backup & restore row. Add a separate **Account** row with person icon, chevron and factual **Optional email sign-in / Account connected** description. It opens a dedicated AppScrollView page with centered BrandHeader, Back to Profile, large Account title and the existing white AccountSection form. Reuse theme tokens and shared buttons; maintain ≥44 pt targets, wrapping, keyboard/scrolling and accessible Email address / Six-digit email code labels.

Sending, code entry, resend, wrong/expired code, rate limit, sign-out failure and missing configuration have truthful states. Apple/Google remain visibly disabled with Coming later text. Connection does not show Synced, Sync Now or cloud success. Reset confirmation states that it does not sign out; account and local data actions stay separate. Physical-phone keyboard, VoiceOver and Dynamic Type review remains required.

### Account & Sync — history integration 2026-10-15

Keep the compact Profile Account row and existing premium Account card. The
signed-in page title becomes **Account & Sync**. Present a readable live status
with explanation and one primary **Enable cloud backup / Resume cloud backup /
Sync Now** action. Use off, paused, pending, syncing, synced and couldn't-sync
copy; do not claim Offline without a reliable network signal. Keep Sign Out
available during network sync. No queue counts, cursors or hashes in the UI.

Explain that only completed workouts linked to this account are backed up;
known other-account workouts stay separate, and active workouts/settings stay
local. Errors reassure local availability and distinguish session, conflicting
history, invalid data and connection failures. Reuse existing text, spacing and
button tokens, wrapping, live status announcements and >=44pt targets.

Reset copy says files/account links are kept, cloud history is not deleted and
cloud backup pauses until explicit Resume. Import/restore has the same paused
state. Phone keyboard, VoiceOver, Dynamic Type and native lifecycle acceptance
remain required; JS export is not a device build.

### Conflict comparison — approved 2026-10-16

From Account & Sync, Review conflicting workouts opens a dedicated scrollable
comparison. Show workout date/name and specific differing exercise/set values
under This device and Cloud labels. Use two equally prominent Keep this version
actions, each clearly associated with its version, plus Decide later. This is a
deliberate choice-screen exception to a single primary CTA. No preselection.
Keep both as separate workouts belongs under More options, with an explicit
warning that both enter History/Progress. Replacement/deletion confirmation names
the affected version; Back changes nothing. Never show a timestamp-based Correct
badge. Unknown edit times remain unknown. Show stale/network/pending/blocked
states, reuse tokens and >=44pt targets, and keep account/back navigation usable.

Each version card includes a compact completed-set count and recorded volume
above its exercise details, using the existing headline/footnote tokens equally
on both sides. Exclude unfinished sets. Display unavailable volume explicitly;
keep a valid zero-weight result as zero. When only some completed sets have
measurable volume, show their coverage alongside the recorded total. Summaries
are context for the user's choice and must not imply a recommended winner.

### Home customization — 2026-10-17

Home offers a secondary **Customize Home** action below the greeting. Open a
scrollable page sheet with existing surfaces/tokens and wrapping labels. Each
module has accessible Move up / Move down buttons (44 pt minimum), with disabled
boundary states, and a labeled visibility switch with Shown/Hidden text. The
primary workout module reads Always shown. It may move but cannot be hidden.
Keep header/navigation outside the editable list. Save layout applies after a
successful write; Cancel/system Back discards the draft. Restore default order
restores visibility too and stays a draft until Save. Disable controls and system
Back while saving, show Saving layout… and an inline retryable save error.
Loading disables editing, while workout actions remain available. A load failure
shows a plain-language notice, Retry layout and explicit Reset Home layout.
Retain shared upward scrolling with actual reordered section positions.
This first customization stage adds no card size, cloud sync or calendar behavior; the approved drag follow-up below extends interaction.
Native safe-area/large-text/VoiceOver acceptance remains a release check.

### Home hold-and-drag follow-up — approved 2026-10-17

Holding a Home card for 450 ms enters inline editing with one light haptic.
All visible groups wobble gently (±0.4 degrees); Reduce Motion disables wobble.
Use measured card heights for vertical movement and the existing viewport-edge
scrolling. Show lifted-card feedback, retain empty/hidden-block preferences, and
keep the primary workout and supplementary program together.

An opaque top edit bar overlays the greeting without shifting the grabbed card.
Use existing theme text buttons and wrapping layout for Cancel, Done and
Order & visibility. The latter opens the existing sheet on the current draft;
its cancellation returns to inline editing. Disable child interactions and hide
child actions from screen readers while editing. Groups expose named Move up/down
actions; the sheet retains visible buttons and visibility switches. Done applies
only after successful persistence, failures stay visible and retryable, and
controls disable while saving. Cancel/Android Back reset the draft and lift.
Gesture cancellation, layout changes, backgrounding and unmount stop dragging
and edge-scroll timers. Native gesture competition, animation pace, VoiceOver,
large-text toolbar and safe-area behavior remain physical-device acceptance.

# Muscle participation map — 2026-10-17

Use schematic front/back SVG regions, not a measured activation overlay.
Primary `#A93232`, secondary `#E8A7A7`, neutral `#D5D7DB` are semantic roles,
not a continuous load scale. Primary fill wins when both roles occur; both
counts remain visible in text. Neutral means no mapped completed sets, not
recovered or untrained. All 17 groups have accessible text-row alternatives to
small touch regions. Bilateral mirroring does not imply measured side symmetry.
Details expose saved exercise/workout names and actual logged rows. Retain the
existing Overview rather than adding nonfunctional Strength/Volume tabs.
Device SVG touch, large text, VoiceOver/TalkBack and visual acceptance remain
release checks; automated tests and exports do not replace those checks.

### Muscle Map visual refinement — 2026-10-17

The first geometric placeholder was rejected visually during preview. Replace
its angular panels with an original curved silhouette, natural head/hand/foot
proportions and softly shaded muscle groups. Use thin separators (0.65 SVG units),
preserve all 17 semantic groups, and show calves on the posterior view rather
than coloring the anterior shin. The neutral figure has no sex-specific identity.
No new taxonomy, muscle mapping, sex selector or calculation is introduced.
Shading is fixed decorative lighting; primary/secondary counts still determine
the role, never highlight brightness within a role. Additional shade tokens:
neutral `#ECEDEF` / `#BEC2C8`, primary `#C75757` / `#8F292E`, secondary
`#F1C4C4` / `#D99393`. This remains a simplified group map requiring visual
acceptance, not an individually modeled anatomical atlas or realistic 3D asset.

### Selected anatomical appearance and editable masks — 2026-10-17

The user selected a grayscale anatomical illustration with clearly separated
surface muscles, restrained fiber detail, front/back neutral stance and a small
matte central pelvic modesty insert. Keep the adductors, proximal thighs and
glutes visible. This Muscle Map appearance candidate is separate from the
blue-shirt Exercise Male Master; it does not replace technique artwork.
Preserve one unchanged source image and common coordinates for every layer.
Each of the existing 17 groups has an independent editable SVG mask with
separate view/side path identity. Do not regenerate individual muscle pictures
with inconsistent poses/cameras. Initial manual mask boundaries remain draft
until anatomical and phone-scale visual review; current production SVG stays.

### Approved refinement: model-derived anatomy — 2026-10-17

Prefer an anatomically reviewed, individually separated 3D muscle source for
future precise masks. Render the neutral body, visible-surface muscle IDs/masks
and shading from the same geometry, pose, camera and crop. Preserve the selected
gray appearance and discreet central modesty insert. Each group may aggregate
several anatomical objects. Accuracy comes from reviewed structure, not from
image-to-3D conversion alone. Maintain occlusion; deeper muscle visualization
belongs to a separate layer-view design. Current manual masks remain editable
draft references until replaced or explicitly reviewed, not approved templates
for deforming a future anatomically correct model.

### Active 2D refinement — 2026-10-17

User deferred the unavailable 3D asset and continued 2D work. Retain the selected
image, common coordinates and neutral modesty insert. Use visible anatomical
landmarks and identified references to refine per-side contours, beginning with
chest, lats and quadriceps. Permit editable substructure layers within existing
groups; do not display deep structures over superficial ones. Mark new contours
as drafts and keep the review tool separate from production analytics.
