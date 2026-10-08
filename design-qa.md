# Design QA — 학생 선택과 공부 달력

final result: passed

Reviewed on 2026-10-08. No actionable P0/P1/P2 findings remain after the fixes below.

## Reference and comparison target

- Source: the user's approved, updated Claude artifact with twelve artboards, inspected in the native Claude app. URL: https://claude.ai/artifact/2y9XaTesKd32jxhAryVtfX
- Source captures: `output/claude-redesign/`. Implementation: `http://127.0.0.1:3000/`, local production build in the Codex in-app browser.
- Main viewport: 390 × 844 CSS/image pixels. Claude mobile crops are 388 × 838, normalized to 390 × 844. Outer canvas, cursor and rounded artboard corners are excluded from fidelity expectations.
- Paired evidence is 780 × 876, including 32px labels, with source on the left and implementation on the right. All three final pairs and focused navigation, stats and formula crops were opened and visually reviewed together after the fixes.
- Responsive checks: 320 × 568 and 1280 × 900. Desktop preserves the centered 480px app shell.
- Current screenshots and comparison script: `output/updated-qa/` (ignored by Git).

| Matched state | Source crop | Final combined evidence |
| --- | --- | --- |
| Student picker, no active student | `student-select-mobile.png` | `student-picker-final-comparison.png` |
| Student 2 profile, 3 stars / 0 coupons / 4 days / 0 won | `student-2-profile-mobile.png` | `student-2-profile-final-comparison.png` |
| Student 2 calendar, October 9 selected after returning from concept | `calendar-date-selected-mobile.png` | `calendar-date-selected-final-comparison.png` |

## Fidelity surfaces

- **Typography:** Existing local Noto Sans KR, bold numeric avatars, 30px picker heading, 40px vault amount, compact date labels and 22px calendar formulas. MathML retains real fraction bars and negative signs. Exact source font metadata is unavailable.
- **Spacing/layout:** 20px mobile gutters, 2 × 2 student cards, charcoal vault, three stats, five weekday cards and seven-column calendar. Source-matched icon-only nav uses three 68 × 48px controls with a black selected pill. Content scrolls above the fixed nav on short screens.
- **Colors/states:** Blue, orange, green and purple student identities; charcoal vault and selected date; gold stars and planned markers; green completed markers/earned amounts; gray missed/weekend states. Today has an outline and the selected date a black fill.
- **Images/icons:** Existing fraction and number-line lesson assets remain. Numeric avatars are the reference's UI treatment. Existing Lucide family supplies navigation, arrows, markers, stars and ledger icons; images retain their aspect ratios.
- **Copy/content:** Minimal Korean navigation and essential math terms. Bottom labels are visually removed while accessible names remain. Date selection adds the correct date to concept learning. The existing three focused lesson beats remain intentionally, following the project's one-idea-per-animation-beat instruction. The source's combined static concept screen is not claimed as an identical composition.

## Resolved findings

1. **[P2, spacing] Profile stats too tall.** Fixed label line height, stat spacing and weekly heading gap. Initial evidence: `student-2-profile-comparison.png`; final and focused evidence: `student-2-profile-final-comparison.png`, `student-2-profile-focused-comparison.png`.
2. **[P2, typography/state] Calendar formulas and planned outlines too faint/small.** Increased formulas to 22px (18px on small screens) and strengthened planned marker strokes. Final and focused evidence: `calendar-date-selected-final-comparison.png`, `calendar-date-selected-focused-comparison.png`. At 320px the formula fits without horizontal overflow.
3. **[P2, navigation] Edge tab spacing mismatched.** Adjusted navigation side padding and height; icon-only selected pill now follows source spacing. Final and focused evidence: `student-picker-final-comparison.png`, `student-picker-focused-comparison.png`.

## Functional and responsive verification

- All four student cards open the corresponding profile. Unauthenticated navigation remains on the picker. Student switching returns to the picker; reselecting a student retains their progress in the current page session.
- Study opens the monthly calendar by default. October 9 opens its dated concept; back returns to the same month/date. Previous/next month navigation works and preserves selection. October 17 stays on the calendar with the empty lesson state.
- Student 3 started with no progress. A wrong answer earned no star and allowed retry. Six correct answers earned six stars and one completed learning day; October 9 acquired the completed marker.
- Student 3 claimed one coupon, submitted test question 1, switched to student 2 and back, then resumed at question 2. Student 2 retained 3 stars, 0 coupons, 4 learning days and 0 won. Student 3's completed test showed 3/3 and 3,000 won in the profile with coupon/practice ledger rows.
- One-off helper checks passed for separate progress arrays, seed earnings, weekday lesson bounds, October padding, February/leap-year dates, year rollover, Monday–Friday week dates, learning statuses and compact payout dates.
- 320 × 568: picker cards fit; profile/calendar scroll to remaining content; formula card remains usable above navigation; no horizontal overflow. Evidence: `student-picker-320.png`, `student-4-profile-320.png`, `calendar-320.png`, `calendar-320-scrolled.png`.
- 1280 × 900: profile/calendar retain the centered shell with no horizontal overflow. Evidence: `desktop-profile.png`, `desktop-calendar.png`.
- Icon navigation has empty visible text and complete accessible names. Keyboard Tab reaches the study control with a 3px gold focus outline. Date buttons retain selected/today/status labels. Math and image descriptions, reduced motion and safe-area CSS remain.
- Browser warning/error logs: none. `npm run lint`, `npm run build`, and `git diff --check` passed after the final source changes.

