const COLORS = ["#f7fbff", "#d5e7ff", "#f3e2b0", "#ddd0ff"] as const;

function buildStars(): { x: number; y: number; size: number; color: string; delay: number; duration: number }[] {
  let seed = 20261114;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return Array.from({ length: 72 }, () => {
    const roll = next();
    const color = COLORS[Math.floor(next() * COLORS.length)] ?? COLORS[0];
    return {
      x: next() * 100,
      y: next() * 100,
      size: roll < 0.72 ? 1 : roll < 0.9 ? 1.6 : 2.4,
      color,
      delay: next() * -6,
      duration: 3.2 + next() * 3.6,
    };
  });
}

const STARS = buildStars();

export function StarField() {
  return (
    <div className="star-field" aria-hidden="true">
      {STARS.map((star, index) => (
        <span
          key={index}
          className="star-point"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: star.color,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
