import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "osu-btn-primary",
  secondary: "osu-btn-secondary",
  outline: "osu-btn-outline",
  ghost: "osu-btn-ghost-primary",
  danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "!px-3 !py-1.5 !text-xs",
  md: "",
  lg: "!px-6 !py-3 !text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`osu-btn ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
        {...props}
      >
        {loading && (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {!loading && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";