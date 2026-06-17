import { yearRange } from "@/lib/profile";

export default function ExperienceList({ items }) {
  return (
    <ul className="space-y-4">
      {items.map((e) => (
        <li key={e.id} className="border-l-2 border-border pl-4">
          <p className="font-medium">
            {e.role}
            {e.organization && <span className="text-muted-foreground"> · {e.organization}</span>}
          </p>
          {yearRange(e) && <p className="text-xs text-muted-foreground">{yearRange(e)}</p>}
          {e.description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.description}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
