# CRESUM — Product Definition

## Product

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

## Navigation

Home · Workout · Progress · Profile

## Core v1

### Onboarding

On first launch without meaningful existing workout data, Welcome offers two distinct paths: **Personalize my training** (CRESUM will help me get started) and **Set up workouts myself** (skip personalization for now). The latter goes directly to the existing Guided Workout Builder and completes only after a custom workout is durably created. Cancel/Back do not complete onboarding. Built-in templates alone do not identify an existing user; an active workout, completed history, or a custom workout does. Existing users are never gated by the new flow.

Personalization is short and resumable: Goal (build muscle / get stronger / general fitness) → Experience (beginner / some experience / experienced) → Environment (gym / home / both) → optional age, height, and body weight → truthful completion → Home. Answers survive Back and app restart. Skipping personalization is reversible; Profile can reopen it later. The app learns progressively from performed workouts rather than demanding detailed training history, 1RM, target reps, working weights, or a favorite split up front.

Onboarding has its own versioned local state. It must not alter `fitflow_state_v1`, schema version 1, active workouts, historical snapshots, or the Workout Engine. Corrupt onboarding data cannot corrupt or block access to saved workouts/history. Demographic/body data do not determine an exact working weight. Calibration, baseline generation, and recommendations remain future work.

### Home

An existing workout-template entry and useful recent stats. Starting/resuming a workout is dominant; the template is not labeled as a recommendation.

Dashboard content is composed of independent modules with stable identities. The
module's position must not own workout or analytics logic. The current Home
keeps its primary workout action, factual training summary, latest workout,
and workout templates; header and navigation remain structural. Future
reordering, visibility, supported-size selection, and saved layouts are not
part of the current Core implementation.

### Workout Engine

Start/resume; exercises; sets; weight; reps; previous context; completion; rest timer; editing where supported; exercise progression; Finish; persistence.

Weight entry should evolve into an adaptive system with Recommended, Keypad, and Wheel Picker modes while always preserving exact manual control. Quick weight adjustments should support equipment-aware increments rather than one universal increment; exact manual entry always overrides them. A complete increment table is not defined yet.

Future working-weight recommendations must primarily use history for the specific exercise. With insufficient exercise-specific history, CRESUM should show an honest unavailable/insufficient-history state instead of fabricating a confident load. Recommendations remain customizable and overrideable.

### Exercise Library

Find/select exercises and retain data required by workouts/history.

### Workout Templates

Create/edit/select reusable routines. User-facing creation is a guided Workout Builder: enter a Workout Name, choose one exercise from Exercise Library, configure planned sets and optional starting weight, then review the ordered composition, add more exercises, and Save Workout. Back preserves the local draft; only Save writes it. Planned values are editable starting points, never completed work.

In the manageable workout list, tapping a row starts that workout (or resumes the already-active session). A left swipe reveals concise quick actions; a long press opens all actions, with an accessible non-gesture alternative. Custom workouts can be edited (including renaming), duplicated, or deleted after confirmation. Built-in definitions cannot be edited, renamed, or deleted: users can duplicate one into an independent custom workout or hide it from My Workouts. Hidden built-ins can be restored from Profile. Hiding or deleting a template never removes or rewrites active/completed workout snapshots. Do not assign a swipe-right action without a separately approved use.

A future first-workout calibration may collect actual exercise-specific work and simple perceived difficulty to establish a baseline for later adaptive progression. Proposed sets/load must rely primarily on actual exercise history, be explainable and manually overrideable, and never replace actual performed values in History. Body measurements alone do not provide a precise working weight. This direction does not add calibration or recommendations to the current builder.

### History

List and inspect completed workouts accurately.

### Progress

Prioritize total volume, workout frequency, PRs, weight/repetition progression, estimated 1RM (clearly labeled estimate), and muscle distribution when supported.

Future Training Insights follow the hierarchy Result → Analysis → Suggestion. Interpretations must be cautious, actionable only when justified, and able to explain the principal signals through a “Why?” affordance without fake precision or invented scientific certainty.

A future Suggested Next Workout flow may use recent training history, estimated muscle load, goals, available equipment, and legitimate recovery information. Muscle load is one signal, not ground truth; the system must not simply choose the least-loaded muscle. The user can customize a suggestion before starting and the system can adapt from subsequent workouts.

### Local/offline

Core workout logging remains useful without network.

### Account + Sync

Cloud direction: Supabase/Postgres while preserving reliable local behavior.

### Settings/Profile

Essential account/app preferences only.

Profile → Data offers **Reset local data**, a confirmed destructive action that removes all local CRESUM workouts, history, templates, active workout, personalization, and onboarding data from this device, then returns to Welcome. Cancel leaves data unchanged. A failed reset must not claim success; attempt recovery of removed local values and retain the current in-memory session. This is separate from a future cloud **Delete Account** action.

Profile → Workout settings lists hidden built-in workouts with a Restore action. Reset local data also clears this device's hidden-workout preferences, restoring the standard built-in catalog on first run.

## Not Core now

AI Coach, social/community, nutrition, Apple Watch/Wear OS, Oracle marketing infrastructure, and advanced gamification unless explicitly reprioritized.

## Design

Canonical rules: `docs/DESIGN_SYSTEM.md`.
CRESUM is light, premium, calm, Apple-inspired rather than copied, restrained with glass effects, and optimized for readable workout numbers and practical controls.

## Core success

A user can start a workout, log sets, use rest timer, finish without data loss, find it in History after reopening, and see meaningful progress from saved data.
