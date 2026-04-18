export function pairId(a, b) {
  return [a, b].sort().join("__");
}
