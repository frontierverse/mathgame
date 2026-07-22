import "server-only";

import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { CurriculumQuizSet } from "../shared/curriculumQuizzes";
import { parseMathText, type MathFormulaToken } from "../shared/mathText";
import { getWorksheetAnswerLineCount } from "./worksheetLayout";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 48;
const HEADER_TOP = 54;
const FOOTER_Y = 31;
const CONTENT_BOTTOM = 58;
const QUESTION_FONT_SIZE = 10.5;
const QUESTION_LINE_HEIGHT = 16;
const ANSWER_LINE_HEIGHT = 20;
const EXPONENT_FONT_SCALE = 0.62;
const EXPONENT_RISE_SCALE = 0.48;
const FRACTION_FONT_SCALE = 0.72;
const FRACTION_PADDING_SCALE = 0.18;
const FRACTION_NUMERATOR_RISE_SCALE = 0.46;
const FRACTION_DENOMINATOR_DROP_SCALE = 0.42;
const FRACTION_RULE_RISE_SCALE = 0.2;
const OPERATOR_GAP_SCALE = 0.12;

const INK = rgb(0.09, 0.09, 0.11);
const PURPLE = rgb(0.38, 0.34, 0.47);
const MUTED = rgb(0.44, 0.44, 0.48);
const LINE = rgb(0.83, 0.83, 0.85);

type WorksheetFonts = {
  regular: PDFFont;
  bold: PDFFont;
};

type WorksheetPdfQuestion = {
  number: number;
  text: string;
};

type WorksheetPdfSpec = {
  breadcrumb: string;
  title: string;
  subject: string;
  footerLabel: string;
  studentName?: string;
  questions: readonly WorksheetPdfQuestion[];
};

function measureMathText(text: string, font: PDFFont, fontSize: number) {
  return parseMathText(text).reduce((width, segment) => {
    if (segment.type === "text") {
      return width + font.widthOfTextAtSize(segment.value, fontSize);
    }
    return width + measureFormula(segment.tokens, font, fontSize);
  }, 0);
}

function isTightOperator(operator: string) {
  return operator === "(" || operator === ")" || operator === "|";
}

function getFractionLayout(
  numerator: string,
  denominator: string,
  font: PDFFont,
  fontSize: number,
) {
  const valueSize = fontSize * FRACTION_FONT_SCALE;
  const numeratorWidth = font.widthOfTextAtSize(numerator, valueSize);
  const denominatorWidth = font.widthOfTextAtSize(denominator, valueSize);
  const width =
    Math.max(numeratorWidth, denominatorWidth) + fontSize * FRACTION_PADDING_SCALE;

  return { valueSize, numeratorWidth, denominatorWidth, width };
}

function measureFormula(tokens: readonly MathFormulaToken[], font: PDFFont, fontSize: number) {
  const operatorGap = fontSize * OPERATOR_GAP_SCALE;

  return tokens.reduce((width, token) => {
    if (token.type === "number") {
      const signWidth = token.sign
        ? font.widthOfTextAtSize(token.sign === "-" ? "−" : token.sign, fontSize)
        : 0;
      return width + signWidth + font.widthOfTextAtSize(token.value, fontSize);
    }
    if (token.type === "power") {
      return (
        width +
        font.widthOfTextAtSize(token.base, fontSize) +
        font.widthOfTextAtSize(token.exponent, fontSize * EXPONENT_FONT_SCALE)
      );
    }
    if (token.type === "fraction") {
      const fraction = getFractionLayout(
        token.numerator,
        token.denominator,
        font,
        fontSize,
      );
      const signWidth = token.sign
        ? font.widthOfTextAtSize(token.sign === "-" ? "−" : token.sign, fontSize)
        : 0;
      return width + signWidth + fraction.width;
    }

    const gap = isTightOperator(token.value) ? 0 : operatorGap * 2;
    return width + gap + font.widthOfTextAtSize(token.value, fontSize);
  }, 0);
}

