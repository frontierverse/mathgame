import "server-only";

type YouthRecord = {
  name?: unknown;
  age?: unknown;
  birthDate?: unknown;
};

function readAge(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }

  return null;
}

function ageFromBirthDate(value: unknown) {
  if (typeof value !== "string") return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    birthDate.getFullYear() !== Number(year) ||
    birthDate.getMonth() !== Number(month) - 1 ||
    birthDate.getDate() !== Number(day)
  ) {
    return null;
  }

  const today = new Date();
  const hasHadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  return Math.max(0, today.getFullYear() - birthDate.getFullYear() - (hasHadBirthday ? 0 : 1));
}

export class StudentListError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudentListError";
  }
}

export async function getStudents() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new StudentListError("학생 목록을 불러오기 위한 서버 설정이 없습니다.");
  }

  const endpoint = new URL("/rest/v1/Youth", supabaseUrl);
  // Sort oldest-first. The `age` column is currently unpopulated, so fall
  // back to `birthDate` (an earlier birthDate means an older student).
  endpoint.searchParams.set("select", "name,age,birthDate");
  endpoint.searchParams.set("order", "age.desc.nullslast,birthDate.asc.nullslast");

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Student list request failed", { status: response.status });
      throw new StudentListError("학생 목록을 불러오지 못했습니다.");
    }

    const records: unknown = await response.json();
    if (!Array.isArray(records)) {
      console.error("Student list response has an unexpected shape");
      throw new StudentListError("학생 목록 응답을 처리하지 못했습니다.");
    }

    return records.flatMap((record) => {
      const youth = record as YouthRecord;
      const name = youth?.name;
      if (typeof name !== "string" || !name.trim()) return [];

      return [
        {
          name: name.trim(),
          age: readAge(youth.age) ?? ageFromBirthDate(youth.birthDate),
        },
      ];
    });
  } catch (error) {
    if (error instanceof StudentListError) throw error;

    console.error("Student list request could not reach Supabase");
    throw new StudentListError("학생 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}
