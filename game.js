"use strict";
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const BASE_GROUND_Y = 860; // the floor (ground level)
// Screen Resolution
const SCREEN_WIDTH = 768; // Match per-arena tile aspect (square)
const SCREEN_HEIGHT = 768;
// Scale factor: currentHeight / baseHeight
const SCALE = SCREEN_HEIGHT / BASE_HEIGHT;
// Ground Y in screen coordinates (scaled from base)
const GROUND_Y = Math.round(BASE_GROUND_Y * SCALE);
// Fighter height (just to make sure they all stand on the same level bruv)
const STANDARD_FIGHTER_HEIGHT = 380;
const STANDARD_FIGHTER_WIDTH = 280;
const FPS = 60;
const FIXED_DELTA_TIME = 1 / 60; // timestep for updates
// Modern Vector Color Palette ( no idea )
const PALETTE = {
    WHITE: "#ffffff",
    BLACK: "#000000",
    OUTLINE: "#000000", // Thick black outlines
    BACKGROUND_LIGHT: "#f5f5f5",
    BACKGROUND_DARK: "#e8e8e8",
    PASTEL_PINK: "#ffb3d9",
    PASTEL_BLUE: "#b3d9ff",
    PASTEL_GREEN: "#b3ffd9",
    PASTEL_YELLOW: "#fff9b3",
    PASTEL_PURPLE: "#d9b3ff",
    PASTEL_ORANGE: "#ffd9b3",
    ACCENT_RED: "#ff6b6b",
    ACCENT_BLUE: "#4ecdc4",
    ACCENT_GREEN: "#95e1d3",
    ACCENT_YELLOW: "#ffe66d",
    GROUND: "#f0f0f0",
    GROUND_SHADOW: "#d0d0d0",
};
// Color manipulation helper functions ( for the 16-bit tekken style shading) this is so far from tekken though
function darkenColor(color, amount) {
    const r = parseInt(color.slice(1, 3), 16); // red ( power ranger style )
    const g = parseInt(color.slice(3, 5), 16); // green ( steph curry style )
    const b = parseInt(color.slice(5, 7), 16); // blue  ( blue beetle I guess)
    return `#${Math.max(0, r - amount).toString(16).padStart(2, '0')}${Math.max(0, g - amount).toString(16).padStart(2, '0')}${Math.max(0, b - amount).toString(16).padStart(2, '0')}`;
}
function lightenColor(color, amount) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `#${Math.min(255, r + amount).toString(16).padStart(2, '0')}${Math.min(255, g + amount).toString(16).padStart(2, '0')}${Math.min(255, b + amount).toString(16).padStart(2, '0')}`;
}
// Character Preview Image Paths ( some don't have a solo shot so I gotta do some screen shots from the site lol)
const CHARACTER_PREVIEW_PATHS = {
    "Fantasy Warrior": "Fantasy Warrior/Sprites/Idle.png", // Fallback to Idle if no preview
    "Martial Hero": "Martial Hero/Sprites/Idle.png",
    "Martial Hero 2": "Martial Hero 2/Sprites/Idle.png",
    "Martial Hero 3": "Martial Hero 3/Preview.png",
    "Medieval Warrior Pack 2": "Medieval Warrior Pack 2/Sprites/Idle.png",
    "Medieval Warrior Pack 3": "Medieval Warrior Pack 3/Preview.gif",
    "Huntress": "Huntress/Sprites/Idle.png",
    "Huntress 2": "Huntress 2/Preview.png",
    "Evil Wizard 3": "Evil Wizard 3/preview.png"
};
// Character sprite paths mapping
const CHARACTER_SPRITE_PATHS = {
    "Fantasy Warrior": {
        idle: "Fantasy Warrior/Sprites/Idle.png",
        run: "Fantasy Warrior/Sprites/Run.png",
        attack1: "Fantasy Warrior/Sprites/Attack1.png",
        attack2: "Fantasy Warrior/Sprites/Attack2.png",
        attack3: "Fantasy Warrior/Sprites/Attack3.png",
        death: "Fantasy Warrior/Sprites/Death.png",
        fall: "Fantasy Warrior/Sprites/Fall.png",
        getHit: "Fantasy Warrior/Sprites/Take hit.png",
        jump: "Fantasy Warrior/Sprites/Jump.png"
    },
    "Martial Hero": {
        idle: "Martial Hero/Sprites/Idle.png",
        run: "Martial Hero/Sprites/Run.png",
        attack1: "Martial Hero/Sprites/Attack1.png",
        attack2: "Martial Hero/Sprites/Attack2.png",
        death: "Martial Hero/Sprites/Death.png",
        fall: "Martial Hero/Sprites/Fall.png",
        getHit: "Martial Hero/Sprites/Take Hit.png",
        jump: "Martial Hero/Sprites/Jump.png"
    },
    "Martial Hero 2": {
        idle: "Martial Hero 2/Sprites/Idle.png",
        run: "Martial Hero 2/Sprites/Run.png",
        attack1: "Martial Hero 2/Sprites/Attack1.png",
        attack2: "Martial Hero 2/Sprites/Attack2.png",
        death: "Martial Hero 2/Sprites/Death.png",
        fall: "Martial Hero 2/Sprites/Fall.png",
        getHit: "Martial Hero 2/Sprites/Take hit.png",
        jump: "Martial Hero 2/Sprites/Jump.png"
    },
    "Martial Hero 3": {
        idle: "Martial Hero 3/Sprite/Idle.png",
        run: "Martial Hero 3/Sprite/Run.png",
        attack1: "Martial Hero 3/Sprite/Attack1.png",
        attack2: "Martial Hero 3/Sprite/Attack2.png",
        attack3: "Martial Hero 3/Sprite/Attack3.png",
        death: "Martial Hero 3/Sprite/Death.png",
        fall: "Martial Hero 3/Sprite/Going Down.png",
        getHit: "Martial Hero 3/Sprite/Take Hit.png"
    },
    "Medieval Warrior Pack 2": {
        idle: "Medieval Warrior Pack 2/Sprites/Idle.png",
        run: "Medieval Warrior Pack 2/Sprites/Run.png",
        attack1: "Medieval Warrior Pack 2/Sprites/Attack1.png",
        attack2: "Medieval Warrior Pack 2/Sprites/Attack2.png",
        attack3: "Medieval Warrior Pack 2/Sprites/Attack3.png",
        attack4: "Medieval Warrior Pack 2/Sprites/Attack4.png",
        death: "Medieval Warrior Pack 2/Sprites/Death.png",
        fall: "Medieval Warrior Pack 2/Sprites/Fall.png",
        getHit: "Medieval Warrior Pack 2/Sprites/Take Hit.png",
        jump: "Medieval Warrior Pack 2/Sprites/Jump.png"
    },
    "Medieval Warrior Pack 3": {
        idle: "Medieval Warrior Pack 3/Sprites/Idle.png",
        run: "Medieval Warrior Pack 3/Sprites/Run.png",
        attack1: "Medieval Warrior Pack 3/Sprites/Attack1.png",
        attack2: "Medieval Warrior Pack 3/Sprites/Attack2.png",
        attack3: "Medieval Warrior Pack 3/Sprites/Attack3.png",
        death: "Medieval Warrior Pack 3/Sprites/Death.png",
        fall: "Medieval Warrior Pack 3/Sprites/Fall.png",
        getHit: "Medieval Warrior Pack 3/Sprites/Get Hit.png",
        jump: "Medieval Warrior Pack 3/Sprites/Jump.png"
    },
    "Huntress": {
        idle: "Huntress/Sprites/Idle.png",
        run: "Huntress/Sprites/Run.png",
        attack1: "Huntress/Sprites/Attack1.png",
        attack2: "Huntress/Sprites/Attack2.png",
        attack3: "Huntress/Sprites/Attack3.png",
        death: "Huntress/Sprites/Death.png",
        fall: "Huntress/Sprites/Fall.png",
        getHit: "Huntress/Sprites/Take hit.png",
        jump: "Huntress/Sprites/Jump.png"
    },
    "Huntress 2": {
        idle: "Huntress 2/Sprites/Character/Idle.png",
        run: "Huntress 2/Sprites/Character/Run.png",
        attack1: "Huntress 2/Sprites/Character/Attack.png",
        death: "Huntress 2/Sprites/Character/Death.png",
        fall: "Huntress 2/Sprites/Character/Fall.png",
        getHit: "Huntress 2/Sprites/Character/Get Hit.png",
        jump: "Huntress 2/Sprites/Character/Jump.png"
    },
    "Evil Wizard 3": {
        idle: "Evil Wizard 3/Sprites/Idle.png",
        run: "Evil Wizard 3/Sprites/Run.png",
        walk: "Evil Wizard 3/Sprites/Walk.png",
        attack1: "Evil Wizard 3/Sprites/Attack.png",
        death: "Evil Wizard 3/Sprites/Death.png",
        fall: "Evil Wizard 3/Sprites/Fall.png",
        getHit: "Evil Wizard 3/Sprites/Get hit.png",
        jump: "Evil Wizard 3/Sprites/Jump.png"
    }
};
// Animation definitions
var AnimationType;
(function (AnimationType) {
    AnimationType[AnimationType["IDLE"] = 0] = "IDLE";
    AnimationType[AnimationType["RUN"] = 1] = "RUN";
    AnimationType[AnimationType["WALK"] = 2] = "WALK";
    AnimationType[AnimationType["ATTACK1"] = 3] = "ATTACK1";
    AnimationType[AnimationType["ATTACK2"] = 4] = "ATTACK2";
    AnimationType[AnimationType["ATTACK3"] = 5] = "ATTACK3";
    AnimationType[AnimationType["DEATH"] = 6] = "DEATH";
    AnimationType[AnimationType["FALL"] = 7] = "FALL";
    AnimationType[AnimationType["GET_HIT"] = 8] = "GET_HIT";
    AnimationType[AnimationType["BLOCK"] = 9] = "BLOCK";
})(AnimationType || (AnimationType = {}));
// Sprite frame loader for individual animation files
class SpriteFrameLoader {
    constructor() {
        this.images = new Map();
        this.loadingPromises = new Map();
    }
    loadSprite(path) {
        if (this.images.has(path)) {
            return Promise.resolve(this.images.get(path));
        }
        if (this.loadingPromises.has(path)) {
            return this.loadingPromises.get(path).then(() => this.images.get(path) || null);
        }
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(path, img);
                resolve();
            };
            img.onerror = () => {
                console.warn("Failed to load sprite:", path);
                resolve(); // Resolve anyway to not block
            };
            img.src = path;
        });
        this.loadingPromises.set(path, promise);
        return promise.then(() => this.images.get(path) || null);
    }
    getSprite(path) {
        return this.images.get(path) || null;
    }
    isLoaded(path) {
        return this.images.has(path);
    }
}
// Global sprite loader
const spriteLoader = new SpriteFrameLoader();
// Helper function to get frame count from a sprite sheet image
function getFrameCountFromSprite(img) {
    // Most sprite sheets are horizontal strips, estimate frame count
    // Assuming each frame is roughly square or slightly wider than tall
    const estimatedFrameWidth = img.height; // Assume frames are roughly square
    return Math.max(1, Math.floor(img.width / estimatedFrameWidth));
}
class SpriteAnimation {
    constructor(type, spritePath, frameDuration = 8, loop = true) {
        this.frameCount = 0;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.loop = true;
        this.frameWidth = 0;
        this.frameHeight = 0;
        this.type = type;
        this.spritePath = spritePath;
        this.frameDuration = frameDuration;
        this.loop = loop;
        // Load sprite and determine frame count
        if (spritePath) {
            spriteLoader.loadSprite(spritePath).then((img) => {
                if (img) {
                    // Estimate frame count (most sprite sheets are horizontal strips)
                    this.frameHeight = img.height;
                    this.frameWidth = img.height; // Assume square frames
                    this.frameCount = Math.max(1, Math.floor(img.width / this.frameWidth));
                }
            });
        }
    }
    update(speedMultiplier = 1.0) {
        const img = spriteLoader.getSprite(this.spritePath);
        if (!img)
            return;
        // Update frame count if not set yet
        if (this.frameCount === 0) {
            this.frameHeight = img.height;
            this.frameWidth = img.height;
            this.frameCount = Math.max(1, Math.floor(img.width / this.frameWidth));
        }
        const adjustedDuration = Math.max(1, Math.floor(this.frameDuration / speedMultiplier));
        this.frameTimer++;
        if (this.frameTimer >= adjustedDuration) {
            this.frameTimer = 0;
            this.currentFrame++;
            if (this.currentFrame >= this.frameCount) {
                if (this.loop) {
                    this.currentFrame = 0;
                }
                else {
                    this.currentFrame = this.frameCount - 1;
                }
            }
        }
    }
    reset() {
        this.currentFrame = 0;
        this.frameTimer = 0;
    }
    getCurrentFrameX() {
        return this.currentFrame * this.frameWidth;
    }
    getFrameWidth() {
        return this.frameWidth || 64; // Default fallback
    }
    getFrameHeight() {
        return this.frameHeight || 64; // Default fallback
    }
    getSprite() {
        return spriteLoader.getSprite(this.spritePath);
    }
}
// --- Interfaces & Types for Structure ---
// Game States
var GameState;
(function (GameState) {
    GameState[GameState["MENU"] = 0] = "MENU";
    GameState[GameState["CHARACTER_SELECT_P1"] = 1] = "CHARACTER_SELECT_P1";
    GameState[GameState["CHARACTER_SELECT_P2"] = 2] = "CHARACTER_SELECT_P2";
    GameState[GameState["CHARACTER_DETAILS"] = 3] = "CHARACTER_DETAILS";
    GameState[GameState["ARENA_SELECT"] = 4] = "ARENA_SELECT";
    GameState[GameState["ARENA_DETAILS"] = 5] = "ARENA_DETAILS";
    GameState[GameState["FIGHTING"] = 6] = "FIGHTING";
    GameState[GameState["PAUSED"] = 7] = "PAUSED";
    GameState[GameState["ROUND_END"] = 8] = "ROUND_END";
    GameState[GameState["GAME_OVER"] = 9] = "GAME_OVER";
    GameState[GameState["HELP"] = 10] = "HELP";
    /** One-time quick controls before first fight (skipped after localStorage flag). */
    GameState[GameState["CONTROLS_INTRO"] = 11] = "CONTROLS_INTRO";
})(GameState || (GameState = {}));
// Game Modes enum
var GameMode;
(function (GameMode) {
    GameMode[GameMode["OneVsOneAI"] = 0] = "OneVsOneAI";
    GameMode[GameMode["OneVsOnePvP"] = 1] = "OneVsOnePvP";
    GameMode[GameMode["OneVsTwo"] = 2] = "OneVsTwo";
    GameMode[GameMode["TwoVsTwo"] = 3] = "TwoVsTwo";
})(GameMode || (GameMode = {}));
// Fighter States - Enhanced with Ground/Air distinction
var FighterState;
(function (FighterState) {
    FighterState[FighterState["IDLE"] = 0] = "IDLE";
    FighterState[FighterState["MOVING"] = 1] = "MOVING";
    FighterState[FighterState["ATTACKING"] = 2] = "ATTACKING";
    FighterState[FighterState["STUNNED"] = 3] = "STUNNED";
    FighterState[FighterState["BLOCKING"] = 4] = "BLOCKING";
    FighterState[FighterState["DEFEATED"] = 5] = "DEFEATED";
    // Ground/Air states
    FighterState[FighterState["GROUNDED"] = 10] = "GROUNDED";
    FighterState[FighterState["AIRBORNE"] = 11] = "AIRBORNE";
    FighterState[FighterState["LANDING"] = 12] = "LANDING"; // Transitioning from air to ground
})(FighterState || (FighterState = {}));
// Ground detection and physics constants
const GROUND_DETECTION_RAY_LENGTH = 10; // Pixels to check below feet
const GROUND_SNAP_THRESHOLD = 5; // Max distance to snap to ground
const GRAVITY = 0.8; // Gravity force (base coords per frame)
const JUMP_VELOCITY = -12; // Initial upward velocity (base coords per frame)
const GROUND_FRICTION = 0.85; // Friction when grounded
const AIR_FRICTION = 0.95; // Friction when airborne (less resistance)
// Attack Types
var AttackType;
(function (AttackType) {
    AttackType[AttackType["PUNCH_LIGHT"] = 0] = "PUNCH_LIGHT";
    AttackType[AttackType["KICK_HEAVY"] = 1] = "KICK_HEAVY";
    AttackType[AttackType["FINISHER"] = 2] = "FINISHER";
})(AttackType || (AttackType = {}));
var AttackPhase;
(function (AttackPhase) {
    AttackPhase[AttackPhase["STARTUP"] = 0] = "STARTUP";
    AttackPhase[AttackPhase["ACTIVE"] = 1] = "ACTIVE";
    AttackPhase[AttackPhase["RECOVERY"] = 2] = "RECOVERY";
})(AttackPhase || (AttackPhase = {}));
// --- The Roster Data Structure (The "Codex" part) ---
// Auto-pull fighters from sprite mappings so new sprite sets
// are automatically available in roster select.
const AVAILABLE_CHARACTERS = Object.keys(CHARACTER_SPRITE_PATHS);
const ARENA_SPRITESHEET_PATH = "IMG_4822.png";
const ARENA_COLUMNS = 4;
const ARENA_ROWS = 3;
const ARENA_COUNT = ARENA_COLUMNS * ARENA_ROWS;
/**
 * Human-readable names for each arena tile on `ARENA_SPRITESHEET_PATH`, row-major (same order as thumbnails: left→right, top→bottom).
 * Edit these strings — keep the list length equal to `ARENA_COUNT` (currently 12).
 */