function drawMathText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  fontSize: number,
) {
  let cursorX = x;

  parseMathText(text).forEach((segment) => {
    if (segment.type === "text") {
      page.drawText(segment.value, {
        x: cursorX,
        y,
        size: fontSize,
        font,
        color: INK,
      });
      cursorX += font.widthOfTextAtSize(segment.value, fontSize);
      return;
    }

    segment.tokens.forEach((token) => {
      if (token.type === "number") {
        if (token.sign) {
          const sign = token.sign === "-" ? "−" : token.sign;
          page.drawText(sign, {
            x: cursorX,
            y,
            size: fontSize,
            font,
            color: INK,
          });
          cursorX += font.widthOfTextAtSize(sign, fontSize);
        }
        page.drawText(token.value, {
          x: cursorX,
          y,
          size: fontSize,
          font,
          color: INK,
        });
        cursorX += font.widthOfTextAtSize(token.value, fontSize);
        return;
      }

      if (token.type === "power") {
        page.drawText(token.base, {
          x: cursorX,
          y,
          size: fontSize,
          font,
          color: INK,
        });
        cursorX += font.widthOfTextAtSize(token.base, fontSize);

        const exponentSize = fontSize * EXPONENT_FONT_SCALE;
        page.drawText(token.exponent, {
          x: cursorX,
          y: y + fontSize * EXPONENT_RISE_SCALE,
          size: exponentSize,
          font,
          color: INK,
        });
        cursorX += font.widthOfTextAtSize(token.exponent, exponentSize);
        return;
      }

      if (token.type === "fraction") {
        if (token.sign) {
          const sign = token.sign === "-" ? "−" : token.sign;
          page.drawText(sign, {
            x: cursorX,
            y,
            size: fontSize,
            font,
            color: INK,
          });
          cursorX += font.widthOfTextAtSize(sign, fontSize);
        }

        const fraction = getFractionLayout(
          token.numerator,
          token.denominator,
          font,
          fontSize,
        );
        const numeratorX = cursorX + (fraction.width - fraction.numeratorWidth) / 2;
        const denominatorX = cursorX + (fraction.width - fraction.denominatorWidth) / 2;

        page.drawText(token.numerator, {
          x: numeratorX,
          y: y + fontSize * FRACTION_NUMERATOR_RISE_SCALE,
          size: fraction.valueSize,
          font,
          color: INK,
        });
        page.drawLine({
          start: { x: cursorX, y: y + fontSize * FRACTION_RULE_RISE_SCALE },
          end: { x: cursorX + fraction.width, y: y + fontSize * FRACTION_RULE_RISE_SCALE },
          thickness: 0.45,
          color: INK,
        });
        page.drawText(token.denominator, {
          x: denominatorX,
          y: y - fontSize * FRACTION_DENOMINATOR_DROP_SCALE,
          size: fraction.valueSize,
          font,
          color: INK,
        });
        cursorX += fraction.width;
        return;
      }

      const operatorGap = isTightOperator(token.value) ? 0 : fontSize * OPERATOR_GAP_SCALE;
      cursorX += operatorGap;
      page.drawText(token.value, {
        x: cursorX,
        y,
        size: fontSize,
        font,
        color: INK,
      });
      cursorX += font.widthOfTextAtSize(token.value, fontSize) + operatorGap;
    });
  });
}

function splitLongToken(token: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const chunks: string[] = [];
  let chunk = "";

  Array.from(token).forEach((character) => {
    const candidate = `${chunk}${character}`;
    if (chunk && measureMathText(candidate, font, fontSize) > maxWidth) {
      chunks.push(chunk);
      chunk = character;
      return;
    }
    chunk = candidate;
  });

  if (chunk) chunks.push(chunk);
  return chunks;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const tokens = text.split(/\s+/).flatMap((token) =>
    measureMathText(token, font, fontSize) > maxWidth
      ? splitLongToken(token, font, fontSize, maxWidth)
      : [token],
  );
  const lines: string[] = [];
  let line = "";

  tokens.forEach((token) => {
    const candidate = line ? `${line} ${token}` : token;
    if (line && measureMathText(candidate, font, fontSize) > maxWidth) {
      lines.push(line);
      line = token;
      return;
    }
    line = candidate;
  });

  if (line) lines.push(line);
  return lines;
}

