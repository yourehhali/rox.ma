import { useEffect, useRef } from "react";

const LENGTH = 6;

/**
 * Controlled 6-box OTP entry. The parent owns the joined digit string via
 * `value`/`onChange`; `onComplete` fires when all six digits are present.
 * Shared by the WhatsApp client-login screen and the public intake.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
  }, [autoFocus]);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/[^0-9]/g, "").slice(-1);
    const next = digits.slice();
    next[i] = clean;
    const joined = next.join("").replace(/\s/g, "");
    onChange(joined);
    if (clean && i < LENGTH - 1) inputsRef.current[i + 1]?.focus();
    if (joined.length === LENGTH) onComplete?.(joined);
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    const focusIdx = Math.min(text.length, LENGTH - 1);
    inputsRef.current[focusIdx]?.focus();
    if (text.length === LENGTH) onComplete?.(text);
  };

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="Code de vérification">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          aria-label={`Chiffre ${i + 1}`}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
          }}
          onPaste={onPaste}
          className="h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
        />
      ))}
    </div>
  );
}
