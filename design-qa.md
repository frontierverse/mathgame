# Design QA — 수학 적립 금고

final result: passed

## Findings

No actionable P0/P1/P2 findings remain after the revisions below. The first concept is usable through the study, practice, coupon, final-test and vault screens. Payments, coupon delivery and persistence are outside this frontend design prototype; the UI explicitly identifies reward examples.

## Comparison target and evidence

- Source visual truth: `/Users/seungsikshin/Documents/Codex/2026-10-01/task-4/attachments/c0ecd123-bf52-4e53-a431-5558705a0a92/수학 적립 금고 앱.pdf`, pages 1–10.
- Extracted visual truth: `/Users/seungsikshin/Documents/Codex/2026-10-01/task-4/tmp/pdfs/source-000.jpg` through `source-009.jpg`.
- Implementation URL: `http://127.0.0.1:3000/`, rendered in the user's connected Mac Chrome, not a remote Linux browser.
- Main viewport: 390 × 844 CSS pixels. Source screenshots: 1170 × 2532 pixels, normalized by 3× downsampling to 390 × 844. Browser screenshots: 390 × 844 pixels, 1 image pixel per CSS pixel. No device bezel or browser chrome is included in either side of the comparisons.
- Combined comparison images are 780 × 844 pixels: normalized source on the left, actual browser implementation on the right.
- Responsive evidence: `math-vault-320.jpg` at 320 × 740 and `math-vault-desktop.jpg` at the normal 1920 × 886 browser viewport. The web app uses a centered shell, max-width 480px on desktop; it fills the mobile viewport without a simulated phone frame.
- Evidence directory: `/Users/seungsikshin/Documents/Codex/2026-10-01/task-4/`.

| State | Browser screenshot | Combined full-view evidence |
| --- | --- | --- |
| Study, zero stars | `math-vault-study.jpg` | `math-vault-study-comparison-final.png` |
| Concept 0 explanation | `math-vault-concept.jpg` | `math-vault-concept-comparison-final.png` |
| Practice question 1, no answer selected | `math-vault-practice.jpg` | `math-vault-practice-comparison-final.png` |
| Six practice answers completed, empty reflection | `math-vault-complete.jpg` | `math-vault-complete-comparison-final.png` |
| Rewards, six stars, coupon available, zero won | `math-vault-rewards.jpg` | `math-vault-rewards-comparison-final.png` |
| Final test question 2, answer 0 selected, question 1 submitted | `math-vault-test.jpg` | `math-vault-test-comparison-final.png` |
| Final test, 3/3 correct, 3,000 won example | `math-vault-result.jpg` | `math-vault-result-comparison-final.png` |
| Profile, six stars, one coupon, 1/9 passed, 3,000 won | `math-vault-profile.jpg` | `math-vault-profile-comparison-final.png` |

Focused comparison: `math-vault-card-detail.png` shows the current-concept card from both artifacts at readable size. Final-test and result full-view pairs were also inspected at full resolution to check fraction typography, selected-answer borders, progress colors and the result ledger. The source's rasterized scrollbars were excluded from fidelity expectations; the live app has a scrollable content region and a persistent bottom navigation.

## Required fidelity surfaces

- Fonts / typography: Noto Sans KR regular and bold provide a close visual match for the Korean sans-serif headings and UI. The PDF contains raster screenshots and does not establish the original font family; no exact-font claim is made. Heading size, weight, wrapping and negative letter spacing were compared in the combined study/card captures. MathML fractions retain serif numerals, horizontal bars and symbolic operators; compact math and non-stretching parentheses corrected oversized formulas. All choices and labels are legible without truncation.
- Spacing / layout rhythm: 20px mobile gutters, rounded white cards, a 78px persistent bottom menu and source-like section grouping. The concept CTA ends at 713.45px, above the navigation starting at 766px at the 390 × 844 viewport. The back button measures 44 × 44px. Small screens scroll their content while navigation remains visible; desktop centers the same content without horizontal overflow.
- Colors / tokens: charcoal `#1a1c15`, warm gray surfaces `#f6f5ef`, gold stars `#ca981b` and green rewards `#206d4d`. Final-test caution is pale rose; submitted progress is green, current progress charcoal, selected answers pale gold with charcoal borders. Small muted copy and focus indicators were darkened for readability. Rewards and states use coherent tokens rather than unrelated component defaults.
- Image quality / asset fidelity: both explanation diagrams are actual crops of the supplied PDF screenshot, preserving its fraction pieces, number-line arrows, labels and color treatment. They are displayed at their original aspect ratios from 1050px-wide PNG assets. No CSS drawings or custom SVG approximations replace these illustrations. Standard navigation, gift, banknote, lock and star icons use one Lucide family at consistent stroke weights. The banknote differs slightly from the source glyph but preserves the same meaning and treatment.
- Copy / content: only concept 0 has questions. Six practice and three final-test formulas match the first-concept goal and were checked for mathematical correctness. Korean cues are brief, and full explanations are confined to accessible labels where possible. The original broad fraction rule was narrowed to natural-number multiplication to remain mathematically correct. A generic profile label replaces the source's placeholder student name. Non-exam days use an explicitly labeled preview action. Extra notes distinguish illustrative rewards from actual money or coupon issuance.

