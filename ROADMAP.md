# FitFlow — Product & Engineering Roadmap

> Статус документа: draft for execution
>
> Базовая версия: v0.3.0
>
> Горизонт: v0.3 → v1.0
>
> Последнее обновление: 18 сентября 2026

## 1. Цель продукта

### Уточнение инфраструктуры — 18 сентября 2026

У владельца уже есть Oracle Always Free сервер; исходный код и CI планируются в
GitHub. Первый исполнимый этап — подготовка репозитория и проверок, затем
инвентаризация Oracle и выбор backend. Детали: [GitHub и Oracle](docs/INFRASTRUCTURE.md).

Все упоминания Supabase ниже являются первоначальным вариантом, а не утверждённым
ограничением. Рабочая альтернатива — PostgreSQL + API на Oracle; Auth, проверка
владельца данных, миграции и sync должны быть спроектированы и протестированы
независимо от выбора. `BE-*`, `AUTH-*`, RLS-тесты и путь `supabase/` будут уточнены
после архитектурного решения. Локальные проверки и CI workflow подготовлены;
запуск на GitHub и deployment на Oracle ещё не подтверждены.

Сроки в таблице ниже — исходная оценка, которую нужно пересмотреть после этого
решения. Переход на собственный API не считается бесплатной заменой Supabase.

FitFlow — мобильный дневник силовых тренировок, который позволяет начать тренировку за несколько секунд, удобно записывать подходы во время занятия и видеть понятный прогресс без перегруженного интерфейса.

Целевой результат v1.0:

- пользователь может зарегистрироваться, пройти короткий онбординг и начать первую тренировку без ручной настройки;
- тренировка сохраняется локально даже без сети и синхронизируется между устройствами после восстановления соединения;
- библиотека упражнений, шаблоны и история образуют единый, надёжный поток;
- аналитика отвечает на три вопроса: «становлюсь ли я сильнее?», «достаточно ли я тренируюсь?» и «что тренировать дальше?»;
- приложение готово к закрытой/публичной публикации: протестировано, наблюдаемо, безопасно и имеет понятную политику работы с данными.

## 2. Текущее состояние — v0.3

### Уже реализовано

- Expo 53, React Native 0.79, TypeScript и Expo Router;
- локальная библиотека из 12 упражнений с поиском;
- три встроенных шаблона и пользовательские шаблоны;
- активная тренировка, редактирование и удаление подходов;
- добавление упражнения в активную тренировку;
- таймер отдыха, haptics и восстановление активной тренировки;
- локальная история, тренировочный объём и расчёт estimated 1RM по Epley;
- базовые экраны Home, Workout, Stats и Profile;
- хранение данных в AsyncStorage.

### Основные ограничения

- UI, состояние, бизнес-логика и persistence сосредоточены преимущественно в `app/index.tsx`;
- нет тестов, lint/format/typecheck scripts и CI;
- нет версии схемы локальных данных и миграций;
- нет авторизации, серверного хранилища и синхронизации;
- каталог упражнений зашит в код и недостаточен для реального использования;
- отсутствуют обработка ошибок, crash reporting и продуктовая аналитика;
- конфигурация версии расходится: `package.json` содержит `0.3.0`, а `app.json` — `1.0.0`;
- нет accessibility-аудита, локализации, privacy flow и release-процесса.

## 3. Принципы реализации

1. **Workout first.** Скорость и надёжность записи подхода важнее второстепенных функций.
2. **Offline first.** Потеря сети не должна блокировать тренировку или приводить к потере данных.
3. **Одна модель данных.** UI, локальное хранилище и Supabase используют согласованные доменные сущности и стабильные UUID.
4. **Малые релизы.** Каждая версия завершается тестируемым пользовательским результатом, а не только внутренним рефакторингом.
5. **Privacy by default.** Пользователь видит, какие данные сохраняются, может экспортировать и удалить их.
6. **Измеримость.** Для каждой продуктовой функции заранее определяются события и критерий успеха.

## 4. Приоритеты

### P0 — обязательно до v1.0

- модульная архитектура и версионированная модель данных;
- надёжная активная тренировка и локальное сохранение;
- Supabase Auth, RLS, cloud sync и восстановление данных;
- полноценные шаблоны, библиотека и история тренировок;
- базовая аналитика прогресса;
- тестирование критических сценариев, crash reporting, privacy и release pipeline.

### P1 — желательно до v1.0

