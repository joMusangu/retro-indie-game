// ─── Types ──────────────────────────────────────────────────────────────────

interface InputState {
    up: boolean; down: boolean; left: boolean; right: boolean;
    btnA: boolean; btnB: boolean; help: boolean; pause: boolean;
}

type InputAction = keyof InputState;

// Direction code: "N" | "U" | "D" | "L" | "R" | "UL" | "UR" | "DL" | "DR"
type DirectionCode = string;

interface FighterEntity {
    x: number; y: number; width: number; height: number;
    state: FighterState; frameTimer: number;
    attackCooldown: number; energy: number; maxEnergy: number;
    facingRight: boolean;
}

// ─── InputHandler ────────────────────────────────────────────────────────────

/** Key → action mappings for each player configuration. */
const P1_KEY_MAP: Record<string, InputAction> = {
    w: "up", W: "up", ArrowUp: "up",
    s: "down", S: "down", ArrowDown: "down",
    a: "left", A: "left", ArrowLeft: "left",
    d: "right", D: "right", ArrowRight: "right",
    f: "btnA", F: "btnA",
    g: "btnB", G: "btnB",
};

const P2_KEY_MAP: Record<string, InputAction> = {
    ArrowUp: "up", ArrowDown: "down",
    ArrowLeft: "left", ArrowRight: "right",
    Numpad1: "btnA", "1": "btnA",
    Numpad2: "btnB", "2": "btnB",
};

const SHARED_KEY_MAP: Record<string, InputAction> = {
    h: "help", H: "help", "?": "help",
    Escape: "pause", Esc: "pause",
    Enter: "btnA",
};

function makeEmptyState(): InputState {
    return { up: false, down: false, left: false, right: false,
             btnA: false, btnB: false, help: false, pause: false };
}

interface BufferedInput { direction: DirectionCode; btnA: boolean; btnB: boolean; }

class InputHandler {
    keys: InputState = makeEmptyState();
    private previousKeys: InputState = makeEmptyState();
    private inputBuffer: BufferedInput[] = [];
    readonly maxBufferFrames = 30;

    private readonly playerMap: Record<string, InputAction>;

    /**
     * @param isPlayer2 Key map when listening to keyboard.
     * @param attachKeyboard Set false for synthetic input (e.g. AI) so rising-edge / buffer logic still runs.
     */
    constructor(isPlayer2 = false, attachKeyboard = true) {
        this.playerMap = isPlayer2 ? P2_KEY_MAP : P1_KEY_MAP;
        if (attachKeyboard) {
            window.addEventListener("keydown", (e) => this.setKey(e.key, true));
            window.addEventListener("keyup",   (e) => this.setKey(e.key, false));
        }
    }

