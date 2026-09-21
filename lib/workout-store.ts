import { exerciseLibrary } from './workout-catalog';
import { finishWorkout, startWorkout } from './workout-engine';
import { WorkoutSession, WorkoutState, WorkoutTemplate } from './workout-model';
import { emptyWorkoutState, WorkoutRepository } from './workout-repository';
import {
  createTemplate as createTemplateInList,
  deleteTemplate as deleteTemplateFromList,
  TemplateDraft,
  TemplateIdFactory,
  updateTemplate as updateTemplateInList,
} from './workout-templates';

export type TemplateMutationResult =
  { ok: true; template?: WorkoutTemplate } | { ok: false; error: string };

export class WorkoutStore {
  private listeners = new Set<() => void>();
  private revision = 0;
  private snapshot = {
    data: emptyWorkoutState(),
    ready: false,
    busy: false,
    error: '',
  };
  constructor(private readonly repository: WorkoutRepository) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(update: Partial<typeof this.snapshot>) {
    this.snapshot = { ...this.snapshot, ...update };
    this.listeners.forEach((listener) => listener());
  }
  async load() {
    if (this.snapshot.busy) return;
    this.publish({ busy: true, error: '' });
    try {
      const data = await this.repository.load();
      this.publish({ data, ready: true });
    } catch {
      this.publish({
        error:
          'Could not load saved workouts. Your saved data has been kept. Retry to continue.',
      });
    } finally {
      this.publish({ busy: false });
    }
  }
  private persist(data: WorkoutState) {
    const revision = ++this.revision;
    this.publish({ data });
    void this.repository.save(data).then(
      () => {
        if (revision === this.revision) this.publish({ error: '' });
      },
      () => {
        if (revision === this.revision)
          this.publish({
            error: 'Changes are not saved yet. Keep the app open and retry.',
          });
      },
    );
  }
  updateWorkout(transform: (session: WorkoutSession) => WorkoutSession) {
    const { data, ready, busy } = this.snapshot;
    if (!ready || busy || !data.activeWorkout) return;
    this.persist({ ...data, activeWorkout: transform(data.activeWorkout) });
  }
  start(template: WorkoutTemplate) {
    const { data, ready, busy } = this.snapshot;
    if (!ready || busy) return;
    if (data.activeWorkout)
      throw new Error('Resume your active workout before starting another.');
    const activeWorkout = startWorkout(template, exerciseLibrary);
    if (!activeWorkout.exercises.length)
      throw new Error('This template has no available exercises.');
    this.persist({ ...data, activeWorkout });
  }
  setTemplates(templates: WorkoutTemplate[]) {
    if (!this.snapshot.ready || this.snapshot.busy) return;
    this.persist({ ...this.snapshot.data, templates });
  }
  private async commitTemplates(
    change: (templates: readonly WorkoutTemplate[]) => {
      templates: WorkoutTemplate[];
      template?: WorkoutTemplate;
    },
  ): Promise<TemplateMutationResult> {
    const { data, ready, busy } = this.snapshot;
    if (!ready) return { ok: false, error: 'Templates are not ready yet.' };
    if (busy)
      return {
        ok: false,
        error: 'Template changes are already being saved. Try again shortly.',
      };

    let changeResult: ReturnType<typeof change>;
    try {
      changeResult = change(data.templates);
    } catch (problem) {
      return { ok: false, error: (problem as Error).message };
    }

    const next = { ...data, templates: changeResult.templates };
    ++this.revision;
    this.publish({ busy: true, error: '' });
    try {
      await this.repository.save(next);
      this.publish({ data: next, error: '' });
      return { ok: true, template: changeResult.template };
    } catch {
      const error = 'Template changes could not be saved. Try again.';
      this.publish({ error });
      return { ok: false, error };
    } finally {
      this.publish({ busy: false });
    }
  }
  createTemplate(
    draft: TemplateDraft,
    idFactory?: TemplateIdFactory,
  ): Promise<TemplateMutationResult> {
    return this.commitTemplates((templates) =>
      createTemplateInList(templates, draft, idFactory),
    );
  }
  updateTemplate(
    templateId: string,
    draft: TemplateDraft,
  ): Promise<TemplateMutationResult> {
    return this.commitTemplates((templates) => ({
      templates: updateTemplateInList(templates, templateId, draft),
    }));
  }
  deleteTemplate(templateId: string): Promise<TemplateMutationResult> {
    return this.commitTemplates((templates) => ({
      templates: deleteTemplateFromList(templates, templateId),
    }));
  }
  async retry() {
    if (!this.snapshot.ready) return this.load();
    if (this.snapshot.busy) return;
    this.persist(this.snapshot.data);
  }
  async finish(): Promise<WorkoutSession | undefined> {
    const { data, ready, busy } = this.snapshot;
    if (!ready || busy || !data.activeWorkout) return;
    const completed = finishWorkout(data.activeWorkout);
    const next = {
      ...data,
      activeWorkout: null,
      history: [
        completed,
        ...data.history.filter((item) => item.id !== completed.id),
      ],
    };
    ++this.revision;
    this.publish({ busy: true, error: '' });
    try {
      await this.repository.save(next);
      this.publish({ data: next });
      return completed;
    } catch {
      this.publish({
        error:
          'Workout could not be saved. Your active workout is still here. Try Finish again.',
      });
      return undefined;
    } finally {
      this.publish({ busy: false });
    }
  }
}
