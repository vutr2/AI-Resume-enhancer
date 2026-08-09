export default function DauViecLogo({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue D shape */}
      <path
        d="M13 7 H36 Q58 7 65 40 Q58 73 36 73 H13 Q8 73 8 68 V12 Q8 7 13 7 Z"
        fill="#1B5BE8"
      />
      {/* White cutout — hollow D interior */}
      <path
        d="M21 19 H34 Q50 19 50 40 Q50 61 34 61 H21 V19 Z"
        fill="white"
      />
      {/* Green checkmark — "V" overlaps D, tip extends past right edge */}
      <polyline
        points="13,46 31,65 75,17"
        stroke="#35B15C"
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
