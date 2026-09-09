import BoundingBox from "./BoundingBox";

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildScene(n, seedStr, baseConf) {
  const rand = mulberry32(hashSeed(seedStr));
  const count = Math.max(1, Math.min(n, 8));
  const slot = 400 / count;
  const figures = [];
  const boxes = [];

  for (let i = 0; i < count; i++) {
    const jitter = (rand() - 0.5) * slot * 0.3;
    const cx = slot * (i + 0.5) + jitter;
    const bodyW = 36 + rand() * 18;
    const bodyH = 110 + rand() * 60;
    const headR = 13 + rand() * 6;
    const bottomY = 272 + rand() * 8;
    const topY = bottomY - bodyH;
    const headCY = topY - headR + 2;
    figures.push({ cx, bodyW, bodyH, topY, headCY, headR });

    const boxW = Math.max(bodyW, headR * 2) + 8;
    const conf = Math.min(0.98, Math.max(0.55, baseConf + (rand() - 0.5) * 0.14));
    boxes.push({
      x1: (cx - boxW / 2) / 400,
      y1: (headCY - headR - 4) / 300,
      x2: (cx + boxW / 2) / 400,
      y2: (bottomY + 4) / 300,
      confidence: conf,
    });
  }

  return { figures, boxes };
}

// Seeded by `seed` (the sample's own label) so the same sample always
// renders the same layout — revisiting sample_03.jpg twice shouldn't
// reshuffle the scene.
function SceneCanvas({ people, seed, confidence }) {
  const { figures, boxes } = buildScene(people, seed, confidence);

  return (
    <>
      <svg viewBox="0 0 400 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sceneBg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#050705" />
            <stop offset="70%" stopColor="#070a07" />
            <stop offset="100%" stopColor="#0c130d" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="400" height="300" fill="url(#sceneBg)" />
        <rect x="0" y="258" width="400" height="42" fill="#050605" />
        <line x1="0" y1="258" x2="400" y2="258" stroke="#14201a" strokeWidth="1" />
        <circle cx="380" cy="18" r="55" fill="rgba(255,255,255,0.03)" />
        {figures.map((f, i) => (
          <g key={i}>
            <circle cx={f.cx} cy={f.headCY} r={f.headR} fill="#16211a" />
            <rect
              x={f.cx - f.bodyW / 2}
              y={f.topY}
              width={f.bodyW}
              height={f.bodyH}
              rx={f.bodyW / 2.6}
              fill="#16211a"
            />
          </g>
        ))}
      </svg>
      {boxes.map((b, i) => (
        <BoundingBox
          key={i}
          x1={b.x1}
          y1={b.y1}
          x2={b.x2}
          y2={b.y2}
          confidence={b.confidence}
          index={i}
          delayMs={i * 60}
        />
      ))}
    </>
  );
}

export default SceneCanvas;
