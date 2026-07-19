import type { ParsedExpression } from "./types";

export function parseVisualExpression(expression: string): ParsedExpression | null {
  const match = expression.replace(/\s/g, "").match(/^(\d+)([+\-×÷])(\d+)$/);

  if (!match) return null;

  return {
    left: Number(match[1]),
    operator: match[2] as ParsedExpression["operator"],
    right: Number(match[3]),
  };
}

export function getDefaultExpression(lessonId: string): ParsedExpression {
  const examples: Record<string, ParsedExpression> = {
    quantity: { left: 5, operator: "+", right: 0 },
    addition: { left: 3, operator: "+", right: 4 },
    subtraction: { left: 7, operator: "-", right: 3 },
    "fast-addition": { left: 10, operator: "+", right: 10 },
    multiplication: { left: 10, operator: "×", right: 10 },
    "times-table-two": { left: 2, operator: "×", right: 1 },
    "square-area": { left: 3, operator: "×", right: 3 },
    "triangle-area": { left: 10, operator: "×", right: 10 },
    "circle-circumference": { left: 2, operator: "×", right: 5 },
    "circle-area": { left: 5, operator: "×", right: 5 },
    powers: { left: 2, operator: "×", right: 2 },
    division: { left: 12, operator: "÷", right: 3 },
    parentheses: { left: 4, operator: "+", right: 2 },
    mixed: { left: 8, operator: "÷", right: 2 },
    explore: { left: 6, operator: "+", right: 3 },
  };

  return examples[lessonId] ?? examples.addition;
}
