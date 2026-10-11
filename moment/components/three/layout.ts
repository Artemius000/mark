// Where the wheel, floor and camera sit for each screen shape.
// Phones stack the wheel above the headline; tall tablets use a smaller wheel top-right.
export type SceneLayout = {
  heroX: number;
  openX: number;
  rootY: number;
  scale: [number, number]; // hero → teardown
  floorY: number;
  camY: [number, number]; // before → after the intro dolly
  camX0: number;
  lookY: number;
  lookX: boolean; // desktop keeps the wheel off-centre during the intro
  reflector: boolean;
};

export function sceneLayout(width: number, height: number): SceneLayout {
  if (width < 768) {
    return { heroX: 0, openX: 0.22, rootY: 1.55, scale: [0.5, 0.38], floorY: 1.045, camY: [1.2, 1.8], camX0: 0.4, lookY: 0.78, lookX: false, reflector: false };
  }
  if (width / height < 1.25) {
    return { heroX: 0.42, openX: 0.1, rootY: 0.55, scale: [0.5, 0.44], floorY: 0.045, camY: [0.25, 0.85], camX0: 1.2, lookY: 0.25, lookX: false, reflector: true };
  }
  return { heroX: 1.3, openX: 0.1, rootY: -0.02, scale: [0.92, 0.84], floorY: -1.03, camY: [-0.45, 0.18], camX0: 2.2, lookY: -0.05, lookX: true, reflector: true };
}
