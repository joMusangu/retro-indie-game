/**
 * Central collision tuning for this engine.
 *
 * Godot analogy (from project.godot):
 * - `layer_names/2d_physics/layer_1="game world"` → static stage / push volumes (future).
 * - `layer_names/2d_physics/layer_2="hitboxes"`    → attack hitboxes.
 *
 * Godot pairs **collision_layer** (what I am) with **collision_mask** (what I collide with).
 * Here we use `CollisionLayer` + `layerMask` bitflags on each `CollisionBox` (see `layerToBit` in game.ts).
 *
 * Edit reach / fractions here instead of inside `generateDefaultFrameData`.
 */
const ENGINE_COLLISION = {
    /**
     * Hitbox rect leading edge: distance from feet pivot along facing, as a fraction of sprite width.
     * 0.5 = aligned with the right edge of the fighter AABB (previous default).
     * Lower than 0.5 = leading edge starts farther left (more overlap with own sprite), shortening how far the attack extends past the art.
     */
    hitboxStartFromPivotWidthFraction: 0.44,

    /** Horizontal reach (depth) in **screen pixels** — forward extension of the hitbox after the leading edge. */
    reachPx: {
        punch: { min: 24, max: 38 },
        heavy: { min: 32, max: 48 },
        finisher: { min: 40, max: 62 },
    },

    /** Defender hurtbox width as a fraction of fighter width (narrower = must be closer to connect). */
    hurtboxWidthFactor: 0.58,
};
