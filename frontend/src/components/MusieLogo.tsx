interface MusieLogoProps {
  showWordmark?: boolean;
  className?: string;
}

export const MusieLogo = ({ showWordmark = true, className = '' }: MusieLogoProps) => (
  <div className={`flex items-center gap-3 ${className}`.trim()}>
    <svg viewBox="0 0 64 64" role="img" aria-label="Musie logo" className="h-8 w-8 shrink-0">
      <path
        d="M12 52V19c0-2.2 1.8-4 4-4h7.5l13.2 19.2L48 15h4c2.2 0 4 1.8 4 4v25.5c0 3.2-2.6 5.8-5.8 5.8-3.1 0-5.7-2.5-5.7-5.7 0-2.7 1.9-5 4.5-5.6V25.3L36.8 41.8c-1.6 2.4-5.1 2.4-6.7 0L19.5 25.3V52H12Z"
        fill="var(--accent-primary)"
      />
      <path
        d="M48.5 14.8c.8 6.6 4.2 9.5 9.1 11.6-2.4 1.1-5.4 1.1-8 0"
        fill="none"
        stroke="var(--accent-secondary)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.5"
      />
      <circle cx="49.2" cy="50.1" r="3.7" fill="var(--text-main)" />
    </svg>
    {showWordmark && (
      <span className="text-lg font-black tracking-tighter text-[var(--text-main)]">MUSIE</span>
    )}
  </div>
);