## Comparison history and resolved findings

1. [P2, spacing] Initial study card was too tall and pushed the stage list down. Evidence: `math-vault-study-comparison-1.png`. Reduced heading gaps, card description spacing and stage padding; revision: `math-vault-study-comparison-2.png`, accepted final: `math-vault-study-comparison-final.png` and focused card comparison.
2. [P2, viewport] Concept action partially fell under the fixed menu. Evidence: `math-vault-concept-comparison-1.png`. Reduced concept top padding and shortened the rule cue without changing its meaning. Recaptured the same viewport/state: `math-vault-concept-comparison-final.png`; DOM bounds confirm the action is fully above the navigation.
3. [P2, typography/layout] Initial practice fractions and formula area were too large, moving choices down. Evidence: `math-vault-practice-comparison-1.png`. Enabled compact MathML, reduced formula area and rule spacing. Post-fix: `math-vault-practice-comparison-final.png`.
4. [P2, state/colors] Initial final-test comparison used an unselected state against a selected source, and missed its green submitted progress / rose caution. Corrected the state comparison, added final-test colors and disabled stretching parentheses. Recaptured the source-matched question 2 with answer 0 selected: `math-vault-test-comparison-final.png`.
5. [P2, result composition] Initial result put the eyebrow before the icon and displayed an ungrouped ledger. Restored icon-first order and the warm-gray result card with bold earned amounts. Post-fix: `math-vault-result-comparison-final.png`.
6. [P2, selected state] Hover styling temporarily weakened a selected answer's border. Excluded selected choices from the generic hover rule and recaptured the selected final-test choice in `math-vault-test-comparison-final.png`.
7. [P2, touch usability] The initial back button was 32 × 36px. Enlarged it to 44 × 44px while compensating header spacing; latest concept and practice screenshots verify stable composition.

## Browser interactions and checks

- Bottom navigation opens all three screens; study back actions return to the stage map.
- Before selection, submission is disabled. A wrong practice answer awards no star, shows the hint and can be retried; a correct answer awards one star and prevents additional answers on that question.
- Six correct practice answers unlock completion, reflection input, one coupon and the final test. The coupon can be claimed once and appears in the profile.
- Starting the test clears the coupon toast, so it does not cover the test action.
- A submitted final answer cannot be replaced; backing out and resuming starts at the next unanswered question.
- The full final-test browser flow earned exactly 3,000 won for 3/3 correct, displayed the ledger and changed passed stages to 1/9. It cannot be credited a second time.
- Curriculum checks independently evaluated all nine formulas and choices: exactly one mathematically correct option per question; invalid answers and replacement submissions are rejected; incomplete tests earn zero; 0/3, 2/3 and 3/3 earn 0, 2,000 and 3,000 respectively.
- Actual 320px profile and desktop screens were checked for clipping, text overflow and navigation overlap; none found. Primary controls and answer buttons have practical tap areas. Safe-area insets and reduced-motion preference are supported in CSS.
- Console errors and warnings checked in Mac Chrome: none.
- Refresh intentionally resets prototype progress. Questions remain registered in source code. No real financial action, public deployment or backend write was performed.

## Open questions / follow-up polish

- [P3] Exact original font metrics cannot be recovered from raster screenshots. Noto Sans KR preserves the hierarchy; fractional bars and icon glyphs have minor platform-dependent differences.
- The current acceptance concerns a mobile-friendly web design. Persistence, real coupon issuance, payout rules and additional concepts require a separate implementation scope.
- Physical iPhone safe-area behavior and OS text scaling were not tested on hardware; responsive sizes were tested through the connected Mac browser.

## Implementation checklist

- [x] First concept only, with six practice and three final-test questions.
- [x] All three bottom-menu destinations and reward/progress states work.
- [x] Original diagrams used; no substitute artwork.
- [x] Same-viewport source/prototype comparisons inspected after fixes.
- [x] 320px and desktop resilience, keyboard focus, math/alt labels and reduced motion considered.
- [x] Reward illustrations clearly labeled; no actual payout promises implemented.
- [x] Lint and production build checked before handoff; local server restarted afterward.

final result: passed
