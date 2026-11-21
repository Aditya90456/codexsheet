import DsaCodingWorkspace from "./DsaCodingWorkspace";

type DsaProblem = { number: number; title: string; pattern: string; difficulty: "Easy" | "Medium" | "Hard"; link?: string };

export default function DsaIde({ problems, userId, focusProblem, voicePractice = false }: { problems: DsaProblem[]; userId: string | null; focusProblem?: number | null; voicePractice?: boolean }) {
  return <DsaCodingWorkspace problems={problems} userId={userId} focusProblem={focusProblem} voicePractice={voicePractice} />;
}
