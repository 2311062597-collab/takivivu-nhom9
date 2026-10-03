// Flat-vector coastal town illustration used behind the auth slogan.
// Hand-drawn shapes (no stock photo) so it stays crisp, on-brand and license-free.
const houses = [
  { x: 34, y: 122, w: 30, h: 40 },
  { x: 70, y: 100, w: 28, h: 62, dome: 'blue' as const },
  { x: 104, y: 126, w: 34, h: 36 },
  { x: 186, y: 110, w: 36, h: 52 },
  { x: 228, y: 96, w: 26, h: 66, dome: 'blue' as const },
  { x: 260, y: 122, w: 30, h: 40 },
  { x: 296, y: 106, w: 34, h: 56 },
  { x: 336, y: 124, w: 28, h: 38 },
  { x: 370, y: 100, w: 30, h: 62, dome: 'terracotta' as const },
  { x: 406, y: 118, w: 26, h: 44 },
  { x: 442, y: 108, w: 34, h: 54 },
  { x: 482, y: 124, w: 28, h: 38 },
  { x: 516, y: 112, w: 30, h: 50 },
  { x: 552, y: 124, w: 26, h: 38 },
]

export default function AuthIllustration() {
  return (
    <svg
      className="auth-illustration-svg"
      viewBox="0 0 600 230"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ai-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fd4ec" />
          <stop offset="1" stopColor="#1c6cad" />
        </linearGradient>
        <linearGradient id="ai-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9e1d3" />
          <stop offset="1" stopColor="#c9baa4" />
        </linearGradient>
      </defs>

      {/* distant birds */}
      <path d="M76,28 q4,-6 8,0 q4,-6 8,0" stroke="#0b3977" strokeWidth="1.4" fill="none" opacity=".35" strokeLinecap="round" />
      <path d="M150,46 q3,-4.5 6,0 q3,-4.5 6,0" stroke="#0b3977" strokeWidth="1.2" fill="none" opacity=".3" strokeLinecap="round" />

      {/* cliff / headland */}
      <path
        d="M0,162 L40,150 L80,159 L120,148 L160,156 L198,144 L236,151 L276,142 L316,150 L356,144 L394,153 L432,144 L470,151 L508,146 L546,153 L600,148 L600,230 L0,230 Z"
        fill="url(#ai-stone)"
      />
      <path
        d="M0,162 L40,150 L80,159 L120,148 L160,156 L198,144 L236,151 L276,142 L316,150 L356,144 L394,153 L432,144 L470,151 L508,146 L546,153 L600,148"
        stroke="#b6a488"
        strokeWidth="2"
        fill="none"
        opacity=".5"
      />

      {/* bell tower landmark */}
      <rect x="146" y="66" width="16" height="86" rx="2" fill="#fbfeff" />
      <circle cx="154" cy="62" r="11" fill="#2f6fd6" />
      <line x1="154" y1="46" x2="154" y2="34" stroke="#0b3977" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="148" y1="39" x2="160" y2="39" stroke="#0b3977" strokeWidth="1.6" strokeLinecap="round" />

      {/* village houses */}
      {houses.map((h, i) => (
        <g key={i}>
          <rect x={h.x} y={h.y} width={h.w} height={h.h} rx="3" fill="#fbfeff" />
          <rect x={h.x + h.w / 2 - 3} y={h.y + 12} width="6" height="8" fill="#2f6fd6" opacity=".85" />
          {h.dome && (
            <circle
              cx={h.x + h.w / 2}
              cy={h.y - 2}
              r={h.w / 2 + 2}
              fill={h.dome === 'blue' ? '#2f6fd6' : '#e2794f'}
            />
          )}
        </g>
      ))}

      {/* sea */}
      <path
        d="M0,192 C60,186 120,198 180,192 C240,186 300,198 360,192 C420,186 480,198 540,192 C570,190 600,192 600,192 L600,230 L0,230 Z"
        fill="url(#ai-sea)"
      />
      <path d="M40,203 q20,-5 40,0 t40,0" stroke="#eaf9ff" strokeWidth="1.4" fill="none" opacity=".4" />
      <path d="M300,213 q20,-5 40,0 t40,0" stroke="#eaf9ff" strokeWidth="1.4" fill="none" opacity=".35" />

      {/* small sailboat */}
      <path d="M468,206 L486,206 L482,213 L472,213 Z" fill="#0b3977" opacity=".8" />
      <path d="M479,193 L479,206 L489,205 Z" fill="#fbfeff" />
    </svg>
  )
}
