import { parseEvec } from "./parseEvec";
import type { Dataset } from "./types";
/** Deterministic synthetic coordinates; no biological inference is intended. */
export function createExample(): Dataset {
  let seed = 1729;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed + 1) / 4294967297;
  };
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const centers = [
    [-0.045, 0.034],
    [-0.017, 0.012],
    [0.01, -0.021],
    [0.041, -0.006],
    [0.033, 0.047],
    [-0.037, -0.035],
  ];
  const rows = ["#eigvals: 12.4 8.6 4.2 2.8 1.5 1.2"];
  centers.forEach(([x, y], group) => {
    for (let i = 0; i < 60; i++) {
      const pcs = [
        x + normal() * 0.009,
        y + normal() * 0.009,
        ...Array.from({ length: 4 }, () => normal() * 0.03),
      ];
      rows.push(
        `DEMO_${String(group * 60 + i + 1).padStart(3, "0")} ${pcs.map((v) => v.toFixed(6)).join(" ")} Group_${String.fromCharCode(65 + group)}`,
      );
    }
  });
  return { ...parseEvec(rows.join("\n"), "Example dataset"), example: true };
}
