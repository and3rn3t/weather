// Minimal utility to ensure coverage artifacts are non-empty in CI
// Safe and side-effect free.

export function add(a: number, b: number): number {
  return a + b;
}

export function isEven(n: number): boolean {
  return n % 2 === 0;
}

export default { add, isEven };