function drawHeader(
  page: PDFPage,
  spec: WorksheetPdfSpec,
  fonts: WorksheetFonts,
) {
  page.drawText(spec.breadcrumb, {
    x: MARGIN_X,
    y: PAGE_HEIGHT - HEADER_TOP,
    size: 9,
    font: fonts.bold,
    color: PURPLE,
  });
  page.drawText(spec.title, {
    x: MARGIN_X,
    y: PAGE_HEIGHT - HEADER_TOP - 30,
    size: 22,
    font: fonts.bold,
    color: INK,
  });
  page.drawText("이름", {
    x: PAGE_WIDTH - MARGIN_X - 150,
    y: PAGE_HEIGHT - HEADER_TOP - 26,
    size: 8.5,
    font: fonts.regular,
    color: INK,
  });
  if (spec.studentName) {
    page.drawText(spec.studentName, {
      x: PAGE_WIDTH - MARGIN_X - 118,
      y: PAGE_HEIGHT - HEADER_TOP - 26,
      size: 9,
      font: fonts.bold,
      color: INK,
    });
  }
  page.drawLine({
    start: { x: PAGE_WIDTH - MARGIN_X - 122, y: PAGE_HEIGHT - HEADER_TOP - 29 },
    end: { x: PAGE_WIDTH - MARGIN_X - 58, y: PAGE_HEIGHT - HEADER_TOP - 29 },
    thickness: 0.5,
    color: MUTED,
  });
  page.drawText("날짜", {
    x: PAGE_WIDTH - MARGIN_X - 48,
    y: PAGE_HEIGHT - HEADER_TOP - 26,
    size: 8.5,
    font: fonts.regular,
    color: INK,
  });
  page.drawLine({
    start: { x: PAGE_WIDTH - MARGIN_X - 20, y: PAGE_HEIGHT - HEADER_TOP - 29 },
    end: { x: PAGE_WIDTH - MARGIN_X + 26, y: PAGE_HEIGHT - HEADER_TOP - 29 },
    thickness: 0.5,
    color: MUTED,
  });
  page.drawLine({
    start: { x: MARGIN_X, y: PAGE_HEIGHT - HEADER_TOP - 43 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: PAGE_HEIGHT - HEADER_TOP - 43 },
    thickness: 1.5,
    color: INK,
  });

  return PAGE_HEIGHT - HEADER_TOP - 68;
}

function drawQuestion(
  page: PDFPage,
  questionNumber: number,
  question: string,
  y: number,
  fonts: WorksheetFonts,
) {
  const textX = MARGIN_X + 27;
  const lines = wrapText(
    question,
    fonts.regular,
    QUESTION_FONT_SIZE,
    PAGE_WIDTH - MARGIN_X - textX,
  );
  const answerLineCount = getWorksheetAnswerLineCount(question);

  page.drawText(`${questionNumber}.`, {
    x: MARGIN_X,
    y,
    size: QUESTION_FONT_SIZE,
    font: fonts.bold,
    color: INK,
  });
  lines.forEach((line, lineIndex) => {
    drawMathText(
      page,
      line,
      textX,
      y - lineIndex * QUESTION_LINE_HEIGHT,
      fonts.regular,
      QUESTION_FONT_SIZE,
    );
  });

  let lineY = y - lines.length * QUESTION_LINE_HEIGHT - 3;
  for (let index = 0; index < answerLineCount; index += 1) {
    page.drawLine({
      start: { x: textX, y: lineY },
      end: { x: PAGE_WIDTH - MARGIN_X, y: lineY },
      thickness: 0.45,
      color: LINE,
    });
    lineY -= ANSWER_LINE_HEIGHT;
  }

  return lineY - 7;
}

