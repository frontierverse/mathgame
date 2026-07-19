import { notFound } from "next/navigation";

import { getQuizSetForSubunit } from "../../../shared/curriculumQuizzes";
import WorksheetPrintDocument from "../../WorksheetPrintDocument";
import PrintOnLoad from "./PrintOnLoad";

export const dynamic = "force-dynamic";

export default async function WorksheetPrintPage({
  params,
}: {
  params: Promise<{ subunitId: string }>;
}) {
  const { subunitId } = await params;
  const quizSet = getQuizSetForSubunit(subunitId);
  if (!quizSet) notFound();

  return (
    <>
      <PrintOnLoad />
      <WorksheetPrintDocument quizSet={quizSet} />
    </>
  );
}
