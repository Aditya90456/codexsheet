import DsaCodingWorkspace from "./DsaCodingWorkspace";

type DsaProblem = { number: number; title: string; pattern: string; difficulty: "Easy" | "Medium" | "Hard"; link?: string };

export default function DsaIde({ problems, userId }: { problems: DsaProblem[]; userId: string | null }) {
  return <DsaCodingWorkspace problems={problems} userId={userId} />;
}
