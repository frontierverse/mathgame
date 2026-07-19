import type { CurriculumQuiz, CurriculumQuizSet } from "../shared/curriculumQuizzes";
import QuizQuestionText from "../progress/QuizQuestionText";
import { getWorksheetAnswerLineCount, QUESTIONS_PER_PRINT_PAGE } from "./worksheetLayout";

function PrintableQuestion({ quiz }: { quiz: CurriculumQuiz }) {
  return (
    <div className="worksheet-print-question">
      <div className="worksheet-print-prompt">
        <strong>{quiz.globalNumber}.</strong>
        <QuizQuestionText text={quiz.question} />
      </div>
      <div aria-hidden="true" className="worksheet-print-answer-lines">
        {Array.from({ length: getWorksheetAnswerLineCount(quiz.question) }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </div>
  );
}

function ProblemPage({
  quizSet,
  quizzes,
  pageNumber,
  pageCount,
}: {
  quizSet: CurriculumQuizSet;
  quizzes: readonly CurriculumQuiz[];
  pageNumber: number;
  pageCount: number;
}) {
  return (
    <section className="worksheet-print-page">
      <header className="worksheet-print-header">
        <div>
          <p>
            {quizSet.gradeLabel} · {quizSet.semesterLabel} · {quizSet.unitTitle}
          </p>
          <h1>{quizSet.subunitTitle} 학습지</h1>
        </div>
        <div className="worksheet-print-fields">
          <span>이름</span>
          <span>날짜</span>
        </div>
      </header>

      <div className="worksheet-print-questions">
        {quizzes.map((quiz) => (
          <PrintableQuestion key={quiz.id} quiz={quiz} />
        ))}
      </div>

      <footer>
        수학 공간 · {quizSet.subunitTitle} · 최신 퀴즈 {quizSet.quizzes.length}문항
        <span>
          {pageNumber} / {pageCount}
        </span>
      </footer>
    </section>
  );
}

export default function WorksheetPrintDocument({ quizSet }: { quizSet: CurriculumQuizSet }) {
  const pages = Array.from(
    { length: Math.ceil(quizSet.quizzes.length / QUESTIONS_PER_PRINT_PAGE) },
    (_, pageIndex) =>
      quizSet.quizzes.slice(
        pageIndex * QUESTIONS_PER_PRINT_PAGE,
        (pageIndex + 1) * QUESTIONS_PER_PRINT_PAGE,
      ),
  );

  return (
    <article
      className="worksheet-print-document"
      aria-label={`${quizSet.subunitTitle} 인쇄용 학습지`}
    >
      {pages.map((quizzes, pageIndex) => (
        <ProblemPage
          key={quizzes[0]?.id ?? pageIndex}
          quizSet={quizSet}
          quizzes={quizzes}
          pageNumber={pageIndex + 1}
          pageCount={pages.length}
        />
      ))}
    </article>
  );
}
