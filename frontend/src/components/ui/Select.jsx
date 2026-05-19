import { forwardRef } from "react";

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, className = "", id, ...props },
  ref,
) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <select
        id={inputId}
        ref={ref}
        className={`h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
          error ? "border-red-500" : ""
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
});

export default Select;
