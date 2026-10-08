import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { practiceQuestions, testQuestions, earnedWon, testScore } = loadTypeScript("src/app/curriculum.ts");
const { isStudentProgress } = loadTypeScript("src/app/server/progressRules.ts");
const { emptyStudentProgress } = loadTypeScript("src/app/studentProgress.ts");
const number = token => typeof token === "number" ? token : token[0] / token[1];

// Independent arithmetic evaluator: verifies every expansion and distractor,
// including operation precedence, without consulting the answer key.
function calculate(tokens) {
  const values = [], operators = [];
  const precedence = { "+": 1, "−": 1, "×": 2 };
  function apply() {
    const operator = operators.pop(), b = values.pop(), a = values.pop();
    values.push(operator === "+" ? a + b : operator === "−" ? a - b : a * b);
  }
  for (const token of tokens) {
    if (typeof token !== "string") values.push(number(token));
    else if (token === "(") operators.push(token);
    else if (token === ")") { while (operators.at(-1) !== "(") apply(); operators.pop(); }
    else { while (operators.length && operators.at(-1) !== "(" && precedence[operators.at(-1)] >= precedence[token]) apply(); operators.push(token); }
  }
  while (operators.length) apply();
  assert.equal(values.length, 1);
  return values[0];
}

for (const question of [...practiceQuestions, ...testQuestions]) {
  test(`${question.id}: exactly one correct meaning and no bare result options`, () => {
    const expected = calculate(question.expression);
    const matching = question.choices.filter(choice => {
      if (choice.kind === "expression") {
        assert.ok(choice.tokens.length > 1);
        assert.ok(choice.tokens.some(token => ["+", "−", "×"].includes(token)));
        assert.ok(!choice.tokens.includes("="));
      } else {
        assert.ok(number(choice.distance) > 0);
        assert.ok(["left", "right"].includes(choice.direction));
      }
      const actual = choice.kind === "expression" ? calculate(choice.tokens) : number(choice.start) + (choice.direction === "left" ? -1 : 1) * number(choice.distance);
      return Math.abs(actual - expected) < 1e-12;
    });
    assert.equal(matching.length, 1); assert.equal(matching[0].id, question.answer);
    assert.deepEqual(question.choices.map(choice => choice.id), ["a", "b", "c", "d"]);
  });
}

test("4 × 1/8 is represented by four additions of the original 1/8", () => {
  const question = practiceQuestions[1];
  const answer = question.choices.find(choice => choice.id === question.answer);
  assert.equal(answer.kind, "expression");
  assert.deepEqual(answer.tokens, [[1, 8], "+", [1, 8], "+", [1, 8], "+", [1, 8]]);
});

test("addition choices check the original start, signed direction and distance", () => {
  for (const question of [...practiceQuestions, ...testQuestions].filter(item => item.instruction === "첫 수에서 출발")) {
    const operands = question.expression.filter(token => typeof token !== "string");
    const answer = question.choices.find(choice => choice.id === question.answer);
    assert.equal(answer.kind, "movement");
    assert.deepEqual(answer.start, operands[0]);
    assert.equal(answer.direction, number(operands[1]) < 0 ? "left" : "right");
    assert.equal(number(answer.distance), Math.abs(number(operands[1])));
  }
});

test("saved answer IDs keep prior scores and remain valid after wording changes", () => {
  assert.deepEqual(practiceQuestions.map(question => question.answer), ["a", "b", "c", "d", "b", "d"]);
  assert.deepEqual(testQuestions.map(question => question.answer), ["b", "c", "b"]);
  assert.equal(testScore(["b", "c", "b"]), 3); assert.equal(earnedWon(["b", "c", "b"]), 3000);
  assert.equal(testScore(["a", "b", "d"]), 0);
  assert.ok(isStudentProgress({ ...emptyStudentProgress(), stars: 6, testAnswers: ["a", "c", null], testDate: "2026-10-08" }));
});
