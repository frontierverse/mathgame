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
- Real authentication, server persistence, coupon delivery and payments are not connected. Demo student state lives in memory and resets to seed data on refresh. Registered demonstration dates share concept 0; unregistered dates show an empty state.
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
