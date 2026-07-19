export const QUESTIONS_PER_PRINT_PAGE = 10;

export function getWorksheetAnswerLineCount(question: string) {
  if (/뜻|이유|설명|왜|어떤 상황/.test(question)) return 2;
  if (/모두|5개/.test(question)) return 2;
  return 1;
}
