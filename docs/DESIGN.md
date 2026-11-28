# Design decisions

Reading this as a personal mental-health companion using the existing indigo palette and tab navigation. ENERGY 1 / RHYTHM 2 / MOTION 1. antislop during was approved by the owner.

## Visual pass

The owner reviewed the first released UI, judged it plainer than the Material Android app it replaced, and asked for it to look at least as good. The restraint rules below were relaxed deliberately, not eroded by accident: soft elevation, rounded surfaces, an indigo gradient on the focal cards and pill controls are now allowed where they carry hierarchy. What did not change: no external font, no icon or UI library, no invented data, no decorative imagery, and the same five-tab structure and Indonesian copy.

- A token layer (`web/src/styles/app.css`) defines the ink, surface, line, accent, radius, shadow, spacing and motion scales. Components read tokens; nothing hard-codes a colour a sibling component also uses.
- Cards, pills and soft shadows establish hierarchy. Elevation is limited to three levels and only marks real grouping or interactivity.
- The tab bar is the same markup at every width: a bottom bar with icons on phones, and a top navigation bar from 900px up, where the app also gets a wider reading column.
- Home leads with the date, a time-aware greeting and the primary question, then three shortcuts, then the focal pause card with a working link to the breathing exercise.
- The mood picker is five equal cards with the emoji as the anchor and a selected state that changes border, surface, weight and colour, so selection is not carried by colour alone.
- The mood chart carries value labels on the y-axis and the last date on the x-axis, so it reads without the caption.
- The install and update strip is informational: it sits after the content on phones, spans one column at every width, and never pushes the greeting off the first screen.
- Native controls, 44px targets and a dark-indigo focus outline make keyboard and touch interaction explicit. Icons are `aria-hidden`; icon-only controls carry an `aria-label`.
- Motion is limited to hover, press and small translate feedback at 150ms, and everything is disabled under `prefers-reduced-motion`.
- Recommendations link to real in-app writing or a plain-text self-directed breathing exercise, not invented doctors or absent audio.

## Earlier decisions, still in force

- Indigo is the existing RuangJiwa identity, used for primary actions and active navigation.
- A light surface preserves the original calm reading environment. No unrequested theme is added.
- System sans-serif preserves readable native-app typography without an external font request.
- Existing mood emoji are functional representations of the five stored mood values, never generic decoration.
- The provisional app icon is retained without inventing a replacement or profile imagery.
