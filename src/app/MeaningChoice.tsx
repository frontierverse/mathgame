import Formula from "./Formula";
import { mathTokenLabel, type Choice } from "./curriculum";

export default function MeaningChoice({ choice }: { choice: Choice }) {
  if (choice.kind === "expression") return <Formula tokens={choice.tokens} label={choice.label} />;
  const left = choice.direction === "left";
  return <span className={`movement-meaning ${choice.direction}`}>
    <span className="movement-distance"><Formula tokens={[choice.distance]} label={`${mathTokenLabel(choice.distance)}만큼 이동`} /></span>
    <svg viewBox="0 0 160 24" aria-hidden="true">
      <path d={left ? "M148 12H12 M12 12L20 5 M12 12L20 19" : "M12 12H148 M148 12L140 5 M148 12L140 19"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={left ? 148 : 12} cy="12" r="4" fill="white" stroke="currentColor" strokeWidth="2" />
    </svg>
    <span className="movement-start"><Formula tokens={[choice.start]} label={`출발점 ${mathTokenLabel(choice.start)}`} /></span>
  </span>;
}
