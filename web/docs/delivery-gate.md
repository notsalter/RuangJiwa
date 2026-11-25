# Delivery gate

Scope: implementation and local UI. Production connectivity, deployment rules and operator legal policy are not verified. Emulator integration is explicitly enabled only for the demo project; parent owns integration verification and PWA install/update policy.

## Hard gate

- R-02 PASS: source/docs scan found no newly written em dash characters.
- R-03 PASS: Chromium tested all five tabs at 320, 375, 768, 1280px with zero horizontal overflow after fixing long prompt select sizing. Auth buttons measured 45.19px; base controls are at least 44px.
- R-17 PASS: only recorded mood/quiz values and backend directory ratings are shown.
- R-18 PASS: no testimonials or fictional production people.
- R-23 PASS: approved provisional icon retained; no new visual assets or avatars.
- R-24 PASS: component route test visited all five tab destinations plus quiz.
- R-25 PASS: calculated contrast ratios: body 14.67, links 7.90, primary action 6.29, focal text 13.58, errors 8.36, disabled text 6.81.
- R-26 PASS: native forms, radio/select/checkbox controls, CRUD, confirmation and calendar download exercised in component tests and Chromium with injected test-only boundary.
- R-27 PASS: collection views use explicit loading, empty and safe error/retry states; session query rejection/retry tested.
- R-28 PASS: no FAQ added.
- R-32 PASS: native controls and links are keyboard-operable, focus-visible outline and skip-to-main exist; Chromium exercised Tab. No modal focus trap is required, confirmations are inline.
- R-33 PASS: source implemented directly, no feature patch scripts shipped.
- R-34 PASS: original light theme preserved; no theme toggle or untested alternate theme.
- R-35 PASS: TypeScript, 35 unit/component tests and production build executed. Chromium exercised the click-through below with no page errors.
- R-36 PASS: no compliance/performance/backend-connectivity claims; build payload is measured output, field Web Vitals not measured.
- R-37 PASS: approved indigo/tab direction and ENERGY 1 / RHYTHM 2 / MOTION 1 recorded before editing.
- R-38 PASS: no guest backend or seeded production directory. Browser fixtures are injected from an external scratch probe and marked TEST.
- R-39 PASS: labels wrap native fields, controls have accessible names, cursor/disabled rules and focus style; main/header/nav/footer, document language/title, reduced-motion rules exist.
- R-40 PASS: profile/directory images have explicit 96px dimensions and referrer policy, no hero imagery or third-party blocking script.

## Purpose gate

- R-01 PASS: indigo is the existing approved identity, no gradient/glow.
- R-04 PASS: mood emoji represent the actual stored five-value mood vocabulary, no decorative icon library.
- R-06 PASS: system sans-serif retains native reading familiarity with no font request.
- R-07 PASS: plain reading surface, no patterned background.
- R-08 PASS: no decorative button arrows.
- R-09 PASS: status shown as plain text, no capsule badges.
- R-10 PASS: no blur/glass.
- R-12 PASS: no decorative elevation/shadows.
- R-13 PASS: no glow.
- R-14 PASS: reflection focal region, forms and history rows have content-specific composition rather than feature cards.
- R-19 PASS: hover/press feedback only; reduced-motion stops press transform.
- R-22 PASS: no invented illustration.

## Liveliness and quality locks

- Dials PASS: calm greeting/task focal point, form/list rhythm, hover/press-only motion match ENERGY 1 / RHYTHM 2 / MOTION 1.
- Focal point PASS: each screen leads with its task and primary action rather than metrics.
- Whitespace PASS: form fields are grouped; history and reflection sections have larger separation.
- Accent PASS: indigo primary action and selected tab, neutral secondary controls.
- Identity PASS: RuangJiwa indigo, mood vocabulary, reflection prompts and persistent original five tabs retained.
- Design Read PASS: recorded in design-decisions.md and before first edit.
- C-1 through C-5 PASS: written intent, exercised controls, content-specific composition, responsive states, no fabricated claims.
- R-05 PASS: form/list reading layout, not landing/dashboard template.
- R-11 PASS: 6px controls, 12px focal region, no universal pills.
- R-15 PASS: task-specific labels such as Simpan jurnal and Kirim permintaan.
- R-16 PASS: no marketing buzzwords.
- R-20 PASS: existing RuangJiwa vocabulary/palette/tab structure are preserved.
- R-21 PASS: approved original light reading environment retained; no dark-default invention.
- R-29 PASS: indigo plus neutrals and functional error text.
- R-30 PASS: no external product cloned.
- R-31 PASS: major decisions recorded in design-decisions.md.

## Recorded click-through

Real Chromium, Preact UI and Session with an injected test-only network boundary. These are not production Firebase integration results.

- No config: open, signup toggle, return signin, language selector and Tab focus. Login visibly disabled. Zero page errors.
- All five navigation tabs: correct screens, no overflow at four viewport widths.
- Mood: select very_happy, enter note, save, read history; choose future reminder, prepare calendar link.
- Journal: title/content/tags, random prompt, save, read, favorite, edit/save, delete/cancel deletion, delete/confirm deletion.
- Consultation: directory/detail, explicit future time, pending request, confirm cancellation. Unit/component tests separately cover confirmed-only ICS.
- Quiz: stress selection, five responses, score 10/category moderate saved, visible result/history.
- Profile: readonly email, password reset feedback. Unit/component tests cover name/photo boundary validation and saving.

Parent still needs real emulator E2E, final service-worker/install checks, runtime legal policy and production deployment configuration/rules.
