import { useState } from "react";

export default function Tabs({ tabs, initial }) {
  const [active, setActive] = useState(initial || tabs[0]?.key);
  const current = tabs.find((t) => t.key === active);

  return (
    <div>
      <div className="border-b border-neutral-200">
        <nav className="flex gap-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium transition ${
                t.key === active
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
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
