const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const BASE_GROUND_Y = 860; // the floor (ground level)

// Screen Resolution
const SCREEN_WIDTH = 768;  // Match per-arena tile aspect (square)
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
    OUTLINE: "#000000",  // Thick black outlines
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
function darkenColor(color: string, amount: number): string {
    const r = parseInt(color.slice(1, 3), 16); // red ( power ranger style )
    const g = parseInt(color.slice(3, 5), 16); // green ( steph curry style )
    const b = parseInt(color.slice(5, 7), 16); // blue  ( blue beetle I guess)
    return `#${Math.max(0, r - amount).toString(16).padStart(2, '0')}${Math.max(0, g - amount).toString(16).padStart(2, '0')}${Math.max(0, b - amount).toString(16).padStart(2, '0')}`;
}

function lightenColor(color: string, amount: number): string {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `#${Math.min(255, r + amount).toString(16).padStart(2, '0')}${Math.min(255, g + amount).toString(16).padStart(2, '0')}${Math.min(255, b + amount).toString(16).padStart(2, '0')}`;
}

// --- Sprite Animation System ---
// I need to give credit to the sprite artists for the characters I use in this game.
// Character sprite configuration
interface CharacterSprites {
    idle: string;
    run: string;
    walk?: string;
    attack1: string;
    attack2?: string;
    attack3?: string;
    attack4?: string;
    death: string;
    fall: string;
    getHit: string;
    jump?: string; // I don't think any of the characters in this game jump but just in case atleast the images I got from the artist dont have a jump animation
}

