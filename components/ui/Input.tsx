import {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`osu-input ${className}`} {...props} />
  )
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => (
    <select ref={ref} className={`osu-input ${className}`} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea ref={ref} className={`osu-input ${className}`} {...props} />
));
Textarea.displayName = "Textarea";

type FieldProps = LabelHTMLAttributes<HTMLLabelElement> & {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
};

export function Field({ label, required, hint, children, className = "", ...props }: FieldProps) {
  return (
    <label className={`block text-sm text-[var(--color-text-secondary)] ${className}`} {...props}>
      <span className="mb-1.5 inline-flex items-center gap-1 font-medium text-[var(--color-text-primary)]">
        {label}
        {required && <span className="text-[var(--color-danger)]">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--color-text-muted)]">{hint}</span>}
    </label>
  );
}