    /** Apply external input (AI); does not touch previousKeys — use finalizeFrame at end of tick. */
    setKeysFromState(state: InputState): void {
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
    resetInputTracking(): void {
        this.keys = makeEmptyState();
        this.previousKeys = makeEmptyState();
        this.inputBuffer = [];
    }

    private setKey(key: string, pressed: boolean): void {
        const sharedAction = SHARED_KEY_MAP[key];
        if (sharedAction) { this.keys[sharedAction] = pressed; return; }

        const playerAction = this.playerMap[key];
        if (playerAction) this.keys[playerAction] = pressed;
    }

    updateFrame(): void {
        this.inputBuffer.push({
            direction: this.getDirectionCode(),
            btnA: this.keys.btnA,
            btnB: this.keys.btnB,
        });
        if (this.inputBuffer.length > this.maxBufferFrames) this.inputBuffer.shift();
    }

    finalizeFrame(): void {
        this.previousKeys = { ...this.keys };
    }

    wasPressed(action: InputAction): boolean {
        return this.keys[action] && !this.previousKeys[action];
    }

    getDirectionCode(): DirectionCode {
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
    detectQuarterCircleForward(facingRight: boolean, lookbackFrames = 15): boolean {
        const recent = this.inputBuffer.slice(-Math.min(lookbackFrames, this.inputBuffer.length));
        if (recent.length < 3) return false;

        const fwd  = facingRight ? "R"  : "L";
        const dfwd = facingRight ? "DR" : "DL";

        // Single-pass state machine (reading forward in time)
        let stage = 0; // 0=need D, 1=need Dfwd, 2=need Fwd
        for (const { direction: dir } of recent) {
            switch (stage) {
                case 0: if (dir === "D" || dir === dfwd) stage = 1; break;
                case 1: if (dir === dfwd)                stage = 2; break;
                case 2: if (dir === fwd  || dir === dfwd) return true; break;
            }
        }
        return false;
    }

    consumeAttackRequest(facingRight: boolean, canUseFinisher: boolean): AttackType | null {
        const a = this.wasPressed("btnA");
        const b = this.wasPressed("btnB");

        if (canUseFinisher) {
            const combo = (a && this.keys.btnB) || (b && this.keys.btnA);
            const qcf   = a && this.detectQuarterCircleForward(facingRight, 15);
            if (combo || qcf) return AttackType.FINISHER;
        }

        if (b) return AttackType.KICK_HEAVY;
        if (a) return AttackType.PUNCH_LIGHT;
        return null;
    }
}

// ─── AIController ────────────────────────────────────────────────────────────

const enum AiDecision { ATTACK_LIGHT, ATTACK_HEAVY, FINISHER, ADVANCE, RETREAT, BLOCK, IDLE }

interface AiConfig {
    /** Base frequency, in frames, between reconsiderations. */
    thinkIntervalMin: number;
    thinkIntervalMax: number;
    /** 0–1; chance to advance when in mid-range. */
    baseAggression: number;
    attackRange: number;
    approachRange: number;
}

const DEFAULT_AI_CONFIG: AiConfig = {
    thinkIntervalMin: 18,
    thinkIntervalMax: 34,
    baseAggression: 0.45,
    attackRange: 340,
    approachRange: 560,
};

class AIController {
    private frame = 0;
    private nextThink = 0;
    private lastDecision: AiDecision = AiDecision.IDLE;

    /** Tracks consecutive hits landed; raises aggression after a combo run. */
    private consecutiveHits = 0;

    readonly config: AiConfig;

    constructor(config: Partial<AiConfig> = {}) {
        this.config = { ...DEFAULT_AI_CONFIG, ...config };
    }

    /** Call when a hit lands to adjust AI pressure. */
    onHitLanded(): void { this.consecutiveHits = Math.min(this.consecutiveHits + 1, 5); }
    /** Call when the AI is staggered/stunned. */
    onHitReceived(): void { this.consecutiveHits = 0; }

    private get effectiveAggression(): number {
        // Each consecutive hit adds 6% extra aggression, capped at 0.95.
        return Math.min(0.95, this.config.baseAggression + this.consecutiveHits * 0.06);
    }

    // ── Contextual helpers ───────────────────────────────────────────────────

    private isOpponentRight(self: FighterEntity, opponent: FighterEntity): boolean {
        return (opponent.x + opponent.width / 2) > (self.x + self.width / 2);
    }

    private distance(self: FighterEntity, opponent: FighterEntity): number {
        return Math.abs((self.x + self.width / 2) - (opponent.x + opponent.width / 2));
    }

    /**
     * Assess how immediately threatening the opponent is on a 0–1 scale.
     * High when opponent is attacking, in range, and has low frame lag.
     */
    private threatLevel(self: FighterEntity, opponent: FighterEntity): number {
        if (opponent.state !== FighterState.ATTACKING) return 0;
        const dist = this.distance(self, opponent);
        if (dist >= this.config.attackRange) return 0;
        // More frames into the attack = less threat (they've committed).
        const frameDanger = Math.max(0, 1 - opponent.frameTimer / 20);
        return frameDanger * (1 - dist / this.config.attackRange);
    }

    // ── Decision sub-routines ────────────────────────────────────────────────

    private decideUnderThreat(self: FighterEntity, dist: number): AiDecision {
        // If we can punish with a counter, do so (30% chance).
        if (self.attackCooldown === 0 && dist > this.config.attackRange && Math.random() < 0.30)
            return AiDecision.ATTACK_LIGHT;
        // Otherwise: 60% chance to block, 40% to back away.
        return Math.random() < 0.60 ? AiDecision.BLOCK : AiDecision.RETREAT;
    }

    private decideAtRange(self: FighterEntity): AiDecision {
        if (self.attackCooldown > 0) return AiDecision.ADVANCE; // pressure while cooling down

        const canFinish = self.energy >= self.maxEnergy;
        const r = Math.random();

        if (canFinish && r < 0.40)        return AiDecision.FINISHER;
        if (r < 0.45)                     return AiDecision.ATTACK_LIGHT;
        if (r < 0.75)                     return AiDecision.ATTACK_HEAVY;
        return AiDecision.RETREAT; // feint/spacing
    }

    private decideMidRange(): AiDecision {
        return Math.random() < this.effectiveAggression
            ? AiDecision.ADVANCE
            : (Math.random() < 0.20 ? AiDecision.ATTACK_HEAVY : AiDecision.IDLE);
    }

    private chooseDecision(self: FighterEntity, opponent: FighterEntity): AiDecision {
        const dist   = this.distance(self, opponent);
        const threat = this.threatLevel(self, opponent);

        if (threat > 0.4)                        return this.decideUnderThreat(self, dist);
        if (dist <= this.config.attackRange)     return this.decideAtRange(self);
        if (dist > this.config.approachRange)    return AiDecision.ADVANCE;
        return this.decideMidRange();
    }

    // ── Public API ───────────────────────────────────────────────────────────

    calculateInput(self: FighterEntity, opponent: FighterEntity): InputState {
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
            case AiDecision.ATTACK_LIGHT:  input.btnA = true;                             break;
            case AiDecision.ATTACK_HEAVY:  input.btnB = true;                             break;
            case AiDecision.FINISHER:      input.btnA = true; input.btnB = true;          break;
            case AiDecision.ADVANCE:
                // Move in short bursts so AI pace is less twitchy/slippery.
                if (this.frame % 3 !== 0) break;
                input.right = opponentRight;
                input.left  = !opponentRight;
                break;
            case AiDecision.RETREAT:
                if (this.frame % 3 !== 0) break;
                input.right = !opponentRight;
                input.left  = opponentRight;
                break;
            case AiDecision.BLOCK:         input.down = true;                             break;
            case AiDecision.IDLE:          /* stand still */                              break;
        }

        return input;
    }
}