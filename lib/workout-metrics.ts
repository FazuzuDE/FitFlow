type VolumeSession = {
  exercises: { sets: { weight: string; reps: string; done: boolean }[] }[];
};

// Preserve v0.3 calculations while moving them behind a testable boundary.
export const volume = (session: VolumeSession): number =>
  session.exercises
    .flatMap((exercise) => exercise.sets)
    .filter((set) => set.done)
    .reduce(
      (total, set) =>
        total + (Number(set.weight) || 0) * (Number(set.reps) || 0),
      0,
    );

export const epley = (weight: number, reps: number): number =>
  reps <= 1 ? weight : weight * (1 + reps / 30);