- onboarding с настройкой целей и единиц измерения;
- кастомные упражнения, заметки, RPE/RIR и типы подходов;
- план тренировок и календарь;
- напоминания, экспорт данных и локализация EN/RU;
- доступность и поддержка динамического размера текста.

### P2 — после подтверждения retention

- Apple Health / Health Connect;
- social, тренеры и совместные шаблоны;
- видео упражнений и облачное медиа;
- AI-рекомендации и автоматическое программирование;
- подписка и платные функции.

## 5. Версионный план

Оценки ниже рассчитаны для одного разработчика и двухнедельных итераций. При параллельной работе сроки уточняются после декомпозиции и оценки задач.

| Версия |   Ориентир | Главный результат                                   | Exit criteria                                                                                                            |
| ------ | ---------: | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| v0.3.1 |   1 неделя | Стабильная база и зафиксированное поведение MVP     | Проект проверяется одной командой; критические потоки покрыты тестами; данные v0.3 не теряются                           |
| v0.4   |   3 недели | Архитектура, аккаунт и безопасное облачное хранение | Новый пользователь проходит onboarding; локальные данные мигрируют; RLS проверен; синхронизация переживает offline/retry |
| v0.5   |   2 недели | Качественный workout experience                     | Любую типовую тренировку можно провести от старта до результата без блокирующих UX-проблем                               |
| v0.6   |   2 недели | Полноценные библиотека, шаблоны и планирование      | Пользователь создаёт собственную структуру занятий и видит её в календаре                                                |
| v0.7   |   2 недели | Полезная аналитика прогресса                        | Метрики корректны, объяснимы и открываются из истории до исходного подхода                                               |
| v0.8   |   2 недели | Retention и персонализация                          | Напоминания управляемы; настройки и экспорт работают; EN/RU готовы                                                       |
| v0.9   | 2–3 недели | Закрытая beta и production hardening                | Нет открытых P0/P1 дефектов; crash-free sessions ≥ 99.5%; пройден release checklist                                      |
| v1.0   |   1 неделя | Публичный релиз                                     | Store metadata, privacy, monitoring, support и rollback-план готовы                                                      |

## 6. Детальный план по этапам

### Этап 0 — стабилизация v0.3.1

**Цель:** сделать текущее поведение измеримым и безопасным для последующей миграции.

#### Архитектура и tooling

- [ ] `FND-01` Зафиксировать Node/package-manager version и добавить lockfile.
- [ ] `FND-02` Добавить scripts: `typecheck`, `lint`, `format`, `test`, `test:watch`.
- [ ] `FND-03` Настроить ESLint, Prettier, Jest и React Native Testing Library.
- [ ] `FND-04` Ввести CI: install → typecheck → lint → test → Expo config validation.
- [ ] `FND-05` Синхронизировать версии в `package.json`, `app.json` и build config.

#### Декомпозиция монолита

- [ ] `ARC-01` Вынести доменные типы: Exercise, Workout, WorkoutExercise, Set, Template, UserSettings.
- [ ] `ARC-02` Разделить routes, feature-компоненты, shared UI, hooks, services и repositories.
- [ ] `ARC-03` Вынести расчёты volume/e1RM в чистые функции с unit-тестами.
- [ ] `ARC-04` Создать единый workout store с явными actions вместо глубокого JSON-clone.
- [ ] `ARC-05` Создать storage interface, чтобы AsyncStorage и Supabase не использовались напрямую из UI.

#### Данные и надёжность

- [ ] `DATA-01` Добавить `schemaVersion` и миграцию существующих ключей `fitflow_*`.
- [ ] `DATA-02` Валидировать данные при чтении; повреждённая запись не должна ронять приложение.
- [ ] `DATA-03` Ввести UUID для сущностей и ISO timestamps для переносимости между устройствами.
- [ ] `DATA-04` Покрыть тестами: старт, редактирование, восстановление, завершение тренировки и сохранение шаблона.

**Definition of Done:** чистая установка запускается; существующие локальные данные открываются после обновления; CI зелёный; расчёт volume/e1RM детерминирован и протестирован.

---

### Этап 1 — v0.4: аккаунт, onboarding и cloud foundation

**Цель:** пользовательские данные безопасно доступны после входа и не теряются при плохой сети.

#### Backend и модель данных

