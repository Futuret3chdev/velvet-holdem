/** Geometric 6-max ring — used as a fallback, not the camera staging. */
export function seatAngle(seat: number, count = 6) {
  return Math.PI / 2 + (seat * Math.PI * 2) / count;
}

export function seatPos(seat: number, count = 6, radiusX = 2.42, radiusZ = 1.78): [number, number, number] {
  const a = seatAngle(seat, count);
  return [Math.cos(a) * radiusX, 0, Math.sin(a) * radiusZ];
}

/**
 * Presentation seats. Hero is the camera (seat 0, near +Z). Opponents sit on a
 * compact far arc so every face is in frame on a portrait phone.
 */
const VIS: [number, number, number][] = [
  [0, 0, 1.22],
  [-0.8, 0, -0.86],
  [-0.4, 0, -1.02],
  [0, 0, -1.1],
  [0.4, 0, -1.02],
  [0.8, 0, -0.86],
];

export function visPos(seat: number): [number, number, number] {
  return VIS[seat] ?? [0, 0, 0];
}

/** Chip stacks sit on the felt, pulled toward the pot from each seat. */
export function chipPos(seat: number): [number, number, number] {
  const [x, , z] = visPos(seat);
  return [x * 0.58, 0, z * 0.52];
}

/** Hole cards on the felt in front of a bust. */
export function holePos(seat: number): [number, number, number] {
  const [x, , z] = visPos(seat);
  return [x * 0.7, 0, z * 0.64];
}

export function visYaw(seat: number) {
  const [x, , z] = visPos(seat);
  return Math.atan2(-x, -z);
}
