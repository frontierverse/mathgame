# Design QA — 수학 적립 금고

final result: passed

Reviewed on 2026-10-08. No actionable P0/P1/P2 findings remain in the applied mobile design after the fixes below.

## Reference and comparison target

- Visual source: the ten artboards inspected in the user's open Claude app, captured on 2026-10-07. Source directory: `/Users/seungsikshin/.codex/visualizations/2026/10/07/01a11696-340c-75a0-b1e7-393598c5e6fc/math-vault-audit`.
- Implementation: `http://127.0.0.1:3000/`, rendered through the Codex in-app browser on the user's Mac. Existing Next.js app and curriculum retained.
- Main viewport: 390 × 844 CSS pixels; screenshots are 390 × 844 pixels. Claude mobile crops are 388 × 840 pixels, normalized to 390 × 844 for comparison. Source rounded artboard corners and the outer canvas are excluded from fidelity expectations.
- Paired comparison files are 780 × 876 pixels, including a 32px evidence label. Source is on the left and the applied browser screen is on the right. Comparisons were inspected together, including focused progress and answer crops.
- Responsive viewports: 320 × 568 and 1280 × 900. Mobile fills the viewport; desktop centers the existing shell at a maximum width of 480px.
- Current evidence: `output/mobile-qa/` inside this repository (ignored by Git). The prior PDF-based report has been replaced by this Claude-based review.

| State | Claude source | Browser evidence | Combined evidence |
| --- | --- | --- | --- |
| Study, zero stars | `01-study-map-mobile.png` | `study-mobile.png` | `study-comparison-final.png` |
| Concept 0 | `02-concept-mobile.png` | `concept-fraction-final.png`, `concept-positive-final.png`, `concept-negative-final.png` | `concept-adaptation-comparison.png` |
| First practice, no selection | `03-practice-mobile.png` | `practice-mobile.png` | `practice-mobile-comparison.png` |
| First practice correct, one star | `04-practice-right-mobile.png` | `practice-correct-final.png` | `practice-correct-comparison-final.png` |
| Practice complete, six stars | `06-practice-done-mobile.png` | `practice-complete.png` | `practice-complete-comparison.png` |
| Rewards, coupon available, zero earned | `07-rewards-mobile.png` | `rewards-mobile.png` | `rewards-mobile-comparison.png` |
| Final test question 2, answer selected | `08-final-test-mobile.png` | `test-selected-mobile.png` | `test-selected-mobile-comparison.png` |
| Final test 3/3, 3,000 won example | `09-test-done-mobile.png` | `test-result-mobile.png` | `test-result-mobile-comparison.png` |
| Vault, six stars, one coupon, 1/9 passed | `10-my-vault-mobile.png` | `profile-mobile.png` | `profile-mobile-comparison.png` |

The source wrong-answer artboard shows question 4, while the interaction check uses question 1. `practice-wrong-final.png` verifies behavior and red feedback; it is not presented as a matched question-state comparison.

## Required fidelity surfaces

- **Typography:** Existing local Noto Sans KR preserves the source's Korean sans-serif hierarchy. MathML renders proper fraction bars, multiplication, parentheses and negative signs. Correct-choice numerals are green and incorrect choices red. Navigation labels use a readable 13px size. Source font metadata is unavailable, so exact font-family fidelity is not claimed.
- **Spacing and layout:** Source-style 20px mobile gutters, rounded cards, a 2 × 2 answer grid and persistent three-tab navigation. Feedback stays near the next action. Back and pagination controls are 44 × 44px. In the 390 × 844 correct-answer state, the next button ends at y=726, above navigation at y=766. Short screens scroll content without horizontal overflow or hiding controls behind navigation.
- **Colors:** Charcoal `#1a1c15`, gold `#ca981b`, green `#206d4d`, warm neutral surfaces and pale green/red feedback. Earned practice progress is gold; submitted final-test progress is green. The charcoal vault card, gold date badge and green earned amounts match the source roles.
- **Images and icons:** Existing reference-derived fraction and number-line assets are retained. Fraction pieces and board are cropped into separate panels, preserving their colors and geometry. The positive number-line crop omits the later negative step. Images retain aspect ratios. Lucide icons reuse the existing app's icon family; no substitute illustrations or bespoke icon drawings were introduced.
- **Copy and content:** Necessary Korean navigation and mathematical terms remain. The source's single concept explanation is intentionally split into multiplication, positive addition and negative addition, with one short cue per beat. Practice hints and completion reflection are optional. Repeated lock instructions are consolidated. Rewards say “최대 3,000원” before earnings; concise “체험” labels identify the prototype. The source's nine-stage count now agrees with the displayed current stage plus eight future stages. Questions, choices and canonical answers remain mathematically unchanged.