const ARENA_NAMES = [
    "AYY ITS HOT HERE", "WOW A GLADIATOR", "WANNA READ ABOUT MAGIC", "DIAMONDS ARE HARD",
    "AYYYY IS THIS HELL", "DAMN A SACRIFICE", "AHHH A PORTAL", "BIG RUBBY I THINK?",
    "NO WATER HERE", "SHIT WHATS MY FORTUNE", "MAN ANOTHER SUMMONING", "THE FLOOR IS LAVA",
];
function getArenaDisplayName(index) {
    const name = ARENA_NAMES[index];
    return name !== undefined && name.length > 0 ? name : `Arena ${index + 1}`;
}
const ROSTER_NAME_OVERRIDES = {
    "Medieval Warrior Pack 2": "Medieval Warrior",
    "Medieval Warrior Pack 3": "Medieval Warrior 3",
    "Evil Wizard 3": "Evil Wizard"
};
const ROSTER_TUNING = {
    "Fantasy Warrior": { baseSpeed: 3, basePower: 10, colorAccent: PALETTE.PASTEL_BLUE },
    "Martial Hero": { baseSpeed: 4, basePower: 9, colorAccent: PALETTE.PASTEL_PINK },
    "Martial Hero 2": { baseSpeed: 3, basePower: 11, colorAccent: PALETTE.PASTEL_GREEN },
    "Martial Hero 3": { baseSpeed: 4, basePower: 10, colorAccent: PALETTE.PASTEL_PURPLE },
    "Medieval Warrior Pack 2": { baseSpeed: 2, basePower: 12, colorAccent: PALETTE.PASTEL_YELLOW },
    "Medieval Warrior Pack 3": { baseSpeed: 3, basePower: 11, colorAccent: PALETTE.PASTEL_ORANGE },
    "Huntress": { baseSpeed: 5, basePower: 8, colorAccent: PALETTE.PASTEL_PINK },
    "Huntress 2": { baseSpeed: 4, basePower: 9, colorAccent: PALETTE.PASTEL_GREEN },
    "Evil Wizard 3": { baseSpeed: 3, basePower: 12, colorAccent: PALETTE.PASTEL_PURPLE },
};
const DEFAULT_ROSTER_TUNING = { baseSpeed: 3, basePower: 10, colorAccent: PALETTE.PASTEL_BLUE };
const FIGHTER_ROSTER = AVAILABLE_CHARACTERS.map((spriteKey, idx) => {
    var _a;
    const tuning = ROSTER_TUNING[spriteKey] || DEFAULT_ROSTER_TUNING;
    return {
        id: `f${idx + 1}`,
        name: ROSTER_NAME_OVERRIDES[spriteKey] || spriteKey,
        baseSpeed: tuning.baseSpeed,
        basePower: tuning.basePower,
        colorAccent: tuning.colorAccent,
        spriteKey,
        sizeScale: (_a = tuning.sizeScale) !== null && _a !== void 0 ? _a : 1,
    };
});
// --- Canonical Coordinate System & Collision Framework ---
//
// Matches the usual fighting-game split (2D AABBs — fast overlap tests, same idea as rect-vs-rect in articles):
// - Hitboxes: damage volumes, only on active frames of an attack (`AttackFrameData.hitboxes`).
// - Hurtboxes: where this character can be hit; per-frame in attacks, default body box otherwise
//   (`AttackFrameData.hurtboxes` + `getCurrentFrameCollisionBoxes()`).
// - Push / “collision” boxes (optional, not wired yet): smaller than hurtbox, keeps characters from
//   overlapping when you want depth separation — add `CollisionLayer.PUSH` + physics pass later.
//
// Boxes live in base space relative to the feet pivot; `transformCollisionBox()` → screen AABB each frame.
// Collision Layers
var CollisionLayer;
(function (CollisionLayer) {
    CollisionLayer[CollisionLayer["HIGH"] = 0] = "HIGH";
    CollisionLayer[CollisionLayer["MID"] = 1] = "MID";
    CollisionLayer[CollisionLayer["LOW"] = 2] = "LOW";
    CollisionLayer[CollisionLayer["THROW"] = 3] = "THROW";
    CollisionLayer[CollisionLayer["SCAN"] = 4] = "SCAN";
    CollisionLayer[CollisionLayer["PUSH"] = 5] = "PUSH";
})(CollisionLayer || (CollisionLayer = {}));
// Helper function to convert base coordinates to screen coordinates
function baseToScreen(baseValue) {
    return Math.round(baseValue * SCALE);
}
// Helper function to convert screen coordinates to base coordinates
function screenToBase(screenValue) {
    return screenValue / SCALE;
}
class FighterEntity {
    constructor(x, config, facingRight) {
        this.z = 0; // For jumps/airborne state (base coords)
        this.velocityX = 0;
        this.velocityY = 0;
        this.velocityZ = 0; // Vertical velocity for jumps
        // Dimensions in screen space (scaled)
        this.width = STANDARD_FIGHTER_WIDTH;
        this.height = STANDARD_FIGHTER_HEIGHT;
        // Foot pivot point offset (base coords) - distance from sprite bottom to feet
        this.footOffset = 0;
        this.facingRight = true;
        this.maxHp = 100;
        this.hp = 100;
        this.maxEnergy = 100;
        this.energy = 0;
        this.state = FighterState.IDLE;
        // Cooldowns and frame timers
        this.attackCooldown = 0;
        this.stunTimer = 0;
        /** Frames of hit stun applied by the last hit (for HUD bar drain). */
        this.hitStunDisplayFrames = 0;
        /** Hits landed in the current combo; increments only if defender was already in hit stun. */
        this.comboCounter = 0;
        this.frameTimer = 0; // Current frame of action
        this.currentAttackType = null;
        this.currentAttackDef = null;
        // One-hit-per-attack tracking
        this.alreadyHitTargets = new Set();
        // Visual effects
        this.hitEffects = [];
        this.animFrame = 0; // Animation frame counter
        // Ground state and physics
        this.isGrounded = true;
        this.groundDistance = 0; // Distance to ground (for detection)
        this.lastGroundCheck = 0; // Frame counter for ground checks
        this.groundSnapActive = true; // Whether to snap to ground
        // Character mirroring state
        this.mirrorX = 0; // X position for mirroring calculations
        // Sprite-based animation
        this.currentAnimation = null;
        this.groundOffsetPx = 0;
        this.groundOffsetResolved = false;
        this.x = x;
        this.config = config;
        const s = config.sizeScale;
        this.width = Math.round(STANDARD_FIGHTER_WIDTH * s);
        this.height = Math.round(STANDARD_FIGHTER_HEIGHT * s);
        this.y = GROUND_Y - this.height;
        this.facingRight = facingRight;
        // Get sprite paths for this character
        const sprites = CHARACTER_SPRITE_PATHS[config.spriteKey];
        if (!sprites) {
            console.error(`No sprites found for: ${config.spriteKey}`);
        }
        // Initialize animations with individual sprite files
        // Use run for movement, fallback to idle if run not available
        const runPath = (sprites === null || sprites === void 0 ? void 0 : sprites.run) || (sprites === null || sprites === void 0 ? void 0 : sprites.idle) || "";
        const walkPath = (sprites === null || sprites === void 0 ? void 0 : sprites.walk) || runPath;
        this.idleAnimation = new SpriteAnimation(AnimationType.IDLE, (sprites === null || sprites === void 0 ? void 0 : sprites.idle) || "", 6, true);
        this.walkRightAnimation = new SpriteAnimation(AnimationType.RUN, runPath, 3, true);
        this.walkLeftAnimation = new SpriteAnimation(AnimationType.RUN, runPath, 3, true); // Same sprite, will flip
        this.hurtAnimation = new SpriteAnimation(AnimationType.GET_HIT, (sprites === null || sprites === void 0 ? void 0 : sprites.getHit) || (sprites === null || sprites === void 0 ? void 0 : sprites.fall) || "", 6, false);
        this.deathAnimation = new SpriteAnimation(AnimationType.DEATH, (sprites === null || sprites === void 0 ? void 0 : sprites.death) || "", 12, false);
        this.blockAnimation = new SpriteAnimation(AnimationType.BLOCK, (sprites === null || sprites === void 0 ? void 0 : sprites.idle) || "", 8, true); // Use idle for block
        this.jumpAnimation = new SpriteAnimation(AnimationType.FALL, (sprites === null || sprites === void 0 ? void 0 : sprites.jump) || (sprites === null || sprites === void 0 ? void 0 : sprites.fall) || (sprites === null || sprites === void 0 ? void 0 : sprites.idle) || "", 8, true);
        this.attack1Animation = new SpriteAnimation(AnimationType.ATTACK1, (sprites === null || sprites === void 0 ? void 0 : sprites.attack1) || (sprites === null || sprites === void 0 ? void 0 : sprites.attack2) || (sprites === null || sprites === void 0 ? void 0 : sprites.attack3) || "", 6, false);
        this.attack2Animation = new SpriteAnimation(AnimationType.ATTACK2, (sprites === null || sprites === void 0 ? void 0 : sprites.attack2) || (sprites === null || sprites === void 0 ? void 0 : sprites.attack1) || "", 6, false);
        this.attack3Animation = new SpriteAnimation(AnimationType.ATTACK3, (sprites === null || sprites === void 0 ? void 0 : sprites.attack3) || (sprites === null || sprites === void 0 ? void 0 : sprites.attack1) || "", 8, false);
        // Preload all sprites
        if (sprites) {
            Object.values(sprites).forEach(path => {
                if (path)
                    spriteLoader.loadSprite(path);
            });
        }
        // Start with idle animation
        this.currentAnimation = this.idleAnimation;
    }
    updateAnimation() {
        // Determine which animation to use based on state
        let targetAnimation = null;
        if (this.state === FighterState.DEFEATED) {
            targetAnimation = this.deathAnimation;
        }
        else if (this.state === FighterState.STUNNED) {
            targetAnimation = this.hurtAnimation;
        }
        else if (this.state === FighterState.BLOCKING) {
            targetAnimation = this.blockAnimation;
        }
        else if (this.state === FighterState.AIRBORNE || this.state === FighterState.LANDING) {
            targetAnimation = this.jumpAnimation;
        }
        else if (this.state === FighterState.ATTACKING) {
            // Select attack animation based on attack type
            if (this.currentAttackType === AttackType.FINISHER) {
                targetAnimation = this.attack3Animation;
            }
            else if (this.currentAttackType === AttackType.KICK_HEAVY) {
                targetAnimation = this.attack2Animation;
            }
            else {
                targetAnimation = this.attack1Animation;
            }
            // Reset attack animation when starting
            if (this.frameTimer === 0) {
                targetAnimation.reset();
            }
        }
        else if (this.state === FighterState.MOVING) {
            targetAnimation = this.facingRight ? this.walkRightAnimation : this.walkLeftAnimation;
        }
        else {
            targetAnimation = this.idleAnimation;
        }
        // Switch animation if needed
        if (this.currentAnimation !== targetAnimation) {
            this.currentAnimation = targetAnimation;
            if (targetAnimation) {
                targetAnimation.reset();
            }
        }
        // Update current animation with speed multiplier based on fighter's movement speed
        if (this.currentAnimation) {
            // Faster fighters animate faster - makes movement feel more dynamic and responsive
            let speedMultiplier = 1.0;
            if (this.state === FighterState.MOVING) {
                // Scale animation speed based on baseSpeed (range 2-5, normalize to 1.0-1.8)
                // This makes faster fighters have faster walk cycles, more dynamic feel
                speedMultiplier = 0.8 + (this.config.baseSpeed / 5) * 1.0;
            }
            this.currentAnimation.update(speedMultiplier);
        }
    }
    // Ground Detection System - Physics-based raycast
    checkGround() {
        // Raycast downward from feet position
        const feetX = this.x + this.width / 2;
        const feetY = GROUND_Y; // Current feet Y position
        // Check distance to ground plane
        const groundDistance = Math.abs(feetY - GROUND_Y);
        // Consider grounded if within threshold
        const isGrounded = groundDistance <= GROUND_SNAP_THRESHOLD &&
            this.velocityZ === 0 &&
            this.z === 0;
        return { isGrounded, distance: groundDistance };
    }
    // Snap character to ground if close enough
    snapToGround() {
        if (!this.groundSnapActive)
            return;
        const groundCheck = this.checkGround();
        this.groundDistance = groundCheck.distance;
        // If close to ground and not moving vertically, snap to it
        if (groundCheck.distance <= GROUND_SNAP_THRESHOLD && this.velocityZ === 0) {
            this.z = 0;
            this.velocityZ = 0;
            this.isGrounded = true;
            // Update state to grounded if was airborne
            if (this.state === FighterState.AIRBORNE) {
                this.state = FighterState.LANDING;
            }
            else if (this.state === FighterState.LANDING) {
                // Transition from landing to appropriate ground state
                if (this.velocityX !== 0) {
                    this.state = FighterState.MOVING;
                }
                else {
                    this.state = FighterState.IDLE;
                }
            }
        }
        else if (groundCheck.distance > GROUND_SNAP_THRESHOLD || this.velocityZ !== 0) {
            // Not grounded
            this.isGrounded = false;
            if (this.state !== FighterState.AIRBORNE &&
                this.state !== FighterState.ATTACKING &&
                this.state !== FighterState.STUNNED &&
                this.state !== FighterState.DEFEATED) {
                this.state = FighterState.AIRBORNE;
            }
        }
    }
    // Apply gravity and physics
    applyPhysics() {
        // Apply gravity if airborne
        if (!this.isGrounded) {
            this.velocityZ += GRAVITY;
            this.z += this.velocityZ;
            // Check if we've hit the ground
            if (this.z >= 0) {
                this.z = 0;
                this.velocityZ = 0;
                this.snapToGround();
            }
        }
        // Apply friction based on ground state
        if (this.isGrounded) {
            this.velocityX *= GROUND_FRICTION;
        }
        else {
            this.velocityX *= AIR_FRICTION;
        }
    }
    // Character mirroring - automatically flip when crossing sides
    updateMirroring(opponent) {
        // Keep each fighter facing the opponent in neutral/stun states.
        // During attacks we keep facing locked to preserve move direction.
        if (this.state !== FighterState.ATTACKING) {
            this.facingRight = this.x < opponent.x;
        }
        this.mirrorX = this.x;
    }
    /** Crouch guard only (no stand / back-to-block). */
    shouldEnterBlock(input) {
        return this.isGrounded && input.down;
    }
    update(input, opponent, inputHandler = null) {
        if (this.state === FighterState.DEFEATED) {
            this.updateAnimation();
            return;
        }
        // Ground detection and physics (run every frame)
        this.snapToGround();
        this.applyPhysics();
        // Character mirroring (maintain consistent controls)
        this.updateMirroring(opponent);
        // Handle Stun (hit stun: unactionable until timer reaches zero; combo drops when we recover)
        if (this.stunTimer > 0) {
            this.state = FighterState.STUNNED;
            this.stunTimer--;
            if (this.stunTimer <= 0) {
                this.state = FighterState.IDLE;
                this.hitStunDisplayFrames = 0;
                opponent.comboCounter = 0;
            }
            // Apply friction while stunned
            this.velocityX *= 0.8;
            this.x += this.velocityX;
            // Enforce screen boundaries during stun
            const minX = 0;
            const maxX = SCREEN_WIDTH - this.width;
            this.x = Math.max(minX, Math.min(maxX, this.x));
            this.updateAnimation();
            return;
        }
        // Handle Attack frames - collision is checked in new system during active frames
        if (this.state === FighterState.ATTACKING) {
            this.frameTimer++;
            this.velocityX = 0; // Stop moving while attacking
            // Check collision every frame during active frames (new canonical system)
            if (this.currentAttackDef) {
                if (this.getAttackPhase() === AttackPhase.ACTIVE) {
                    this.checkAttackCollision(opponent);
                }
            }
            // End attack after animation completes
            if (this.currentAttackDef && this.frameTimer >= this.currentAttackDef.totalFrames) {
                this.state = FighterState.IDLE;
                this.attackCooldown = this.currentAttackDef.recoveryFrames;
                this.currentAttackType = null;
                this.currentAttackDef = null;
                this.alreadyHitTargets.clear();
            }
            this.animFrame++;
            this.updateAnimation();
            return;
        }
        // Cooldown recovery
        if (this.attackCooldown > 0)
            this.attackCooldown--;
        // --- Blocking: crouch (down) only ---
        if (this.shouldEnterBlock(input)) {
            this.state = FighterState.BLOCKING;
            this.velocityX = 0;
            this.animFrame++;
            this.updateAnimation();
            return;
        }
        // --- Jump start ---
        if (this.isGrounded && input.up) {
            this.isGrounded = false;
            this.state = FighterState.AIRBORNE;
            this.velocityZ = JUMP_VELOCITY;
            this.z += this.velocityZ;
        }
        // --- Movement & Neutral State ---
        this.state = this.isGrounded ? FighterState.IDLE : FighterState.AIRBORNE;
        this.velocityX = 0;
        if (input.left) {
            // Scale movement speed for new resolution (old was 160px, new is 800px = 5x)
            this.velocityX = -this.config.baseSpeed * 5;
            this.facingRight = false;
            if (this.isGrounded)
                this.state = FighterState.MOVING;
            this.animFrame++;
        }
        else if (input.right) {
            // Scale movement speed for new resolution
            this.velocityX = this.config.baseSpeed * 5;
            this.facingRight = true;
            if (this.isGrounded)
                this.state = FighterState.MOVING;
            this.animFrame++;
        }
        else {
            this.animFrame++;
        }
        // Apply movement (horizontal only - fighters stay on ground)
        this.x += this.velocityX;
        // Enforce screen boundaries - fighters can never go off screen
        const minX = 0;
        const maxX = SCREEN_WIDTH - this.width;
        this.x = Math.max(minX, Math.min(maxX, this.x));
        // Ensure fighter stays within bounds even after movement
        if (this.x < minX)
            this.x = minX;
        if (this.x > maxX)
            this.x = maxX;
        // Always maintain ground alignment - fighters never move vertically
        // All fighters' bottom edge aligns to GROUND_Y = 500
        // The draw() method will set the correct position based on actual sprite dimensions
        // We don't set Y here to avoid conflicts - draw() handles it every frame
        // --- Attacks ---
        if (this.attackCooldown === 0) {
            const requestedAttack = (inputHandler === null || inputHandler === void 0 ? void 0 : inputHandler.consumeAttackRequest(this.facingRight, this.energy >= this.maxEnergy)) || null;
            if (requestedAttack !== null) {
                this.startAttack(requestedAttack);
            }
            else {
                // Fallback direct inputs for non-buffered controllers/AI.
                if (input.btnA && input.btnB && this.energy >= this.maxEnergy)
                    this.startAttack(AttackType.FINISHER);
                else if (input.btnA)
                    this.startAttack(AttackType.PUNCH_LIGHT);
                else if (input.btnB)
                    this.startAttack(AttackType.KICK_HEAVY);
            }
        }
        // Update animation
        this.updateAnimation();
    }
    // Get attack definition for a given attack type
    getAttackDefinition(type) {
        const basePower = this.config.basePower;
        const baseKnockback = 25; // Base knockback in base coords
        switch (type) {
            case AttackType.PUNCH_LIGHT:
                return {
                    type: AttackType.PUNCH_LIGHT,
                    activeStart: 5,
                    activeEnd: 10,
                    startupFrames: 5,
                    activeFrames: 6,
                    recoveryFrames: 10,
                    totalFrames: 21,
                    frameData: this.generateDefaultFrameData(AttackType.PUNCH_LIGHT, 21),
                    damage: basePower,
                    stunTime: 15,
                    knockback: baseKnockback,
                    energyCost: 0,
                    energyGain: 10,
                    canBeBlocked: true,
                    layer: CollisionLayer.MID
                };
            case AttackType.KICK_HEAVY:
                return {
                    type: AttackType.KICK_HEAVY,
                    activeStart: 6,
                    activeEnd: 12,
                    startupFrames: 6,
                    activeFrames: 7,
                    recoveryFrames: 12,
                    totalFrames: 25,
                    frameData: this.generateDefaultFrameData(AttackType.KICK_HEAVY, 25),
                    damage: Math.floor(basePower * 1.2),
                    stunTime: 20,
                    knockback: baseKnockback * 1.5,
                    energyCost: 0,
                    energyGain: 15,
                    canBeBlocked: true,
                    layer: CollisionLayer.MID
                };
            case AttackType.FINISHER:
                return {
                    type: AttackType.FINISHER,
                    activeStart: 8,
                    activeEnd: 15,
                    startupFrames: 8,
                    activeFrames: 8,
                    recoveryFrames: 16,
                    totalFrames: 32,
                    frameData: this.generateDefaultFrameData(AttackType.FINISHER, 32),
                    damage: 40,
                    stunTime: 60,
                    knockback: baseKnockback * 3,
                    energyCost: this.maxEnergy,
                    energyGain: 0,
                    canBeBlocked: false, // Finishers can't be fully blocked
                    layer: CollisionLayer.HIGH
                };
            default:
                return this.getAttackDefinition(AttackType.PUNCH_LIGHT);
        }
    }
    // Generate default frame data for attacks (can be customized per character later)
    generateDefaultFrameData(type, totalFrames) {
        const frames = [];
        const bodyHeightBase = screenToBase(this.height);
        const bodyWidthBase = screenToBase(this.width);
        const hurtboxWidthBase = bodyWidthBase * 0.65;
        const hurtboxX = -hurtboxWidthBase / 2;
        const activeStart = type === AttackType.FINISHER ? 8 : (type === AttackType.KICK_HEAVY ? 6 : 5);
        const activeEnd = type === AttackType.FINISHER ? 15 : (type === AttackType.KICK_HEAVY ? 12 : 10);
        // Weapon depth in screen px → base (was ~0.7× body width in base → ~200px+ “ghost” range).
        const reachMinPx = type === AttackType.FINISHER ? 56 : (type === AttackType.KICK_HEAVY ? 48 : 40);
        const reachMaxPx = type === AttackType.FINISHER ? 86 : (type === AttackType.KICK_HEAVY ? 74 : 62);
        const reachMinBase = screenToBase(reachMinPx);
        const reachMaxBase = screenToBase(reachMaxPx);
        const baseHeight = type === AttackType.KICK_HEAVY ? bodyHeightBase * 0.3 : bodyHeightBase * 0.34;
        const hitboxY = type === AttackType.KICK_HEAVY ? -bodyHeightBase * 0.45 : -bodyHeightBase * 0.72;
        // One entry per attack frame (must match totalFrames — e.g. FINISHER 32, not hardcoded 20).
        for (let frame = 0; frame < totalFrames; frame++) {
            const hitboxes = [];
            const hurtboxes = [];
            // Add hitbox during active frames
            if (frame >= activeStart && frame <= activeEnd) {
                const t = (frame - activeStart) / Math.max(1, activeEnd - activeStart);
                const reach = reachMinBase + (reachMaxBase - reachMinBase) * (0.88 + 0.12 * Math.sin(Math.PI * t));
                const hitboxHeight = baseHeight * (0.9 + 0.2 * Math.sin(Math.PI * t));
                // IMPORTANT: Frame data is authored in canonical "facing right" space.
                // transformCollisionBox() handles left-facing mirroring.
                // x = 0: leading edge from feet-center (forward extension), not inset into the body.
                const hitboxX = screenToBase(this.width / 2);
                hitboxes.push({
                    x: hitboxX,
                    y: hitboxY,
                    width: reach,
                    height: hitboxHeight,
                    layer: type === AttackType.FINISHER ? CollisionLayer.HIGH : CollisionLayer.MID
                });
            }
            // Always have a hurtbox (fighter's body)
            hurtboxes.push({
                x: hurtboxX,
                y: -bodyHeightBase,
                width: hurtboxWidthBase,
                height: bodyHeightBase,
                layer: CollisionLayer.SCAN
            });
            frames.push({ frame, hitboxes, hurtboxes });
        }
        return frames;
    }
    startAttack(type) {
        this.state = FighterState.ATTACKING;
        this.frameTimer = 0;
        this.currentAttackType = type;
        this.currentAttackDef = this.getAttackDefinition(type);
        this.alreadyHitTargets.clear(); // Reset hit tracking
        this.animFrame = 0;
        console.log(`${this.config.name} used ${AttackType[type]}`);
        if (type === AttackType.FINISHER) {
            this.energy = 0; // Reset energy
        }
    }
    getAttackPhase() {
        if (!this.currentAttackDef || this.state !== FighterState.ATTACKING)
            return null;
        if (this.frameTimer < this.currentAttackDef.activeStart)
            return AttackPhase.STARTUP;
        if (this.frameTimer <= this.currentAttackDef.activeEnd)
            return AttackPhase.ACTIVE;
        return AttackPhase.RECOVERY;
    }
    /** Screen Y of feet line — must match sprite placement (GROUND_Y + trim + jump). */
    getFeetWorldY() {
        if (!this.groundOffsetResolved && this.idleAnimation.getSprite())
            this.resolveGroundOffset();
        return GROUND_Y + this.groundOffsetPx + baseToScreen(this.z);
    }
    // Transform collision box from base coords (relative to feet pivot) to world coords (screen space)
    transformCollisionBox(box) {
        const pivotX = this.x + this.width / 2;
        const pivotY = this.getFeetWorldY();
        // Transform box position (account for facing direction)
        let boxX = baseToScreen(box.x);
        if (!this.facingRight) {
            boxX = -boxX - baseToScreen(box.width); // Flip horizontally
        }
        const worldX = pivotX + boxX;
        const worldY = pivotY - baseToScreen(box.y); // Y is negative up, convert to screen coords
        const worldW = baseToScreen(box.width);
        const worldH = baseToScreen(box.height);
        return { x: worldX, y: worldY, w: worldW, h: worldH };
    }
    /**
     * Single tight AABB vs sprite box (inset). Handy for debug/UI; **hit resolution uses
     * `getHurtboxesWorld()`** so defender state matches per-frame hurtboxes when attacking.
     */
    getBodyHurtboxWorld() {
        const feetY = this.getFeetWorldY();
        const topY = feetY - this.height;
        const insetX = this.width * 0.2;
        const insetTop = this.height * 0.15;
        const insetBottom = this.height * 0.05;
        return {
            x: this.x + insetX,
            y: topY + insetTop,
            w: this.width - insetX * 2,
            h: this.height - insetTop - insetBottom
        };
    }
    /** Defender hurtboxes this frame in screen space (one or more AABBs — any overlap with a hitbox counts). */
    getHurtboxesWorld() {
        const { hurtboxes } = this.getCurrentFrameCollisionBoxes();
        if (hurtboxes.length === 0)
            return [this.getBodyHurtboxWorld()];
        return hurtboxes.map((hb) => this.transformCollisionBox(hb));
    }
    /** Axis-aligned rectangle overlap (standard 2D fighting-game hit vs hurt test). */
    checkAABBCollision(box1, box2) {
        return box1.x < box2.x + box2.w &&
            box1.x + box1.w > box2.x &&
            box1.y < box2.y + box2.h &&
            box1.y + box1.h > box2.y;
    }
    // Get current frame's hitboxes and hurtboxes
    getCurrentFrameCollisionBoxes() {
        const bodyHeightBase = screenToBase(this.height);
        const bodyWidthBase = screenToBase(this.width * 0.65);
        const bodyOffsetX = -bodyWidthBase / 2;
        if (!this.currentAttackDef || this.state !== FighterState.ATTACKING) {
            // Default hurtbox when not attacking
            return {
                hitboxes: [],
                hurtboxes: [{
                        x: bodyOffsetX,
                        y: -bodyHeightBase,
                        width: bodyWidthBase,
                        height: bodyHeightBase,
                        layer: CollisionLayer.SCAN
                    }]
            };
        }
        const currentFrame = this.frameTimer;
        const frameData = this.currentAttackDef.frameData.find((fd) => fd.frame === currentFrame);
        if (frameData) {
            return { hitboxes: frameData.hitboxes, hurtboxes: frameData.hurtboxes };
        }
        // Fallback to default
        return {
            hitboxes: [],
            hurtboxes: [{
                    x: bodyOffsetX,
                    y: -bodyHeightBase,
                    width: bodyWidthBase,
                    height: bodyHeightBase,
                    layer: CollisionLayer.SCAN
                }]
        };
    }
    checkAttackCollision(opponent) {
        // Only check during active frames
        if (!this.currentAttackDef ||
            this.frameTimer < this.currentAttackDef.activeStart ||
            this.frameTimer > this.currentAttackDef.activeEnd) {
            return;
        }
        // One-hit-per-attack: skip if already hit this target
        if (this.alreadyHitTargets.has(opponent)) {
            return;
        }
        // Melee sanity: skip if forward faces are farther apart than longest possible hit extension.
        const maxWeaponPx = 100;
        const myR = this.x + this.width;
        const opL = opponent.x;
        const opR = opponent.x + opponent.width;
        const myL = this.x;
        const gap = this.facingRight ? opL - myR : myL - opR;
        if (gap > maxWeaponPx + 12)
            return;
        const { hitboxes } = this.getCurrentFrameCollisionBoxes();
        const defenderHurts = opponent.getHurtboxesWorld();
        for (const hitbox of hitboxes) {
            const worldHitbox = this.transformCollisionBox(hitbox);
            for (const hurt of defenderHurts) {
                if (!this.checkAABBCollision(worldHitbox, hurt))
                    continue;
                const overlapLeft = Math.max(worldHitbox.x, hurt.x);
                const overlapTop = Math.max(worldHitbox.y, hurt.y);
                const overlapRight = Math.min(worldHitbox.x + worldHitbox.w, hurt.x + hurt.w);
                const overlapBottom = Math.min(worldHitbox.y + worldHitbox.h, hurt.y + hurt.h);
                const overlapW = overlapRight - overlapLeft;
                const overlapH = overlapBottom - overlapTop;
                if (overlapW <= 0 || overlapH <= 0)
                    continue;
                const impactX = overlapLeft + overlapW / 2;
                const impactY = overlapTop + overlapH / 2;
                this.processHit(opponent, impactX, impactY);
                this.alreadyHitTargets.add(opponent);
                return;
            }
        }
    }
    processHit(opponent, impactX, impactY) {
        var _a, _b;
        if (!this.currentAttackDef)
            return;
        const attackDef = this.currentAttackDef;
        // Check if opponent is blocking
        const isBlocking = opponent.state === FighterState.BLOCKING;
        const isFacingAttacker = (opponent.facingRight && this.x > opponent.x) || (!opponent.facingRight && this.x < opponent.x);
        if (isBlocking && isFacingAttacker && attackDef.canBeBlocked) {
            // BLOCKED — breaks the attacker's combo string
            this.comboCounter = 0;
            let blockedDamage = Math.floor(attackDef.damage * 0.2); // 20% chip damage
            let energyGain = Math.floor(attackDef.energyGain * 0.5); // Less energy for blocked hits
            // Finishers can't be fully blocked
            if (attackDef.type === AttackType.FINISHER) {
                blockedDamage = Math.floor(attackDef.damage * 0.5); // 50% damage even when blocked
                opponent.takeDamage(blockedDamage, 5, 0); // Small stun, no knockback
            }
            else {
                opponent.takeDamage(blockedDamage, 0, 0); // No stun, no knockback
            }
            if (blockedDamage > 0)
                (_a = this.onHitDealt) === null || _a === void 0 ? void 0 : _a.call(this);
            this.energy = Math.min(this.maxEnergy, this.energy + energyGain);
            // Add block effect
            opponent.hitEffects.push({ x: impactX, y: impactY, life: 8, maxLife: 8, blocked: true });
            console.log(`${opponent.config.name} blocked the attack!`);
        }
        else {
            // HIT CONFIRMED — combo counts only while defender remains in hit stun
            const defenderInHitstun = opponent.stunTimer > 0;
            if (defenderInHitstun)
                this.comboCounter++;
            else
                this.comboCounter = 1;
            const knockbackScreen = baseToScreen(attackDef.knockback);
            const knockbackX = this.facingRight ? knockbackScreen : -knockbackScreen;
            opponent.takeDamage(attackDef.damage, attackDef.stunTime, knockbackX);
            (_b = this.onHitDealt) === null || _b === void 0 ? void 0 : _b.call(this);
            this.energy = Math.min(this.maxEnergy, this.energy + attackDef.energyGain);
            // Add hit effect
            opponent.hitEffects.push({ x: impactX, y: impactY, life: 10, maxLife: 10 });
            console.log(`${this.config.name} hit ${opponent.config.name} for ${attackDef.damage} damage!`);
        }
    }
    takeDamage(amount, stunFrames, knockbackX) {
        var _a;
        if (this.state === FighterState.DEFEATED)
            return;
        if (amount > 0) {
            (_a = this.onHitTaken) === null || _a === void 0 ? void 0 : _a.call(this);
            this.comboCounter = 0;
        }
        this.hp = Math.max(0, this.hp - amount);
        this.stunTimer = stunFrames;
        if (stunFrames > 0)
            this.hitStunDisplayFrames = stunFrames;
        this.velocityX = knockbackX;
        // Apply knockback but enforce boundaries immediately
        this.x += this.velocityX;
        const minX = 0;
        const maxX = SCREEN_WIDTH - this.width;
        this.x = Math.max(minX, Math.min(maxX, this.x));
        // Stop knockback if we hit a boundary
        if (this.x <= minX || this.x >= maxX) {
            this.velocityX = 0;
        }
        console.log(`${this.config.name} hit! HP: ${this.hp}`);
        if (this.hp === 0) {
            this.state = FighterState.DEFEATED;
        }
    }
    updateEffects() {
        // Update hit effects
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            this.hitEffects[i].life--;
            if (this.hitEffects[i].life <= 0) {
                this.hitEffects.splice(i, 1);
            }
        }
    }
    /** First animation in priority order that already has a loaded image (avoids huge “placeholder” rects). */
    getDrawableAnimation() {
        const tryAnim = (a) => {
            if (!a || !a.spritePath)
                return null;
            return spriteLoader.getSprite(a.spritePath) ? a : null;
        };
        return tryAnim(this.currentAnimation) || tryAnim(this.idleAnimation);
    }
    draw(ctx) {
        const centerX = this.x + this.width / 2;
        if (!this.groundOffsetResolved && this.idleAnimation.getSprite())
            this.resolveGroundOffset();
        const feetY = this.getFeetWorldY();
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(centerX, feetY - 5, this.width / 3, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        const animDraw = this.getDrawableAnimation();
        if (animDraw) {
            const sprite = spriteLoader.getSprite(animDraw.spritePath);
            if (sprite) {
                if (!this.groundOffsetResolved) {
                    this.resolveGroundOffset();
                }
                const frameX = animDraw.getCurrentFrameX();
                const frameWidth = animDraw.getFrameWidth();
                const frameHeight = animDraw.getFrameHeight();
                const frameAspect = frameWidth / Math.max(1, frameHeight);
                const boxAspect = this.width / Math.max(1, this.height);
                let drawWidth = this.width;
                let drawHeight = this.height;
                if (frameAspect > boxAspect) {
                    drawHeight = Math.round(drawWidth / frameAspect);
                }
                else {
                    drawWidth = Math.round(drawHeight * frameAspect);
                }
                const drawX = this.x + Math.round((this.width - drawWidth) / 2);
                const drawY = GROUND_Y - drawHeight + this.groundOffsetPx + baseToScreen(this.z);
                this.y = GROUND_Y - this.height + this.groundOffsetPx + baseToScreen(this.z);
                this.isGrounded = (this.z === 0 && this.velocityZ === 0);
                const minX = 0;
                const maxX = SCREEN_WIDTH - this.width;
                if (this.x < minX)
                    this.x = minX;
                if (this.x > maxX)
                    this.x = maxX;
                const needsFlip = !this.facingRight;
                if (needsFlip) {
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(sprite, frameX, 0, frameWidth, frameHeight, -drawX - drawWidth, drawY, drawWidth, drawHeight);
                    ctx.restore();
                }
                else {
                    ctx.drawImage(sprite, frameX, 0, frameWidth, frameHeight, drawX, drawY, drawWidth, drawHeight);
                }
            }
        }
        // Draw hit/block effects - 16-bit style colorful
        for (const effect of this.hitEffects) {
            const alpha = effect.life / effect.maxLife;
            if (effect.blocked) {
                // Block effect - blue sparks
                ctx.fillStyle = PALETTE.ACCENT_BLUE;
                ctx.fillRect(effect.x - 5, effect.y - 5, 10, 10);
                ctx.fillStyle = PALETTE.PASTEL_BLUE;
                ctx.fillRect(effect.x - 3, effect.y - 3, 6, 6);
                ctx.fillStyle = PALETTE.WHITE;
                ctx.fillRect(effect.x - 1, effect.y - 1, 2, 2);
            }
            else {
                // Hit effect - red/yellow sparks
                ctx.fillStyle = PALETTE.ACCENT_RED;
                ctx.fillRect(effect.x - 4, effect.y - 4, 8, 8);
                ctx.fillStyle = PALETTE.PASTEL_ORANGE;
                ctx.fillRect(effect.x - 3, effect.y - 3, 6, 6);
                ctx.fillStyle = PALETTE.ACCENT_YELLOW;
                ctx.fillRect(effect.x - 2, effect.y - 2, 4, 4);
                ctx.fillStyle = PALETTE.WHITE;
                ctx.fillRect(Math.floor(effect.x - 1), Math.floor(effect.y - 1), 2, 2);
            }
        }
        // KO text - modern vector minimalist style
        if (this.state === FighterState.DEFEATED) {
            ctx.fillStyle = PALETTE.WHITE;
            ctx.strokeStyle = PALETTE.OUTLINE;
            ctx.lineWidth = 4;
            const koWidth = 80;
            const koHeight = 50;
            ctx.fillRect(centerX - koWidth / 2, this.y - koHeight - 10, koWidth, koHeight);
            ctx.strokeRect(centerX - koWidth / 2, this.y - koHeight - 10, koWidth, koHeight);
            ctx.fillStyle = PALETTE.BLACK;
            ctx.font = "bold 32px 'Arial', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("KO", centerX, this.y - koHeight / 2 - 10);
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
        }
    }
    static getSamplingContext() {
        if (!FighterEntity.groundSampleCanvas) {
            FighterEntity.groundSampleCanvas = document.createElement("canvas");
            FighterEntity.groundSampleCtx = FighterEntity.groundSampleCanvas.getContext("2d", { willReadFrequently: true });
        }
        return FighterEntity.groundSampleCtx;
    }
    computeBottomTransparentRows(img, frameX, frameWidth, frameHeight) {
        const sampleCtx = FighterEntity.getSamplingContext();
        if (!sampleCtx)
            return 0;
        try {
            const canvas = sampleCtx.canvas;
            canvas.width = frameWidth;
            canvas.height = frameHeight;
            sampleCtx.clearRect(0, 0, frameWidth, frameHeight);
            sampleCtx.drawImage(img, frameX, 0, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
            const imageData = sampleCtx.getImageData(0, 0, frameWidth, frameHeight).data;
            for (let y = frameHeight - 1; y >= 0; y--) {
                for (let x = 0; x < frameWidth; x++) {
                    const alpha = imageData[(y * frameWidth + x) * 4 + 3];
                    if (alpha > 16) {
                        return frameHeight - 1 - y;
                    }
                }
            }
        }
        catch (err) {
            return 0;
        }
        return 0;
    }
    resolveGroundOffset() {
        const idleSprite = this.idleAnimation.getSprite();
        if (!idleSprite)
            return;
        const frameHeight = idleSprite.height || 1;
        const frameWidth = frameHeight;
        const bottomTrim = this.computeBottomTransparentRows(idleSprite, 0, frameWidth, frameHeight);
        const offsetScale = this.height / frameHeight;
        // Keep auto-grounding conservative so fighters don't appear to hover.
        this.groundOffsetPx = Math.max(-4, Math.min(16, Math.round(bottomTrim * offsetScale)));
        this.groundOffsetResolved = true;
    }
}
FighterEntity.groundSampleCanvas = null;
FighterEntity.groundSampleCtx = null;
// ─── Types ──────────────────────────────────────────────────────────────────
// ─── InputHandler ────────────────────────────────────────────────────────────
/** Key → action mappings for each player configuration. */
const P1_KEY_MAP = {
    w: "up", W: "up", ArrowUp: "up",
    s: "down", S: "down", ArrowDown: "down",
    a: "left", A: "left", ArrowLeft: "left",
    d: "right", D: "right", ArrowRight: "right",
    f: "btnA", F: "btnA",
    g: "btnB", G: "btnB",
};
const P2_KEY_MAP = {
    ArrowUp: "up", ArrowDown: "down",
    ArrowLeft: "left", ArrowRight: "right",
    Numpad1: "btnA", "1": "btnA",
    Numpad2: "btnB", "2": "btnB",
};
const SHARED_KEY_MAP = {
    h: "help", H: "help", "?": "help",
    Escape: "pause", Esc: "pause",
    Enter: "btnA",
};
function makeEmptyState() {
    return { up: false, down: false, left: false, right: false,
        btnA: false, btnB: false, help: false, pause: false };
}
class InputHandler {
    /**
     * @param isPlayer2 Key map when listening to keyboard.
     * @param attachKeyboard Set false for synthetic input (e.g. AI) so rising-edge / buffer logic still runs.
     */
    constructor(isPlayer2 = false, attachKeyboard = true) {
        this.keys = makeEmptyState();
        this.previousKeys = makeEmptyState();
        this.inputBuffer = [];
        this.maxBufferFrames = 30;
        this.playerMap = isPlayer2 ? P2_KEY_MAP : P1_KEY_MAP;
        if (attachKeyboard) {
            window.addEventListener("keydown", (e) => this.setKey(e.key, true));
            window.addEventListener("keyup", (e) => this.setKey(e.key, false));
        }
    }
    /** Apply external input (AI); does not touch previousKeys — use finalizeFrame at end of tick. */
    setKeysFromState(state) {
        this.keys.up = state.up;
        this.keys.down = state.down;
        this.keys.left = state.left;
        this.keys.right = state.right;
        this.keys.btnA = state.btnA;
        this.keys.btnB = state.btnB;
        this.keys.help = state.help;
        this.keys.pause = state.pause;
    }
    /** Clear held keys, edge state, and motion buffer (e.g. new round). */
    resetInputTracking() {
        this.keys = makeEmptyState();
        this.previousKeys = makeEmptyState();
        this.inputBuffer = [];
    }
    setKey(key, pressed) {
        const sharedAction = SHARED_KEY_MAP[key];
        if (sharedAction) {
            this.keys[sharedAction] = pressed;
            return;
        }
        const playerAction = this.playerMap[key];
        if (playerAction)
            this.keys[playerAction] = pressed;
    }
    updateFrame() {
        this.inputBuffer.push({
            direction: this.getDirectionCode(),
            btnA: this.keys.btnA,
            btnB: this.keys.btnB,
        });
        if (this.inputBuffer.length > this.maxBufferFrames)
            this.inputBuffer.shift();
    }
    finalizeFrame() {
        this.previousKeys = Object.assign({}, this.keys);
    }
    wasPressed(action) {
        return this.keys[action] && !this.previousKeys[action];
    }
    getDirectionCode() {
        const h = this.keys.left !== this.keys.right
            ? (this.keys.left ? "L" : "R") : "";
        const v = this.keys.up !== this.keys.down
            ? (this.keys.up ? "U" : "D") : "";
        return h || v ? `${v}${h}` : "N";
    }
    /**
     * Scans the recent input buffer for a quarter-circle-forward motion.
     * Accepts D → (D+forward) → forward within `lookbackFrames`.
     */
    detectQuarterCircleForward(facingRight, lookbackFrames = 15) {
        const recent = this.inputBuffer.slice(-Math.min(lookbackFrames, this.inputBuffer.length));
        if (recent.length < 3)
            return false;
        const fwd = facingRight ? "R" : "L";
        const dfwd = facingRight ? "DR" : "DL";
        // Single-pass state machine (reading forward in time)
        let stage = 0; // 0=need D, 1=need Dfwd, 2=need Fwd
        for (const { direction: dir } of recent) {
            switch (stage) {
                case 0:
                    if (dir === "D" || dir === dfwd)
                        stage = 1;
                    break;
                case 1:
                    if (dir === dfwd)
                        stage = 2;
                    break;
                case 2:
                    if (dir === fwd || dir === dfwd)
                        return true;
                    break;
            }
        }
        return false;
    }
    consumeAttackRequest(facingRight, canUseFinisher) {
        const a = this.wasPressed("btnA");
        const b = this.wasPressed("btnB");
        if (canUseFinisher) {
            const combo = (a && this.keys.btnB) || (b && this.keys.btnA);
            const qcf = a && this.detectQuarterCircleForward(facingRight, 15);
            if (combo || qcf)
                return AttackType.FINISHER;
        }
        if (b)
            return AttackType.KICK_HEAVY;
        if (a)
            return AttackType.PUNCH_LIGHT;
        return null;
    }
}
const DEFAULT_AI_CONFIG = {
    thinkIntervalMin: 18,
    thinkIntervalMax: 34,
    baseAggression: 0.45,
    attackRange: 340,
    approachRange: 560,
};
class AIController {
    constructor(config = {}) {
        this.frame = 0;
        this.nextThink = 0;
        this.lastDecision = 6 /* AiDecision.IDLE */;
        /** Tracks consecutive hits landed; raises aggression after a combo run. */
        this.consecutiveHits = 0;
        this.config = Object.assign(Object.assign({}, DEFAULT_AI_CONFIG), config);
    }
    /** Call when a hit lands to adjust AI pressure. */
    onHitLanded() { this.consecutiveHits = Math.min(this.consecutiveHits + 1, 5); }
    /** Call when the AI is staggered/stunned. */
    onHitReceived() { this.consecutiveHits = 0; }
    get effectiveAggression() {
        // Each consecutive hit adds 6% extra aggression, capped at 0.95.
        return Math.min(0.95, this.config.baseAggression + this.consecutiveHits * 0.06);
    }
    // ── Contextual helpers ───────────────────────────────────────────────────
    isOpponentRight(self, opponent) {
        return (opponent.x + opponent.width / 2) > (self.x + self.width / 2);
    }
    distance(self, opponent) {
        return Math.abs((self.x + self.width / 2) - (opponent.x + opponent.width / 2));
    }
    /**
     * Assess how immediately threatening the opponent is on a 0–1 scale.
     * High when opponent is attacking, in range, and has low frame lag.
     */
    threatLevel(self, opponent) {
        if (opponent.state !== FighterState.ATTACKING)
            return 0;
        const dist = this.distance(self, opponent);
        if (dist >= this.config.attackRange)
            return 0;
        // More frames into the attack = less threat (they've committed).
        const frameDanger = Math.max(0, 1 - opponent.frameTimer / 20);
        return frameDanger * (1 - dist / this.config.attackRange);
    }
    // ── Decision sub-routines ────────────────────────────────────────────────
    decideUnderThreat(self, dist) {
        // If we can punish with a counter, do so (30% chance).
        if (self.attackCooldown === 0 && dist > this.config.attackRange && Math.random() < 0.30)
            return 0 /* AiDecision.ATTACK_LIGHT */;
        // Otherwise: 60% chance to block, 40% to back away.
        return Math.random() < 0.60 ? 5 /* AiDecision.BLOCK */ : 4 /* AiDecision.RETREAT */;
    }
    decideAtRange(self) {
        if (self.attackCooldown > 0)
            return 3 /* AiDecision.ADVANCE */; // pressure while cooling down
        const canFinish = self.energy >= self.maxEnergy;
        const r = Math.random();
        if (canFinish && r < 0.40)
            return 2 /* AiDecision.FINISHER */;
        if (r < 0.45)
            return 0 /* AiDecision.ATTACK_LIGHT */;
        if (r < 0.75)
            return 1 /* AiDecision.ATTACK_HEAVY */;
        return 4 /* AiDecision.RETREAT */; // feint/spacing
    }
    decideMidRange() {
        return Math.random() < this.effectiveAggression
            ? 3 /* AiDecision.ADVANCE */
            : (Math.random() < 0.20 ? 1 /* AiDecision.ATTACK_HEAVY */ : 6 /* AiDecision.IDLE */);
    }
    chooseDecision(self, opponent) {
        const dist = this.distance(self, opponent);
        const threat = this.threatLevel(self, opponent);
        if (threat > 0.4)
            return this.decideUnderThreat(self, dist);
        if (dist <= this.config.attackRange)
            return this.decideAtRange(self);
        if (dist > this.config.approachRange)
            return 3 /* AiDecision.ADVANCE */;
        return this.decideMidRange();
    }
    // ── Public API ───────────────────────────────────────────────────────────
    calculateInput(self, opponent) {
        const input = makeEmptyState();
        // Stunned / mid-attack: return empty input.
        if (self.state === FighterState.STUNNED || self.state === FighterState.ATTACKING)
            return input;
        this.frame++;
        if (this.frame >= this.nextThink) {
            const { thinkIntervalMin: min, thinkIntervalMax: max } = this.config;
            this.nextThink = this.frame + min + Math.floor(Math.random() * (max - min + 1));
            this.lastDecision = this.chooseDecision(self, opponent);
        }
        const opponentRight = this.isOpponentRight(self, opponent);
        // Always face the opponent.
        self.facingRight = opponentRight;
        switch (this.lastDecision) {
            case 0 /* AiDecision.ATTACK_LIGHT */:
                input.btnA = true;
                break;
            case 1 /* AiDecision.ATTACK_HEAVY */:
                input.btnB = true;
                break;
            case 2 /* AiDecision.FINISHER */:
                input.btnA = true;
                input.btnB = true;
                break;
            case 3 /* AiDecision.ADVANCE */:
                // Move in short bursts so AI pace is less twitchy/slippery.
                if (this.frame % 3 !== 0)
                    break;
                input.right = opponentRight;
                input.left = !opponentRight;
                break;
            case 4 /* AiDecision.RETREAT */:
                if (this.frame % 3 !== 0)
                    break;
                input.right = !opponentRight;
                input.left = opponentRight;
                break;
            case 5 /* AiDecision.BLOCK */:
                input.down = true;
                break;
            case 6 /* AiDecision.IDLE */: /* stand still */ break;
        }
        return input;
    }
}
class FightingGameEngine {
    constructor() {
        var _a, _b;
        this.roundDurationSeconds = 75;
        this.roundTimeFrames = 75 * FPS;
        /** True when last round ended in a tie (timeout, same damage) — show DRAW and replay same round number. */
        this.lastRoundWasDraw = false;
        this.player2Input = null;
        this.fighter1 = null;
        this.fighter2 = null;
        this.gameState = GameState.MENU;
        this.gameMode = GameMode.OneVsOneAI;
        this.menuSelection = 0;
        this.p1Selection = 0;
        this.p2Selection = 0;
        this.arenaSelection = 0;
        this.menuCooldown = 0;
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.currentRound = 1;
        this.roundEndTimer = 0;
        /** @deprecated kept for reset; game-over flow uses gameOverBannerTimer */
        this.gameOverTimer = 0;
        /** While > 0, show winner celebration only; then show end menu. Skip early with Enter. */
        this.gameOverBannerTimer = 0;
        this.gameOverMenuIndex = 0;
        this.gameOverNavCooldown = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseClicked = false;
        this.detailIsP1 = true;
        this.pauseSelection = 0;
        /** After opening pause with ESC held, ignore resume until ESC is released (prevents instant close). */
        this.pauseIgnoreEscUntilRelease = false;
        this.pauseNavCooldown = 0;
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = SCREEN_WIDTH;
        this.canvas.height = SCREEN_HEIGHT;
        this.layoutCanvasToViewport();
        const refit = () => this.layoutCanvasToViewport();
        window.addEventListener("resize", refit);
        (_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.addEventListener("resize", refit);
        (_b = window.visualViewport) === null || _b === void 0 ? void 0 : _b.addEventListener("scroll", refit);
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
            this.mouseClicked = true;
        });
        this.canvas.addEventListener('wheel', (e) => {
            // Roster is now full-screen and non-scrollable.
            if (this.gameState === GameState.CHARACTER_SELECT_P1 || this.gameState === GameState.CHARACTER_SELECT_P2)
                e.preventDefault();
        }, { passive: false });
        this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: false });
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.webkitImageSmoothingEnabled = true;
        this.ctx.mozImageSmoothingEnabled = true;
        this.ctx.msImageSmoothingEnabled = true;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.player1Input = new InputHandler(false);
        this.aiInputHandler = new InputHandler(false, false);
        this.aiController = new AIController();
        Object.values(CHARACTER_PREVIEW_PATHS).forEach(path => { if (path)
            spriteLoader.loadSprite(path); });
        spriteLoader.loadSprite(ARENA_SPRITESHEET_PATH);
    }
    /** Scale canvas CSS size to fit the window; drawing stays at SCREEN_WIDTH × SCREEN_HEIGHT. */
    layoutCanvasToViewport() {
        const iw = SCREEN_WIDTH;
        const ih = SCREEN_HEIGHT;
        const vv = window.visualViewport;
        const vw = vv ? vv.width : window.innerWidth;
        const vh = vv ? vv.height : window.innerHeight;
        const pad = 24;
        const maxW = Math.max(80, vw - pad * 2);
        const maxH = Math.max(80, vh - pad * 2);
        const scale = Math.min(maxW / iw, maxH / ih);
        const dw = Math.max(1, Math.floor(iw * scale));
        const dh = Math.max(1, Math.floor(ih * scale));
        this.canvas.style.width = `${dw}px`;
        this.canvas.style.height = `${dh}px`;
    }
    startFight() {
        if (!this.fighter1 || !this.fighter2)
            return;
        this.lastRoundWasDraw = false;
        this.roundTimeFrames = this.roundDurationSeconds * FPS;
        this.fighter1.hp = this.fighter1.maxHp;
        this.fighter1.energy = 0;
        this.fighter1.state = FighterState.IDLE;
        this.fighter1.velocityX = 0;
        this.fighter1.velocityY = 0;
        this.fighter1.velocityZ = 0;
        this.fighter1.x = 100;
        this.fighter1.facingRight = true;
        this.fighter1.comboCounter = 0;
        this.fighter1.hitStunDisplayFrames = 0;
        this.fighter1.x = Math.max(0, Math.min(SCREEN_WIDTH - this.fighter1.width, this.fighter1.x));
        this.fighter2.hp = this.fighter2.maxHp;
        this.fighter2.energy = 0;
        this.fighter2.state = FighterState.IDLE;
        this.fighter2.comboCounter = 0;
        this.fighter2.hitStunDisplayFrames = 0;
        this.fighter2.velocityX = 0;
        this.fighter2.velocityY = 0;
        this.fighter2.velocityZ = 0;
        this.fighter2.x = SCREEN_WIDTH - this.fighter2.width - 100;
        this.fighter2.facingRight = false;
        this.fighter2.x = Math.max(0, Math.min(SCREEN_WIDTH - this.fighter2.width, this.fighter2.x));
        if (this.gameMode === GameMode.OneVsOneAI)
            this.aiInputHandler.resetInputTracking();
        this.gameState = GameState.FIGHTING;
    }
    checkRoundEnd() {
        if (!this.fighter1 || !this.fighter2)
            return;
        if (this.roundTimeFrames <= 0) {
            const p1DamageTaken = this.fighter1.maxHp - this.fighter1.hp;
            const p2DamageTaken = this.fighter2.maxHp - this.fighter2.hp;
            this.lastRoundWasDraw = p1DamageTaken === p2DamageTaken;
            if (p1DamageTaken < p2DamageTaken)
                this.p1Wins++;
            else if (p2DamageTaken < p1DamageTaken)
                this.p2Wins++;
            this.roundEndTimer = 180;
            this.gameState = GameState.ROUND_END;
            if (this.p1Wins >= 2 || this.p2Wins >= 2)
                this.beginGameOver();
            return;
        }
        if (this.fighter1.state === FighterState.DEFEATED) {
            this.lastRoundWasDraw = false;
            this.p2Wins++;
            this.roundEndTimer = 180;
            this.gameState = GameState.ROUND_END;
        }
        else if (this.fighter2.state === FighterState.DEFEATED) {
            this.lastRoundWasDraw = false;
            this.p1Wins++;
            this.roundEndTimer = 180;
            this.gameState = GameState.ROUND_END;
        }
        if (this.p1Wins >= 2 || this.p2Wins >= 2)
            this.beginGameOver();
    }
    resetMatch() {
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.currentRound = 1;
        this.roundEndTimer = 0;
        this.gameOverTimer = 0;
        this.lastRoundWasDraw = false;
        this.roundTimeFrames = this.roundDurationSeconds * FPS;
    }
    beginGameOver() {
        this.gameState = GameState.GAME_OVER;
        this.gameOverTimer = 0;
        this.gameOverBannerTimer = 200;
        this.gameOverMenuIndex = 0;
        this.gameOverNavCooldown = 0;
        this.menuCooldown = 25;
    }
    returnToMenu() { this.fighter1 = null; this.fighter2 = null; this.player2Input = null; this.arenaSelection = 0; this.gameState = GameState.MENU; this.menuSelection = 0; this.resetMatch(); }
    start() { setInterval(() => this.gameLoop(), 1000 / FPS); }
    gameLoop() { this.update(); this.draw(); }
    update() {
        this.player1Input.updateFrame();
        if (this.player2Input)
            this.player2Input.updateFrame();
        if (this.menuCooldown > 0)
            this.menuCooldown--;
        if (this.gameState === GameState.MENU)
            this.updateMenu();
        else if (this.gameState === GameState.HELP)
            this.updateHelp();
        else if (this.gameState === GameState.CHARACTER_SELECT_P1)
            this.updateCharacterSelect(true);
        else if (this.gameState === GameState.CHARACTER_SELECT_P2)
            this.updateCharacterSelect(false);
        else if (this.gameState === GameState.CHARACTER_DETAILS)
            this.updateCharacterDetails();
        else if (this.gameState === GameState.ARENA_SELECT)
            this.updateArenaSelect();
        else if (this.gameState === GameState.ARENA_DETAILS)
            this.updateArenaDetails();
        else if (this.gameState === GameState.FIGHTING) {
            if (this.player1Input.keys.pause && this.menuCooldown === 0) {
                this.gameState = GameState.PAUSED;
                this.pauseSelection = 0;
                this.pauseIgnoreEscUntilRelease = true;
                this.pauseNavCooldown = 0;
            }
            else {
                this.updateFighting();
                this.checkRoundEnd();
            }
        }
        else if (this.gameState === GameState.PAUSED)
            this.updatePaused();
        else if (this.gameState === GameState.ROUND_END)
            this.updateRoundEnd();
        else if (this.gameState === GameState.GAME_OVER)
            this.updateGameOver();
        else if (this.gameState === GameState.CONTROLS_INTRO)
            this.updateControlsIntro();
        if (this.mouseClicked)
            this.mouseClicked = false;
        this.player1Input.finalizeFrame();
        if (this.player2Input)
            this.player2Input.finalizeFrame();
        // AI synthetic handler: finalize whenever roster exists so pause/round-end don't desync edges vs resume.
        if (this.gameMode === GameMode.OneVsOneAI && this.fighter1 && this.fighter2) {
            this.aiInputHandler.finalizeFrame();
        }
    }
    isMouseInRect(x, y, w, h) {
        return this.mouseX >= x && this.mouseX <= x + w && this.mouseY >= y && this.mouseY <= y + h;
    }
    /** Character + arena detail screens share this panel and BACK / CONFIRM hit boxes. */
    getDetailsPanelLayout() {
        const panelW = 760;
        const panelH = 560;
        const panelX = (SCREEN_WIDTH - panelW) / 2;
        const panelY = 70;
        const confirmX = panelX + panelW - 220;
        const confirmY = panelY + panelH - 70;
        const confirmW = 180;
        const confirmH = 42;
        const backX = panelX + 40;
        const backY = panelY + panelH - 70;
        const backW = 180;
        const backH = 42;
        return { panelW, panelH, panelX, panelY, confirmX, confirmY, confirmW, confirmH, backX, backY, backW, backH };
    }
    getArenaSelectLayout() {
        const previewX = 60;
        // Below header strip (see drawArenaSelect: headerY + headerH + gap)
        const previewY = 124;
        const previewWidth = SCREEN_WIDTH - 120;
        const previewHeight = 300;
        const thumbGap = 10;
        const thumbWidth = Math.floor((previewWidth - (ARENA_COLUMNS - 1) * thumbGap) / ARENA_COLUMNS);
        const thumbHeight = 48;
        const thumbsY = previewY + previewHeight + 14;
        return { previewX, previewY, previewWidth, previewHeight, thumbGap, thumbWidth, thumbHeight, thumbsY };
    }
    /** Shared geometry for pause menu (draw + hit tests stay in sync). */
    getPauseMenuLayout() {
        const panelW = 440;
        const panelH = 408;
        const panelX = (SCREEN_WIDTH - panelW) / 2;
        const panelY = (SCREEN_HEIGHT - panelH) / 2;
        const itemW = 320;
        const itemH = 48;
        const gapBetweenRows = 14;
        const rowPitch = itemH + gapBetweenRows;
        const titleY = panelY + 44;
        const startY = panelY + 84;
        const lastButtonBottom = startY + 3 * rowPitch + itemH;
        const footerTop = lastButtonBottom + 26;
        return {
            panelW, panelH, panelX, panelY, itemW, itemH, rowPitch, titleY, startY, footerTop,
        };
    }
    drawCharacterPreview(img, x, y, w, h) {
        // Many character assets are horizontal strips. If image is very wide,
        // render the first square frame so previews look like a single character.
        const stripLike = img.width >= img.height * 1.5;
        const srcW = stripLike ? img.height : img.width;
        const srcH = img.height;
        const scale = Math.min(w / srcW, h / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const drawX = x + (w - drawW) / 2;
        const drawY = y + (h - drawH) / 2;
        this.ctx.drawImage(img, 0, 0, srcW, srcH, drawX, drawY, drawW, drawH);
    }
    getRosterLayout() {
        // Full static roster grid (no scroll): all characters visible at once.
        const columns = 4;
        const gap = 12;
        const sidePadding = 32;
        const rows = Math.ceil(FIGHTER_ROSTER.length / columns);
        const viewportY = 88;
        // Leave room for footer copy + MAIN MENU / P2 BACK buttons inside SCREEN_HEIGHT
        const footerReserve = 112;
        const viewportH = Math.max(220, Math.min(498, SCREEN_HEIGHT - viewportY - footerReserve));
        const gridW = SCREEN_WIDTH - sidePadding * 2;
        const gridX = sidePadding;
        const cardW = Math.floor((gridW - (columns - 1) * gap) / columns);
        const contentH = viewportH;
        const cardH = Math.floor((contentH - (rows - 1) * gap) / rows);
        return { columns, cardW, cardH, gap, rows, gridW, gridX, viewportY, viewportH, contentH };
    }
    /** Help panel: shared draw + hit-test (title above inner body; back button inside panel). */
    getHelpLayout() {
        const outerMargin = 20;
        const panelW = Math.min(620, SCREEN_WIDTH - outerMargin * 2);
        const panelH = Math.min(440, SCREEN_HEIGHT - outerMargin * 2);
        const panelX = (SCREEN_WIDTH - panelW) / 2;
        const panelY = (SCREEN_HEIGHT - panelH) / 2;
        const pad = 20;
        const titleBand = 56;
        const titleCy = panelY + pad + titleBand / 2;
        const innerX = panelX + pad;
        const innerY = panelY + pad + titleBand;
        const innerW = panelW - pad * 2;
        const backH = 42;
        const backGap = 14;
        const innerH = panelH - pad * 2 - titleBand - backH - backGap;
        const backW = 200;
        const backX = (SCREEN_WIDTH - backW) / 2;
        const backY = panelY + panelH - pad - backH;
        return {
            panelX, panelY, panelW, panelH, pad, titleCy, innerX, innerY, innerW, innerH,
            backX, backY, backW, backH,
        };
    }
    getRosterMaxScroll() {
        return 0;
    }
    ensureSelectionVisible(selection) {
        // Non-scroll roster; selection is always visible.
        void selection;
    }
    updateMenu() {
        if (this.menuCooldown !== 0)
            return;
        const centerX = SCREEN_WIDTH / 2;
        const startY = 150;
        const itemWidth = 300;
        const itemHeight = 60;
        const helpButtonWidth = 120;
        const helpButtonHeight = 50;
        const helpButtonX = SCREEN_WIDTH - helpButtonWidth - 20;
        const helpButtonY = 20;
        if (this.mouseClicked && this.isMouseInRect(helpButtonX, helpButtonY, helpButtonWidth, helpButtonHeight)) {
            this.gameState = GameState.HELP;
            this.menuCooldown = 20;
            this.mouseClicked = false;
            return;
        }
        if (this.mouseClicked) {
            for (let i = 0; i < 3; i++) {
                const y = startY + 100 + i * 80;
                if (this.isMouseInRect(centerX - itemWidth / 2, y - itemHeight / 2, itemWidth, itemHeight)) {
                    this.menuSelection = i;
                    if (i === 0) {
                        this.gameMode = GameMode.OneVsOneAI;
                        this.gameState = GameState.CHARACTER_SELECT_P1;
                        this.p1Selection = 0;
                    }
                    else if (i === 1) {
                        this.gameMode = GameMode.OneVsOnePvP;
                        this.gameState = GameState.CHARACTER_SELECT_P1;
                        this.p1Selection = 0;
                    }
                    this.menuCooldown = 20;
                    this.mouseClicked = false;
                    return;
                }
            }
        }
        if (this.player1Input.keys.help) {
            this.gameState = GameState.HELP;
            this.menuCooldown = 20;
            return;
        }
        if (this.player1Input.keys.up) {
            this.menuSelection = Math.max(0, this.menuSelection - 1);
            this.menuCooldown = 15;
        }
        else if (this.player1Input.keys.down) {
            this.menuSelection = Math.min(2, this.menuSelection + 1);
            this.menuCooldown = 15;
        }
        else if (this.player1Input.keys.btnA) {
            if (this.menuSelection === 0) {
                this.gameMode = GameMode.OneVsOneAI;
                this.gameState = GameState.CHARACTER_SELECT_P1;
                this.p1Selection = 0;
            }
            else if (this.menuSelection === 1) {
                this.gameMode = GameMode.OneVsOnePvP;
                this.gameState = GameState.CHARACTER_SELECT_P1;
                this.p1Selection = 0;
            }
            this.menuCooldown = 20;
        }
    }
    updateHelp() {
        if (this.menuCooldown > 0)
            this.menuCooldown--;
        const { backX, backY, backW, backH } = this.getHelpLayout();
        const isMouseOverBack = this.isMouseInRect(backX, backY, backW, backH);
        if (this.menuCooldown === 0) {
            if (this.mouseClicked && isMouseOverBack) {
                this.gameState = GameState.MENU;
                this.menuCooldown = 20;
                this.mouseClicked = false;
                return;
            }
            if (this.player1Input.keys.btnA || this.player1Input.keys.btnB || this.player1Input.keys.pause) {
                this.gameState = GameState.MENU;
                this.menuCooldown = 20;
            }
        }
        if (this.mouseClicked)
            this.mouseClicked = false;
    }
    updateCharacterSelect(isP1) {
        const maxSelection = FIGHTER_ROSTER.length - 1;
        if (this.menuCooldown !== 0)
            return;
        let mouseBack = false;
        let mouseToMenu = false;
        const { columns, cardW, cardH, gap, gridX, viewportY, viewportH } = this.getRosterLayout();
        const footerY = viewportY + viewportH + 18;
        const backX = SCREEN_WIDTH / 2 - 80;
        const backY = footerY + 72;
        const backW = 160;
        const backH = 38;
        const selection = isP1 ? this.p1Selection : this.p2Selection;
        this.ensureSelectionVisible(selection);
        if (this.mouseClicked) {
            for (let i = 0; i < FIGHTER_ROSTER.length; i++) {
                const col = i % columns;
                const row = Math.floor(i / columns);
                const x = gridX + col * (cardW + gap);
                const y = viewportY + row * (cardH + gap);
                if (this.isMouseInRect(x, y, cardW, cardH)) {
                    if (isP1)
                        this.p1Selection = i;
                    else
                        this.p2Selection = i;
                    this.detailIsP1 = isP1;
                    this.gameState = GameState.CHARACTER_DETAILS;
                    this.menuCooldown = 8;
                    this.mouseClicked = false;
                    return;
                }
            }
            if (isP1 && this.isMouseInRect(backX, backY, backW, backH))
                mouseToMenu = true;
            else if (!isP1 && this.isMouseInRect(backX, backY, backW, backH))
                mouseBack = true;
            this.mouseClicked = false;
        }
        if (mouseToMenu) {
            this.gameState = GameState.MENU;
            this.menuCooldown = 20;
            return;
        }
        if (this.player1Input.keys.left) {
            if (isP1)
                this.p1Selection = Math.max(0, this.p1Selection - 1);
            else
                this.p2Selection = Math.max(0, this.p2Selection - 1);
            this.ensureSelectionVisible(isP1 ? this.p1Selection : this.p2Selection);
            this.menuCooldown = 10;
        }
        else if (this.player1Input.keys.right) {
            if (isP1)
                this.p1Selection = Math.min(maxSelection, this.p1Selection + 1);
            else
                this.p2Selection = Math.min(maxSelection, this.p2Selection + 1);
            this.ensureSelectionVisible(isP1 ? this.p1Selection : this.p2Selection);
            this.menuCooldown = 10;
        }
        else if (this.player1Input.keys.up) {
            if (isP1)
                this.p1Selection = Math.max(0, this.p1Selection - columns);
            else
                this.p2Selection = Math.max(0, this.p2Selection - columns);
            this.ensureSelectionVisible(isP1 ? this.p1Selection : this.p2Selection);
            this.menuCooldown = 10;
        }
        else if (this.player1Input.keys.down) {
            if (isP1)
                this.p1Selection = Math.min(maxSelection, this.p1Selection + columns);
            else
                this.p2Selection = Math.min(maxSelection, this.p2Selection + columns);
            this.ensureSelectionVisible(isP1 ? this.p1Selection : this.p2Selection);
            this.menuCooldown = 10;
        }
        else if (this.player1Input.keys.btnA) {
            this.detailIsP1 = isP1;
            this.gameState = GameState.CHARACTER_DETAILS;
            this.menuCooldown = 10;
        }
        else if ((this.player1Input.keys.btnB || mouseBack) && !isP1) {
            this.gameState = GameState.CHARACTER_SELECT_P1;
            this.menuCooldown = 20;
        }
        else if ((this.player1Input.keys.btnB || this.player1Input.keys.pause) && isP1) {
            this.gameState = GameState.MENU;
            this.menuCooldown = 20;
        }
    }
    updateCharacterDetails() {
        if (this.menuCooldown !== 0)
            return;
        const { confirmX, confirmY, confirmW, confirmH, backX, backY, backW, backH } = this.getDetailsPanelLayout();
        if (this.mouseClicked) {
            if (this.isMouseInRect(confirmX, confirmY, confirmW, confirmH)) {
                this.confirmCharacterSelection();
                this.mouseClicked = false;
                return;
            }
            if (this.isMouseInRect(backX, backY, backW, backH)) {
                this.gameState = this.detailIsP1 ? GameState.CHARACTER_SELECT_P1 : GameState.CHARACTER_SELECT_P2;
                this.menuCooldown = 10;
                this.mouseClicked = false;
                return;
            }
            this.mouseClicked = false;
        }
        if (this.player1Input.keys.btnA) {
            this.confirmCharacterSelection();
            this.menuCooldown = 20;
        }
        else if (this.player1Input.keys.btnB || this.player1Input.keys.pause) {
            this.gameState = this.detailIsP1 ? GameState.CHARACTER_SELECT_P1 : GameState.CHARACTER_SELECT_P2;
            this.menuCooldown = 10;
        }
    }
    confirmCharacterSelection() {
        if (this.detailIsP1) {
            this.fighter1 = new FighterEntity(150, FIGHTER_ROSTER[this.p1Selection], true);
            if (this.gameMode === GameMode.OneVsOneAI) {
                this.p2Selection = Math.floor(Math.random() * FIGHTER_ROSTER.length);
                this.fighter2 = new FighterEntity(550, FIGHTER_ROSTER[this.p2Selection], false);
                this.fighter2.onHitDealt = () => this.aiController.onHitLanded();
                this.fighter2.onHitTaken = () => this.aiController.onHitReceived();
                this.aiInputHandler.resetInputTracking();
                this.gameState = GameState.ARENA_SELECT;
                this.arenaSelection = 0;
            }
            else {
                this.gameState = GameState.CHARACTER_SELECT_P2;
                this.p2Selection = 0;
            }
        }
        else {
            this.fighter2 = new FighterEntity(550, FIGHTER_ROSTER[this.p2Selection], false);
            if (this.gameMode === GameMode.OneVsOnePvP)
                this.player2Input = new InputHandler(true);
            this.gameState = GameState.ARENA_SELECT;
            this.arenaSelection = 0;
        }
    }
    hasSeenControlsIntro() {
        try {
            return localStorage.getItem(FightingGameEngine.CONTROLS_INTRO_STORAGE_KEY) === "1";
        }
        catch (_a) {
            return true;
        }
    }
    markControlsIntroSeen() {
        try {
            localStorage.setItem(FightingGameEngine.CONTROLS_INTRO_STORAGE_KEY, "1");
        }
        catch (_a) {
            /* private mode / quota */
        }
    }
    confirmArenaAndStartFight() {
        this.resetMatch();
        if (!this.hasSeenControlsIntro()) {
            this.gameState = GameState.CONTROLS_INTRO;
            this.menuCooldown = 28;
            return;
        }
        this.startFight();
    }
    dismissControlsIntro() {
        this.markControlsIntroSeen();
        this.startFight();
        this.menuCooldown = 18;
    }
    /** Layout for first-run controls modal (draw + hit-test). */
    getControlsIntroLayout() {
        const panelW = Math.min(560, SCREEN_WIDTH - 40);
        const panelH = this.gameMode === GameMode.OneVsOnePvP ? 340 : 280;
        const panelX = (SCREEN_WIDTH - panelW) / 2;
        const panelY = (SCREEN_HEIGHT - panelH) / 2;
        const pad = 22;
        const gotItW = 220;
        const gotItH = 44;
        const gotItX = (SCREEN_WIDTH - gotItW) / 2;
        const gotItY = panelY + panelH - pad - gotItH;
        return { panelX, panelY, panelW, panelH, pad, gotItX, gotItY, gotItW, gotItH };
    }
    updateControlsIntro() {
        if (this.menuCooldown > 0) {
            this.menuCooldown--;
            return;
        }
        const { gotItX, gotItY, gotItW, gotItH } = this.getControlsIntroLayout();
        if (this.mouseClicked && this.isMouseInRect(gotItX, gotItY, gotItW, gotItH)) {
            this.dismissControlsIntro();
            this.mouseClicked = false;
            return;
        }
        if (this.player1Input.wasPressed("btnA") || this.player1Input.wasPressed("btnB")) {
            this.dismissControlsIntro();
            return;
        }
        if (this.mouseClicked)
            this.mouseClicked = false;
    }
    drawControlsIntro() {
        const centerX = SCREEN_WIDTH / 2;
        const { panelX, panelY, panelW, panelH, pad, gotItX, gotItY, gotItW, gotItH } = this.getControlsIntroLayout();
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 5;
        this.ctx.fillRect(panelX, panelY, panelW, panelH);
        this.ctx.strokeRect(panelX, panelY, panelW, panelH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "bold 28px 'Arial', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("CONTROLS", centerX, panelY + pad + 18);
        this.ctx.font = "17px 'Arial', sans-serif";
        this.ctx.textBaseline = "top";
        let ty = panelY + pad + 48;
        const lineGap = 22;
        const p1Lines = [
            "Player 1 — WASD or arrow keys: move",
            "F: light punch   ·   G: heavy kick",
            "Hold S or Down while grounded: crouch block",
            "Esc: pause   ·   H: full help (main menu)",
        ];
        for (const line of p1Lines) {
            this.ctx.fillText(line, centerX, ty);
            ty += lineGap;
        }
        if (this.gameMode === GameMode.OneVsOnePvP) {
            ty += 6;
            this.ctx.font = "bold 17px 'Arial', sans-serif";
            this.ctx.fillText("Player 2", centerX, ty);
            ty += lineGap;
            this.ctx.font = "17px 'Arial', sans-serif";
            const p2Lines = [
                "Arrow keys: move",
                "1 or Numpad 1: punch   ·   2 or Numpad 2: kick",
            ];
            for (const line of p2Lines) {
                this.ctx.fillText(line, centerX, ty);
                ty += lineGap;
            }
        }
        const overGot = this.isMouseInRect(gotItX, gotItY, gotItW, gotItH);
        this.ctx.fillStyle = overGot ? PALETTE.PASTEL_GREEN : PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(gotItX, gotItY, gotItW, gotItH);
        this.ctx.strokeRect(gotItX, gotItY, gotItW, gotItH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "bold 18px 'Arial', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("GOT IT — START", centerX, gotItY + gotItH / 2);
        this.ctx.font = "14px 'Arial', sans-serif";
        this.ctx.fillStyle = "#444444";
        this.ctx.textBaseline = "bottom";
        this.ctx.fillText("Enter / G / click the button to begin", centerX, panelY + panelH - 8);
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }
    updateArenaDetails() {
        if (this.menuCooldown !== 0)
            return;
        const { confirmX, confirmY, confirmW, confirmH, backX, backY, backW, backH } = this.getDetailsPanelLayout();
        if (this.mouseClicked) {
            if (this.isMouseInRect(confirmX, confirmY, confirmW, confirmH)) {
                this.confirmArenaAndStartFight();
                this.mouseClicked = false;
                return;
            }
            if (this.isMouseInRect(backX, backY, backW, backH)) {
                this.gameState = GameState.ARENA_SELECT;
                this.menuCooldown = 10;
                this.mouseClicked = false;
                return;
            }
            this.mouseClicked = false;
        }
        if (this.player1Input.keys.btnA) {
            this.confirmArenaAndStartFight();
            this.menuCooldown = 20;
        }
        else if (this.player1Input.keys.btnB || this.player1Input.keys.pause) {
            this.gameState = GameState.ARENA_SELECT;
            this.menuCooldown = 10;
        }
    }
    updateArenaSelect() {
        if (this.menuCooldown > 0) {
            this.menuCooldown--;
            return;
        }
        const { previewX, previewY, previewWidth, previewHeight, thumbGap, thumbWidth, thumbHeight, thumbsY } = this.getArenaSelectLayout();
        if (this.mouseClicked) {
            let handled = false;
            for (let i = 0; i < ARENA_COUNT; i++) {
                const col = i % ARENA_COLUMNS, row = Math.floor(i / ARENA_COLUMNS);
                const x = previewX + col * (thumbWidth + thumbGap), y = thumbsY + row * (thumbHeight + thumbGap);
                if (this.isMouseInRect(x, y, thumbWidth, thumbHeight)) {
                    this.arenaSelection = i;
                    this.gameState = GameState.ARENA_DETAILS;
                    this.menuCooldown = 8;
                    handled = true;
                    break;
                }
            }
            if (handled) {
                this.mouseClicked = false;
                return;
            }
        }
        if (this.player1Input.keys.left) {
            this.arenaSelection = (this.arenaSelection - 1 + ARENA_COUNT) % ARENA_COUNT;
            this.menuCooldown = 10;
        }
        else if (this.player1Input.keys.right) {
            this.arenaSelection = (this.arenaSelection + 1) % ARENA_COUNT;
            this.menuCooldown = 10;
        }
        else if (this.player1Input.keys.up) {
            this.arenaSelection = (this.arenaSelection - ARENA_COLUMNS + ARENA_COUNT) % ARENA_COUNT;
            this.menuCooldown = 10;
        }
        else if (this.player1Input.keys.down) {
            this.arenaSelection = (this.arenaSelection + ARENA_COLUMNS) % ARENA_COUNT;
            this.menuCooldown = 10;
        }
        else if (this.player1Input.keys.btnA) {
            this.gameState = GameState.ARENA_DETAILS;
            this.menuCooldown = 10;
        }
        else if (this.player1Input.keys.btnB) {
            this.gameState = this.gameMode === GameMode.OneVsOneAI ? GameState.CHARACTER_SELECT_P1 : GameState.CHARACTER_SELECT_P2;
            this.menuCooldown = 20;
        }
    }
    restartCurrentMatch() {
        this.resetMatch();
        this.startFight();
    }
    returnToRoster() {
        this.fighter1 = null;
        this.fighter2 = null;
        this.player2Input = null;
        this.gameState = GameState.CHARACTER_SELECT_P1;
        this.p1Selection = 0;
        this.p2Selection = 0;
    }
    updatePaused() {
        const options = 4; // Resume, Restart, Home, Roster
        if (this.pauseNavCooldown > 0)
            this.pauseNavCooldown--;
        const { itemW, itemH, startY, rowPitch } = this.getPauseMenuLayout();
        if (this.mouseClicked) {
            for (let i = 0; i < options; i++) {
                const y = startY + i * rowPitch;
                if (this.isMouseInRect((SCREEN_WIDTH - itemW) / 2, y, itemW, itemH)) {
                    this.pauseSelection = i;
                    this.applyPauseSelection();
                    this.mouseClicked = false;
                    return;
                }
            }
            this.mouseClicked = false;
        }
        if (this.pauseIgnoreEscUntilRelease) {
            if (!this.player1Input.keys.pause)
                this.pauseIgnoreEscUntilRelease = false;
        }
        else {
            if (this.player1Input.wasPressed("pause")) {
                this.gameState = GameState.FIGHTING;
                this.menuCooldown = 15;
                return;
            }
        }
        const navUp = this.player1Input.wasPressed("up");
        const navDown = this.player1Input.wasPressed("down");
        if (this.pauseNavCooldown === 0 && (navUp || navDown)) {
            if (navUp)
                this.pauseSelection = (this.pauseSelection - 1 + options) % options;
            if (navDown)
                this.pauseSelection = (this.pauseSelection + 1) % options;
            this.pauseNavCooldown = 10;
        }
        if (this.player1Input.wasPressed("btnA")) {
            this.applyPauseSelection();
            return;
        }
        if (this.player1Input.wasPressed("btnB")) {
            this.gameState = GameState.FIGHTING;
            this.menuCooldown = 15;
        }
    }
    applyPauseSelection() {
        switch (this.pauseSelection) {
            case 0: // Resume
                this.gameState = GameState.FIGHTING;
                break;
            case 1: // Restart
                this.restartCurrentMatch();
                break;
            case 2: // Home
                this.returnToMenu();
                break;
            case 3: // Roster
                this.returnToRoster();
                break;
        }
        this.menuCooldown = 20;
    }
    updateFighting() {
        if (!this.fighter1 || !this.fighter2)
            return;
        let fighter2Input;
        let fighter2Handler;
        if (this.gameMode === GameMode.OneVsOneAI) {
            fighter2Input = this.aiController.calculateInput(this.fighter2, this.fighter1);
            this.aiInputHandler.setKeysFromState(fighter2Input);
            this.aiInputHandler.updateFrame();
            fighter2Handler = this.aiInputHandler;
        }
        else if (this.player2Input) {
            fighter2Input = this.player2Input.keys;
            fighter2Handler = this.player2Input;
        }
        else {
            fighter2Input = { up: false, down: false, left: false, right: false, btnA: false, btnB: false, help: false, pause: false };
            fighter2Handler = null;
        }
        this.fighter1.update(this.player1Input.keys, this.fighter2, this.player1Input);
        this.fighter2.update(fighter2Input, this.fighter1, fighter2Handler);
        this.fighter1.updateEffects();
        this.fighter2.updateEffects();
        if (this.roundTimeFrames > 0)
            this.roundTimeFrames--;
    }
    updateRoundEnd() {
        this.roundEndTimer--;
        if (this.roundEndTimer > 0)
            return;
        if (this.p1Wins >= 2 || this.p2Wins >= 2) {
            this.beginGameOver();
        }
        else {
            if (!this.lastRoundWasDraw)
                this.currentRound++;
            this.startFight();
        }
    }
    updateGameOver() {
        if (this.menuCooldown > 0)
            this.menuCooldown--;
        if (this.gameOverNavCooldown > 0)
            this.gameOverNavCooldown--;
        if (this.gameOverBannerTimer > 0) {
            this.gameOverBannerTimer--;
            if (this.menuCooldown === 0 && this.player1Input.wasPressed("btnA"))
                this.gameOverBannerTimer = 0;
            return;
        }
        const options = 3;
        const { itemW, itemH, startY, rowPitch } = this.getGameOverMenuLayout();
        if (this.mouseClicked) {
            for (let i = 0; i < options; i++) {
                const y = startY + i * rowPitch;
                if (this.isMouseInRect((SCREEN_WIDTH - itemW) / 2, y, itemW, itemH)) {
                    this.gameOverMenuIndex = i;
                    this.applyGameOverMenuSelection();
                    this.mouseClicked = false;
                    return;
                }
            }
            this.mouseClicked = false;
        }
        const navUp = this.player1Input.wasPressed("up");
        const navDown = this.player1Input.wasPressed("down");
        if (this.gameOverNavCooldown === 0 && (navUp || navDown)) {
            if (navUp)
                this.gameOverMenuIndex = (this.gameOverMenuIndex - 1 + options) % options;
            if (navDown)
                this.gameOverMenuIndex = (this.gameOverMenuIndex + 1) % options;
            this.gameOverNavCooldown = 10;
        }
        if (this.player1Input.wasPressed("btnA"))
            this.applyGameOverMenuSelection();
    }
    getGameOverMenuLayout() {
        const panelW = 420;
        const panelH = 320;
        const panelX = (SCREEN_WIDTH - panelW) / 2;
        const panelY = Math.floor(SCREEN_HEIGHT * 0.52);
        const itemW = 360;
        const itemH = 46;
        const gap = 12;
        const rowPitch = itemH + gap;
        const titleY = panelY + 36;
        const startY = panelY + 72;
        return { panelW, panelH, panelX, panelY, itemW, itemH, rowPitch, titleY, startY, gap };
    }
    applyGameOverMenuSelection() {
        switch (this.gameOverMenuIndex) {
            case 0:
                this.restartCurrentMatch();
                break;
            case 1:
                this.resetMatch();
                this.returnToRoster();
                break;
            case 2:
                this.returnToMenu();
                break;
        }
        this.menuCooldown = 20;
    }
    drawBar(x, y, current, max, color) {
        const width = 230, height = 16, fillWidth = Math.max(0, (current / max) * width);
        this.ctx.fillStyle = PALETTE.BACKGROUND_DARK;
        this.ctx.fillRect(x, y, width, height);
        if (fillWidth > 0) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, fillWidth, height);
        }
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);
    }
    drawUI(f1, f2) {
        const uiHeight = 90;
        const uiPadding = 20;
        const barW = 230;
        const stunH = 6;
        const nameY = uiPadding + 28;
        const stunY = uiPadding + 36;
        const hpY = uiPadding + 46;
        const enY = uiPadding + 66;
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(uiPadding, uiPadding, 250, uiHeight);
        this.ctx.strokeRect(uiPadding, uiPadding, 250, uiHeight);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "bold 22px 'Arial', sans-serif";
        this.ctx.textAlign = "left";
        this.ctx.fillText(f1.config.name.substring(0, 12), uiPadding + 10, nameY);
        this.ctx.fillStyle = PALETTE.BACKGROUND_DARK;
        this.ctx.fillRect(uiPadding + 10, stunY, barW, stunH);
        if (f1.stunTimer > 0 && f1.hitStunDisplayFrames > 0) {
            const fillW = Math.max(0, (f1.stunTimer / f1.hitStunDisplayFrames) * barW);
            this.ctx.fillStyle = PALETTE.ACCENT_YELLOW;
            this.ctx.fillRect(uiPadding + 10, stunY, fillW, stunH);
        }
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(uiPadding + 10, stunY, barW, stunH);
        this.drawBar(uiPadding + 10, hpY, f1.hp, f1.maxHp, PALETTE.ACCENT_RED);
        this.drawBar(uiPadding + 10, enY, f1.energy, f1.maxEnergy, PALETTE.ACCENT_GREEN);
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(SCREEN_WIDTH - 250 - uiPadding, uiPadding, 250, uiHeight);
        this.ctx.strokeRect(SCREEN_WIDTH - 250 - uiPadding, uiPadding, 250, uiHeight);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.textAlign = "right";
        this.ctx.fillText(f2.config.name.substring(0, 12), SCREEN_WIDTH - uiPadding - 10, nameY);
        this.ctx.textAlign = "left";
        this.ctx.fillStyle = PALETTE.BACKGROUND_DARK;
        const f2stunX = SCREEN_WIDTH - 250 - uiPadding + 10;
        this.ctx.fillRect(f2stunX, stunY, barW, stunH);
        if (f2.stunTimer > 0 && f2.hitStunDisplayFrames > 0) {
            const fillW = Math.max(0, (f2.stunTimer / f2.hitStunDisplayFrames) * barW);
            this.ctx.fillStyle = PALETTE.ACCENT_YELLOW;
            this.ctx.fillRect(f2stunX, stunY, fillW, stunH);
        }
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(f2stunX, stunY, barW, stunH);
        this.drawBar(f2stunX, hpY, f2.hp, f2.maxHp, PALETTE.ACCENT_RED);
        this.drawBar(f2stunX, enY, f2.energy, f2.maxEnergy, PALETTE.ACCENT_GREEN);
        this.ctx.font = "bold 17px 'Arial', sans-serif";
        if (f1.comboCounter >= 2) {
            this.ctx.fillStyle = PALETTE.ACCENT_YELLOW;
            this.ctx.textAlign = "left";
            this.ctx.fillText(`${f1.comboCounter}-HIT COMBO`, uiPadding + 10, uiPadding + uiHeight + 14);
        }
        if (f2.comboCounter >= 2) {
            this.ctx.fillStyle = PALETTE.ACCENT_YELLOW;
            this.ctx.textAlign = "right";
            this.ctx.fillText(`${f2.comboCounter}-HIT COMBO`, SCREEN_WIDTH - uiPadding - 10, uiPadding + uiHeight + 14);
        }
        this.ctx.textAlign = "left";
        // Best-of-3 round tracker (3 pips per side, green for won rounds)
        const pipW = 22;
        const pipH = 12;
        const pipGap = 6;
        const leftPipsX = uiPadding + 10;
        const pipsY = uiPadding - 16;
        for (let i = 0; i < 3; i++) {
            this.ctx.fillStyle = i < this.p1Wins ? "#32d74b" : "#d8d8d8";
            this.ctx.strokeStyle = PALETTE.OUTLINE;
            this.ctx.lineWidth = 2;
            this.ctx.fillRect(leftPipsX + i * (pipW + pipGap), pipsY, pipW, pipH);
            this.ctx.strokeRect(leftPipsX + i * (pipW + pipGap), pipsY, pipW, pipH);
        }
        const rightTotalW = 3 * pipW + 2 * pipGap;
        const rightPipsX = SCREEN_WIDTH - uiPadding - 10 - rightTotalW;
        for (let i = 0; i < 3; i++) {
            this.ctx.fillStyle = i < this.p2Wins ? "#32d74b" : "#d8d8d8";
            this.ctx.strokeStyle = PALETTE.OUTLINE;
            this.ctx.lineWidth = 2;
            this.ctx.fillRect(rightPipsX + i * (pipW + pipGap), pipsY, pipW, pipH);
            this.ctx.strokeRect(rightPipsX + i * (pipW + pipGap), pipsY, pipW, pipH);
        }
        const timeSeconds = Math.max(0, Math.ceil(this.roundTimeFrames / FPS));
        const timerW = 96;
        const timerH = 62;
        const timerX = SCREEN_WIDTH / 2 - timerW / 2;
        const timerY = 18;
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(timerX, timerY, timerW, timerH);
        this.ctx.strokeRect(timerX, timerY, timerW, timerH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.font = "bold 38px 'Arial', sans-serif";
        this.ctx.fillText(`${timeSeconds}`, SCREEN_WIDTH / 2, timerY + timerH / 2 + 1);
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }
    drawArenaBackground(destX, destY, destWidth, destHeight) {
        const arenaSheet = spriteLoader.getSprite(ARENA_SPRITESHEET_PATH);
        if (!arenaSheet) {
            this.ctx.fillStyle = PALETTE.BACKGROUND_DARK;
            this.ctx.fillRect(destX, destY, destWidth, destHeight);
            return;
        }
        const tileWidth = arenaSheet.width / ARENA_COLUMNS;
        const tileHeight = arenaSheet.height / ARENA_ROWS;
        const arenaCol = this.arenaSelection % ARENA_COLUMNS;
        const arenaRow = Math.floor(this.arenaSelection / ARENA_COLUMNS);
        // Preserve arena aspect ratio to avoid blur/stretch.
        const fitScale = Math.min(destWidth / tileWidth, destHeight / tileHeight);
        const drawWidth = tileWidth * fitScale;
        const drawHeight = tileHeight * fitScale;
        const drawX = destX + (destWidth - drawWidth) / 2;
        const drawY = destY + (destHeight - drawHeight) / 2;
        this.ctx.fillStyle = "#111111";
        this.ctx.fillRect(destX, destY, destWidth, destHeight);
        this.ctx.drawImage(arenaSheet, arenaCol * tileWidth, arenaRow * tileHeight, tileWidth, tileHeight, drawX, drawY, drawWidth, drawHeight);
    }
    draw() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
        gradient.addColorStop(0, PALETTE.BACKGROUND_LIGHT);
        gradient.addColorStop(1, PALETTE.BACKGROUND_DARK);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        if (this.gameState === GameState.FIGHTING)
            this.drawFighting();
        else if (this.gameState === GameState.PAUSED) {
            this.drawFighting();
            this.drawPaused();
        }
        else if (this.gameState === GameState.ROUND_END)
            this.drawRoundEnd();
        else if (this.gameState === GameState.GAME_OVER)
            this.drawGameOver();
        else if (this.gameState === GameState.HELP)
            this.drawHelp();
        else if (this.gameState === GameState.CONTROLS_INTRO)
            this.drawControlsIntro();
        else if (this.gameState === GameState.ARENA_DETAILS)
            this.drawArenaDetails();
        else if (this.gameState === GameState.ARENA_SELECT)
            this.drawArenaSelect();
        else if (this.gameState === GameState.CHARACTER_DETAILS)
            this.drawCharacterDetails();
        else if (this.gameState === GameState.CHARACTER_SELECT_P1 || this.gameState === GameState.CHARACTER_SELECT_P2)
            this.drawCharacterSelect();
        else
            this.drawMenu();
    }
    drawMenu() {
        const centerX = SCREEN_WIDTH / 2;
        const startY = 150;
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 5;
        this.ctx.font = "bold 48px 'Arial', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.strokeText("WHO WOULD WIN?", centerX, startY);
        this.ctx.fillText("WHO WOULD WIN?", centerX, startY);
        this.ctx.font = "bold 32px 'Arial', sans-serif";
        const modes = ["1v1 vs CPU", "1v1 PvP"];
        for (let i = 0; i < modes.length; i++) {
            const y = startY + 100 + i * 80;
            const itemWidth = 300;
            const itemHeight = 60;
            if (i === this.menuSelection) {
                this.ctx.fillStyle = PALETTE.PASTEL_BLUE;
                this.ctx.strokeStyle = PALETTE.OUTLINE;
                this.ctx.lineWidth = 4;
            }
            else {
                this.ctx.fillStyle = PALETTE.WHITE;
                this.ctx.strokeStyle = PALETTE.OUTLINE;
                this.ctx.lineWidth = 3;
            }
            this.ctx.fillRect(centerX - itemWidth / 2, y - itemHeight / 2, itemWidth, itemHeight);
            this.ctx.strokeRect(centerX - itemWidth / 2, y - itemHeight / 2, itemWidth, itemHeight);
            this.ctx.fillStyle = PALETTE.BLACK;
            this.ctx.fillText(modes[i], centerX, y);
        }
        const helpButtonWidth = 120;
        const helpButtonHeight = 50;
        const helpButtonX = SCREEN_WIDTH - helpButtonWidth - 20;
        const helpButtonY = 20;
        const isMouseOverHelp = this.isMouseInRect(helpButtonX, helpButtonY, helpButtonWidth, helpButtonHeight);
        this.ctx.fillStyle = isMouseOverHelp ? PALETTE.PASTEL_BLUE : PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(helpButtonX, helpButtonY, helpButtonWidth, helpButtonHeight);
        this.ctx.strokeRect(helpButtonX, helpButtonY, helpButtonWidth, helpButtonHeight);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "bold 24px 'Arial', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("HELP", helpButtonX + helpButtonWidth / 2, helpButtonY + helpButtonHeight / 2);
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }
    drawHelp() {
        const centerX = SCREEN_WIDTH / 2;
        const { panelX, panelY, panelW, panelH, titleCy, innerX, innerY, innerW, innerH, backX, backY, backW, backH, } = this.getHelpLayout();
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 5;
        this.ctx.fillRect(panelX, panelY, panelW, panelH);
        this.ctx.strokeRect(panelX, panelY, panelW, panelH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "bold 34px 'Arial', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("HOW TO PLAY", centerX, titleCy);
        this.ctx.fillStyle = PALETTE.BACKGROUND_LIGHT;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(innerX, innerY, innerW, innerH);
        this.ctx.strokeRect(innerX, innerY, innerW, innerH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "18px 'Arial', sans-serif";
        this.ctx.textBaseline = "top";
        const lines = [
            "WASD or Arrow keys — move",
            "F / G — light punch / heavy kick (Enter also confirms menus)",
            "S or Down — crouch block",
            "ESC — pause in fight; B / Esc — back in menus",
        ];
        let ty = innerY + 18;
        const lineGap = 26;
        for (const line of lines) {
            this.ctx.fillText(line, centerX, ty);
            ty += lineGap;
        }
        this.ctx.font = "16px 'Arial', sans-serif";
        this.ctx.fillStyle = "#333333";
        this.ctx.fillText("Press Enter, Esc, or G to return to the main menu.", centerX, innerY + innerH - 36);
        const overBack = this.isMouseInRect(backX, backY, backW, backH);
        this.ctx.fillStyle = overBack ? PALETTE.PASTEL_BLUE : PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(backX, backY, backW, backH);
        this.ctx.strokeRect(backX, backY, backW, backH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "bold 18px 'Arial', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("BACK", centerX, backY + backH / 2);
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }
    drawCharacterSelect() {
        var _a;
        const isP1 = this.gameState === GameState.CHARACTER_SELECT_P1;
        const selection = isP1 ? this.p1Selection : this.p2Selection;
        const { columns, cardW, cardH, gap, gridW, gridX, viewportY, viewportH } = this.getRosterLayout();
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(SCREEN_WIDTH / 2 - 200, 20, 400, 60);
        this.ctx.strokeRect(SCREEN_WIDTH / 2 - 200, 20, 400, 60);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "bold 36px 'Arial', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(isP1 ? "P1 ROSTER" : "P2 ROSTER", SCREEN_WIDTH / 2, 50);
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(gridX - 8, viewportY - 8, gridW + 16, viewportH + 16);
        this.ctx.strokeRect(gridX - 8, viewportY - 8, gridW + 16, viewportH + 16);
        for (let i = 0; i < FIGHTER_ROSTER.length; i++) {
            const entry = FIGHTER_ROSTER[i];
            const col = i % columns;
            const row = Math.floor(i / columns);
            const x = gridX + col * (cardW + gap);
            const y = viewportY + row * (cardH + gap);
            this.ctx.fillStyle = i === selection ? PALETTE.PASTEL_BLUE : PALETTE.WHITE;
            this.ctx.strokeStyle = PALETTE.OUTLINE;
            this.ctx.lineWidth = i === selection ? 4 : 2;
            this.ctx.fillRect(x, y, cardW, cardH);
            this.ctx.strokeRect(x, y, cardW, cardH);
            const previewPath = CHARACTER_PREVIEW_PATHS[entry.spriteKey] || ((_a = CHARACTER_SPRITE_PATHS[entry.spriteKey]) === null || _a === void 0 ? void 0 : _a.idle) || "";
            const imageAreaTop = y + 4;
            const imageAreaHeight = Math.max(72, cardH - 30);
            const imageAreaBottom = imageAreaTop + imageAreaHeight;
            if (previewPath) {
                spriteLoader.loadSprite(previewPath);
                const previewImg = spriteLoader.getSprite(previewPath);
                if (previewImg) {
                    this.drawCharacterPreview(previewImg, x + 6, imageAreaTop + 2, cardW - 12, imageAreaHeight - 4);
                }
                else {
                    this.ctx.fillStyle = PALETTE.BACKGROUND_DARK;
                    this.ctx.fillRect(x + 8, imageAreaTop, cardW - 16, imageAreaHeight);
                }
            }
            else {
                this.ctx.fillStyle = PALETTE.BACKGROUND_DARK;
                this.ctx.fillRect(x + 8, imageAreaTop, cardW - 16, imageAreaHeight);
            }
            this.ctx.fillStyle = "rgba(0,0,0,0.7)";
            this.ctx.fillRect(x + 8, y + cardH - 26, cardW - 16, 22);
            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "bold 15px 'Arial', sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            const label = entry.name.length > 18 ? `${entry.name.substring(0, 18)}...` : entry.name;
            this.ctx.fillText(label, x + cardW / 2, y + cardH - 15);
        }
        const footerY = viewportY + viewportH + 18;
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.font = "bold 20px 'Arial', sans-serif";
        if (isP1) {
            this.ctx.fillText("Select a fighter to open details  ·  B / Esc: main menu", SCREEN_WIDTH / 2, footerY);
        }
        else {
            this.ctx.fillText("Select a fighter to open details", SCREEN_WIDTH / 2, footerY);
        }
        const menuBtnX = SCREEN_WIDTH / 2 - 80;
        const menuBtnY = footerY + 72;
        const menuBtnW = 160;
        const menuBtnH = 38;
        if (isP1) {
            const overMenu = this.isMouseInRect(menuBtnX, menuBtnY, menuBtnW, menuBtnH);
            this.ctx.fillStyle = overMenu ? PALETTE.PASTEL_BLUE : PALETTE.WHITE;
            this.ctx.strokeStyle = PALETTE.OUTLINE;
            this.ctx.fillRect(menuBtnX, menuBtnY, menuBtnW, menuBtnH);
            this.ctx.strokeRect(menuBtnX, menuBtnY, menuBtnW, menuBtnH);
            this.ctx.fillStyle = PALETTE.BLACK;
            this.ctx.font = "bold 18px 'Arial', sans-serif";
            this.ctx.fillText("MAIN MENU", SCREEN_WIDTH / 2, menuBtnY + menuBtnH / 2 + 1);
        }
        else {
            const overBack = this.isMouseInRect(menuBtnX, menuBtnY, menuBtnW, menuBtnH);
            this.ctx.fillStyle = overBack ? PALETTE.PASTEL_ORANGE : PALETTE.WHITE;
            this.ctx.strokeStyle = PALETTE.OUTLINE;
            this.ctx.fillRect(menuBtnX, menuBtnY, menuBtnW, menuBtnH);
            this.ctx.strokeRect(menuBtnX, menuBtnY, menuBtnW, menuBtnH);
            this.ctx.fillStyle = PALETTE.BLACK;
            this.ctx.font = "bold 20px 'Arial', sans-serif";
            this.ctx.fillText("BACK", SCREEN_WIDTH / 2, menuBtnY + menuBtnH / 2 + 1);
        }
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }
    drawCharacterDetails() {
        var _a;
        const selection = this.detailIsP1 ? this.p1Selection : this.p2Selection;
        const fighter = FIGHTER_ROSTER[selection];
        const { panelW, panelH, panelX, panelY, confirmX, confirmY, confirmW, confirmH, backX, backY, backW, backH } = this.getDetailsPanelLayout();
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 5;
        this.ctx.fillRect(panelX, panelY, panelW, panelH);
        this.ctx.strokeRect(panelX, panelY, panelW, panelH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.font = "bold 36px 'Arial', sans-serif";
        this.ctx.fillText(fighter.name, SCREEN_WIDTH / 2, panelY + 45);
        const previewPath = CHARACTER_PREVIEW_PATHS[fighter.spriteKey] || ((_a = CHARACTER_SPRITE_PATHS[fighter.spriteKey]) === null || _a === void 0 ? void 0 : _a.idle) || "";
        const imgBoxX = panelX + 24;
        const imgBoxY = panelY + 82;
        const imgBoxW = 380;
        const imgBoxH = 380;
        this.ctx.fillStyle = PALETTE.BACKGROUND_DARK;
        this.ctx.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
        if (previewPath) {
            spriteLoader.loadSprite(previewPath);
            const previewImg = spriteLoader.getSprite(previewPath);
            if (previewImg) {
                this.drawCharacterPreview(previewImg, imgBoxX + 6, imgBoxY + 6, imgBoxW - 12, imgBoxH - 12);
            }
        }
        const infoX = panelX + 430;
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.textAlign = "left";
        this.ctx.font = "bold 28px 'Arial', sans-serif";
        this.ctx.fillText("POWER LEVEL", infoX, panelY + 150);
        this.ctx.font = "bold 44px 'Arial', sans-serif";
        this.ctx.fillText(`${fighter.basePower * 100}`, infoX, panelY + 205);
        this.ctx.font = "22px 'Arial', sans-serif";
        this.ctx.fillText(`Speed: ${fighter.baseSpeed}`, infoX, panelY + 264);
        this.ctx.fillText(`Power: ${fighter.basePower}`, infoX, panelY + 300);
        this.ctx.fillText(`Style: ${fighter.id.toUpperCase()}`, infoX, panelY + 336);
        const overConfirm = this.isMouseInRect(confirmX, confirmY, confirmW, confirmH);
        const overBack = this.isMouseInRect(backX, backY, backW, backH);
        this.ctx.fillStyle = overBack ? PALETTE.PASTEL_ORANGE : PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.fillRect(backX, backY, backW, backH);
        this.ctx.strokeRect(backX, backY, backW, backH);
        this.ctx.fillStyle = overConfirm ? PALETTE.PASTEL_GREEN : PALETTE.WHITE;
        this.ctx.fillRect(confirmX, confirmY, confirmW, confirmH);
        this.ctx.strokeRect(confirmX, confirmY, confirmW, confirmH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.textAlign = "center";
        this.ctx.font = "bold 22px 'Arial', sans-serif";
        this.ctx.fillText("BACK", backX + backW / 2, backY + backH / 2 + 1);
        this.ctx.fillText("CONFIRM", confirmX + confirmW / 2, confirmY + confirmH / 2 + 1);
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }
    drawArenaDetails() {
        const { panelW, panelH, panelX, panelY, confirmX, confirmY, confirmW, confirmH, backX, backY, backW, backH } = this.getDetailsPanelLayout();
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 5;
        this.ctx.fillRect(panelX, panelY, panelW, panelH);
        this.ctx.strokeRect(panelX, panelY, panelW, panelH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.font = "bold 36px 'Arial', sans-serif";
        this.ctx.fillText(getArenaDisplayName(this.arenaSelection), SCREEN_WIDTH / 2, panelY + 45);
        const previewX = panelX + 24;
        const previewY = panelY + 82;
        const previewW = panelW - 48;
        const previewH = 380;
        this.ctx.fillStyle = PALETTE.BACKGROUND_DARK;
        this.ctx.fillRect(previewX, previewY, previewW, previewH);
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(previewX, previewY, previewW, previewH);
        this.drawArenaBackground(previewX + 6, previewY + 6, previewW - 12, previewH - 12);
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.textAlign = "center";
        this.ctx.font = "20px 'Arial', sans-serif";
        this.ctx.fillText("Fight on this stage?", SCREEN_WIDTH / 2, panelY + panelH - 118);
        const overConfirm = this.isMouseInRect(confirmX, confirmY, confirmW, confirmH);
        const overBack = this.isMouseInRect(backX, backY, backW, backH);
        this.ctx.fillStyle = overBack ? PALETTE.PASTEL_ORANGE : PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.fillRect(backX, backY, backW, backH);
        this.ctx.strokeRect(backX, backY, backW, backH);
        this.ctx.fillStyle = overConfirm ? PALETTE.PASTEL_GREEN : PALETTE.WHITE;
        this.ctx.fillRect(confirmX, confirmY, confirmW, confirmH);
        this.ctx.strokeRect(confirmX, confirmY, confirmW, confirmH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "bold 22px 'Arial', sans-serif";
        this.ctx.fillText("BACK", backX + backW / 2, backY + backH / 2 + 1);
        this.ctx.fillText("CONFIRM", confirmX + confirmW / 2, confirmY + confirmH / 2 + 1);
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }
    drawArenaSelect() {
        const { previewX, previewY, previewWidth, previewHeight, thumbGap, thumbWidth, thumbHeight, thumbsY } = this.getArenaSelectLayout();
        const thumbsBottom = thumbsY + ARENA_ROWS * thumbHeight + (ARENA_ROWS - 1) * thumbGap;
        const footerY = thumbsBottom + 28;
        const headerW = 440;
        const headerH = 92;
        const headerX = SCREEN_WIDTH / 2 - headerW / 2;
        const headerY = 20;
        const headerPadTop = 14;
        const titleLineH = 38;
        const titleToSubtitleGap = 8;
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(headerX, headerY, headerW, headerH);
        this.ctx.strokeRect(headerX, headerY, headerW, headerH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "top";
        this.ctx.font = "bold 34px 'Arial', sans-serif";
        this.ctx.fillText("SELECT ARENA", SCREEN_WIDTH / 2, headerY + headerPadTop);
        this.ctx.font = "18px 'Arial', sans-serif";
        this.ctx.fillText(getArenaDisplayName(this.arenaSelection), SCREEN_WIDTH / 2, headerY + headerPadTop + titleLineH + titleToSubtitleGap);
        this.ctx.textBaseline = "alphabetic";
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.fillRect(previewX - 6, previewY - 6, previewWidth + 12, previewHeight + 12);
        this.ctx.strokeRect(previewX - 6, previewY - 6, previewWidth + 12, previewHeight + 12);
        this.drawArenaBackground(previewX, previewY, previewWidth, previewHeight);
        const arenaSheet = spriteLoader.getSprite(ARENA_SPRITESHEET_PATH);
        if (arenaSheet) {
            const tileWidth = arenaSheet.width / ARENA_COLUMNS;
            const tileHeight = arenaSheet.height / ARENA_ROWS;
            for (let i = 0; i < ARENA_COUNT; i++) {
                const col = i % ARENA_COLUMNS;
                const row = Math.floor(i / ARENA_COLUMNS);
                const x = previewX + col * (thumbWidth + thumbGap);
                const y = thumbsY + row * (thumbHeight + thumbGap);
                this.ctx.drawImage(arenaSheet, col * tileWidth, row * tileHeight, tileWidth, tileHeight, x, y, thumbWidth, thumbHeight);
                this.ctx.lineWidth = i === this.arenaSelection ? 4 : 2;
                this.ctx.strokeStyle = i === this.arenaSelection ? PALETTE.ACCENT_BLUE : PALETTE.OUTLINE;
                this.ctx.strokeRect(x, y, thumbWidth, thumbHeight);
            }
        }
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.font = "bold 18px 'Arial', sans-serif";
        this.ctx.fillText("Click an arena or press Enter to review · Arrows to change selection", SCREEN_WIDTH / 2, footerY);
        this.ctx.font = "16px 'Arial', sans-serif";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }
    /** Arena, ground line, and both fighters (no HUD). */
    drawArenaGroundAndFighters() {
        this.drawArenaBackground(-24, -30, SCREEN_WIDTH + 48, SCREEN_HEIGHT + 60);
        const groundGradient = this.ctx.createLinearGradient(0, GROUND_Y, 0, SCREEN_HEIGHT);
        groundGradient.addColorStop(0, PALETTE.GROUND);
        groundGradient.addColorStop(1, PALETTE.GROUND_SHADOW);
        this.ctx.fillStyle = groundGradient;
        this.ctx.globalAlpha = 0.35;
        this.ctx.fillRect(0, GROUND_Y, SCREEN_WIDTH, SCREEN_HEIGHT - GROUND_Y);
        this.ctx.globalAlpha = 1;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, GROUND_Y);
        this.ctx.lineTo(SCREEN_WIDTH, GROUND_Y);
        this.ctx.stroke();
        if (this.fighter1 && this.fighter2) {
            this.fighter2.draw(this.ctx);
            this.fighter1.draw(this.ctx);
        }
    }
    drawFighting() {
        this.drawArenaGroundAndFighters();
        if (this.fighter1 && this.fighter2)
            this.drawUI(this.fighter1, this.fighter2);
    }
    drawPaused() {
        this.ctx.fillStyle = "rgba(0,0,0,0.72)";
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        const { panelW, panelH, panelX, panelY, itemW, itemH, rowPitch, titleY, startY, footerTop } = this.getPauseMenuLayout();
        const options = ["Resume", "Restart Match", "Exit to Home", "Exit to Roster"];
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(panelX, panelY, panelW, panelH);
        this.ctx.strokeRect(panelX, panelY, panelW, panelH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "bold 36px 'Arial', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("PAUSED", SCREEN_WIDTH / 2, titleY);
        const borderW = 3;
        for (let i = 0; i < options.length; i++) {
            const x = (SCREEN_WIDTH - itemW) / 2;
            const y = startY + i * rowPitch;
            const over = this.isMouseInRect(x, y, itemW, itemH);
            const selected = this.pauseSelection === i;
            this.ctx.fillStyle = selected || over ? PALETTE.PASTEL_BLUE : PALETTE.WHITE;
            this.ctx.strokeStyle = PALETTE.OUTLINE;
            this.ctx.lineWidth = borderW;
            this.ctx.fillRect(x, y, itemW, itemH);
            this.ctx.strokeRect(x, y, itemW, itemH);
            this.ctx.fillStyle = PALETTE.BLACK;
            this.ctx.font = "bold 19px 'Arial', sans-serif";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(options[i], SCREEN_WIDTH / 2, y + itemH / 2);
        }
        this.ctx.font = "13px 'Arial', sans-serif";
        this.ctx.fillStyle = "#333333";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }
    drawRoundEnd() {
        this.drawFighting();
        this.ctx.fillStyle = "rgba(0,0,0,0.55)";
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        if (this.lastRoundWasDraw) {
            const cx = SCREEN_WIDTH / 2;
            const cy = SCREEN_HEIGHT / 2 - 20;
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.font = "bold 112px 'Arial', sans-serif";
            this.ctx.strokeStyle = PALETTE.OUTLINE;
            this.ctx.lineWidth = 10;
            this.ctx.strokeText("DRAW", cx, cy);
            this.ctx.fillStyle = PALETTE.WHITE;
            this.ctx.fillText("DRAW", cx, cy);
            this.ctx.font = "bold 26px 'Arial', sans-serif";
            this.ctx.fillStyle = PALETTE.ACCENT_YELLOW;
            this.ctx.strokeStyle = PALETTE.OUTLINE;
            this.ctx.lineWidth = 4;
            this.ctx.strokeText("Same HP — round replay!", cx, cy + 88);
            this.ctx.fillText("Same HP — round replay!", cx, cy + 88);
            this.ctx.textAlign = "left";
            this.ctx.textBaseline = "alphabetic";
        }
    }
    drawGameOver() {
        if (!this.fighter1 || !this.fighter2) {
            this.ctx.fillStyle = "rgba(0,0,0,0.85)";
            this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            return;
        }
        this.drawArenaGroundAndFighters();
        const p1Won = this.p1Wins >= 2;
        const winner = p1Won ? this.fighter1 : this.fighter2;
        const winTitle = p1Won
            ? (this.gameMode === GameMode.OneVsOneAI ? "YOU WIN!" : "PLAYER 1 WINS")
            : (this.gameMode === GameMode.OneVsOneAI ? "CPU WINS" : "PLAYER 2 WINS");
        const winSubtitle = `Winner — ${winner.config.name}`;
        const cx = SCREEN_WIDTH / 2;
        const bannerY = 108;
        const overlayAlpha = this.gameOverBannerTimer > 0 ? 0.42 : 0.58;
        this.ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.font = "bold 52px 'Arial', sans-serif";
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 8;
        this.ctx.strokeText(winTitle, cx, bannerY);
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.fillText(winTitle, cx, bannerY);
        this.ctx.font = "bold 24px 'Arial', sans-serif";
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(winSubtitle, cx, bannerY + 52);
        this.ctx.fillStyle = PALETTE.PASTEL_YELLOW;
        this.ctx.fillText(winSubtitle, cx, bannerY + 52);
        if (this.gameOverBannerTimer > 0) {
            this.ctx.font = "18px 'Arial', sans-serif";
            this.ctx.fillStyle = "rgba(255,255,255,0.95)";
            this.ctx.strokeStyle = PALETTE.OUTLINE;
            this.ctx.lineWidth = 3;
            const hint = "Press Enter / F to continue";
            this.ctx.strokeText(hint, cx, SCREEN_HEIGHT - 56);
            this.ctx.fillText(hint, cx, SCREEN_HEIGHT - 56);
            this.ctx.textAlign = "left";
            this.ctx.textBaseline = "alphabetic";
            return;
        }
        const { panelW, panelH, panelX, panelY, itemW, itemH, rowPitch, titleY, startY } = this.getGameOverMenuLayout();
        const options = ["Restart match", "Change character", "Main menu"];
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(panelX, panelY, panelW, panelH);
        this.ctx.strokeRect(panelX, panelY, panelW, panelH);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "bold 26px 'Arial', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("What's next?", cx, titleY);
        const borderW = 3;
        for (let i = 0; i < options.length; i++) {
            const x = (SCREEN_WIDTH - itemW) / 2;
            const y = startY + i * rowPitch;
            const over = this.isMouseInRect(x, y, itemW, itemH);
            const selected = this.gameOverMenuIndex === i;
            this.ctx.fillStyle = selected || over ? PALETTE.PASTEL_BLUE : PALETTE.WHITE;
            this.ctx.strokeStyle = PALETTE.OUTLINE;
            this.ctx.lineWidth = borderW;
            this.ctx.fillRect(x, y, itemW, itemH);
            this.ctx.strokeRect(x, y, itemW, itemH);
            this.ctx.fillStyle = PALETTE.BLACK;
            this.ctx.font = "bold 18px 'Arial', sans-serif";
            this.ctx.fillText(options[i], cx, y + itemH / 2);
        }
        this.ctx.font = "13px 'Arial', sans-serif";
        this.ctx.fillStyle = "#333333";
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }
}
FightingGameEngine.CONTROLS_INTRO_STORAGE_KEY = "ww_w_seen_controls_intro_v1";
const game = new FightingGameEngine();
game.start();