- [ ] `BE-01` Создать Supabase environments: development и production; секреты хранить вне репозитория.
- [ ] `BE-02` Добавить миграции для таблиц `profiles`, `exercises`, `templates`, `template_exercises`, `workouts`, `workout_exercises`, `workout_sets`, `user_settings`.
- [ ] `BE-03` Во все пользовательские сущности добавить `id`, `user_id`, `created_at`, `updated_at`, `deleted_at` и индекс по владельцу/обновлению.
- [ ] `BE-04` Настроить RLS: пользователь читает и изменяет только свои данные; системная библиотека доступна read-only.
- [ ] `BE-05` Добавить seed базовой библиотеки и версию каталога.
- [ ] `BE-06` Проверить RLS отдельными integration tests для anonymous/user A/user B.

#### Auth и onboarding

- [ ] `AUTH-01` Реализовать email sign-up/sign-in, подтверждение email, logout и восстановление пароля.
- [ ] `AUTH-02` Сохранить и восстанавливать auth session, корректно обрабатывать expired/refresh token.
- [ ] `AUTH-03` Добавить onboarding: имя, опыт, цель, единицы веса, дни тренировок и согласие с privacy policy.
- [ ] `AUTH-04` Разрешить локальный guest-flow; предложить привязать аккаунт после первой завершённой тренировки.
- [ ] `AUTH-05` Реализовать слияние guest-данных с аккаунтом без дубликатов.
- [ ] `AUTH-06` Подготовить account deletion и повторную аутентификацию для опасных действий.

#### Offline-first sync

- [ ] `SYNC-01` Выбрать локальную БД для нормализованных данных; AsyncStorage оставить только для небольших настроек/session metadata.
- [ ] `SYNC-02` Реализовать outbox: локальная запись → очередь изменений → retry с exponential backoff.
- [ ] `SYNC-03` Определить conflict policy: незавершённая тренировка защищена от перезаписи; для остальных сущностей — last-write-wins по server timestamp с логом конфликта.
- [ ] `SYNC-04` Поддержать tombstones для удаления и идемпотентный upsert.
- [ ] `SYNC-05` Показать ненавязчивый sync status и понятное действие при длительной ошибке.
- [ ] `SYNC-06` Протестировать airplane mode, force close, повторный login, два устройства и частично выполненный sync.

**Definition of Done:** пользователь может работать offline, затем войти на другом устройстве и получить полную историю; guest migration выполняется один раз; ни один RLS-тест не допускает межпользовательский доступ.

---

### Этап 2 — v0.5: workout experience

**Цель:** довести главный сценарий до уровня ежедневного использования в зале.

#### Активная тренировка

- [ ] `WO-01` Показать elapsed time, выполненный объём, число подходов и текущий прогресс.
- [ ] `WO-02` Добавить reorder/remove/replace упражнения с подтверждением только при потере введённых данных.
- [ ] `WO-03` Поддержать warm-up, working, drop и failure sets.
- [ ] `WO-04` Добавить RPE или RIR, заметку к упражнению и заметку к тренировке.
- [ ] `WO-05` Предзаполнять вес/повторы из прошлого выполнения этого упражнения.
- [ ] `WO-06` Добавить undo после удаления и защиту от случайного завершения/отмены.
- [ ] `WO-07` Разрешить ручное редактирование даты, времени и длительности завершённой тренировки.

#### Таймер и системное поведение

- [ ] `TMR-01` Настраиваемый таймер по умолчанию и на уровне упражнения.
- [ ] `TMR-02` Продолжение таймера в background и локальное уведомление по завершении.
- [ ] `TMR-03` Быстрые действия `+30 sec`, `skip`, `restart`; звук/haptics уважают настройки устройства.
- [ ] `TMR-04` Не допускать drift таймера: хранить target timestamp, а не только уменьшать локальный counter.

#### UX и accessibility

- [ ] `UX-01` Keyboard-safe ввод и корректная decimal separator для locale.
- [ ] `UX-02` Достаточные touch targets, screen reader labels, contrast и dynamic type.
- [ ] `UX-03` Skeleton/empty/error states для всех основных экранов.
- [ ] `UX-04` Проверить малые Android-экраны и актуальные iPhone form factors.

**Definition of Done:** сценарий «шаблон → подходы → таймер → добавление упражнения → завершение → история» проходит на iOS и Android, offline и после перезапуска; нет потери введённых данных.

---

### Этап 3 — v0.6: библиотека, шаблоны и план

**Цель:** дать пользователю достаточно гибкости для собственной программы тренировок.

#### Exercise Library

