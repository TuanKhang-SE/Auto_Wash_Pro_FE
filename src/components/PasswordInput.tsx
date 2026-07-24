import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  revealLabel?: string;
};

function PasswordInput({
  className = "",
  disabled,
  revealLabel = "mật khẩu",
  ...inputProps
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleLabel = isVisible
    ? `Ẩn ${revealLabel}`
    : `Hiển thị ${revealLabel}`;

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={isVisible ? "text" : "password"}
        disabled={disabled}
        className={`password-input ${className}`}
      />

      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setIsVisible((currentValue) => !currentValue)}
        disabled={disabled}
        aria-label={toggleLabel}
        aria-pressed={isVisible}
        title={toggleLabel}
        className="absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-center rounded-r-lg text-gray-500 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isVisible ? (
          <EyeOff size={21} aria-hidden="true" />
        ) : (
          <Eye size={21} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export default PasswordInput;
