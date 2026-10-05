import type { ExerciseAssetSpecificationBundle } from './types';
import { getCatalogVariant } from '../exercise-catalog-adapter';
import { immutableSnapshot } from './integrity';

const ref = (id: string, revision = '1') => ({ id, revision });

const canonicalVariant = getCatalogVariant(
  'lat-pulldown-close-neutral-v-handle',
);
if (!canonicalVariant)
  throw new Error('Canonical first-slice variant is required.');

export const approvedExerciseAssetSpecifications = immutableSnapshot({
  productionProfile: {
    ...ref('cresum-first-slice-male-technique', '2'),
    approvalStatus: 'approved',
    scope: 'first-slice-production-only',
    variantId: canonicalVariant.id,
    machineRef: ref('cresum-seated-high-pulley-lat-pulldown-machine'),
    attachmentRef: ref('cresum-close-neutral-v-handle'),
    modelProfileRef: ref('cresum-male-master', '2'),
    outfitProfileRef: ref('cresum-male-outfit-blue-gray-v1'),
  },
  variantRef: {
    ...ref(canonicalVariant.id, '2'),
    approvalStatus: 'approved',
  },
  // A value copy of the adapter record, never a second catalog definition.
  variant: structuredClone(canonicalVariant),
  machine: {
    ...ref('cresum-seated-high-pulley-lat-pulldown-machine'),
    approvalStatus: 'approved',
    name: 'CRESUM Seated High-Pulley Lat Pulldown Machine v1',
    functionalGeometry: {
      frame: 'stable floor-supported generic load-bearing frame',
      pulley: 'single high pulley centered over the exercise station',
      cablePath:
        'taut terminal cable travels from the high pulley in front of the head and torso to the attachment central eyelet',
      resistance:
        'physically plausible selectorized resistance routed through the pulley system',
      seat: 'stable centered padded seat supporting the pelvis',
      thighRestraint:
        'symmetric adjustable padded restraint over the thighs proximal to the knees and not over the patellae',
      movementClearance:
        'clearance for overhead arms, face, handle, cable, and elbows descending beside the torso',
    },
    canonicalVisualReference: null,
    visualReferenceStatus: 'requires-equipment-geometry-qa',
    prohibited: [
      'commercial branding or copied trade dress',
      'cable intersecting the body or frame',
      'attachment or hands colliding with the pulley',
      'restraint positioned on the patellae',
    ],
  },
  attachment: {
    ...ref('cresum-close-neutral-v-handle'),
    approvalStatus: 'approved',
    name: 'CRESUM Close Neutral V-Handle v1',
    rigidity: 'rigid',
    symmetry: 'bilateral-symmetric',
    cableEyelet: 'single-central',
    gripSurfaces: 'two-parallel-or-near-parallel-neutral-grips',
    gripSpacing: 'close-attachment-defined',
    handClearance: 'complete-hand-and-thumb-clearance',
    dimensions: 'qualitative-realistic-proportions',
    prohibited: [
      'pronated triceps press-down V-bar geometry',
      'branding or recognizable proprietary styling',
      'asymmetric load-bearing structure',
      'insufficient hand or thumb clearance',
    ],
  },
  biomechanics: {
    ...ref('biomechanics-lat-pulldown-close-neutral-v-handle', '2'),
    source: ref('cresum-lat-pulldown-biomechanics'),
    constraints: {
      endpoint: 'upper-chest-upper-sternum',
      chestContact: 'optional',
      elbowPath: 'close-no-material-posterior-travel',
      torsoMotion: 'controlled-no-excessive-recline',
      scapularMotion: 'natural-coordinated',
      attachmentOrientation: 'unchanged-between-phases',
    },
    approvalStatus: 'approved',
    variantId: 'lat-pulldown-close-neutral-v-handle',
    machineRef: ref('cresum-seated-high-pulley-lat-pulldown-machine'),
    attachmentRef: ref('cresum-close-neutral-v-handle'),
    equipment: {
      machineArchetype:
        'seated front-of-body high-pulley cable station; concrete geometry belongs to the production profile',
      pulleyPosition: 'high and centered above the exercise station',
      cablePath:
        'taut and continuous in front of the head and torso to the central eyelet',
      seat: 'stable centered seat with the pelvis fully supported',
      thighRestraint:
        'symmetric pads secure the thighs just proximal to the knees',
    },
    grip: {
      orientation: 'neutral',
      width: 'close-attachment-defined',
      handPlacement: 'one complete hand on each grip at symmetric positions',
      fingerContact: 'all fingers anatomically wrap and contact each grip',
      thumbPosition: 'each thumb wraps opposite the fingers',
      wristAlignment:
        'neutral flexion-extension and radial-ulnar alignment with the forearms',
      symmetry: 'bilateral and visually symmetric',
    },
    upperBody: {
      elbowPath:
        'elbows descend toward the sides with only a small posterior component and never materially behind the torso',
      shoulderPosition:
        'controlled throughout without exaggerated shrug, anterior collapse, or extreme extension',
      scapularBehavior:
        'scapulae coordinate naturally with humeral motion: greater upward rotation and elevation at START, then smoothly less upward rotation and elevation with modest retraction and depression at FINISH; no maximal pinching, forced depression, or winging',
      torsoInclination:
        'slight rearward inclination selected at setup and locked between phases',
      spinePosition:
        'neutral controlled spine without pronounced lumbar hyperextension or rounding',
      headAndNeck: 'aligned with the torso without forward-head or chin thrust',
    },
    lowerBody: {
      pelvis: 'fully supported and stable on the seat',
      knees: 'naturally flexed and bilaterally symmetric',
      feet: 'both feet flat and supported on the floor',
    },
    movement: {
      start: [
        'cable taut and handle in front of the head',
        'arms elevated overhead in a narrow symmetric path',
        'elbows near full extension without hyperextension or forced lock',
        'natural overhead scapular upward rotation and elevation without forced depression or maximal retraction',
        'stable torso, pelvis, thigh restraint, knees, and feet',
      ],
      trajectory: [
        'controlled shoulder adduction and extension appropriate to the narrow neutral path',
        'elbows flex and descend toward the sides without wide flare',
        'handle travels in front of the face toward the upper-chest and upper-sternum region',
        'wrists remain neutral and torso inclination remains fixed',
      ],
      finish: [
        'handle is in front of the body near the upper-chest and upper-sternum region; contact is optional',
        'stop before elbows travel materially behind the torso',
        'elbows finish beside the torso at or slightly anterior to the torso plane',
        'shoulders remain controlled without shrug or anterior collapse',
        'scapulae show natural modest retraction and depression without maximal pinching',
        'cable remains taut and lower-body support is unchanged',
      ],
      validRom: {
        start:
          'highest controlled position compatible with a taut cable, near-full elbow extension, neutral wrists, natural overhead scapulae, and a stable torso and pelvis',
        finish:
          'lowest controlled position before elbows move materially behind the torso, torso inclination increases, shoulders roll forward, wrists break, or the attachment must travel toward the abdomen',
      },
      prohibited: [
        'behind-the-neck attachment or cable path',
        'handle at the neck, face, abdomen, or lower chest',
        'elbows materially behind the torso',
        'wide, pronated, supinated, open, or asymmetric grip',
        'floating hands, missing or impossible fingers, or thumbless grip',
        'broken wrist alignment',
        'torso swing or phase-dependent torso lean',
        'pronounced lumbar hyperextension, rounded spine, or forward head',
        'pelvis lifting, thighs outside the restraint, or unsupported feet',
        'forced scapular depression at START, rigid maximal retraction, exaggerated shrug, or winging',
        'cable slack or cable-body-frame intersection',
      ],
    },
    muscles: {
      primary: ['lats'],
      secondary: ['biceps', 'upper-back'],
    },
  },
  visual: {
    ...ref('visual-lat-pulldown-close-neutral-v-handle-male-technique', '3'),
    approvalStatus: 'approved',
    variantId: 'lat-pulldown-close-neutral-v-handle',
    modelProfileRef: ref('cresum-male-master', '2'),
    visualMode: 'technique',
    rendering: [
      'premium semi-realistic 3D instructional rendering',
      'clean seamless white background',
      'soft natural contact shadow',
      'neutral even lighting without cinematic contrast or gym clutter',
      'no anatomy overlay or muscle highlighting',
    ],
    camera: [
      'front-left three-quarter instructional view',
      'camera approximately at upper-torso height',
      'neutral perspective without wide-angle distortion',
      'identical camera transform and lens language for START and FINISH',
    ],
    framing: [
      'full subject including both feet',
      'seat, thigh restraint, attachment, exposed cable path, and high pulley visible',
      'hands, wrists, and elbow paths readable',
      'no crop through functional anatomy or equipment',
    ],
    pairLocks: [
      'model identity, face, hair, age, build, and proportions',
      'clothing and colors',
      'same clothing, colors, and model identity in START and FINISH',
      'machine, attachment, cable origin, seat, restraint, and selected settings',
      'grip and torso inclination',
      'V-handle orientation remains identical between START and FINISH',
      'camera, framing, lighting, background, and rendering language',
      'all specification versions',
    ],
    allowedPhaseChanges: [
      'arm and humeral elevation',
      'elbow flexion and vertical position',
      'mechanically necessary shoulder and coordinated scapular position',
      'handle position and exposed terminal cable length and angle',
      'mechanically consistent visible weight-stack top-plate position',
      'minor pose-caused clothing folds and contact shadows',
    ],
    canvasContract: 'unresolved',
  },
  modelProfiles: [
    {
      ...ref('cresum-male-master', '2'),
      approvalStatus: 'approved',
      model: 'male',
      name: 'CRESUM Male Master Reference',
      identitySource: 'external-master-reference',
      externalReference: {
        logicalId: 'cresum-male-master-reference',
        requiredForGeneration: true,
        asset: null,
      },
      identityLocks: [
        'face',
        'short brown hair',
        'clean-shaven appearance',
        'young-adult age type',
        'athletic / fit build',
        'realistic body proportions',
        'overall character identity',
      ],
    },
  ],
  outfitProfiles: [
    {
      ...ref('cresum-male-outfit-blue-gray-v1'),
      approvalStatus: 'approved',
      model: 'male',
      top: 'fitted muted blue / blue-gray T-shirt; clean, unbranded, no logo',
      bottoms: 'dark gray athletic shorts; clean, unbranded, no logo',
      socks:
        'white athletic socks; clearly visible, normal training length, no branding',
      footwear:
        'light gray athletic shoes; clean modern training shoes, no branding',
    },
    {
      ...ref('cresum-male-outfit-black-v1'),
      approvalStatus: 'approved',
      model: 'male',
      top: 'fitted black T-shirt; unbranded',
      bottoms: 'black athletic shorts; unbranded',
      socks: null,
      footwear: 'black athletic shoes; unbranded',
    },
  ],
  muscleMapping: {
    ...ref('muscle-map-lat-pulldown-close-neutral-v-handle-technique'),
    approvalStatus: 'approved',
    variantId: 'lat-pulldown-close-neutral-v-handle',
    visualMode: 'technique',
    primary: ['lats'],
    secondary: ['biceps', 'upper-back'],
  },
} as const satisfies ExerciseAssetSpecificationBundle);
