export const companyInterviewTracks = ["Amazon", "Google", "Meta", "Apple", "Netflix", "Nvidia"] as const;

export type CompanyInterviewTrack = (typeof companyInterviewTracks)[number];
export type CompanyInterviewTags = Partial<Record<CompanyInterviewTrack, string[]>>;

const sourceRoot = "https://raw.githubusercontent.com/snehasishroy/leetcode-companywise-interview-questions/master";

function parseCsvRow(line: string) {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }
  fields.push(field);
  return fields;
}

function problemSlugs(csv: string) {
  return csv.split(/\r?\n/).slice(1).flatMap((line) => {
    const link = parseCsvRow(line)[1];
    if (!link) return [];
    try {
      const parts = new URL(link).pathname.split("/").filter(Boolean);
      const slug = parts[parts.length - 1];
      return slug ? [slug.toLowerCase()] : [];
    } catch {
      return [];
    }
  });
}

export async function fetchCompanyInterviewTags(): Promise<{
  tags: CompanyInterviewTags;
  unavailable: CompanyInterviewTrack[];
}> {
  const results = await Promise.allSettled(companyInterviewTracks.map(async (company) => {
    const response = await fetch(`${sourceRoot}/${company.toLowerCase()}/all.csv`);
    if (!response.ok) throw new Error(`Could not load ${company} interview tags (HTTP ${response.status}).`);
    return [company, problemSlugs(await response.text())] as const;
  }));
  const tags: CompanyInterviewTags = {};
  const unavailable: CompanyInterviewTrack[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") tags[result.value[0]] = result.value[1];
    else unavailable.push(companyInterviewTracks[index]);
  });
  return { tags, unavailable };
}