// Character Preview Image Paths ( some don't have a solo shot so I gotta do some screen shots from the site lol)
const CHARACTER_PREVIEW_PATHS: { [key: string]: string } = {
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
const CHARACTER_SPRITE_PATHS: { [key: string]: CharacterSprites } = {
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
enum AnimationType {
    IDLE,
    RUN,
    WALK,
    ATTACK1,
    ATTACK2,
    ATTACK3,
    DEATH,
    FALL,
    GET_HIT,
    BLOCK
}

// Sprite frame loader for individual animation files
class SpriteFrameLoader {
    private images: Map<string, HTMLImageElement> = new Map();
    private loadingPromises: Map<string, Promise<void>> = new Map();
    
    loadSprite(path: string): Promise<HTMLImageElement | null> {
        if (this.images.has(path)) {
            return Promise.resolve(this.images.get(path)!);
        }
        
        if (this.loadingPromises.has(path)) {
            return this.loadingPromises.get(path)!.then(() => this.images.get(path) || null);
        }
        
        const promise = new Promise<void>((resolve, reject) => {
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
    
    getSprite(path: string): HTMLImageElement | null {
        return this.images.get(path) || null;
    }
    
    isLoaded(path: string): boolean {
        return this.images.has(path);
    }
}

// Global sprite loader
const spriteLoader = new SpriteFrameLoader();

// Helper function to get frame count from a sprite sheet image
function getFrameCountFromSprite(img: HTMLImageElement): number {
    // Most sprite sheets are horizontal strips, estimate frame count
    // Assuming each frame is roughly square or slightly wider than tall
    const estimatedFrameWidth = img.height; // Assume frames are roughly square
    return Math.max(1, Math.floor(img.width / estimatedFrameWidth));
}

class SpriteAnimation {
    type: AnimationType;
    spritePath: string;
    frameCount: number = 0;
    frameDuration: number;
    currentFrame: number = 0;
    frameTimer: number = 0;
    loop: boolean = true;
    frameWidth: number = 0;
    frameHeight: number = 0;
    
    constructor(type: AnimationType, spritePath: string, frameDuration: number = 8, loop: boolean = true) {
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
    
    update(speedMultiplier: number = 1.0): void {
        const img = spriteLoader.getSprite(this.spritePath);
        if (!img) return;
        
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
                } else {
                    this.currentFrame = this.frameCount - 1;
                }
            }
        }
    }
    
    reset(): void {
        this.currentFrame = 0;
        this.frameTimer = 0;
    }
    
    getCurrentFrameX(): number {
        return this.currentFrame * this.frameWidth;
    }
    
    getFrameWidth(): number {
        return this.frameWidth || 64; // Default fallback
    }
    
    getFrameHeight(): number {
        return this.frameHeight || 64; // Default fallback
    }
    
    getSprite(): HTMLImageElement | null {
        return spriteLoader.getSprite(this.spritePath);
    }
}

// --- Interfaces & Types for Structure ---

// Game States
enum GameState {
    MENU,
    CHARACTER_SELECT_P1,
    CHARACTER_SELECT_P2,
    CHARACTER_DETAILS,
    ARENA_SELECT,
    ARENA_DETAILS,
    FIGHTING,
    PAUSED,
    ROUND_END,
    GAME_OVER,
    HELP
}

// Game Modes enum
enum GameMode {
    OneVsOneAI,      // Player vs AI
    OneVsOnePvP,     // Player vs Player
    OneVsTwo,
    TwoVsTwo
}

// Input state tracking
interface InputState {
    up: boolean; down: boolean; left: boolean; right: boolean;
    btnA: boolean; // Punch / Confirm
    btnB: boolean; // Kick
    help: boolean; // Help key (H)
    pause: boolean; // Pause key (ESC)
}

// Define what makes a fighter unique (for the roster)
interface FighterConfig {
    id: string;
    name: string;
    baseSpeed: number;
    basePower: number;
    colorAccent: string; 
    spriteKey: string; // Key to CHARACTER_SPRITE_PATHS
    /** 1 = default box; >1 larger hitbox + draw (e.g. bulky characters). */
    sizeScale: number;
}

// Fighter States - Enhanced with Ground/Air distinction
enum FighterState {
    IDLE = 0,
    MOVING = 1,
    ATTACKING = 2,
    STUNNED = 3,
    BLOCKING = 4,
    DEFEATED = 5,
    // Ground/Air states
    GROUNDED = 10,    // Explicitly grounded state
    AIRBORNE = 11,    // In the air (jumping/falling)
    LANDING = 12      // Transitioning from air to ground
}

// Ground detection and physics constants
const GROUND_DETECTION_RAY_LENGTH = 10; // Pixels to check below feet
const GROUND_SNAP_THRESHOLD = 5; // Max distance to snap to ground
const GRAVITY = 0.8; // Gravity force (base coords per frame)
const JUMP_VELOCITY = -12; // Initial upward velocity (base coords per frame)
const GROUND_FRICTION = 0.85; // Friction when grounded
const AIR_FRICTION = 0.95; // Friction when airborne (less resistance)

// Attack Types
enum AttackType {
    PUNCH_LIGHT, KICK_HEAVY, FINISHER
}

enum AttackPhase {
    STARTUP,
    ACTIVE,
    RECOVERY
}


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
const ARENA_NAMES: string[] = [
    "AYY ITS HOT HERE", "WOW A GLADIATOR", "WANNA READ ABOUT MAGIC", "DIAMONDS ARE HARD",
    "AYYYY IS THIS HELL", "DAMN A SACRIFICE", "AHHH A PORTAL", "BIG RUBBY I THINK?",
    "NO WATER HERE", "SHIT WHATS MY FORTUNE", "MAN ANOTHER SUMMONING", "THE FLOOR IS LAVA",
];

function getArenaDisplayName(index: number): string {
    const name = ARENA_NAMES[index];
    return name !== undefined && name.length > 0 ? name : `Arena ${index + 1}`;
}

const ROSTER_NAME_OVERRIDES: Record<string, string> = {
    "Medieval Warrior Pack 2": "Medieval Warrior",
    "Medieval Warrior Pack 3": "Medieval Warrior 3",
    "Evil Wizard 3": "Evil Wizard"
};

type RosterTuning = { baseSpeed: number; basePower: number; colorAccent: string; sizeScale?: number };

const ROSTER_TUNING: Record<string, RosterTuning> = {
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

const DEFAULT_ROSTER_TUNING: RosterTuning = { baseSpeed: 3, basePower: 10, colorAccent: PALETTE.PASTEL_BLUE };

const FIGHTER_ROSTER: FighterConfig[] = AVAILABLE_CHARACTERS.map((spriteKey, idx) => {
    const tuning = ROSTER_TUNING[spriteKey] || DEFAULT_ROSTER_TUNING;
    return {
        id: `f${idx + 1}`,
        name: ROSTER_NAME_OVERRIDES[spriteKey] || spriteKey,
        baseSpeed: tuning.baseSpeed,
        basePower: tuning.basePower,
        colorAccent: tuning.colorAccent,
        spriteKey,
        sizeScale: tuning.sizeScale ?? 1,
    };
});


// Input and AI logic moved to input_ai.ts


// Visual effects for hits
interface HitEffect {
    x: number;
    y: number;
    life: number;
    maxLife: number;
    blocked?: boolean;
}

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
enum CollisionLayer {
    HIGH = 0,    // High priority attacks (finishers)
    MID = 1,     // Normal attacks
    LOW = 2,     // Low attacks
    THROW = 3,   // Throws/grabs
    SCAN = 4,    // Hurt / probe layers (and default body hurtboxes in generated data)
    PUSH = 5,    // Reserved for future pushbox vs pushbox (article “stay away from me” boxes)
}

// Hitbox/Hurtbox in base coordinates (relative to fighter pivot at feet)
interface CollisionBox {
    x: number;      // X offset from pivot (base coords)
    y: number;      // Y offset from pivot (base coords, negative = up)
    width: number;  // Width (base coords)
    height: number; // Height (base coords)
    layer: CollisionLayer;
}

// Attack frame data with active frames
interface AttackFrameData {
    frame: number;              // Frame number in animation
    hitboxes: CollisionBox[];   // Hitboxes for this frame
    hurtboxes: CollisionBox[];  // Hurtboxes for this frame
}

// Attack definition with frame data
interface AttackDefinition {
    type: AttackType;
    activeStart: number;        // First frame where hitboxes are active
    activeEnd: number;          // Last frame where hitboxes are active
    startupFrames: number;
    activeFrames: number;
    recoveryFrames: number;
    totalFrames: number;
    frameData: AttackFrameData[]; // Per-frame collision data
    damage: number;
    stunTime: number;
    knockback: number;          // In base coords
    energyCost: number;
    energyGain: number;
    canBeBlocked: boolean;
    layer: CollisionLayer;
}

// Helper function to convert base coordinates to screen coordinates
function baseToScreen(baseValue: number): number {
    return Math.round(baseValue * SCALE);
}

// Helper function to convert screen coordinates to base coordinates
function screenToBase(screenValue: number): number {
    return screenValue / SCALE;
}

class FighterEntity {
    private static groundSampleCanvas: HTMLCanvasElement | null = null;
    private static groundSampleCtx: CanvasRenderingContext2D | null = null;

    // World coordinates (screen space, scaled)
    x: number; 
    y: number;
    z: number = 0; // For jumps/airborne state (base coords)
    velocityX: number = 0; 
    velocityY: number = 0;
    velocityZ: number = 0; // Vertical velocity for jumps
    
    // Dimensions in screen space (scaled)
    width: number = STANDARD_FIGHTER_WIDTH;
    height: number = STANDARD_FIGHTER_HEIGHT;
    
    // Foot pivot point offset (base coords) - distance from sprite bottom to feet
    footOffset: number = 0;
    
    facingRight: boolean = true;

    maxHp: number = 100;
    hp: number = 100;
    maxEnergy: number = 100;
    energy: number = 0;

    state: FighterState = FighterState.IDLE;
    config: FighterConfig;
    
    // Cooldowns and frame timers
    attackCooldown: number = 0;
    stunTimer: number = 0;
    /** Frames of hit stun applied by the last hit (for HUD bar drain). */
    hitStunDisplayFrames: number = 0;
    /** Hits landed in the current combo; increments only if defender was already in hit stun. */
    comboCounter: number = 0;
    frameTimer: number = 0; // Current frame of action
    currentAttackType: AttackType | null = null;
    currentAttackDef: AttackDefinition | null = null;
    
    // One-hit-per-attack tracking
    alreadyHitTargets: Set<FighterEntity> = new Set();

    /** Fired when this fighter deals damage to the opponent via processHit (optional; used for AI). */
    onHitDealt?: () => void;
    /** Fired when this fighter loses HP from an attack (amount > 0). */
    onHitTaken?: () => void;
    
    // Visual effects
    hitEffects: HitEffect[] = [];
    animFrame: number = 0; // Animation frame counter
    
    // Ground state and physics
    isGrounded: boolean = true;
    groundDistance: number = 0; // Distance to ground (for detection)
    lastGroundCheck: number = 0; // Frame counter for ground checks
    groundSnapActive: boolean = true; // Whether to snap to ground
    
    // Character mirroring state
    mirrorX: number = 0; // X position for mirroring calculations
    
    // Sprite-based animation
    currentAnimation: SpriteAnimation | null = null;
    idleAnimation: SpriteAnimation;
    walkRightAnimation: SpriteAnimation;
    walkLeftAnimation: SpriteAnimation;
    hurtAnimation: SpriteAnimation;
    deathAnimation: SpriteAnimation;
    blockAnimation: SpriteAnimation;
    jumpAnimation: SpriteAnimation;
    attack1Animation: SpriteAnimation;
    attack2Animation: SpriteAnimation;
    attack3Animation: SpriteAnimation;
    groundOffsetPx: number = 0;
    groundOffsetResolved: boolean = false;

    constructor(x: number, config: FighterConfig, facingRight: boolean) {
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
        const runPath = sprites?.run || sprites?.idle || "";
        const walkPath = sprites?.walk || runPath;
        
        this.idleAnimation = new SpriteAnimation(AnimationType.IDLE, sprites?.idle || "", 6, true);
        this.walkRightAnimation = new SpriteAnimation(AnimationType.RUN, runPath, 3, true);
        this.walkLeftAnimation = new SpriteAnimation(AnimationType.RUN, runPath, 3, true); // Same sprite, will flip
        this.hurtAnimation = new SpriteAnimation(AnimationType.GET_HIT, sprites?.getHit || sprites?.fall || "", 6, false);
        this.deathAnimation = new SpriteAnimation(AnimationType.DEATH, sprites?.death || "", 12, false);
        this.blockAnimation = new SpriteAnimation(AnimationType.BLOCK, sprites?.idle || "", 8, true); // Use idle for block
        this.jumpAnimation = new SpriteAnimation(AnimationType.FALL, sprites?.jump || sprites?.fall || sprites?.idle || "", 8, true);
        this.attack1Animation = new SpriteAnimation(AnimationType.ATTACK1, sprites?.attack1 || sprites?.attack2 || sprites?.attack3 || "", 6, false);
        this.attack2Animation = new SpriteAnimation(AnimationType.ATTACK2, sprites?.attack2 || sprites?.attack1 || "", 6, false);
        this.attack3Animation = new SpriteAnimation(AnimationType.ATTACK3, sprites?.attack3 || sprites?.attack1 || "", 8, false);
        
        // Preload all sprites
        if (sprites) {
            Object.values(sprites).forEach(path => {
                if (path) spriteLoader.loadSprite(path);
            });
        }
        
        // Start with idle animation
        this.currentAnimation = this.idleAnimation;
    }
    
    updateAnimation(): void {
        // Determine which animation to use based on state
        let targetAnimation: SpriteAnimation | null = null;
        
        if (this.state === FighterState.DEFEATED) {
            targetAnimation = this.deathAnimation;
        } else if (this.state === FighterState.STUNNED) {
            targetAnimation = this.hurtAnimation;
        } else if (this.state === FighterState.BLOCKING) {
            targetAnimation = this.blockAnimation;
        } else if (this.state === FighterState.AIRBORNE || this.state === FighterState.LANDING) {
            targetAnimation = this.jumpAnimation;
        } else if (this.state === FighterState.ATTACKING) {
            // Select attack animation based on attack type
            if (this.currentAttackType === AttackType.FINISHER) {
                targetAnimation = this.attack3Animation;
            } else if (this.currentAttackType === AttackType.KICK_HEAVY) {
                targetAnimation = this.attack2Animation;
            } else {
                targetAnimation = this.attack1Animation;
            }
            // Reset attack animation when starting
            if (this.frameTimer === 0) {
                targetAnimation.reset();
            }
        } else if (this.state === FighterState.MOVING) {
            targetAnimation = this.facingRight ? this.walkRightAnimation : this.walkLeftAnimation;
        } else {
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
    checkGround(): { isGrounded: boolean; distance: number } {
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
        if (!this.groundSnapActive) return;
        
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
            } else if (this.state === FighterState.LANDING) {
                // Transition from landing to appropriate ground state
                if (this.velocityX !== 0) {
                    this.state = FighterState.MOVING;
                } else {
                    this.state = FighterState.IDLE;
                }
            }
        } else if (groundCheck.distance > GROUND_SNAP_THRESHOLD || this.velocityZ !== 0) {
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
        } else {
            this.velocityX *= AIR_FRICTION;
        }
    }
    
    // Character mirroring - automatically flip when crossing sides
    updateMirroring(opponent: FighterEntity) {
        // Keep each fighter facing the opponent in neutral/stun states.
        // During attacks we keep facing locked to preserve move direction.
        if (this.state !== FighterState.ATTACKING) {
            this.facingRight = this.x < opponent.x;
        }
        this.mirrorX = this.x;
    }

    /** Crouch guard only (no stand / back-to-block). */
    private shouldEnterBlock(input: InputState): boolean {
        return this.isGrounded && input.down;
    }

    update(input: InputState, opponent: FighterEntity, inputHandler: InputHandler | null = null) {
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
        if (this.attackCooldown > 0) this.attackCooldown--;

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
            if (this.isGrounded) this.state = FighterState.MOVING;
            this.animFrame++;
        } else if (input.right) {
            // Scale movement speed for new resolution
            this.velocityX = this.config.baseSpeed * 5;
            this.facingRight = true;
            if (this.isGrounded) this.state = FighterState.MOVING;
            this.animFrame++;
        } else {
            this.animFrame++;
        }

        // Apply movement (horizontal only - fighters stay on ground)
        this.x += this.velocityX;
        // Enforce screen boundaries - fighters can never go off screen
        const minX = 0;
        const maxX = SCREEN_WIDTH - this.width;
        this.x = Math.max(minX, Math.min(maxX, this.x));
        
        // Ensure fighter stays within bounds even after movement
        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX;
        
        // Always maintain ground alignment - fighters never move vertically
        // All fighters' bottom edge aligns to GROUND_Y = 500
        // The draw() method will set the correct position based on actual sprite dimensions
        // We don't set Y here to avoid conflicts - draw() handles it every frame

        // --- Attacks ---
        if (this.attackCooldown === 0) {
            const requestedAttack = inputHandler?.consumeAttackRequest(this.facingRight, this.energy >= this.maxEnergy) || null;
            if (requestedAttack !== null) {
                this.startAttack(requestedAttack);
            } else {
                // Fallback direct inputs for non-buffered controllers/AI.
                if (input.btnA && input.btnB && this.energy >= this.maxEnergy) this.startAttack(AttackType.FINISHER);
                else if (input.btnA) this.startAttack(AttackType.PUNCH_LIGHT);
                else if (input.btnB) this.startAttack(AttackType.KICK_HEAVY);
            }
        }
        
        // Update animation
        this.updateAnimation();
    }

    // Get attack definition for a given attack type
    getAttackDefinition(type: AttackType): AttackDefinition {
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
    generateDefaultFrameData(type: AttackType, totalFrames: number): AttackFrameData[] {
        const frames: AttackFrameData[] = [];
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
            const hitboxes: CollisionBox[] = [];
            const hurtboxes: CollisionBox[] = [];
            
            // Add hitbox during active frames
            if (frame >= activeStart && frame <= activeEnd) {
                const t = (frame - activeStart) / Math.max(1, activeEnd - activeStart);
                const reach = reachMinBase + (reachMaxBase - reachMinBase) * (0.88 + 0.12 * Math.sin(Math.PI * t));
                const hitboxHeight = baseHeight * (0.9 + 0.2 * Math.sin(Math.PI * t));
                // IMPORTANT: Frame data is authored in canonical "facing right" space.
                // transformCollisionBox() handles left-facing mirroring.
                // x = 0: leading edge from feet-center (forward extension), not inset into the body.
                const hitboxX = screenToBase(this.width /2);
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

    startAttack(type: AttackType) {
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

    getAttackPhase(): AttackPhase | null {
        if (!this.currentAttackDef || this.state !== FighterState.ATTACKING) return null;
        if (this.frameTimer < this.currentAttackDef.activeStart) return AttackPhase.STARTUP;
        if (this.frameTimer <= this.currentAttackDef.activeEnd) return AttackPhase.ACTIVE;
        return AttackPhase.RECOVERY;
    }

    /** Screen Y of feet line — must match sprite placement (GROUND_Y + trim + jump). */
    private getFeetWorldY(): number {
        if (!this.groundOffsetResolved && this.idleAnimation.getSprite()) this.resolveGroundOffset();
        return GROUND_Y + this.groundOffsetPx + baseToScreen(this.z);
    }

    // Transform collision box from base coords (relative to feet pivot) to world coords (screen space)
    transformCollisionBox(box: CollisionBox): { x: number; y: number; w: number; h: number } {
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
    getBodyHurtboxWorld(): { x: number; y: number; w: number; h: number } {
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
    getHurtboxesWorld(): { x: number; y: number; w: number; h: number }[] {
        const { hurtboxes } = this.getCurrentFrameCollisionBoxes();
        if (hurtboxes.length === 0) return [this.getBodyHurtboxWorld()];
        return hurtboxes.map((hb) => this.transformCollisionBox(hb));
    }
    
    /** Axis-aligned rectangle overlap (standard 2D fighting-game hit vs hurt test). */
    checkAABBCollision(box1: { x: number; y: number; w: number; h: number }, 
                       box2: { x: number; y: number; w: number; h: number }): boolean {
        return box1.x < box2.x + box2.w &&
               box1.x + box1.w > box2.x &&
               box1.y < box2.y + box2.h &&
               box1.y + box1.h > box2.y;
    }
    
    // Get current frame's hitboxes and hurtboxes
    getCurrentFrameCollisionBoxes(): { hitboxes: CollisionBox[]; hurtboxes: CollisionBox[] } {
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
        const frameData = this.currentAttackDef.frameData.find((fd: AttackFrameData) => fd.frame === currentFrame);
        
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

    checkAttackCollision(opponent: FighterEntity) {
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
        if (gap > maxWeaponPx + 12) return;
        
        const { hitboxes } = this.getCurrentFrameCollisionBoxes();
        const defenderHurts = opponent.getHurtboxesWorld();

        for (const hitbox of hitboxes) {
            const worldHitbox = this.transformCollisionBox(hitbox);
            for (const hurt of defenderHurts) {
                if (!this.checkAABBCollision(worldHitbox, hurt)) continue;

                const overlapLeft = Math.max(worldHitbox.x, hurt.x);
                const overlapTop = Math.max(worldHitbox.y, hurt.y);
                const overlapRight = Math.min(worldHitbox.x + worldHitbox.w, hurt.x + hurt.w);
                const overlapBottom = Math.min(worldHitbox.y + worldHitbox.h, hurt.y + hurt.h);
                const overlapW = overlapRight - overlapLeft;
                const overlapH = overlapBottom - overlapTop;
                if (overlapW <= 0 || overlapH <= 0) continue;

                const impactX = overlapLeft + overlapW / 2;
                const impactY = overlapTop + overlapH / 2;
                this.processHit(opponent, impactX, impactY);
                this.alreadyHitTargets.add(opponent);
                return;
            }
        }
    }
    
    processHit(opponent: FighterEntity, impactX: number, impactY: number) {
        if (!this.currentAttackDef) return;
        
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
                } else {
                    opponent.takeDamage(blockedDamage, 0, 0); // No stun, no knockback
                }
                if (blockedDamage > 0) this.onHitDealt?.();
                
                this.energy = Math.min(this.maxEnergy, this.energy + energyGain);
                
                // Add block effect
                opponent.hitEffects.push({ x: impactX, y: impactY, life: 8, maxLife: 8, blocked: true });
                console.log(`${opponent.config.name} blocked the attack!`);
            } else {
            // HIT CONFIRMED — combo counts only while defender remains in hit stun
            const defenderInHitstun = opponent.stunTimer > 0;
            if (defenderInHitstun) this.comboCounter++;
            else this.comboCounter = 1;

            const knockbackScreen = baseToScreen(attackDef.knockback);
            const knockbackX = this.facingRight ? knockbackScreen : -knockbackScreen;
            
            opponent.takeDamage(attackDef.damage, attackDef.stunTime, knockbackX);
            this.onHitDealt?.();
            this.energy = Math.min(this.maxEnergy, this.energy + attackDef.energyGain);
                
                // Add hit effect
                opponent.hitEffects.push({ x: impactX, y: impactY, life: 10, maxLife: 10 });
            console.log(`${this.config.name} hit ${opponent.config.name} for ${attackDef.damage} damage!`);
        }
    }

    takeDamage(amount: number, stunFrames: number, knockbackX: number) {
        if (this.state === FighterState.DEFEATED) return;
        if (amount > 0) {
            this.onHitTaken?.();
            this.comboCounter = 0;
        }
        this.hp = Math.max(0, this.hp - amount);
        this.stunTimer = stunFrames;
        if (stunFrames > 0) this.hitStunDisplayFrames = stunFrames;
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
    private getDrawableAnimation(): SpriteAnimation | null {
        const tryAnim = (a: SpriteAnimation | null | undefined): SpriteAnimation | null => {
            if (!a || !a.spritePath) return null;
            return spriteLoader.getSprite(a.spritePath) ? a : null;
        };
        return tryAnim(this.currentAnimation) || tryAnim(this.idleAnimation);
    }

    draw(ctx: CanvasRenderingContext2D) {
        const centerX = this.x + this.width / 2;
        if (!this.groundOffsetResolved && this.idleAnimation.getSprite()) this.resolveGroundOffset();
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
                } else {
                    drawWidth = Math.round(drawHeight * frameAspect);
                }

                const drawX = this.x + Math.round((this.width - drawWidth) / 2);
                const drawY = GROUND_Y - drawHeight + this.groundOffsetPx + baseToScreen(this.z);

                this.y = GROUND_Y - this.height + this.groundOffsetPx + baseToScreen(this.z);
                this.isGrounded = (this.z === 0 && this.velocityZ === 0);

                const minX = 0;
                const maxX = SCREEN_WIDTH - this.width;
                if (this.x < minX) this.x = minX;
                if (this.x > maxX) this.x = maxX;

                const needsFlip = !this.facingRight;

                if (needsFlip) {
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(
                        sprite,
                        frameX, 0, frameWidth, frameHeight,
                        -drawX - drawWidth, drawY, drawWidth, drawHeight
                    );
                    ctx.restore();
                } else {
                    ctx.drawImage(
                        sprite,
                        frameX, 0, frameWidth, frameHeight,
                        drawX, drawY, drawWidth, drawHeight
                    );
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
            } else {
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

    private static getSamplingContext(): CanvasRenderingContext2D | null {
        if (!FighterEntity.groundSampleCanvas) {
            FighterEntity.groundSampleCanvas = document.createElement("canvas");
            FighterEntity.groundSampleCtx = FighterEntity.groundSampleCanvas.getContext("2d", { willReadFrequently: true });
        }
        return FighterEntity.groundSampleCtx;
    }

    private computeBottomTransparentRows(img: HTMLImageElement, frameX: number, frameWidth: number, frameHeight: number): number {
        const sampleCtx = FighterEntity.getSamplingContext();
        if (!sampleCtx) return 0;

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
        } catch (err) {
            return 0;
        }

        return 0;
    }

    private resolveGroundOffset(): void {
        const idleSprite = this.idleAnimation.getSprite();
        if (!idleSprite) return;

        const frameHeight = idleSprite.height || 1;
        const frameWidth = frameHeight;
        const bottomTrim = this.computeBottomTransparentRows(idleSprite, 0, frameWidth, frameHeight);
        const offsetScale = this.height / frameHeight;
        // Keep auto-grounding conservative so fighters don't appear to hover.
        this.groundOffsetPx = Math.max(-4, Math.min(16, Math.round(bottomTrim * offsetScale)));
        this.groundOffsetResolved = true;
    }
}
