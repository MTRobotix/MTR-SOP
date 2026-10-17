// Halftone mark (logo concept 41): dots grow toward the top right; the largest are the brand red.
// Coarse 7×7 version so it stays legible at header size. Ink follows the text colour.
const DOTS: [number, number, number, boolean][] = [
  [36.0, 8.0, 4.24, false],
  [50.0, 8.0, 5.13, false],
  [64.0, 8.0, 5.77, false],
  [22.0, 22.0, 3.53, false],
  [36.0, 22.0, 4.61, false],
  [50.0, 22.0, 5.67, false],
  [64.0, 22.0, 6.66, true],
  [78.0, 22.0, 6.78, true],
  [8.0, 36.0, 2.44, false],
  [22.0, 36.0, 3.51, false],
  [36.0, 36.0, 4.58, false],
  [50.0, 36.0, 5.62, false],
  [64.0, 36.0, 6.56, false],
  [78.0, 36.0, 6.66, false],
  [92.0, 36.0, 5.77, false],
  [8.0, 50.0, 2.19, false],
  [22.0, 50.0, 3.2, false],
  [36.0, 50.0, 4.17, false],
  [50.0, 50.0, 5.02, false],
  [64.0, 50.0, 5.62, false],
  [78.0, 50.0, 5.67, false],
  [92.0, 50.0, 5.13, false],
  [8.0, 64.0, 1.74, false],
  [22.0, 64.0, 2.66, false],
  [36.0, 64.0, 3.49, false],
  [50.0, 64.0, 4.17, false],
  [64.0, 64.0, 4.58, false],
  [78.0, 64.0, 4.61, false],
  [92.0, 64.0, 4.24, false],
  [22.0, 78.0, 1.95, false],
  [36.0, 78.0, 2.66, false],
  [50.0, 78.0, 3.2, false],
  [64.0, 78.0, 3.51, false],
  [78.0, 78.0, 3.53, false],
  [36.0, 92.0, 1.74, false],
  [50.0, 92.0, 2.19, false],
  [64.0, 92.0, 2.44, false],
];

export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg className="brand-mark" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      {DOTS.map(([x, y, r, brand]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={brand ? "var(--color-brand)" : "currentColor"} />
      ))}
    </svg>
  );
}
