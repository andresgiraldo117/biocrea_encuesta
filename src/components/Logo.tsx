export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r="55"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="1.5, 3.4"
      />
      <path
        fill="currentColor"
        d="M 85 96 C 70 91 58 76 55 61 C 72 59 82 46 80 33 C 78 23 68 19 60 25 C 56 13 44 11 38 19 C 34 25 36 33 42 37 C 28 41 18 55 20 69 C 22 83 34 91 48 89 C 50 101 62 109 78 109 C 88 109 92 101 85 96 Z"
      />
      <circle cx="42" cy="56" r="3" fill="#f3ece1" />
    </svg>
  );
}