- [ ] `LIB-01` Расширить seed-каталог и добавить поля: primary/secondary muscles, equipment, movement pattern, difficulty, instructions.
- [ ] `LIB-02` Поиск с нормализацией, фильтры и группировка по мышцам/оборудованию.
- [ ] `LIB-03` Пользовательские упражнения: создание, редактирование, архивирование и merge duplicates.
- [ ] `LIB-04` История и PR внутри карточки упражнения.
- [ ] `LIB-05` Отделить canonical exercise от workout snapshot, чтобы переименование не меняло старую историю.

#### Templates и planning

- [ ] `TPL-01` Полный CRUD шаблонов, reorder упражнений/подходов и настройка целевых повторов/отдыха.
- [ ] `TPL-02` Duplicate template и создание шаблона из завершённой тренировки.
- [ ] `TPL-03` Папки/теги или программы для группировки шаблонов.
- [ ] `PLAN-01` Недельный план и календарь: planned, completed, skipped.
- [ ] `PLAN-02` Reschedule без потери связи с программой.

**Definition of Done:** пользователь может создать упражнение, собрать программу, запланировать неделю и провести занятие, сохранив связь plan → workout → analytics.

---

### Этап 4 — v0.7: история и аналитика

**Цель:** превратить накопленные данные в понятную обратную связь.

#### История

- [ ] `HIST-01` Экран списка с поиском и фильтрами по периоду, шаблону и упражнению.
- [ ] `HIST-02` Детали тренировки, редактирование, удаление с undo и duplicate as new workout.
- [ ] `HIST-03` Календарная heatmap и недельная/месячная сводка.

#### Метрики

- [ ] `STAT-01` Volume и выполненные working sets по неделям и мышечным группам.
- [ ] `STAT-02` Exercise trend: лучший вес, reps, volume и estimated 1RM.
- [ ] `STAT-03` PR по категориям и событие PR сразу после завершения подхода.
- [ ] `STAT-04` Consistency: тренировки в неделю, streak и adherence к плану.
- [ ] `STAT-05` Сравнение периодов с пояснением формулы и минимального объёма данных.
- [ ] `STAT-06` Не учитывать warm-up в рабочих метриках; корректно обрабатывать bodyweight/unilateral упражнения.

#### Проверка корректности

- [ ] `STAT-07` Golden datasets для всех формул и edge cases.
- [ ] `STAT-08` Каждая aggregate metric открывает исходные тренировки/подходы.

**Definition of Done:** числа совпадают с контрольными наборами; пользователь может понять происхождение каждой метрики; пустые и короткие периоды не вводят в заблуждение.

---

### Этап 5 — v0.8: retention, настройки и контроль данных

**Цель:** повысить возвращаемость, не создавая навязчивости.

- [ ] `RET-01` Опциональные напоминания по расписанию пользователя и planned workout.
- [ ] `RET-02` Post-workout summary: PR, объём, длительность и сравнение с прошлым занятием.
- [ ] `RET-03` Цели на неделю и мягкий progress indicator без штрафующих механик.
- [ ] `SET-01` Настройки kg/lb, языка, timer, haptics, sound и first day of week.
- [ ] `I18N-01` Вынести строки и выпустить проверенные EN/RU translations.
- [ ] `DATA-05` Export пользовательских данных в переносимом формате CSV/JSON.
- [ ] `DATA-06` Удаление аккаунта и локальных/облачных данных с понятным подтверждением.
- [ ] `PRIV-01` Privacy policy, terms, permissions rationale и data-retention policy.

**Definition of Done:** уведомления приходят только после явного opt-in; unit conversion не меняет физический смысл истории; export/import round-trip проходит контрольный тест.

---

### Этап 6 — v0.9: beta и production hardening

**Цель:** доказать стабильность на реальных устройствах и устранить риски релиза.

#### Quality

- [ ] `QA-01` E2E smoke tests: auth, onboarding, guest merge, workout, offline sync, history, delete account.
- [ ] `QA-02` Device matrix для поддерживаемых iOS/Android версий.
- [ ] `QA-03` Performance budgets: cold start, list rendering, bundle size и sync latency.
- [ ] `QA-04` Проверка battery/network consumption во время долгой тренировки.
- [ ] `QA-05` Accessibility и локализационный аудит.

#### Operations

- [ ] `OPS-01` Crash/error reporting с redaction персональных и тренировочных данных.
- [ ] `OPS-02` Product events и dashboard ключевой воронки.
- [ ] `OPS-03` Remote feature flags и kill switch для рискованных функций синхронизации.
- [ ] `OPS-04` Backup/restore drill, migration rollback и incident checklist.
- [ ] `OPS-05` Dev/staging/production build profiles и автоматическая сборка preview/release.

