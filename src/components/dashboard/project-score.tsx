import { Award } from "lucide-react";

export function ProjectScore({ score, scoreOutOf = 100, detailed = false }: { score: number | null | undefined; scoreOutOf?: number; detailed?: boolean }) {
  return <div className={detailed ? "project-score score-detail" : "project-score"}>
    <Award size={detailed ? 23 : 15} aria-hidden="true" />
    <span>{detailed && <small>Project marks</small>}{score == null ? <span className="score-empty">Not marked</span> : <><strong>{score}</strong><span className="score-denominator"> / {scoreOutOf}</span></>}</span>
  </div>;
}
