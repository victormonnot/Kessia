import { useState } from "react";

import { cn } from "@/lib/utils";

// Lightweight tab switcher keeping the v1 API ({ tabs: [{key,label,render}] }).
export default function Tabs({ tabs, initial }) {
  const [active, setActive] = useState(initial || tabs[0]?.key);
  const current = tabs.find((t) => t.key === active);

  return (
    <div>
      <div className="border-b">
        <nav className="flex gap-1 overflow-x-auto" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === active}
              onClick={() => setActive(t.key)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition",
                t.key === active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-6">{current?.render()}</div>
    </div>
  );
}