#### Beta

- [ ] `BETA-01` Internal alpha: 5–10 пользователей, 1 неделя.
- [ ] `BETA-02` Closed beta: 25–50 пользователей, 2 недели.
- [ ] `BETA-03` Триаж feedback по severity/frequency; релиз блокируют все P0 и воспроизводимые P1.

**Definition of Done:** crash-free sessions ≥ 99.5%; sync success ≥ 99%; нет известных случаев потери тренировки; все P0/P1 закрыты или имеют одобренный mitigation.

---

### Этап 7 — v1.0: launch

- [ ] `REL-01` Иконка, splash, screenshots, description, keywords и support URL.
- [ ] `REL-02` Store privacy labels/data safety form соответствуют фактическому сбору данных.
- [ ] `REL-03` Production smoke test на store build, а не только development client.
- [ ] `REL-04` Staged rollout, мониторинг первых 24/72 часов и критерии остановки rollout.
- [ ] `REL-05` Канал поддержки, FAQ, issue template и процедура ответа на data-deletion request.
- [ ] `REL-06` Release notes и baseline метрик для сравнения следующих версий.

**Definition of Done:** опубликован production build, мониторинг активен, восстановление/rollback проверены, пользователь может получить поддержку и полностью удалить данные.

## 7. Целевая архитектура

Рекомендуемая структура после `ARC-02`:

```text
app/                         # Expo Router routes/layouts
src/
  features/
    auth/
    onboarding/
    workout/
    exercises/
    templates/
    history/
    analytics/
    settings/
  domain/                    # entities, value objects, pure calculations
  data/
    local/                   # local database, migrations
    remote/                  # Supabase client and DTOs
    repositories/            # domain-facing interfaces/implementations
    sync/                    # outbox, conflict resolution, retries
  shared/
    ui/
    hooks/
    utils/
    config/
  test/
supabase/
  migrations/
  seed.sql
```

Правила зависимостей:

- route знает о feature screen, но не о Supabase/AsyncStorage;
- feature вызывает repository/use case, а не внешний SDK напрямую;
- domain не зависит от React Native;
- remote DTO преобразуется в domain model в data layer;
- аналитические формулы — чистые функции с versioned definition.

## 8. Базовая модель данных

| Сущность             | Назначение                              | Важные поля                                                        |
| -------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| `profiles`           | профиль и завершение onboarding         | `user_id`, `display_name`, `onboarding_completed_at`               |
| `user_settings`      | персональные настройки                  | `weight_unit`, `locale`, `rest_seconds`, notification settings     |
| `exercises`          | системные и пользовательские упражнения | `owner_id?`, `name`, muscles, equipment, `catalog_version`         |
| `templates`          | заголовок шаблона                       | `user_id`, `name`, `position`, `archived_at`                       |
| `template_exercises` | упражнения и цели внутри шаблона        | `template_id`, `exercise_id`, `position`, target sets/reps/rest    |
| `workouts`           | тренировка как сессия                   | `user_id`, `template_id?`, start/end, notes, sync state            |
| `workout_exercises`  | snapshot упражнения в тренировке        | `workout_id`, `exercise_id?`, snapshot name/muscles, `position`    |
| `workout_sets`       | фактический подход                      | `workout_exercise_id`, type, weight, reps, RPE/RIR, completed time |

Критичные решения до реализации схемы:

- вес хранить в одной canonical unit с точностью, исключающей накопление ошибок;
- исторические названия/атрибуты сохранять snapshot-ом;
- удаление синхронизируемых сущностей делать soft-delete до compaction;
- `updated_at` задаёт сервер, клиентские операции имеют unique operation id;
- незавершённая тренировка может быть активна только одна на пользователя, если продукт не решит иначе.

## 9. Стратегия тестирования

### Unit

- volume, e1RM, kg/lb conversion, duration и PR detection;
- reducers/actions активной тренировки;
- migrations и conflict resolution;
- validation и mapping DTO ↔ domain.

### Integration

- repositories с локальной БД;
- Supabase migrations/RLS;
- outbox retry, duplicate delivery и tombstones;
- guest-to-account migration.

### Component

- ввод подхода, состояние done, добавление/удаление;
- формы auth/onboarding/settings;
- loading/empty/error/offline states.

### E2E

