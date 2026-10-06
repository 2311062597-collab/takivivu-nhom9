export default function AuthScenery() {
  const whiteHouses = [
    { x: 20, y: 390, w: 54, h: 74 }, { x: 66, y: 356, w: 72, h: 110 },
    { x: 122, y: 405, w: 54, h: 66 }, { x: 166, y: 370, w: 66, h: 104 },
    { x: 220, y: 414, w: 48, h: 64 }, { x: 262, y: 382, w: 70, h: 102 },
    { x: 316, y: 424, w: 50, h: 66 }, { x: 354, y: 396, w: 68, h: 98 },
    { x: 408, y: 435, w: 55, h: 64 }, { x: 452, y: 405, w: 62, h: 96 },
    { x: 505, y: 442, w: 44, h: 62 }, { x: 540, y: 420, w: 64, h: 88 },
    { x: 590, y: 450, w: 50, h: 58 }, { x: 628, y: 432, w: 64, h: 82 },
  ]

  return (
    <svg className="travel-scenery" viewBox="0 0 720 780" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7f8ff" />
          <stop offset=".48" stopColor="#bde7fb" />
          <stop offset="1" stopColor="#80c7eb" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#43abd9" />
          <stop offset=".55" stopColor="#187fbd" />
          <stop offset="1" stopColor="#07568f" />
        </linearGradient>
        <linearGradient id="cliff" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d7c6ae" />
          <stop offset=".46" stopColor="#a88b6d" />
          <stop offset="1" stopColor="#6c5a4a" />
        </linearGradient>
        <linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8c9da9" />
          <stop offset="1" stopColor="#536d7e" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <rect width="720" height="780" fill="url(#sky)" />
      <ellipse cx="138" cy="116" rx="210" ry="62" fill="#fff" opacity=".33" filter="url(#soft)" />
      <ellipse cx="520" cy="170" rx="180" ry="44" fill="#fff" opacity=".22" filter="url(#soft)" />

      <path d="M0 328 C86 295, 156 306, 224 326 C302 348, 378 350, 454 322 C534 291, 612 286, 720 318 L720 476 L0 476 Z" fill="#8fb3c8" opacity=".32" />
      <path d="M0 354 C82 318, 162 334, 236 351 C318 370, 412 363, 496 329 C584 293, 642 308, 720 337 L720 462 L0 462 Z" fill="url(#mountain)" opacity=".72" />
      <path d="M0 391 C84 364, 155 373, 232 389 C310 405, 393 394, 470 364 C561 329, 637 342, 720 371 L720 457 L0 457 Z" fill="#5f7f91" opacity=".55" />

      <path d="M0 428 C128 394, 242 412, 350 432 C473 454, 590 428, 720 404 L720 780 L0 780 Z" fill="url(#sea)" />
      <path d="M0 483 C114 471, 216 490, 322 506 C435 523, 572 502, 720 466" fill="none" stroke="#d8f4ff" strokeWidth="4" opacity=".38" />
      <path d="M68 548 C152 531, 235 548, 318 562" fill="none" stroke="#e9fbff" strokeWidth="3" opacity=".32" />
      <path d="M372 592 C465 570, 552 580, 660 566" fill="none" stroke="#e9fbff" strokeWidth="3" opacity=".28" />

      <path d="M0 505 C89 477, 151 485, 210 512 C278 544, 334 546, 390 526 C454 503, 495 515, 528 548 C560 581, 606 597, 720 591 L720 780 L0 780 Z" fill="url(#cliff)" />
      <path d="M0 562 C92 526, 166 542, 234 572 C300 601, 356 604, 423 584 C505 559, 574 588, 720 624 L720 780 L0 780 Z" fill="#a99277" opacity=".9" />
      <path d="M0 615 C108 581, 210 606, 302 638 C390 669, 486 664, 572 642 C630 628, 678 635, 720 650 L720 780 L0 780 Z" fill="#d7c8b3" opacity=".88" />

      {whiteHouses.map((h, i) => (
        <g key={i} transform={`rotate(${i % 3 === 0 ? -1.5 : i % 3 === 1 ? 1.2 : 0} ${h.x + h.w / 2} ${h.y + h.h / 2})`}>
          <rect x={h.x} y={h.y} width={h.w} height={h.h} rx="5" fill="#fbfdff" />
          <rect x={h.x + 9} y={h.y + 19} width="10" height="14" rx="1" fill="#2a71bd" opacity=".86" />
          <rect x={h.x + h.w - 18} y={h.y + 24} width="9" height="12" rx="1" fill="#2a71bd" opacity=".75" />
          <path d={`M${h.x + 5} ${h.y + 10} H${h.x + h.w - 5}`} stroke="#d7e7f3" strokeWidth="2" />
        </g>
      ))}

      <g>
        <rect x="56" y="367" width="106" height="121" rx="8" fill="#fff" />
        <rect x="78" y="398" width="18" height="30" rx="2" fill="#2c74bd" />
        <rect x="123" y="398" width="18" height="30" rx="2" fill="#2c74bd" />
        <ellipse cx="109" cy="366" rx="57" ry="35" fill="#087cd2" />
        <path d="M53 366 C65 330, 89 315, 109 315 C130 315, 151 331, 164 366" fill="#0d8ae4" />
        <rect x="105" y="298" width="8" height="25" rx="2" fill="#fff" />
        <circle cx="109" cy="294" r="7" fill="#087cd2" />
      </g>

      <g opacity=".92">
        <rect x="206" y="338" width="30" height="142" rx="4" fill="#fff" />
        <path d="M203 338 L221 315 L239 338 Z" fill="#e9f7ff" />
        <rect x="215" y="362" width="11" height="16" fill="#2e77c5" />
      </g>

      <path d="M475 514 C516 486, 559 474, 616 475" stroke="#f2fbff" strokeWidth="4" opacity=".38" fill="none" strokeLinecap="round" />
      <path d="M428 541 C465 519, 513 510, 556 511" stroke="#e6f9ff" strokeWidth="3" opacity=".3" fill="none" strokeLinecap="round" />

      <g opacity=".34" fill="#0d4772">
        <path d="M622 244 q8 -10 16 0 q8 -10 16 0 q-8 -5 -16 0 q-8 -5 -16 0" />
        <path d="M566 276 q6 -8 12 0 q6 -8 12 0 q-6 -4 -12 0 q-6 -4 -12 0" />
      </g>
    </svg>
  )
}