`concept-adaptation-comparison.png` shows the original explanation alongside all three applied beats. This is an intentional adaptation under the project's minimal-visible-Korean instructions, rather than a claim of identical screen composition. Generic profile labeling and the current date are also intentional differences.

## Resolved findings

1. **[P2, image treatment] Duplicate number-line backdrop.** The wrapper added a warm background behind the raster image's own rounded panel, exposing a second panel and seams. Removed wrapper padding/background and retained the source image's own treatment. Same beat and viewport before/after: `concept-background-fix.png`.
2. **[P2, state colors] Correct answer and completed progress were neutral.** Matched source green answer text and gold practice progress; red answer text also added for wrong feedback. Final matched evidence: `practice-correct-comparison-final.png`. Readable focused checks: `focus-progress-comparison.png` and `focus-answer-comparison.png`.
3. **[P2, short viewport navigation] Advancing explanations retained old scroll.** At 320 × 568, the next heading was above the viewport (y=-158, scrollTop=246). Explanation changes now reset the content scroll. Same transition after fix: heading y=88, scrollTop=0. Evidence: `concept-scroll-fix.png`.

## Functional and responsive verification

- All three tabs and back actions work. Three concept beats can be advanced or selected directly, then lead to practice.
- Hint stays hidden until requested. Wrong practice answer awards no star and allows retry. Correct answer awards one star, locks further selection and advances only on the next action.
- All six practice answers completed successfully. Optional reflection opens and accepts text; six stars unlock one coupon and the final test.
- Coupon can be claimed once and then displays its received state. Starting the test clears the coupon toast.
- Submitted final answers are immutable. Leaving after question 1 and resuming opens question 2. Three correct answers show 3,000 won, the result ledger and 1/9 passed in the vault.
- An independent one-off curriculum check evaluated all nine formulas/choices: exactly one mathematically correct choice per question and matching answer indices. Invalid and replacement submissions are rejected. Incomplete tests earn zero; 0/3, 2/3 and 3/3 calculate 0, 2,000 and 3,000 won.
- At 320 × 568, profile content and coupon remain reachable by scrolling; coupon bottom y=460.47 is above navigation y=490. Long concept formulas fit horizontally and the lesson action remains reachable above navigation.
- At 1280 × 900, centered layout remains stable. Screenshots: `profile-small.png`, `profile-small-scrolled.png`, `profile-desktop.png`, `concept-fraction-small-final.png`, `concept-scroll-after.png`.
- Keyboard Enter activates concept and pagination controls. Focus outline is 3px gold. Math accessibility labels, image descriptions, selected/disabled states, safe-area CSS and reduced motion are present.
- Full reward workflow was exercised in the development preview. After the final color/scroll fixes, production was rebuilt and the affected concept transition, wrong-answer retry, correct feedback and progress colors were retested in the production preview.
- Browser warning/error logs: none. `npm run lint`, `npm run build` and `git diff --check`: passed after the final source changes.

## Remaining limits

- **[P3]** Original font metrics and exact icon glyphs cannot be established from raster artboards. The existing font/icon families preserve the observed hierarchy and meaning.
- Physical-device safe areas, OS text scaling, virtual keyboard and a full screen-reader session were not tested. Responsive browser sizes and keyboard focus were verified.
- Existing prototype state remains in memory. Real coupon delivery, payments, persistence and later-stage curricula are outside this design change.

## Acceptance

- [x] Claude source and actual rendered implementation compared together at matched dimensions and states.
- [x] Original diagrams retained; three focused concept beats applied.
- [x] Minimal visible copy, optional hint/reflection and nine-stage map applied.
- [x] Study → practice → rewards → final test → vault flow verified.
- [x] Mobile, short-screen and desktop layouts verified.
- [x] Same-state evidence inspected after all P2 fixes.
- [x] Lint and production build passed; local production preview remains running.

final result: passed
