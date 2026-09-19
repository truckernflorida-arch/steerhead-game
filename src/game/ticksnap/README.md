# TickSnap

Only physics → UI contract for SteerHead (GDD v1.2.1+).

- Physics owns `causes[]` and `verbs[]` (and fills `symptoms[].label`).
- UI renders symptoms + verb chips from the snap — **no** `if (id === 'TF_…')` inventing copy.
- Every cause enter/exit is logged via `logCauseTransitions` for debrief.

Dummy cascade: `TF_MIXER_DEAD` → `TF_PRESSURE_DROP` → `TF_PACK_OFF` (`dummyEmitter.ts`).
