export function PokeBall() {
  return (
    <svg className="poke-ball" viewBox="0 0 64 64" aria-hidden="true">
      <g className="poke-ball-top">
        <path d="M6.2 32 A25.8 25.8 0 0 1 57.8 32 Z" fill="#e23b3b" />
      </g>
      <g className="poke-ball-bottom">
        <path d="M6.2 32 A25.8 25.8 0 0 0 57.8 32 Z" fill="#f4f7f8" />
      </g>
      <circle cx="32" cy="32" r="28" fill="none" stroke="#1b1b1b" strokeWidth="3.2" />
      <path d="M5 32 H59" stroke="#1b1b1b" strokeWidth="3.4" />
      <circle className="poke-ball-button" cx="32" cy="32" r="7.2" fill="#f7f7f7" stroke="#1b1b1b" strokeWidth="2.6" />
      <circle cx="32" cy="32" r="2.4" fill="#d7d7d7" />
    </svg>
  );
}
