"use client";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { message: string };

/** Submit button that asks first. For actions that cannot be undone. */
export function ConfirmButton({ message, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
