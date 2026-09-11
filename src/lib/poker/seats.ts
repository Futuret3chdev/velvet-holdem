export function seatAngle(seat: number, count = 6) {
  return Math.PI / 2 + (seat * Math.PI * 2) / count;
}

export function seatPos(seat: number, count = 6, radiusX = 2.42, radiusZ = 1.78): [number, number, number] {
  const a = seatAngle(seat, count);
  return [Math.cos(a) * radiusX, 0, Math.sin(a) * radiusZ];
}
