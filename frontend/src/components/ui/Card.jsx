import { cn } from "@/lib/utils";

// Compatibility wrapper: padded card container keeping the v1 API
// ({ children, className, as }). The composable shadcn Card primitive
// (components/ui/card) stays available for richer layouts.
export default function Card({ children, className = "", as: Tag = "div", ...props }) {
  return (
    <Tag
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
