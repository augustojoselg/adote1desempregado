export default function EloIcon({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      className={className}
      aria-hidden="true"
    >
      <rect x="35" y="85" width="150" height="70" rx="35" fill="none" stroke="#1F6D4C" strokeWidth="26" />
      <rect x="55" y="85" width="150" height="70" rx="35" fill="none" stroke="#F0A93A" strokeWidth="26" transform="rotate(44 130 120)" />
    </svg>
  )
}
