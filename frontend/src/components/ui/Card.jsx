export default function Card({ children, className = "", as: Tag = "div", ...props }) {
  return (
    <Tag
      className={`rounded-lg border border-neutral-200 bg-white p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