function questionHeight(question: string, font: PDFFont) {
  const textX = MARGIN_X + 27;
  const lines = wrapText(
    question,
    font,
    QUESTION_FONT_SIZE,
    PAGE_WIDTH - MARGIN_X - textX,
  );
  return (
    lines.length * QUESTION_LINE_HEIGHT +
    getWorksheetAnswerLineCount(question) * ANSWER_LINE_HEIGHT +
    10
  );
}

async function createPdf(spec: WorksheetPdfSpec) {
  const pdfDocument = await PDFDocument.create();
  pdfDocument.registerFontkit(fontkit);

  const [regularFontBytes, boldFontBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "public/fonts/MalgunGothic.ttf")),
    readFile(path.join(process.cwd(), "public/fonts/MalgunGothic-Bold.ttf")),
  ]);
  const fonts: WorksheetFonts = {
    regular: await pdfDocument.embedFont(regularFontBytes, { subset: true }),
    bold: await pdfDocument.embedFont(boldFontBytes, { subset: true }),
  };

  pdfDocument.setTitle(spec.title);
  pdfDocument.setAuthor("수학 공간");
  pdfDocument.setSubject(spec.subject);
  pdfDocument.setCreationDate(new Date());

  let page = pdfDocument.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawHeader(page, spec, fonts);

  spec.questions.forEach((question) => {
    const requiredHeight = questionHeight(question.text, fonts.regular);
    if (y - requiredHeight < CONTENT_BOTTOM) {
      page = pdfDocument.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = drawHeader(page, spec, fonts);
    }
    y = drawQuestion(page, question.number, question.text, y, fonts);
  });

  const pages = pdfDocument.getPages();
  pages.forEach((currentPage, pageIndex) => {
    currentPage.drawLine({
      start: { x: MARGIN_X, y: FOOTER_Y + 10 },
      end: { x: PAGE_WIDTH - MARGIN_X, y: FOOTER_Y + 10 },
      thickness: 0.35,
      color: LINE,
    });
    currentPage.drawText(`수학 공간 · ${spec.footerLabel}`, {
      x: MARGIN_X,
      y: FOOTER_Y,
      size: 7.5,
      font: fonts.regular,
      color: MUTED,
    });
    const pageText = `${pageIndex + 1} / ${pages.length}`;
    currentPage.drawText(pageText, {
      x: PAGE_WIDTH - MARGIN_X - fonts.regular.widthOfTextAtSize(pageText, 7.5),
      y: FOOTER_Y,
      size: 7.5,
      font: fonts.regular,
      color: MUTED,
    });
  });

  return pdfDocument.save();
}

export async function createWorksheetPdf(quizSet: CurriculumQuizSet) {
  return createPdf({
    breadcrumb: `${quizSet.gradeLabel} · ${quizSet.semesterLabel} · ${quizSet.unitTitle}`,
    title: `${quizSet.subunitTitle} 학습지`,
    subject: `${quizSet.subunitTitle} 퀴즈 ${quizSet.quizzes.length}문항`,
    footerLabel: `${quizSet.subunitTitle} · 최신 퀴즈 ${quizSet.quizzes.length}문항`,
    questions: quizSet.quizzes.map((quiz) => ({
      number: quiz.globalNumber,
      text: quiz.question,
    })),
  });
}

export async function createReviewWorksheetPdf(
  studentName: string,
  questions: readonly { questionText: string }[],
) {
  return createPdf({
    breadcrumb: `샤갈 복습 · ${questions.length}문항`,
    title: `${studentName} 복습지`,
    subject: `${studentName} 샤갈 복습 ${questions.length}문항`,
    footerLabel: `${studentName} 복습 · ${questions.length}문항`,
    studentName,
    questions: questions.map((question, index) => ({
      number: index + 1,
      text: question.questionText,
    })),
  });
}
