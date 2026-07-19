import primeCompositeWorksheet from "./prime-composite-worksheet.json";

export const AVAILABLE_WORKSHEET_ID = primeCompositeWorksheet.id;
export const availableWorksheet = primeCompositeWorksheet;

export function getSubunitId(unitId: string, subunitIndex: number) {
  return `${unitId}-su${subunitIndex + 1}`;
}
