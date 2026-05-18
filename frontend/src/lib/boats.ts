export const BOAT_TYPES = [
  { value: '1x', label: '1× Single', seats: 1, coxed: false, sculling: true },
  { value: '2x', label: '2× Double', seats: 2, coxed: false, sculling: true },
  { value: '2-', label: '2− Pair', seats: 2, coxed: false, sculling: false },
  { value: '4x', label: '4× Quad', seats: 4, coxed: false, sculling: true },
  { value: '4-', label: '4− Four', seats: 4, coxed: false, sculling: false },
  { value: '4+', label: '4+ Coxed four', seats: 4, coxed: true, sculling: false },
  { value: '8+', label: '8+ Eight', seats: 8, coxed: true, sculling: false },
] as const;

export type BoatTypeDef = (typeof BOAT_TYPES)[number];
