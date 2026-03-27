type RobotIconProps = {
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-10 w-10",
} as const;

export function RobotIcon({ size = "md" }: RobotIconProps) {
  return (
    <svg
      className={sizeClasses[size]}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="3" r="1.5" fill="currentColor" className="animate-pulse" />
      <line x1="12" y1="4.5" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="5" y="7" width="14" height="11" rx="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor">
        <animate attributeName="r" values="1.5;1.8;1.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="15" cy="12" r="1.5" fill="currentColor">
        <animate attributeName="r" values="1.5;1.8;1.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <path d="M9 15.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="2" y="10" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="20" y="10" width="2" height="4" rx="1" fill="currentColor" />
      <path d="M8 18v2.5A1.5 1.5 0 009.5 22h5a1.5 1.5 0 001.5-1.5V18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
