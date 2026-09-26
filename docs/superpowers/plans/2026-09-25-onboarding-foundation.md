# Onboarding Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give new CRESUM users a resumable choice between lightweight personalization and creating their first workout, without changing Workout Engine persistence.

**Architecture:** A separate versioned AsyncStorage record owns onboarding progress and answers. A small onboarding controller/screen sits above the existing four-tab app and embeds the existing `TemplateEditor` for self-setup. Existing meaningful workout data bypasses the gate; Profile can reopen personalization without a permanent opt-out.

**Tech Stack:** React Native, Expo, TypeScript, AsyncStorage, Jest/react-test-renderer.

**Spec:** `docs/PRODUCT.md` onboarding section, `docs/DESIGN_SYSTEM.md` onboarding section, and the approved PR #16 request.

## Global Constraints

- Do not change `fitflow_state_v1` or `schemaVersion: 1`.
- Keep Calibration, Recommendation Engine, demographic-based weight inference, and other roadmap features out of this PR.
- Reuse the existing Guided Workout Builder; its successful durable save is the only self-setup completion trigger.
- Preserve workout/history data even when onboarding storage is malformed or unavailable.
- Use only design-system tokens and existing components.

## Review Focus

- A malformed onboarding record must not write to workout storage or trap a user with existing training data.
- Failed onboarding completion after successful template save must not create a duplicate template on retry.
- Back/Cancel must preserve or discard only onboarding/builder draft as intended, never mark completion.
- Reload during partial personalization must restore step and answers.
- Existing sessions/history/custom templates must bypass first-run gating; built-ins alone must not.

---

### Task 1: Domain and persistence

**Files:** Create `lib/onboarding.ts`, `lib/onboarding-repository.ts`, `lib/__tests__/onboarding.test.ts`.

**Interfaces:** `OnboardingState` is a versioned discriminated status/step with typed partial answers. `shouldShowOnboarding(state, workoutState)` handles legacy bypass. `OnboardingRepository.load/save` reads and writes only `cresum_onboarding_v1`.

- [ ] Write failing tests for first run, valid resume, malformed record, meaningful legacy data and built-ins-only behavior.
- [ ] Run `npm test -- --runTestsByPath lib/__tests__/onboarding.test.ts`; confirm expected failure.
- [ ] Implement strict parse and isolated persistence; malformed/unsupported records return recoverable error without overwriting raw data.
- [ ] Run focused tests to green.

### Task 2: Onboarding flow and builder integration

**Files:** Create `components/Onboarding.tsx`, `lib/__tests__/onboarding-screen.test.tsx`; modify `app/index.tsx`, `components/ProfileSettings.tsx`.

**Interfaces:** `Onboarding` receives state, transition/save callbacks, `createTemplate`, and completion callback. It renders Welcome, Goal, Experience, Environment, optional Profile, completion, or `TemplateEditor`.

- [ ] Write failing screen/integration tests for both Welcome paths, step selections, Back/reload, optional fields, builder cancel/save, Profile re-entry and accessibility.
- [ ] Run focused tests and confirm expected failure.
- [ ] Implement one-step-at-a-time flow with scroll/keyboard-safe controls and persisted transitions. Keep Profile edit mode non-gating.
- [ ] Run focused tests to green and existing app screen tests; update tests only to explicitly seed completed onboarding where they test established-tab behavior.

### Task 3: Documentation, validation and PR

**Files:** Modify only `docs/PRODUCT.md`, `docs/DESIGN_SYSTEM.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md` for missing approved decisions.

- [ ] Sync product behavior, UX, roadmap sequencing and dated decision; leave AGENTS unchanged.
- [ ] Run `npm run check`, `npx expo-doctor`, `npm run export:check`, and `git diff --check`.
- [ ] Focused review persistence, navigation, accessibility, compact layout and long text; fix Critical/Important findings.
- [ ] Commit focused changes, push `feature/onboarding-foundation`, create exactly one PR to `develop`, verify CI; do not merge.