## Remaining limits

- **[P3]** Exact font metrics and icon glyphs cannot be established from raster artboards. Existing app families preserve the observed hierarchy and meaning.
- At the original design review, demo student state lived in memory. The DB follow-up below replaces demo identity/progress. External coupon delivery and payments are still not connected. Registered demonstration dates share concept 0; unregistered dates show an empty state.
- Physical-device safe areas, OS text scaling and a full screen-reader session were not tested. Responsive browser layouts and keyboard focus were verified.

## Acceptance

- [x] Approved Claude screens and rendered implementation compared together at matched states and dimensions.
- [x] Student card selection, separate student progress and switching verified.
- [x] Icon-only navigation with accessible names verified.
- [x] Calendar default, date-to-concept and return-to-selection verified.
- [x] Practice, coupon and final-test flow verified with a new student.
- [x] Mobile, short-screen and desktop layouts reviewed.
- [x] All P2 fixes reviewed in final paired/focused evidence.
- [x] Lint and production build passed.

final result: passed

## DB follow-up — 2026-10-08

- The roster now comes from the existing Supabase `Youth` table, with hidden and closed/purged records excluded. Nine eligible students were read successfully. No real names, IDs or credentials are written into source or this report.
- Numeric avatars retain roster position and cycle the four reference colors. Real names and admission/discharge dates replace the four prototype cards and dates. Missing dates show `—`.
- A signed, HttpOnly, seven-day student selection session restores on reload. Student switching deletes the session, reloads the DB roster and loads the selected student's persisted progress. This is the requested card selection flow, without password identity verification.
- `MathLearningProgress` stores practice stars, completion dates, coupon state, submitted test answers and reflection by stable `Youth.id`. RLS prevents direct anonymous/authenticated client access; the server uses the existing service role.
- Eight domain/session/database tests passed, including grading, input validation, immutable submissions, student isolation, concurrent retries, request origin and expired/tampered tokens. Stale tabs must match their displayed student with the signed session before writing. Local API checks returned the expected 404/403/401 for an unknown student, cross-site write, absent session and tampered session.
- A synthetic closed student was used for a live Supabase integration check: wrong/correct practice, concurrent retry, six-question completion, coupon, reflection, test answers and persisted reload all passed. The fixture and test records were removed; real students' learning records were not changed.
- Browser verified real roster, student selection, actual dates, session restore after refresh, calendar-to-concept/back and student switching. New data and connection states preserve the existing visual layout; short-screen roster/profile are reviewed separately in the DB evidence.

## Meaning-choice follow-up — 2026-10-08

- All six practice and three final-test questions now ask for the meaning of the expression. Multiplication choices expand the unchanged fraction into repeated additions; signed addition choices show a start, movement direction and distance without an endpoint result. Mixed expressions check both repeated addition and the sign. The question no longer appends `= ?`.
- The first concept beat now pairs the four original pieces with `4 × 1/8 = 1/8 + 1/8 + 1/8 + 1/8` and one short cue. Visible options use MathML and movement diagrams; full Korean descriptions remain in accessible labels.
- New question checks independently evaluate all nine expressions and all distractors, assert exactly one correct option per question, confirm the four-addition example and signed movement, and retain saved answer IDs/grades. Twenty domain/question tests passed. The live Supabase fixture check also passed and removed its synthetic student; real students' learning records were not changed.
- Browser QA used an isolated local database fixture, through the unchanged student/progress APIs. A wrong practice choice allowed retry without a star; six correct meanings completed practice; all three correct final-test meanings produced 3/3 and 3,000 won. Production does not include a fixture mode.
- Reviewed all nine question screens at 390 × 844. At 320 × 568, long fraction choices fit and scrolling exposes selection, feedback and submit controls above navigation. The repeated-addition lesson formula fits its 288px container (252px MathML width). At 1280 × 900 the quiz retains the centered 480px shell. Browser warning/error logs were empty.
- Captures: `output/meaning-qa/practice-1.png` through `practice-6.png`, `test-1.png` through `test-3.png`, `practice-6-320-feedback.png`, `test-3-desktop.png`, `concept-repeated-addition.png`, and `concept-repeated-addition-320-scrolled.png`. Evidence is ignored by Git.
- Final lint, production build and whitespace checks passed after the lesson update.

## Vault timing follow-up — 2026-10-08

- Profile and rewards vaults hide the countdown by default. The profile also hides its discharge date and period progress bar. Amounts remain visible. A quiet horizontal movement icon replaces the always-visible deadline.
- A deliberate horizontal drag of at least 32px reveals timing only while held. Releasing, cancelling, losing focus or leaving the screen conceals it. Vertical movement and taps do not reveal dates. The timing button also supports holding Enter/Space for keyboard access; releasing the key conceals the content.
- Browser observed the countdown and profile dates during actual pointer drags, then verified their absence after release. Dragging the rewards vault did not navigate. Plain tap and keyboard Enter on the amount still opened the profile. Moving focus between vault controls did not prevent a subsequent drag. Vertical movement and a plain tap on the timing control kept timing hidden; Space release also left it hidden.
- Default and revealed profile states were reviewed at 390 × 844. Profile/rewards cards fit 320 × 568 without horizontal overflow; the centered desktop shell was reviewed at 1280 × 900. Browser warning/error logs were empty. Captures are in `output/vault-qa/` (ignored by Git); real students' learning progress was not submitted or changed.
- Lint, production build and all twenty existing domain/question tests passed. No database/API changes were required.
