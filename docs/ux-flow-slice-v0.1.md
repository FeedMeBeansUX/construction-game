# UX flow – vertical slice "De materialenwagen" v0.1

Copy of the Project doc (2 Nov 2026). Copy IDs refer to `data/copy-nl.json`.

## Flow
Start → (first run) Placement (≤ 6 items) → Location → tap highlighted truck → Briefing → Aan de slag! → Gameplay × 3 loads (one challenge each) → after each correct load: drive + wall animation → after load 3: Completion → Location. "Verder spelen" on Start resumes at the next load (checkpoint after every load). A Huis button (icon + word, top-left) on every screen after Start goes to Location without confirmation.

## Screens
- **S1 Start:** logo, Bram and Sam idle, `btn.play`, `btn.continue` (primary when progress exists), `start.welcomeBack`. Researcher mode: hold logo 5 s → "Export log" (adults, English OK).
- **S2 Placement:** `placement.intro`, items as small truck jobs, no hints or right/wrong feedback; bricks animate to the answer, `placement.next`, `placement.end`.
- **S3 Location:** scene; only the truck is active. Bouncing arrow + Bram waving, `location.pickJob`. Wall shows built sections.
- **S4 Briefing:** Bram bubble `briefing.hello` (first time) → `briefing.task`; button `btn.go` (hard-hat icon).
- **S5 Gameplay:** instruction line · play area (truck, brick stack, sign) · answer row (3 options or Klaar).

| Level | Play area | Step 1 | Step 2 |
|---|---|---|---|
| objects | bed in 10-slot rows, `a` filled, `c − a` outlined | `game.instr.load`: load, then Klaar | `game.instr.howManyAdded`: 1 of 3 |
| objects-numerals | + badges: truck `a`, sign `c` | as objects | as objects |
| numerals | badges only, bed under tarp | `game.instr.howManyMore`: 1 of 3 | chosen bricks load visibly |
| equation | numerals + `a + ? = c` | as numerals | as numerals |

- **S6 Drive + wall:** `feedback.correct.n`, `anim.drive`, truck to wall, `anim.wall`. ≤ 4 s, tap to skip.
- **S7 Completion:** finished wall, Bram cheer, `complete.title` + `complete.wall`; buttons Verder (→ S3), Stoppen (→ S1). After ~5 jobs: `session.lunch` + `session.stopAsk`, never forced.

## Loading bricks
| Action | Drag | Tap alternative |
|---|---|---|
| Load | drag brick from stack onto bed, snaps to next empty slot | tap stack: one brick flies in |
| Unload | drag a new brick back to stack | tap a new brick: it flies back |
| Confirm | – | tap Klaar |

Drop zone = bed + 24 px. Miss → brick bounces back. Stack holds exactly enough to fill. Existing bricks (`a`) can't be removed. Targets: stack ≥ 96 px, bricks ≥ 64 px, buttons ≥ 64 px, options ≥ 96 × 96 with 24 px gaps.

## States
| State | Trigger | What happens | Copy |
|---|---|---|---|
| idle | load start | instruction visible, truck bounces once | instruction |
| loading | first brick | Klaar active once ≥ 1 brick added | – |
| not full | Klaar with empty slots | empty slots pulse, stays in loading | `feedback.notFull` |
| choosing | step 2 / numerals | 3 options | instruction |
| correct | right option | S6 | `feedback.correct.n` |
| retry | wrong option | gentle shake, no red, no sound; numerals: chosen bricks overflow or leave a gap, then return | `feedback.tooMany` / `feedback.notFull`, then `feedback.lookAgain` |
| hint 1 | 10 s idle or 1st wrong | instruction pulses, truck highlighted | `hint.look` |
| hint 2 | 2nd wrong | outline row to next ten, show badges | `hint.fillRow` |
| hint 3 | 3rd wrong | Bram loads up to next ten | `hint.demo`, `hint.yourTurn` |
| easier | 4th wrong | same form, easier band or one support level up | `hint.easier` |

Nothing ever ends because of time.

## Asset hooks
- `assets/machinery/truck.svg`: `slot-01…30` (fill order bottom row, left → right, 5+5), `truck-bricks`, `truck-tarp`, `truck-badge-text`, `truck-dropzone`, wheels.
- `assets/environments/location-magazijn.svg` (1280×800): `truck-anchor` (x 24, y 330), `brick-stack(-hit)`, `sign-text`, `wall-section-1…3(-ghost)`, `char-boss-anchor`, `cue-next-job`, `guides`.
- `assets/characters/char-bram.svg`, `char-sam.svg`: poses `*-idle`, `*-wave`, `*-cheer`.
