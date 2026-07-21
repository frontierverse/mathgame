<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Learning experience: minimal visible Korean

The primary learners may have difficulty sustaining attention. Apply these rules to every new or edited lesson, explanation, and animation:

- Keep visible Korean text to the absolute minimum. Prefer numbers, formulas, mathematical symbols, color, spatial comparison, and motion.
- Teach one idea per animation beat. Use at most one short Korean cue at a time, ideally a single label or phrase on one line.
- Do not add paragraphs, narration-like sentences, repeated captions, or text that merely restates what the visual already shows.
- Prefer direct visual mappings such as matching colors, tracing, grouping, scaling, and transformation. A learner should understand the main relationship without reading.
- Keep essential mathematical definitions concise and place them next to the exact object or symbol they define. Preserve mathematical correctness even when shortening text.
- Do not replace essential Korean math vocabulary with unexplained Latin letters just to reduce text. Keep terms such as `지름`, `반지름`, `둘레`, and `넓이` visible where they identify an object or relationship; pair them with symbols like `r` and `π` only when the symbol is being taught.
- Reveal labels only when they are needed, then fade or de-emphasize them so the mathematical object remains the focus.
- Full Korean descriptions are still allowed in non-visible accessibility text such as `aria-label` when needed for screen-reader clarity.
- During visual QA, review desktop and mobile layouts and remove every visible Korean word that is not necessary for understanding or navigation.

## Quiz questions/answers: use math notation, not spelled-out Korean

`src/app/shared/mathText.ts` (`parseMathText`) auto-renders formulas embedded in quiz `question`/`answer` strings (see `quizAnswersByIndex` in `src/app/shared/curriculumQuizzes.ts`) as proper math markup (superscripts, ×, ÷, −, =).

- Write exponents as `2^4`, not `2의 4제곱` — the parser turns `2^4` into `2` with a superscript `4`; spelled-out Korean stays plain text and looks inconsistent.
- Keep caret notation contiguous: write `2^4`, not `2 ^ 4`, `2⁴`, `2**4`, Markdown, or HTML superscript syntax. `parseMathText` recognizes ASCII digits joined directly by `^`.
- Write fractions as `1/2` or `-3/4`, and absolute values as `|-5|`; `parseMathText` renders these forms as mathematical notation in quizzes and worksheets.
- Write multiplication/division as `x` or `*`/`÷` (normalized to `×`/`÷`), not `곱하기`/`나누기` in the numeric part of an expression.
- Only prose around the formula (e.g. "같은 수의 곱셈을 빠르게 나타내기 위해서. 예: ...") should stay in Korean; the numeric expression itself should always use the symbolic form so it renders as a formula.
- Treat symbolic notation as a required quiz-data invariant, not an optional styling preference. Before finishing any quiz edit, inspect every changed `question` and `answer`, including generated variants, for prose-form numeric expressions.
- When canonical quiz wording changes, update the matching rule in `src/app/shared/numericQuizRuleCompiler.ts` so every randomized variant preserves the same symbolic notation. Run `npm run build`; curriculum validation must pass.
- `src/app/shared/curriculumQuizzes.ts` rejects Korean number-based power forms such as `2의 4제곱` at build time. Do not bypass this guard with `fixedNumberQuestion`; write `2^4` instead.
