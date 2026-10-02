# CRESUM — Development Roadmap

This is priority guidance, not a claim that items are unimplemented. Inspect the repository first.

## Objective

Stable Core:
Onboarding → Home → Workout → Sets → Rest → Finish → History → Progress.

## P0 — Core

1. **Workout Engine** — reliable start/resume, logging, editing, rest timer, persistence, exactly one valid completion, tests.
2. **Exercise Library** — browse/search/select; stable references and consistent metadata.
3. **Workout Templates** — guided create/select/edit routines with planned sets/optional starting weight, without corrupting historical workouts.
4. **History** — accurate completed-session list and details.
5. **Progress** — real saved-data metrics: volume, PRs, progression, estimated 1RM, readable charts.
6. **Local persistence/offline** — core logging does not depend on network; recover data according to current architecture.
7. **Account + Sync** — optional Supabase/Postgres backup and multi-device sync, staged behind reliable local storage. Do not replace working local persistence or make workout logging network-dependent.

### Account + Cloud Sync v1 sequence

Implement in separate focused PRs, not one combined feature:

1. **Account/Auth Foundation:** Supabase client seam, auth session state, Account/Profile shell, Apple/Google/Email auth seams, signed-in/out behavior. No workout cloud sync yet.
2. **Cloud Schema + Sync Foundation:** versioned database migrations, user-owned Row Level Security, normalized entities, stable identity/revisions, device ID, and durable local sync metadata/queue. No broad feature expansion.
3. **History Backup + First Sync:** completed-workout upload/download, merge-first sign-in, idempotent retry, offline recovery, and physical multi-device validation where possible.

Later, separately approved work may sync custom workouts, preferences/profile, add conflict UX, account deletion and deeper recovery/diagnostics. Active-workout backup is not part of Sync v1 and needs separate approval. This documentation sync does not increase official Core readiness.

## P1 — Product polish

- Onboarding Foundation: resumable lightweight personalization or direct first-workout creation through the Guided Workout Builder, separate versioned local state, legacy-user bypass, and later Profile re-entry. Calibration and recommendations remain separate future work.
- Home Dashboard using real app data and `docs/DESIGN_SYSTEM.md`.
- Modular dashboard foundation for existing Home content. Reorder/show-hide,
  supported-size selection, and saved/synced layouts come later as a separate
  task; do not add drag/drop or layout persistence to the foundation.
- Essential Settings/Profile.
- UI consistency, interaction states, haptics, accessibility, phone-sized layouts.

## P2 — Release readiness

Device/development builds, error handling, store assets/metadata, privacy/permissions, subscriptions/paywall if required, RevenueCat if used, App Store/Google Play preparation.

## Later

- Exercise Library / Asset evolution, in separate focused PRs: approved documentation sync → family/variant model and types → non-destructive adapter for the existing 58-record catalog → a small set of verified high-value variants → asset manifest and biomechanics QA workflow → gradual asset production and catalog expansion. Preserve stable IDs, historical snapshots, and schema v1 throughout; this sequence is planned, not already implemented.
- Adaptive Weight Input with Recommended, Keypad, and Wheel Picker modes, equipment-aware quick increments, and exact manual override. Timing and the complete increment table remain unscheduled.
- Muscle Load and the red-intensity Muscle Heat Map, with calculation and rendering kept separate from canonical muscle metadata.
- Training Insights using Result → Analysis → Suggestion and explainable “Why?” details.
- Apple Health/Health Connect, watches, AI Coach, social, nutrition, advanced gamification, and Oracle marketing/analytics/auxiliary services.

## Future

- First-workout calibration and adaptive progression: conservative initial work → actual exercise-specific performance and simple perceived difficulty → baseline → explainable, overrideable proposed sets/load informed by actual history. Body measurements alone are not enough for a precise working weight; actual logged values remain truth. This is not part of the Guided Workout Builder. PR #17 Calibration v1 is deferred for UX redesign, remains unmerged, and is not an Account & Sync dependency.
- Suggested Next Workout and its Recommendation Engine: Workout → Muscle Load → Muscle Map → Training Insight → Suggested Next Workout → Customize → Start Workout → Adapt.
- Recommendation Engine architecture may be anticipated, but implementation must not delay CRESUM Core. Muscle load is one input rather than ground truth.

## Working method

One focused feature/fix per task and PR:
inspect → smallest scope → implement → validate → phone review for UI → commit/PR → checkpoint.

If unfinished Codex changes exist, finish or safely checkpoint them before a new large feature.

After a clean checkpoint, sensible UI sequence:

1. establish/reuse theme tokens from `docs/DESIGN_SYSTEM.md`;
2. Home Dashboard only;
3. validate;
4. Active Workout and Progress as separate tasks.

Do not turn this into a broad rewrite.
