/** Geometric 6-max ring — used as a fallback, not the camera staging. */
export function seatAngle(seat: number, count = 6) {
  return Math.PI / 2 + (seat * Math.PI * 2) / count;
}

export function seatPos(seat: number, count = 6, radiusX = 2.42, radiusZ = 1.78): [number, number, number] {
  const a = seatAngle(seat, count);
  return [Math.cos(a) * radiusX, 0, Math.sin(a) * radiusZ];
}

/**
 * Chairs sit just outside the rail. Hero (seat 0) is nearest the camera at +Z.
 * Camera looks down at the felt, so these are markers — not a face wall.
 */
const VIS: [number, number, number][] = [
  [0, 0, 1.58],
  [-1.52, 0, 0.62],
  [-1.22, 0, -0.92],
  [0, 0, -1.42],
  [1.22, 0, -0.92],
  [1.52, 0, 0.62],
];

export function visPos(seat: number): [number, number, number] {
  return VIS[seat] ?? [0, 0, 0];
}

/** Chip stacks sit on the felt, pulled toward the pot from each seat. */
export function chipPos(seat: number): [number, number, number] {
  const [x, , z] = visPos(seat);
  return [x * 0.52, 0, z * 0.5];
}

/** Hole cards on the felt in front of a seat. */
export function holePos(seat: number): [number, number, number] {
  const [x, , z] = visPos(seat);
  return [x * 0.62, 0, z * 0.58];
}

export function visYaw(seat: number) {
  const [x, , z] = visPos(seat);
  return Math.atan2(-x, -z);
}
