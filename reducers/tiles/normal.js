export function tileKeyAtLocation({ x, y }) {
  return `tile_${x}_${y}`;
}

export function createNormalTile({
  x,
  y,
  type,
  dimension,
}) {
  const key = tileKeyAtLocation({ x, y });
  return {
    x,
    y,
    type,
    key,
    dimension,
  };
}
