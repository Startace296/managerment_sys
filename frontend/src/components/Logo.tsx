import { useId } from "react";

export default function Logo({ className = "size-9" }: { className?: string }) {
  const barId = useId();
  const nodeId = useId();

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={barId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16787d" />
          <stop offset="55%" stopColor="#0e5a5e" />
          <stop offset="100%" stopColor="#093f43" />
        </linearGradient>
        <linearGradient id={nodeId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2c069" />
          <stop offset="50%" stopColor="#e8a33d" />
          <stop offset="100%" stopColor="#c97f1f" />
        </linearGradient>
      </defs>
      <rect x="10" y="14" width="16" height="36" rx="8" fill={`url(#${barId})`} />
      <rect x="38" y="18" width="16" height="32" rx="8" fill={`url(#${barId})`} />
      <circle cx="32" cy="34" r="12" fill={`url(#${nodeId})`} />
      <circle cx="28.5" cy="30" r="3" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}
