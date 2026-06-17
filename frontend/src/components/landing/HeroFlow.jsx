// Decorative orange "process line" for the hero: starts at the top near the
// title, sweeps down and exits on the RIGHT edge near the bottom (not cut off at
// the bottom), threading past the two cards. Uses a 0-100 viewBox with
// preserveAspectRatio="none" + non-scaling stroke so the geometry maps
// proportionally to its box → the cards stay on the line across screen sizes.
// Decorative only. Easy to remove: drop <HeroFlow /> in Landing.jsx.
export default function HeroFlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[72%] select-none lg:block"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="flow-orange" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F2620F" />
            <stop offset="1" stopColor="#F7943F" />
          </linearGradient>
        </defs>
        <path
          d="M 16 -2 C 40 8, 56 18, 68 22 C 82 27, 78 52, 86 66 C 92 76, 102 80, 114 84"
          stroke="url(#flow-orange)"
          strokeWidth="26"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity="0.4"
        />
      </svg>

      {/* Dot cluster — pixel-stable corner, kept out of the stretched SVG. */}
      <svg
        className="absolute right-4 top-6 h-24 w-40 text-neutral-300"
        fill="currentColor"
        aria-hidden
      >
        <defs>
          <pattern id="hero-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)" />
      </svg>
    </div>
  );
}
