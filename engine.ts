class FightingGameEngine {
    readonly roundDurationSeconds: number = 75;
    roundTimeFrames: number = 75 * FPS;
    /** True when last round ended in a tie (timeout, same damage) — show DRAW and replay same round number. */
    lastRoundWasDraw: boolean = false;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    player1Input: InputHandler;
    player2Input: InputHandler | null = null;
    /** Synthetic handler for AI vs mode: same buffer + wasPressed as human players. */
    private aiInputHandler: InputHandler;
    aiController: AIController;
    fighter1: FighterEntity | null = null;
    fighter2: FighterEntity | null = null;
    gameState: GameState = GameState.MENU;
    gameMode: GameMode = GameMode.OneVsOneAI;
    menuSelection: number = 0;
    p1Selection: number = 0;
    p2Selection: number = 0;
    arenaSelection: number = 0;
    menuCooldown: number = 0;
    p1Wins: number = 0;
    p2Wins: number = 0;
    currentRound: number = 1;
    roundEndTimer: number = 0;
    /** @deprecated kept for reset; game-over flow uses gameOverBannerTimer */
    gameOverTimer: number = 0;
    /** While > 0, show winner celebration only; then show end menu. Skip early with Enter. */
    gameOverBannerTimer: number = 0;
    gameOverMenuIndex: number = 0;
    private gameOverNavCooldown: number = 0;
    mouseX: number = 0;
    mouseY: number = 0;
    mouseClicked: boolean = false;
    detailIsP1: boolean = true;
    pauseSelection: number = 0;
    /** After opening pause with ESC held, ignore resume until ESC is released (prevents instant close). */
    pauseIgnoreEscUntilRelease: boolean = false;
    private pauseNavCooldown: number = 0;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.canvas.width = SCREEN_WIDTH;
        this.canvas.height = SCREEN_HEIGHT;
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
            if (this.gameState === GameState.CHARACTER_SELECT_P1 || this.gameState === GameState.CHARACTER_SELECT_P2) e.preventDefault();
        }, { passive: false });
        this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: false })!;
        this.ctx.imageSmoothingEnabled = true;
        (this.ctx as any).webkitImageSmoothingEnabled = true;
        (this.ctx as any).mozImageSmoothingEnabled = true;
        (this.ctx as any).msImageSmoothingEnabled = true;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.player1Input = new InputHandler(false);
        this.aiInputHandler = new InputHandler(false, false);
        this.aiController = new AIController();
        Object.values(CHARACTER_PREVIEW_PATHS).forEach(path => { if (path) spriteLoader.loadSprite(path); });
        spriteLoader.loadSprite(ARENA_SPRITESHEET_PATH);
    }

    startFight() {
        if (!this.fighter1 || !this.fighter2) return;
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
        if (this.gameMode === GameMode.OneVsOneAI) this.aiInputHandler.resetInputTracking();
        this.gameState = GameState.FIGHTING;
    }

    checkRoundEnd() {
        if (!this.fighter1 || !this.fighter2) return;
        if (this.roundTimeFrames <= 0) {
            const p1DamageTaken = this.fighter1.maxHp - this.fighter1.hp;
            const p2DamageTaken = this.fighter2.maxHp - this.fighter2.hp;
            this.lastRoundWasDraw = p1DamageTaken === p2DamageTaken;
            if (p1DamageTaken < p2DamageTaken) this.p1Wins++;
            else if (p2DamageTaken < p1DamageTaken) this.p2Wins++;
            this.roundEndTimer = 180;
            this.gameState = GameState.ROUND_END;
            if (this.p1Wins >= 2 || this.p2Wins >= 2) this.beginGameOver();
            return;
        }
        if (this.fighter1.state === FighterState.DEFEATED) {
            this.lastRoundWasDraw = false;
            this.p2Wins++; this.roundEndTimer = 180; this.gameState = GameState.ROUND_END;
        } else if (this.fighter2.state === FighterState.DEFEATED) {
            this.lastRoundWasDraw = false;
            this.p1Wins++; this.roundEndTimer = 180; this.gameState = GameState.ROUND_END;
        }
        if (this.p1Wins >= 2 || this.p2Wins >= 2) this.beginGameOver();
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

    private beginGameOver() {
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
        if (this.player2Input) this.player2Input.updateFrame();
        if (this.menuCooldown > 0) this.menuCooldown--;
        if (this.gameState === GameState.MENU) this.updateMenu();
        else if (this.gameState === GameState.HELP) this.updateHelp();
        else if (this.gameState === GameState.CHARACTER_SELECT_P1) this.updateCharacterSelect(true);
        else if (this.gameState === GameState.CHARACTER_SELECT_P2) this.updateCharacterSelect(false);
        else if (this.gameState === GameState.CHARACTER_DETAILS) this.updateCharacterDetails();
        else if (this.gameState === GameState.ARENA_SELECT) this.updateArenaSelect();
        else if (this.gameState === GameState.ARENA_DETAILS) this.updateArenaDetails();
        else if (this.gameState === GameState.FIGHTING) {
            if (this.player1Input.keys.pause && this.menuCooldown === 0) {
                this.gameState = GameState.PAUSED;
                this.pauseSelection = 0;
                this.pauseIgnoreEscUntilRelease = true;
                this.pauseNavCooldown = 0;
            }
            else { this.updateFighting(); this.checkRoundEnd(); }
        } else if (this.gameState === GameState.PAUSED) this.updatePaused();
        else if (this.gameState === GameState.ROUND_END) this.updateRoundEnd();
        else if (this.gameState === GameState.GAME_OVER) this.updateGameOver();
        if (this.mouseClicked) this.mouseClicked = false;
        this.player1Input.finalizeFrame();
        if (this.player2Input) this.player2Input.finalizeFrame();
        // AI synthetic handler: finalize whenever roster exists so pause/round-end don't desync edges vs resume.
        if (this.gameMode === GameMode.OneVsOneAI && this.fighter1 && this.fighter2) {
            this.aiInputHandler.finalizeFrame();
        }
    }

    private isMouseInRect(x: number, y: number, w: number, h: number): boolean {
        return this.mouseX >= x && this.mouseX <= x + w && this.mouseY >= y && this.mouseY <= y + h;
    }

    /** Character + arena detail screens share this panel and BACK / CONFIRM hit boxes. */
    private getDetailsPanelLayout() {
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

    private getArenaSelectLayout() {
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
    private getPauseMenuLayout() {
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

    private drawCharacterPreview(img: HTMLImageElement, x: number, y: number, w: number, h: number): void {
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

    private getRosterLayout() {
        // Full static roster grid (no scroll): all characters visible at once.
        const columns = 4;
        const gap = 12;
        const sidePadding = 32;
        const rows = Math.ceil(FIGHTER_ROSTER.length / columns);
        const viewportY = 92;
        const viewportH = 560;
        const gridW = SCREEN_WIDTH - sidePadding * 2;
        const gridX = sidePadding;
        const cardW = Math.floor((gridW - (columns - 1) * gap) / columns);
        const contentH = viewportH;
        const cardH = Math.floor((contentH - (rows - 1) * gap) / rows);
        return { columns, cardW, cardH, gap, rows, gridW, gridX, viewportY, viewportH, contentH };
    }

    private getRosterMaxScroll(): number {
        return 0;
    }

    private ensureSelectionVisible(selection: number): void {
        // Non-scroll roster; selection is always visible.
        void selection;
    }

    updateMenu() {
        if (this.menuCooldown !== 0) return;
        const centerX = SCREEN_WIDTH / 2;
        const startY = 150;
        const itemWidth = 300;
        const itemHeight = 60;
        const helpButtonWidth = 120;
        const helpButtonHeight = 50;
        const helpButtonX = SCREEN_WIDTH - helpButtonWidth - 20;
        const helpButtonY = 20;
        if (this.mouseClicked && this.isMouseInRect(helpButtonX, helpButtonY, helpButtonWidth, helpButtonHeight)) {
            this.gameState = GameState.HELP; this.menuCooldown = 20; this.mouseClicked = false; return;
        }
        if (this.mouseClicked) {
            for (let i = 0; i < 3; i++) {
                const y = startY + 100 + i * 80;
                if (this.isMouseInRect(centerX - itemWidth / 2, y - itemHeight / 2, itemWidth, itemHeight)) {
                    this.menuSelection = i;
                    if (i === 0) { this.gameMode = GameMode.OneVsOneAI; this.gameState = GameState.CHARACTER_SELECT_P1; this.p1Selection = 0; }
                    else if (i === 1) { this.gameMode = GameMode.OneVsOnePvP; this.gameState = GameState.CHARACTER_SELECT_P1; this.p1Selection = 0; }
                    this.menuCooldown = 20; this.mouseClicked = false; return;
                }
            }
        }
        if (this.player1Input.keys.help) { this.gameState = GameState.HELP; this.menuCooldown = 20; return; }
        if (this.player1Input.keys.up) { this.menuSelection = Math.max(0, this.menuSelection - 1); this.menuCooldown = 15; }
        else if (this.player1Input.keys.down) { this.menuSelection = Math.min(2, this.menuSelection + 1); this.menuCooldown = 15; }
        else if (this.player1Input.keys.btnA) {
            if (this.menuSelection === 0) { this.gameMode = GameMode.OneVsOneAI; this.gameState = GameState.CHARACTER_SELECT_P1; this.p1Selection = 0; }
            else if (this.menuSelection === 1) { this.gameMode = GameMode.OneVsOnePvP; this.gameState = GameState.CHARACTER_SELECT_P1; this.p1Selection = 0; }
            this.menuCooldown = 20;
        }
    }

    updateHelp() {
        if (this.menuCooldown > 0) this.menuCooldown--;
        const backButtonSize = 60, backButtonX = 30, backButtonY = 30;
        const isMouseOverBack = this.isMouseInRect(backButtonX, backButtonY, backButtonSize, backButtonSize);
        if (this.menuCooldown === 0) {
            if (this.mouseClicked && isMouseOverBack) { this.gameState = GameState.MENU; this.menuCooldown = 20; this.mouseClicked = false; }
            else if (this.player1Input.keys.btnA || this.player1Input.keys.btnB || this.player1Input.keys.pause) { this.gameState = GameState.MENU; this.menuCooldown = 20; }
        }
        if (this.mouseClicked) this.mouseClicked = false;
    }

    updateCharacterSelect(isP1: boolean) {
        const maxSelection = FIGHTER_ROSTER.length - 1;
        if (this.menuCooldown !== 0) return;
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
                    if (isP1) this.p1Selection = i;
                    else this.p2Selection = i;
                    this.detailIsP1 = isP1;
                    this.gameState = GameState.CHARACTER_DETAILS;
                    this.menuCooldown = 8;
                    this.mouseClicked = false;
                    return;
                }
            }
            if (isP1 && this.isMouseInRect(backX, backY, backW, backH)) mouseToMenu = true;
            else if (!isP1 && this.isMouseInRect(backX, backY, backW, backH)) mouseBack = true;
            this.mouseClicked = false;
        }
        if (mouseToMenu) {
            this.gameState = GameState.MENU;
            this.menuCooldown = 20;
            return;
        }
        if (this.player1Input.keys.left) {
            if (isP1) this.p1Selection = Math.max(0, this.p1Selection - 1);
            else this.p2Selection = Math.max(0, this.p2Selection - 1);
            this.ensureSelectionVisible(isP1 ? this.p1Selection : this.p2Selection);
            this.menuCooldown = 10;
        } else if (this.player1Input.keys.right) {
            if (isP1) this.p1Selection = Math.min(maxSelection, this.p1Selection + 1);
            else this.p2Selection = Math.min(maxSelection, this.p2Selection + 1);
            this.ensureSelectionVisible(isP1 ? this.p1Selection : this.p2Selection);
            this.menuCooldown = 10;
        } else if (this.player1Input.keys.up) {
            if (isP1) this.p1Selection = Math.max(0, this.p1Selection - columns);
            else this.p2Selection = Math.max(0, this.p2Selection - columns);
            this.ensureSelectionVisible(isP1 ? this.p1Selection : this.p2Selection);
            this.menuCooldown = 10;
        } else if (this.player1Input.keys.down) {
            if (isP1) this.p1Selection = Math.min(maxSelection, this.p1Selection + columns);
            else this.p2Selection = Math.min(maxSelection, this.p2Selection + columns);
            this.ensureSelectionVisible(isP1 ? this.p1Selection : this.p2Selection);
            this.menuCooldown = 10;
        }
        else if (this.player1Input.keys.btnA) {
            this.detailIsP1 = isP1;
            this.gameState = GameState.CHARACTER_DETAILS;
            this.menuCooldown = 10;
        } else if ((this.player1Input.keys.btnB || mouseBack) && !isP1) { this.gameState = GameState.CHARACTER_SELECT_P1; this.menuCooldown = 20; }
        else if ((this.player1Input.keys.btnB || this.player1Input.keys.pause) && isP1) { this.gameState = GameState.MENU; this.menuCooldown = 20; }
    }

    updateCharacterDetails() {
        if (this.menuCooldown !== 0) return;
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
        } else if (this.player1Input.keys.btnB || this.player1Input.keys.pause) {
            this.gameState = this.detailIsP1 ? GameState.CHARACTER_SELECT_P1 : GameState.CHARACTER_SELECT_P2;
            this.menuCooldown = 10;
        }
    }

    private confirmCharacterSelection() {
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
            } else {
                this.gameState = GameState.CHARACTER_SELECT_P2;
                this.p2Selection = 0;
            }
        } else {
            this.fighter2 = new FighterEntity(550, FIGHTER_ROSTER[this.p2Selection], false);
            if (this.gameMode === GameMode.OneVsOnePvP) this.player2Input = new InputHandler(true);
            this.gameState = GameState.ARENA_SELECT;
            this.arenaSelection = 0;
        }
    }

    private confirmArenaAndStartFight() {
        this.resetMatch();
        this.startFight();
    }

    updateArenaDetails() {
        if (this.menuCooldown !== 0) return;
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
        } else if (this.player1Input.keys.btnB || this.player1Input.keys.pause) {
            this.gameState = GameState.ARENA_SELECT;
            this.menuCooldown = 10;
        }
    }

    updateArenaSelect() {
        if (this.menuCooldown > 0) { this.menuCooldown--; return; }
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
            if (handled) { this.mouseClicked = false; return; }
        }
        if (this.player1Input.keys.left) { this.arenaSelection = (this.arenaSelection - 1 + ARENA_COUNT) % ARENA_COUNT; this.menuCooldown = 10; }
        else if (this.player1Input.keys.right) { this.arenaSelection = (this.arenaSelection + 1) % ARENA_COUNT; this.menuCooldown = 10; }
        else if (this.player1Input.keys.up) { this.arenaSelection = (this.arenaSelection - ARENA_COLUMNS + ARENA_COUNT) % ARENA_COUNT; this.menuCooldown = 10; }
        else if (this.player1Input.keys.down) { this.arenaSelection = (this.arenaSelection + ARENA_COLUMNS) % ARENA_COUNT; this.menuCooldown = 10; }
        else if (this.player1Input.keys.btnA) { this.gameState = GameState.ARENA_DETAILS; this.menuCooldown = 10; }
        else if (this.player1Input.keys.btnB) { this.gameState = this.gameMode === GameMode.OneVsOneAI ? GameState.CHARACTER_SELECT_P1 : GameState.CHARACTER_SELECT_P2; this.menuCooldown = 20; }
    }

    private restartCurrentMatch() {
        this.resetMatch();
        this.startFight();
    }

    private returnToRoster() {
        this.fighter1 = null;
        this.fighter2 = null;
        this.player2Input = null;
        this.gameState = GameState.CHARACTER_SELECT_P1;
        this.p1Selection = 0;
        this.p2Selection = 0;
    }

    updatePaused() {
        const options = 4; // Resume, Restart, Home, Roster
        if (this.pauseNavCooldown > 0) this.pauseNavCooldown--;

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
            if (!this.player1Input.keys.pause) this.pauseIgnoreEscUntilRelease = false;
        } else {
            if (this.player1Input.wasPressed("pause")) {
                this.gameState = GameState.FIGHTING;
                this.menuCooldown = 15;
                return;
            }
        }

        const navUp = this.player1Input.wasPressed("up");
        const navDown = this.player1Input.wasPressed("down");
        if (this.pauseNavCooldown === 0 && (navUp || navDown)) {
            if (navUp) this.pauseSelection = (this.pauseSelection - 1 + options) % options;
            if (navDown) this.pauseSelection = (this.pauseSelection + 1) % options;
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

    private applyPauseSelection() {
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
        if (!this.fighter1 || !this.fighter2) return;
        let fighter2Input: InputState;
        let fighter2Handler: InputHandler | null;
        if (this.gameMode === GameMode.OneVsOneAI) {
            fighter2Input = this.aiController.calculateInput(this.fighter2, this.fighter1);
            this.aiInputHandler.setKeysFromState(fighter2Input);
            this.aiInputHandler.updateFrame();
            fighter2Handler = this.aiInputHandler;
        } else if (this.player2Input) {
            fighter2Input = this.player2Input.keys;
            fighter2Handler = this.player2Input;
        } else {
            fighter2Input = { up: false, down: false, left: false, right: false, btnA: false, btnB: false, help: false, pause: false };
            fighter2Handler = null;
        }
        this.fighter1.update(this.player1Input.keys, this.fighter2, this.player1Input);
        this.fighter2.update(fighter2Input, this.fighter1, fighter2Handler);
        this.fighter1.updateEffects();
        this.fighter2.updateEffects();
        if (this.roundTimeFrames > 0) this.roundTimeFrames--;
    }

    updateRoundEnd() {
        this.roundEndTimer--;
        if (this.roundEndTimer > 0) return;
        if (this.p1Wins >= 2 || this.p2Wins >= 2) {
            this.beginGameOver();
        } else {
            if (!this.lastRoundWasDraw) this.currentRound++;
            this.startFight();
        }
    }
    updateGameOver() {
        if (this.menuCooldown > 0) this.menuCooldown--;
        if (this.gameOverNavCooldown > 0) this.gameOverNavCooldown--;

        if (this.gameOverBannerTimer > 0) {
            this.gameOverBannerTimer--;
            if (this.menuCooldown === 0 && this.player1Input.wasPressed("btnA")) this.gameOverBannerTimer = 0;
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
            if (navUp) this.gameOverMenuIndex = (this.gameOverMenuIndex - 1 + options) % options;
            if (navDown) this.gameOverMenuIndex = (this.gameOverMenuIndex + 1) % options;
            this.gameOverNavCooldown = 10;
        }

        if (this.player1Input.wasPressed("btnA")) this.applyGameOverMenuSelection();
    }

    private getGameOverMenuLayout() {
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

    private applyGameOverMenuSelection() {
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

    drawBar(x: number, y: number, current: number, max: number, color: string) {
        const width = 230, height = 16, fillWidth = Math.max(0, (current / max) * width);
        this.ctx.fillStyle = PALETTE.BACKGROUND_DARK;
        this.ctx.fillRect(x, y, width, height);
        if (fillWidth > 0) { this.ctx.fillStyle = color; this.ctx.fillRect(x, y, fillWidth, height); }
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);
    }

    drawUI(f1: FighterEntity, f2: FighterEntity) {
        const uiHeight = 90;
        const uiPadding = 20;
        const barW = 230;
        const stunH = 6;
        const nameY = uiPadding + 28;
        const stunY = uiPadding + 36;
        const hpY = uiPadding + 46;
        const enY = uiPadding + 66;
        this.ctx.fillStyle = PALETTE.WHITE; this.ctx.strokeStyle = PALETTE.OUTLINE; this.ctx.lineWidth = 4;
        this.ctx.fillRect(uiPadding, uiPadding, 250, uiHeight); this.ctx.strokeRect(uiPadding, uiPadding, 250, uiHeight);
        this.ctx.fillStyle = PALETTE.BLACK; this.ctx.font = "bold 22px 'Arial', sans-serif"; this.ctx.textAlign = "left";
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
        this.ctx.fillStyle = PALETTE.WHITE; this.ctx.strokeStyle = PALETTE.OUTLINE; this.ctx.lineWidth = 4;
        this.ctx.fillRect(SCREEN_WIDTH - 250 - uiPadding, uiPadding, 250, uiHeight);
        this.ctx.strokeRect(SCREEN_WIDTH - 250 - uiPadding, uiPadding, 250, uiHeight);
        this.ctx.fillStyle = PALETTE.BLACK; this.ctx.textAlign = "right";
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

    drawArenaBackground(destX: number, destY: number, destWidth: number, destHeight: number) {
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
        this.ctx.drawImage(
            arenaSheet,
            arenaCol * tileWidth,
            arenaRow * tileHeight,
            tileWidth,
            tileHeight,
            drawX,
            drawY,
            drawWidth,
            drawHeight
        );
    }

    draw() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
        gradient.addColorStop(0, PALETTE.BACKGROUND_LIGHT);
        gradient.addColorStop(1, PALETTE.BACKGROUND_DARK);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        if (this.gameState === GameState.FIGHTING) this.drawFighting();
        else if (this.gameState === GameState.PAUSED) { this.drawFighting(); this.drawPaused(); }
        else if (this.gameState === GameState.ROUND_END) this.drawRoundEnd();
        else if (this.gameState === GameState.GAME_OVER) this.drawGameOver();
        else if (this.gameState === GameState.HELP) this.drawHelp();
        else if (this.gameState === GameState.ARENA_DETAILS) this.drawArenaDetails();
        else if (this.gameState === GameState.ARENA_SELECT) this.drawArenaSelect();
        else if (this.gameState === GameState.CHARACTER_DETAILS) this.drawCharacterDetails();
        else if (this.gameState === GameState.CHARACTER_SELECT_P1 || this.gameState === GameState.CHARACTER_SELECT_P2) this.drawCharacterSelect();
        else this.drawMenu();
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
        this.ctx.strokeText("LETS FIGHT!", centerX, startY);
        this.ctx.fillText("LETS FIGHT!", centerX, startY);
        this.ctx.font = "bold 32px 'Arial', sans-serif";
        const modes = ["1v1 vs AI", "1v1 PvP", "Back"];
        for (let i = 0; i < modes.length; i++) {
            const y = startY + 100 + i * 80;
            const itemWidth = 300;
            const itemHeight = 60;
            if (i === this.menuSelection) {
                this.ctx.fillStyle = PALETTE.PASTEL_BLUE;
                this.ctx.strokeStyle = PALETTE.OUTLINE;
                this.ctx.lineWidth = 4;
            } else {
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
        const panelWidth = 700;
        const panelHeight = 540;
        const panelX = centerX - panelWidth / 2;
        const panelY = 30;
        this.ctx.fillStyle = PALETTE.WHITE;
        this.ctx.strokeStyle = PALETTE.OUTLINE;
        this.ctx.lineWidth = 5;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.fillStyle = PALETTE.BLACK;
        this.ctx.font = "bold 42px 'Arial', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText("HOW TO PLAY", centerX, panelY + 25);
        this.ctx.font = "20px 'Arial', sans-serif";
        this.ctx.fillText("WASD/Arrows to move, F/G to attack, ESC to pause.", centerX, panelY + 120);
        this.ctx.fillText("Click back or press ESC/Enter to return.", centerX, panelY + 160);
        this.ctx.textAlign = "left";
    }

    drawCharacterSelect() {
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

            const previewPath = CHARACTER_PREVIEW_PATHS[entry.spriteKey] || CHARACTER_SPRITE_PATHS[entry.spriteKey]?.idle || "";
            const imageAreaTop = y + 4;
            const imageAreaHeight = Math.max(72, cardH - 30);
            const imageAreaBottom = imageAreaTop + imageAreaHeight;

            if (previewPath) {
                spriteLoader.loadSprite(previewPath);
                const previewImg = spriteLoader.getSprite(previewPath);
                if (previewImg) {
                    this.drawCharacterPreview(previewImg, x + 6, imageAreaTop + 2, cardW - 12, imageAreaHeight - 4);
                } else {
                    this.ctx.fillStyle = PALETTE.BACKGROUND_DARK;
                    this.ctx.fillRect(x + 8, imageAreaTop, cardW - 16, imageAreaHeight);
                }
            } else {
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
            this.ctx.fillText("Select a fighter to open details  ·  B / Esc: main menu", SCREEN_WIDTH / 2, footerY + 10);
        } else {
            this.ctx.fillText("Select a fighter to open details", SCREEN_WIDTH / 2, footerY + 10);
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
        } else {
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

        const previewPath = CHARACTER_PREVIEW_PATHS[fighter.spriteKey] || CHARACTER_SPRITE_PATHS[fighter.spriteKey]?.idle || "";
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
        this.ctx.fillText(
            getArenaDisplayName(this.arenaSelection),
            SCREEN_WIDTH / 2,
            headerY + headerPadTop + titleLineH + titleToSubtitleGap
        );
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
        this.ctx.fillText("B / Esc: back to character select", SCREEN_WIDTH / 2, footerY + 26);
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }

    /** Arena, ground line, and both fighters (no HUD). */
    private drawArenaGroundAndFighters() {
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
        if (this.fighter1 && this.fighter2) this.drawUI(this.fighter1, this.fighter2);
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
        this.ctx.fillText("W / S or arrows to move   ·   Enter or F to confirm   ·   Click a button", SCREEN_WIDTH / 2, footerTop);
        this.ctx.fillText("ESC to resume (release ESC once after opening pause)   ·   G also resumes", SCREEN_WIDTH / 2, footerTop + 18);
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
        this.ctx.fillText("W / S or arrows · Enter / F to confirm · Click a button", cx, panelY + panelH - 36);
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "alphabetic";
    }
}

const game = new FightingGameEngine();
game.start();
