export const getRayBoxIntersection = (x1: number, y1: number, x2: number, y2: number, boxW: number, boxH: number, margin: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const slope = dy / dx;
  const cx = x2;
  const cy = y2;
  const hw = boxW / 2;
  const hh = boxH / 2;
  let ix, iy;

  if (Math.abs(dx) > 0.001) {
      const signX = dx > 0 ? 1 : -1;
      ix = signX * hw;
      iy = slope * ix;
      if (Math.abs(iy) <= hh) return { x: cx - (ix + signX * margin), y: cy - iy };
  }
  if (Math.abs(dy) > 0.001) {
      const signY = dy > 0 ? 1 : -1;
      iy = signY * hh;
      ix = iy / slope;
      if (Math.abs(ix) <= hw) return { x: cx - ix, y: cy - (iy + signY * margin) };
  }
  return { x: cx, y: cy };
};
