// Shared mutable state between the DOM (GSAP, Lenis, pointer) and the WebGL scene.
// Mutated outside React on purpose: it changes every frame and must not re-render.
export const sceneState = {
  progress: 0, // 0 → assembled wheel, 1 → full teardown
  velocity: 0, // scroll velocity, px/s
  pointer: { x: 0, y: 0 }, // -1..1
  reduced: false,
  introAt: -1, // performance.now() when the preloader lifted; -1 = not yet
};
