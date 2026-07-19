import { getQuizSetForSubunit } from "../../../../shared/curriculumQuizzes";
import { createWorksheetPdf } from "../../../../worksheets/worksheetPdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subunitId: string }> },
) {
  const { subunitId } = await params;
  const quizSet = getQuizSetForSubunit(subunitId);

  if (!quizSet) {
    return Response.json({ error: "등록된 퀴즈가 없는 소단원입니다." }, { status: 404 });
  }

  const pdfBytes = await createWorksheetPdf(quizSet);
  const download = new URL(request.url).searchParams.get("download") === "1";
  const disposition = download ? "attachment" : "inline";
  const encodedFilename = encodeURIComponent(
    `${quizSet.gradeLabel}-${quizSet.semesterLabel}-${quizSet.subunitTitle}-학습지.pdf`,
  );
  const responseBody = Uint8Array.from(pdfBytes).buffer;

  return new Response(responseBody, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": `${disposition}; filename="worksheet-${subunitId}.pdf"; filename*=UTF-8''${encodedFilename}`,
      "Content-Length": String(responseBody.byteLength),
      "Content-Type": "application/pdf",
    },
  });
}
