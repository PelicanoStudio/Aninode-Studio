export const getMenuPosition = (
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number,
  margin: number = 10
): { left: number; top: number } => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let left = x;
  let top = y;

  // Check if menu would overflow right edge
  if (x + menuWidth + margin > windowWidth) {
    left = windowWidth - menuWidth - margin;
  }

  // Check if menu would overflow bottom edge
  if (y + menuHeight + margin > windowHeight) {
    top = windowHeight - menuHeight - margin;
  }

  // Check if menu would overflow left edge
  if (left < margin) {
    left = margin;
  }

  // Check if menu would overflow top edge
  if (top < margin) {
    top = margin;
  }

  return { left, top };
};
