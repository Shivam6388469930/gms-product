"use client";

import { useId, type SelectHTMLAttributes } from "react";
import { inputClass, labelClass } from "@/components/Ui";

export function SelectField({
  label,
  options,
  ...props
}: { label: string; options: readonly { value: string; label: string }[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={`${labelClass} mb-1.5`}>
        {label}
      </label>
      <select id={id} {...props} className={inputClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}