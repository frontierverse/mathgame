import { getStudents } from "../../server/students";
import { dataErrorResponse } from "../../server/session";

export async function GET() {
  try { return Response.json({ students: await getStudents() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return dataErrorResponse(error); }
}