- первая тренировка guest-пользователя;
- регистрация и перенос локальной истории;
- восстановление активной тренировки после force close;
- тренировка offline и последующая синхронизация;
- вход на втором устройстве;
- export и удаление аккаунта.

## 10. Метрики продукта и качества

### Основная продуктовая метрика

**Completed workouts per weekly active user** — отражает реальную ценность лучше, чем простое число открытий приложения.

### Воронка

- onboarding started → onboarding completed;
- onboarding completed → first workout started;
- first workout started → first workout completed;
- first workout completed → second workout within 7 days;
- week 1 → week 4 retention.

### Guardrails

- workout save success ≥ 99.9%;
- sync success после retry ≥ 99%;
- crash-free sessions ≥ 99.5% в beta, цель ≥ 99.8% после launch;
- доля незавершённых из-за технической ошибки тренировок < 0.5%;
- p95 локального сохранения подхода < 100 ms;
- события аналитики не содержат свободный текст, email, веса/повторы или другие чувствительные payloads без явной необходимости.

## 11. Зависимости и критический путь

```text
FND/ARC/DATA
    ↓
Supabase schema + RLS
    ↓
Auth + guest migration
    ↓
Offline sync
    ↓
Workout hardening
    ↓
Library/templates/planning
    ↓
Analytics
    ↓
Beta hardening → v1.0
```

Нельзя безопасно начинать multi-device sync до UUID, schema version и repository abstraction. Аналитику можно проектировать раньше, но финализировать только после стабилизации типов подходов и правил snapshot/history.

## 12. Риски и способы снижения

| Риск                                        | Вероятность / влияние | Mitigation                                                                         |
| ------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| Потеря или дублирование тренировок при sync | Высокая / критическое | Local-first, outbox, idempotency key, tombstones, sync integration tests           |
| Слишком раннее усложнение backend           | Средняя / высокое     | Реализовать только P0 schema и один conflict policy; social/media отложить         |
| Разрастание scope библиотеки                | Высокая / среднее     | Начать с качественного seed и custom exercises; медиа вынести после v1             |
| Ошибочные или непонятные метрики            | Средняя / высокое     | Versioned formulas, golden datasets, drill-down к исходным sets                    |
| Таймер ломается в background                | Высокая / среднее     | Target timestamp + local notification + device tests                               |
| Privacy/store rejection                     | Низкая / высокое      | Privacy review до beta, data inventory, account deletion и корректные store labels |
| Слабый retention несмотря на объём функций  | Средняя / высокое     | Проверять first/second workout funnel до P2-функций и монетизации                  |

## 13. Ближайший исполнимый backlog

Порядок первых задач без дополнительных продуктовых решений:

1. `FND-01…05` — воспроизводимая сборка и CI.
2. `ARC-01` + `ARC-03` — типы и чистая доменная логика.
3. `DATA-01…04` — версия локальной схемы и regression tests.
4. `ARC-04…05` — workout store и repository boundary.
5. `BE-01…06` — Supabase schema, seed и RLS tests.
6. `AUTH-01…03` — auth и onboarding.
7. `AUTH-04…05` + `SYNC-01…06` — guest migration и offline sync.
8. Выпустить v0.4 в internal alpha только после прохождения exit criteria.

## 14. Решения, которые нужно зафиксировать до v0.4

- guest mode обязателен или регистрация требуется до первой тренировки;
- методы входа v1: только email или также Apple/Google;
- одна или несколько одновременных активных тренировок;
- локальная БД и библиотека управления состоянием;
- минимальные поддерживаемые версии iOS/Android;
- какие языки входят в v1;
- является ли планирование частью бесплатного ядра;
- срок хранения удалённых cloud records до окончательной очистки.

До принятия решений roadmap исходит из следующих рабочих допущений: guest mode разрешён; email auth обязателен, social login — после стабилизации; активная тренировка одна; EN и RU входят в v1; все P2-функции исключены из критического пути.

## 15. Definition of Done для любой задачи

Задача считается завершённой, когда:

- выполнены acceptance criteria и обработаны loading/empty/error/offline состояния;
- добавлены или обновлены автоматические тесты пропорционально риску;
- typecheck/lint/tests проходят локально и в CI;
- нет необработанных персональных данных в логах/аналитике;
- поведение проверено минимум на iOS и Android для пользовательской функции;
- схема/миграция/события/документация обновлены, если задача их меняет;
- предусмотрены backward compatibility и rollback для изменений данных.
