# FitFlow — Development Roadmap

This is priority guidance, not a claim that items are unimplemented. Inspect the repository first.

## Objective
Stable Core:
Onboarding → Home → Workout → Sets → Rest → Finish → History → Progress.

## P0 — Core
1. **Workout Engine** — reliable start/resume, logging, editing, rest timer, persistence, exactly one valid completion, tests.
2. **Exercise Library** — browse/search/select; stable references and consistent metadata.
3. **Workout Templates** — create/select/edit routines without corrupting historical workouts.
4. **History** — accurate completed-session list and details.
5. **Progress** — real saved-data metrics: volume, PRs, progression, estimated 1RM, readable charts.
6. **Local persistence/offline** — core logging does not depend on network; recover data according to current architecture.
7. **Account + Sync** — target Supabase/Postgres; refine after inspecting persistence. Do not replace working local storage unnecessarily.

## P1 — Product polish
- Minimal onboarding.
- Home Dashboard using real app data and `docs/DESIGN_SYSTEM.md`.
- Essential Settings/Profile.
- UI consistency, interaction states, haptics, accessibility, phone-sized layouts.

## P2 — Release readiness
Device/development builds, error handling, store assets/metadata, privacy/permissions, subscriptions/paywall if required, RevenueCat if used, App Store/Google Play preparation.

## Later
Apple Health/Health Connect, watches, AI Coach, social, nutrition, advanced gamification, Oracle marketing/analytics/auxiliary services.

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
