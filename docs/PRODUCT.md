# FitFlow — Product Definition

## Product

FitFlow is a mobile gym workout tracker for quickly recording training and understanding progress.

Core loop:
Start workout → choose exercise → log weight/reps → complete set → rest → continue → finish → History → Progress.

## Core user value

FitFlow should answer:

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

Short first-run experience.

### Home

Current/recommended workout entry and useful recent stats. Starting/resuming a workout is dominant.

### Workout Engine

Start/resume; exercises; sets; weight; reps; previous context; completion; rest timer; editing where supported; exercise progression; Finish; persistence.

### Exercise Library

Find/select exercises and retain data required by workouts/history.

### Workout Templates

Create/edit/select reusable routines.

### History

List and inspect completed workouts accurately.

### Progress

Prioritize total volume, workout frequency, PRs, weight/repetition progression, estimated 1RM (clearly labeled estimate), and muscle distribution when supported.

### Local/offline

Core workout logging remains useful without network.

### Account + Sync

Cloud direction: Supabase/Postgres while preserving reliable local behavior.

### Settings/Profile

Essential account/app preferences only.

## Not Core now

AI Coach, social/community, nutrition, Apple Watch/Wear OS, Oracle marketing infrastructure, and advanced gamification unless explicitly reprioritized.

## Design

Canonical rules: `docs/DESIGN_SYSTEM.md`.
FitFlow is light, premium, calm, Apple-inspired rather than copied, restrained with glass effects, and optimized for readable workout numbers and practical controls.

## Core success

A user can start a workout, log sets, use rest timer, finish without data loss, find it in History after reopening, and see meaningful progress from saved data.
