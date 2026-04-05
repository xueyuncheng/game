import * as Phaser from "phaser";
import { gamepadManager } from "@/lib/gamepad/gamepad-manager";
import {
  PLAYER_DOUBLE_JUMP_VEL,
  BOSS_SHOOT_INTERVAL_1,
  BOSS_SHOOT_INTERVAL_2,
  BOSS_SHOOT_INTERVAL_3,
  BOSS_W,
  BULLET_SPEED,
  ENEMY_BULLET_SPEED,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_TOP_Y,
  INVINCIBLE_MS,
  MAX_LIVES,
  PLATFORM_H,
  PLAYER_H,
  PLAYER_JUMP_VEL,
  PLAYER_SPEED,
  SCORE_PER_BOSS,
  SCORE_PER_SOLDIER,
  SCORE_PER_TURRET,
  SHOOT_COOLDOWN_MS,
  SOLDIER_ACTIVATE_DIST,
  SOLDIER_H,
  SOLDIER_HP,
  SOLDIER_SHOOT_INTERVAL_MAX,
  SOLDIER_SHOOT_INTERVAL_MIN,
  SOLDIER_SPEED,
  SOLDIER_W,
  TURRET_ACTIVATE_DIST,
  TURRET_HP,
  TURRET_SHOOT_INTERVAL,
  type WeaponType,
} from "@/games/steel-commando/config";
import {
  type ArcadeTarget,
  type BossData,
  type LaserGateEntry,
  type SniperNestEntry,
  type SoldierSprite,
  type SpikeTrapEntry,
  type TurretEntry,
} from "@/games/steel-commando/types";
import { LEVEL_DEFS, type LevelDef } from "@/games/steel-commando/level-data";
import {
  clearSteelCommandoProgress,
  loadSteelCommandoProgress,
  saveSteelCommandoProgress,
} from "@/games/steel-commando/progress";
import { preloadTextures } from "@/games/steel-commando/textures";
import { createAnimations } from "@/games/steel-commando/animations";

// ─── Scene ────────────────────────────────────────────────────────────────────

export class SteelCommandoScene extends Phaser.Scene {
  // Player
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private facingRight = true;
  private aimUp = false;
  private isCrouching = false;
  private isOnGround = false;
  private jumpsUsed = 0;
  private weapon: WeaponType = "pistol";
  private lastShotAt = 0;
  private invincibleUntil = 0;
  private lives = MAX_LIVES;
  private score = 0;
  private dead = false;
  private gameOver = false;
  private levelComplete = false;
  private isPaused = false;
  private currentLevel = 1;
  private levelDef!: LevelDef;

  // Gamepad edge detection
  private prevGpJump = false;
  private prevGpShoot = false;

  // Physics groups
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private soldierGroup!: Phaser.Physics.Arcade.Group;
  private turretBaseGroup!: Phaser.Physics.Arcade.StaticGroup;
  private pickupGroup!: Phaser.Physics.Arcade.StaticGroup;

  // Enemy data
  private turrets: TurretEntry[] = [];
  private spikeTraps: SpikeTrapEntry[] = [];
  private sniperNests: SniperNestEntry[] = [];
  private laserGates: LaserGateEntry[] = [];
  private boss: BossData | null = null;
  private bossSpawned = false;

  // HUD (fixed to camera)
  private scoreText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private livesContainer!: Phaser.GameObjects.Container;

  // Keys
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private shootKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private crouchKey!: Phaser.Input.Keyboard.Key;
  private pauseKey!: Phaser.Input.Keyboard.Key;
  private pauseOverlay!: Phaser.GameObjects.Container;

  constructor() {
    super("steel-commando");
  }

  // ─── Preload ────────────────────────────────────────────────────────────────

  preload() {
    preloadTextures(this);
  }

  // ─── Create ─────────────────────────────────────────────────────────────────

  create() {
    const data = (this.scene.settings.data as { level?: number; lives?: number; score?: number }) ?? {};
    const savedProgress = loadSteelCommandoProgress();
    const initialLevel = data.level ?? savedProgress?.level ?? 1;

    this.resetState();
    this.currentLevel = initialLevel;
    this.levelDef = LEVEL_DEFS[this.currentLevel - 1];

    // Carry over lives and score when advancing levels
    this.lives = data.lives ?? savedProgress?.lives ?? this.lives;
    this.score = data.score ?? savedProgress?.score ?? this.score;

    this.physics.world.setBounds(0, 0, this.levelDef.worldWidth, GAME_HEIGHT);
    this.physics.world.gravity.y = 900;

    this.createBackground();
    this.createTerrain();
    this.createPlayer();
    createAnimations(this);
    this.createGroups();
    this.spawnEnemies();
    this.placePickups();
    this.createLevelMechanics();
    this.setupCamera();
    this.setupInput();
    this.setupColliders();
    this.createHud();
    this.saveProgress();
  }

  private resetState() {
    this.facingRight = true;
    this.aimUp = false;
    this.isCrouching = false;
    this.isOnGround = false;
    this.jumpsUsed = 0;
    this.weapon = "pistol";
    this.lastShotAt = 0;
    this.invincibleUntil = 0;
    this.lives = MAX_LIVES;
    this.score = 0;
    this.dead = false;
    this.gameOver = false;
    this.levelComplete = false;
    this.isPaused = false;
    this.prevGpJump = false;
    this.prevGpShoot = false;
    this.turrets = [];
    this.spikeTraps = [];
    this.sniperNests = [];
    this.laserGates = [];
    this.boss = null;
    this.bossSpawned = false;
  }

  // ─── Background ──────────────────────────────────────────────────────────────

  private createBackground() {
    const skyTexture = `sc-${this.levelDef.theme}-sky`;
    const mountainTexture = `sc-${this.levelDef.theme}-mountains`;
    const buildingTexture = `sc-${this.levelDef.theme}-buildings`;

    // Sky (static, full canvas)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, skyTexture).setScrollFactor(0).setDepth(-10);

    // Mountains (slow parallax)
    for (let i = 0; i < Math.ceil(this.levelDef.worldWidth / GAME_WIDTH) + 1; i++) {
      this.add
        .image(i * GAME_WIDTH, GAME_HEIGHT - 260, mountainTexture)
        .setOrigin(0, 0)
        .setScrollFactor(0.15)
        .setDepth(-9);
    }

    // Buildings (medium parallax)
    for (let i = 0; i < Math.ceil(this.levelDef.worldWidth / GAME_WIDTH) + 1; i++) {
      this.add
        .image(i * GAME_WIDTH, GAME_HEIGHT - 220, buildingTexture)
        .setOrigin(0, 0)
        .setScrollFactor(0.4)
        .setDepth(-8);
    }
  }

  // ─── Terrain ─────────────────────────────────────────────────────────────────

  private createTerrain() {
    const groundTexture = `sc-${this.levelDef.theme}-ground`;
    const platformTexture = `sc-${this.levelDef.theme}-platform`;

    this.ground = this.physics.add.staticGroup();
    this.platforms = this.physics.add.staticGroup();

    // Ground strip: cover the whole world width with 64px tiles
    const tileW = 64;
    const numTiles = Math.ceil(this.levelDef.worldWidth / tileW) + 1;
    for (let i = 0; i < numTiles; i++) {
      const tile = this.ground.create(i * tileW + tileW / 2, GROUND_TOP_Y + 32, groundTexture) as
        Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
      tile.refreshBody();
    }

    // Platforms
    for (const [cx, cy, w] of this.levelDef.platforms) {
      const numPTiles = Math.ceil(w / tileW);
      for (let i = 0; i < numPTiles; i++) {
        const tx = cx - w / 2 + i * tileW + tileW / 2;
        const pt = this.platforms.create(tx, cy, platformTexture) as
          Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
        pt.refreshBody();
        pt.body.setSize(tileW, PLATFORM_H);
        pt.body.setOffset(0, 0);
      }
    }
  }

  // ─── Player ──────────────────────────────────────────────────────────────────

  private createPlayer() {
    const startY = GROUND_TOP_Y - PLAYER_H / 2;
    this.player = this.physics.add.sprite(120, startY, "sc-player-idle");
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(0); // world gravity handles it
    this.player.body.setSize(20, 44);
    this.player.body.setOffset(6, 4);
    this.player.setDepth(5);
  }

  // ─── Enemies ─────────────────────────────────────────────────────────────────

  private spawnEnemies() {
    this.soldierGroup = this.physics.add.group();

    for (const [sx, patrolRadius] of this.levelDef.soldiers) {
      const sy = GROUND_TOP_Y - SOLDIER_H / 2;
      const soldier = this.soldierGroup.create(sx, sy, "sc-soldier-walk-0") as SoldierSprite;
      soldier.hp = SOLDIER_HP;
      soldier.dir = -1;
      soldier.nextShotAt = this.time.now + Phaser.Math.Between(SOLDIER_SHOOT_INTERVAL_MIN, SOLDIER_SHOOT_INTERVAL_MAX);
      soldier.activated = false;
      soldier.patrolMin = sx - patrolRadius;
      soldier.patrolMax = sx + patrolRadius;
      soldier.setCollideWorldBounds(true);
      soldier.body.setSize(SOLDIER_W - 4, SOLDIER_H - 4);
      soldier.body.setOffset(2, 2);
      soldier.setDepth(4);
      soldier.play("sc-soldier-walk");
      soldier.setFlipX(soldier.dir === 1);
    }

    // Turrets
    for (let i = 0; i < this.levelDef.turrets.length; i++) {
      const [tx, ty] = this.levelDef.turrets[i];
      const base = this.turretBaseGroup.create(tx, ty, "sc-turret-base") as
        Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
      base.refreshBody();
      base.setDepth(3);

      const barrel = this.add.image(tx, ty - 16, "sc-turret-barrel");
      barrel.setOrigin(0.5, 1);
      barrel.setDepth(3);

      // Store barrel reference directly on the sprite so the overlap callback can find it
      base.setData("barrel", barrel);

      this.turrets.push({
        base,
        barrel,
        hp: TURRET_HP,
        nextShotAt: this.time.now + TURRET_SHOOT_INTERVAL,
        activated: false,
      });
    }
  }

  // ─── Pickups ─────────────────────────────────────────────────────────────────

  private placePickups() {
    this.pickupGroup = this.physics.add.staticGroup();

    for (const [px, py, wt] of this.levelDef.pickups) {
      const pu = this.pickupGroup.create(px, py, `sc-pickup-${wt}`) as
        Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
      pu.setData("weapon", wt);
      pu.refreshBody();
      pu.setDepth(3);

      // Bob animation
      this.tweens.add({
        targets: pu,
        y: py - 8,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    }
  }

  private createLevelMechanics() {
    this.createSpikeTraps();
    this.createSniperNests();
    this.createLaserGates();
  }

  private createSpikeTraps() {
    for (const [x, width, cycleMs] of this.levelDef.spikeTraps) {
      const spikeCount = Math.max(2, Math.floor(width / 24));
      const glow = this.add
        .rectangle(x, GROUND_TOP_Y - 6, width, 12, 0xa4ff86, 0.12)
        .setDepth(2.5);
      const spikes: Phaser.GameObjects.Triangle[] = [];

      for (let i = 0; i < spikeCount; i++) {
        const sx = x - width / 2 + (i + 0.5) * (width / spikeCount);
        const spike = this.add
          .triangle(sx, GROUND_TOP_Y + 10, 0, 18, 10, 0, 20, 18, 0xbafc8a, 0.95)
          .setDepth(3)
          .setVisible(false);
        spikes.push(spike);
      }

      this.spikeTraps.push({
        x,
        width,
        cycleMs,
        activeDurationMs: Math.floor(cycleMs * 0.55),
        active: false,
        nextToggleAt: this.time.now + Phaser.Math.Between(350, 850),
        glow,
        spikes,
      });
    }
  }

  private createSniperNests() {
    for (const [x, heightOffset, cooldownMs] of this.levelDef.sniperNests) {
      const y = GROUND_TOP_Y - heightOffset;
      this.add.rectangle(x, y + 28, 32, 8, 0x5b6675, 1).setDepth(2.8);
      this.add.rectangle(x, y, 18, 26, 0xc6d1de, 1).setDepth(3.2);
      this.add.rectangle(x + 10, y - 4, 16, 4, 0x1d2430, 1).setDepth(3.2);

      const warningLine = this.add.graphics().setDepth(7).setVisible(false);
      const warningReticle = this.add
        .circle(x, GROUND_TOP_Y - 30, 9, 0xff6677, 0)
        .setStrokeStyle(2, 0xff6677, 0.9)
        .setDepth(7)
        .setVisible(false);

      this.sniperNests.push({
        x,
        y,
        cooldownMs,
        activated: false,
        nextShotAt: this.time.now + Phaser.Math.Between(900, 1700),
        fireAt: 0,
        targetX: x,
        targetY: GROUND_TOP_Y - 30,
        warningLine,
        warningReticle,
      });
    }
  }

  private createLaserGates() {
    for (const [x, topY, height, cycleMs] of this.levelDef.laserGates) {
      const beam = this.add
        .rectangle(x, topY + height / 2, 10, height, 0xff4458, 0.18)
        .setDepth(3.6)
        .setVisible(false);
      const topCore = this.add.circle(x, topY, 9, 0xff8894, 0.8).setDepth(3.7);
      const bottomCore = this.add.circle(x, topY + height, 9, 0xff8894, 0.8).setDepth(3.7);

      this.laserGates.push({
        x,
        topY,
        height,
        cycleMs,
        activeDurationMs: Math.floor(cycleMs * 0.5),
        active: false,
        nextToggleAt: this.time.now + Phaser.Math.Between(500, 1100),
        beam,
        topCore,
        bottomCore,
      });
    }
  }

  // ─── Camera ──────────────────────────────────────────────────────────────────

  private setupCamera() {
    this.cameras.main.setBounds(0, 0, this.levelDef.worldWidth, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(80, 200);
  }

  // ─── Input ───────────────────────────────────────────────────────────────────

  private setupInput() {
    const kb = this.input.keyboard;
    if (!kb) throw new Error("Keyboard unavailable");

    this.cursors = kb.createCursorKeys();
    this.jumpKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.shootKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.restartKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.crouchKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.pauseKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
  }

  // ─── Groups ──────────────────────────────────────────────────────────────────

  private createGroups() {
    this.bullets = this.physics.add.group({ maxSize: 50, classType: Phaser.Physics.Arcade.Image });
    this.enemyBullets = this.physics.add.group({ maxSize: 60, classType: Phaser.Physics.Arcade.Image });
    this.turretBaseGroup = this.physics.add.staticGroup();
  }

  // ─── Colliders ───────────────────────────────────────────────────────────────

  private setupColliders() {
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platforms, this.onPlayerPlatform, this.playerCanLandOnPlatform, this);
    this.physics.add.collider(this.soldierGroup, this.ground);
    this.physics.add.collider(this.soldierGroup, this.platforms, undefined, this.entityCanLandOnPlatform, this);

    this.physics.add.overlap(this.player, this.pickupGroup, this.onPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.bullets, this.soldierGroup, this.onBulletHitSoldier as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    // enemy bullets vs player: handled manually in update loop

    // Player bullets vs enemy bullets (cancel each other)
    this.physics.add.overlap(this.bullets, this.enemyBullets, this.onBulletsMeetBullets as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    // Bullets vs ground/platforms (destroy bullet)
    this.physics.add.collider(this.bullets, this.ground, this.onBulletHitTerrain as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.collider(this.bullets, this.platforms, this.onBulletHitTerrain as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.collider(this.enemyBullets, this.ground, this.onBulletHitTerrain as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.collider(this.enemyBullets, this.platforms, this.onBulletHitTerrain as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
  }

  private playerCanLandOnPlatform(playerObj: ArcadeTarget): boolean {
    const p = playerObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    // Only land if falling downward (not jumping through)
    return p.body.velocity.y >= 0;
  }

  private entityCanLandOnPlatform(): boolean {
    return true;
  }

  private onPlayerPlatform() {
    // No special logic needed, collider handles it
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────

  private createHud() {
    this.scoreText = this.add
      .text(16, 12, "SCORE 000000", { fontFamily: "Arial", fontSize: "18px", color: "#dff8ff" })
      .setScrollFactor(0)
      .setDepth(100);
    if (this.score > 0) this.scoreText.setText(`SCORE ${String(this.score).padStart(6, "0")}`);

    this.weaponText = this.add
      .text(16, 36, "PISTOL", { fontFamily: "Arial", fontSize: "14px", color: "#ffee88" })
      .setScrollFactor(0)
      .setDepth(100);

    // Level indicator
    this.add
      .text(16, 56, `LEVEL ${this.currentLevel}  ${this.levelDef.name}`, {
        fontFamily: "Arial", fontSize: "12px", color: "#aaccff",
      })
      .setScrollFactor(0)
      .setDepth(100);

    // Lives icons
    this.livesContainer = this.add.container(GAME_WIDTH - 20, 12).setScrollFactor(0).setDepth(100);
    this.refreshLives();

    // Controls hint
    this.add
      .text(GAME_WIDTH / 2, 12, "← → Move  Z Double Jump  X/Space Shoot  ↑ ↓ Aim  P Pause  R Restart", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#8899bb",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100);

    // Pause overlay (hidden by default)
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 300, 130, 0x050913, 0.92)
      .setStrokeStyle(2, 0x88aaff, 0.6);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, "PAUSED", {
      fontFamily: "Arial", fontSize: "32px", color: "#88aaff",
    }).setOrigin(0.5);
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 22, "Press P to resume", {
      fontFamily: "Arial", fontSize: "16px", color: "#8899cc",
    }).setOrigin(0.5);
    this.pauseOverlay = this.add.container(0, 0, [bg, title, hint])
      .setScrollFactor(0).setDepth(300).setVisible(false);
  }

  private refreshLives() {
    this.livesContainer.removeAll(true);
    const icon = this.add.image(0, 0, "sc-life-icon").setOrigin(1, 0);
    const text = this.add.text(-28, 0, `×${this.lives}`, {
      fontFamily: "Arial", fontSize: "14px", color: "#66ddff",
    }).setOrigin(1, 0);
    this.livesContainer.add([icon, text]);
  }

  private updateScore(delta: number) {
    this.score += delta;
    this.scoreText.setText(`SCORE ${String(this.score).padStart(6, "0")}`);
    this.saveProgress();
  }

  private saveProgress() {
    saveSteelCommandoProgress({
      level: this.currentLevel,
      lives: this.lives,
      score: this.score,
    });
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  update(time: number, delta: number) {
    if (this.gameOver || this.levelComplete) {
      const gp = gamepadManager.poll();
      const restart = Phaser.Input.Keyboard.JustDown(this.restartKey) || (gp.start && !this.prevGpJump);
      if (restart) {
        if (this.levelComplete && this.currentLevel < LEVEL_DEFS.length) {
          this.scene.restart({ level: this.currentLevel + 1, lives: this.lives, score: this.score });
        } else {
          this.scene.restart();
        }
      }
      return;
    }

    // Pause toggle
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.togglePause();
      return;
    }
    if (this.isPaused) return;

    if (this.dead) return;

    const input = this.gatherInput();
    this.updatePlayer(time, input);
    this.checkEnemyBulletsHitPlayer();
    this.updateSpikeTraps(time);
    this.updateSniperNests(time);
    this.updateLaserGates(time);
    this.updateSoldiers(time);
    this.updateTurrets(time);
    this.updateBoss(time);
    this.cullOffscreenBullets();
    void delta;
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.pauseOverlay.setVisible(true);
    } else {
      this.physics.resume();
      this.pauseOverlay.setVisible(false);
    }
  }

  // ─── Input gathering ─────────────────────────────────────────────────────────

  private gatherInput() {
    const kb = this.cursors;
    const gp = gamepadManager.poll();

    const moveLeft = Boolean(kb.left.isDown);
    const moveRight = Boolean(kb.right.isDown);
    const aimUpKb = Boolean(kb.up.isDown);
    const aimDownKb = Boolean(kb.down.isDown || this.crouchKey.isDown);
    const jumpJustDown = Phaser.Input.Keyboard.JustDown(this.jumpKey) || (gp.altShoot && !this.prevGpJump);
    const shootDown =
      Boolean(this.shootKey.isDown) ||
      Boolean(this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL).isDown) ||
      Boolean(kb.space?.isDown) ||
      gp.shoot;

    this.prevGpJump = gp.altShoot;
    this.prevGpShoot = gp.shoot;

    return {
      left: moveLeft || gp.moveLeft,
      right: moveRight || gp.moveRight,
      up: aimUpKb || gp.moveUp,
      down: aimDownKb || gp.moveDown,
      jumpJustDown,
      shootDown,
    };
  }

  // ─── Player update ───────────────────────────────────────────────────────────

  private updatePlayer(time: number, input: ReturnType<typeof this.gatherInput>) {
    const body = this.player.body;
    this.isOnGround = body.blocked.down;
    if (this.isOnGround) {
      this.jumpsUsed = 0;
    }
    this.aimUp = input.up && !input.down;

    // Crouch (only on ground)
    const wantCrouch = input.down && this.isOnGround;
    if (wantCrouch !== this.isCrouching) {
      this.isCrouching = wantCrouch;
      if (this.isCrouching) {
        this.player.body.setSize(20, 28);
        this.player.body.setOffset(6, 20);
      } else {
        this.player.body.setSize(20, 44);
        this.player.body.setOffset(6, 4);
      }
    }

    if (input.left !== input.right) {
      this.facingRight = input.right;
    }

    // Horizontal movement (no movement while crouching)
    if (!this.isCrouching) {
      if (input.left && !input.right) {
        this.player.setVelocityX(-PLAYER_SPEED);
      } else if (input.right && !input.left) {
        this.player.setVelocityX(PLAYER_SPEED);
      } else {
        this.player.setVelocityX(0);
      }
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    if (input.jumpJustDown) {
      if (this.isOnGround) {
        this.player.setVelocityY(PLAYER_JUMP_VEL);
        this.isOnGround = false;
        this.jumpsUsed = 1;
      } else if (this.jumpsUsed < 2) {
        this.player.setVelocityY(PLAYER_DOUBLE_JUMP_VEL);
        this.jumpsUsed = 2;
      }
    }

    // Flip
    this.player.setFlipX(!this.facingRight);

    // Animation
    if (this.isCrouching) {
      if (this.player.anims.currentAnim?.key !== "sc-crouch") this.player.play("sc-crouch");
    } else if (!this.isOnGround) {
      if (this.player.anims.currentAnim?.key !== "sc-jump") this.player.play("sc-jump");
    } else if (Math.abs(body.velocity.x) > 10) {
      if (this.player.anims.currentAnim?.key !== "sc-run") this.player.play("sc-run");
    } else {
      if (this.player.anims.currentAnim?.key !== "sc-idle") this.player.play("sc-idle");
    }

    // Shoot
    if (input.shootDown && time - this.lastShotAt > SHOOT_COOLDOWN_MS) {
      this.lastShotAt = time;
      this.doPlayerShoot(input);
    }

    // Invincibility blink
    if (time < this.invincibleUntil) {
      this.player.setAlpha(Math.sin(time / 80) > 0 ? 1 : 0.3);
    } else {
      this.player.setAlpha(1);
    }
  }

  // ─── Player shoot ────────────────────────────────────────────────────────────

  private doPlayerShoot(input: ReturnType<typeof this.gatherInput>) {
    const aimX = input.left === input.right ? 0 : input.left ? -1 : 1;
    const aimY = input.up === input.down ? 0 : input.up ? -1 : 1;
    const direction = new Phaser.Math.Vector2(aimX, aimY);

    if (direction.lengthSq() === 0) {
      direction.set(this.facingRight ? 1 : -1, 0);
    } else {
      direction.normalize();
    }

    const x = this.player.x + direction.x * 18;
    const y = this.player.y + direction.y * 18;

    if (this.weapon === "spread") {
      // 3-way spread
      const angles = [-0.3, 0, 0.3];
      for (const a of angles) {
        const velocity = direction.clone().rotate(a).scale(BULLET_SPEED);
        this.spawnBullet(x, y, velocity.x, velocity.y);
      }
    } else if (this.weapon === "laser") {
      // Fast laser in the aimed direction.
      this.spawnBullet(x, y, direction.x * BULLET_SPEED * 1.4, direction.y * BULLET_SPEED * 1.4, "sc-bullet-laser");
    } else {
      this.spawnBullet(x, y, direction.x * BULLET_SPEED, direction.y * BULLET_SPEED);
    }

    gamepadManager.vibrate(30, 0.1, 0.3);
  }

  private spawnBullet(x: number, y: number, vx: number, vy: number, texture = "sc-bullet-player") {
    const b = this.bullets.get(x, y, texture) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody | null;
    if (!b) return;

    b.enableBody(true, x, y, true, true);
    b.setDepth(6);
    b.setVelocity(vx, vy);
    b.body.allowGravity = false;

    // Rotate to match velocity direction.
    if (vx !== 0 || vy !== 0) {
      b.setRotation(Math.atan2(vy, vx) - Math.PI / 2);
    }
  }

  private spawnEnemyBullet(x: number, y: number, vx: number, vy: number) {
    const b = this.enemyBullets.get(x, y, "sc-bullet-enemy") as Phaser.Types.Physics.Arcade.ImageWithDynamicBody | null;
    if (!b) return;

    b.enableBody(true, x, y, true, true);
    b.setDepth(6);
    b.setVelocity(vx, vy);
    b.body.allowGravity = false;
  }

  private isTerrainBlockingShot(fromX: number, fromY: number, toX: number, toY: number) {
    const line = new Phaser.Geom.Line(fromX, fromY, toX, toY);
    const groundRect = new Phaser.Geom.Rectangle(0, GROUND_TOP_Y, this.levelDef.worldWidth, GAME_HEIGHT - GROUND_TOP_Y);

    if (Phaser.Geom.Intersects.LineToRectangle(line, groundRect)) {
      return true;
    }

    let blocked = false;
    this.platforms.children.each((child) => {
      const platform = child as Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
      const body = platform.body;
      const rect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);

      if (Phaser.Geom.Intersects.LineToRectangle(line, rect)) {
        blocked = true;
        return false;
      }

      return true;
    });

    return blocked;
  }

  // ─── Soldiers ────────────────────────────────────────────────────────────────

  private updateSoldiers(time: number) {
    const camRight = this.cameras.main.scrollX + GAME_WIDTH;

    this.soldierGroup.children.each((child) => {
      const s = child as SoldierSprite;
      if (!s.active) return true;

      // Activate when camera approaches
      if (!s.activated) {
        if (s.x < camRight + SOLDIER_ACTIVATE_DIST) {
          s.activated = true;
        } else {
          return true;
        }
      }

      // Patrol
      s.setVelocityX(s.dir * SOLDIER_SPEED);
      if (s.x <= s.patrolMin) {
        s.dir = 1;
        s.setFlipX(true);
      } else if (s.x >= s.patrolMax) {
        s.dir = -1;
        s.setFlipX(false);
      }

      // Shoot toward player if in range
      if (time > s.nextShotAt) {
        s.nextShotAt = time + Phaser.Math.Between(SOLDIER_SHOOT_INTERVAL_MIN, SOLDIER_SHOOT_INTERVAL_MAX);
        const dx = this.player.x - s.x;
        if (Math.abs(dx) < 400) {
          const vx = dx > 0 ? ENEMY_BULLET_SPEED : -ENEMY_BULLET_SPEED;
          this.spawnEnemyBullet(s.x, s.y - 8, vx, 0);
        }
      }

      return true;
    });
  }

  private updateSpikeTraps(time: number) {
    for (const trap of this.spikeTraps) {
      if (time >= trap.nextToggleAt) {
        trap.active = !trap.active;
        trap.nextToggleAt = time + (trap.active ? trap.activeDurationMs : trap.cycleMs - trap.activeDurationMs);
        trap.glow.setFillStyle(trap.active ? 0xc4ff8c : 0xa4ff86, trap.active ? 0.26 : 0.12);
        for (const spike of trap.spikes) {
          spike.setVisible(trap.active);
        }
      }

      if (!trap.active || time < this.invincibleUntil) continue;
      if (Math.abs(this.player.x - trap.x) > trap.width / 2 + 10) continue;

      const playerFeet = this.player.y + this.player.displayHeight / 2;
      if (playerFeet >= GROUND_TOP_Y - 10) {
        this.spawnHit(this.player.x, GROUND_TOP_Y - 8, 0xbaff88);
        this.killPlayer();
      }
    }
  }

  private updateSniperNests(time: number) {
    const camRight = this.cameras.main.scrollX + GAME_WIDTH;

    for (const nest of this.sniperNests) {
      if (!nest.activated) {
        if (nest.x < camRight + 260) {
          nest.activated = true;
        } else {
          continue;
        }
      }

      if (nest.fireAt > 0 && time >= nest.fireAt) {
        nest.warningLine.clear();
        nest.warningLine.setVisible(false);
        nest.warningReticle.setVisible(false);

        const dx = nest.targetX - nest.x;
        const dy = nest.targetY - nest.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          const speed = ENEMY_BULLET_SPEED * 1.9;
          this.spawnEnemyBullet(nest.x + (dx / len) * 18, nest.y + (dy / len) * 18, (dx / len) * speed, (dy / len) * speed);
        }

        nest.fireAt = 0;
        nest.nextShotAt = time + nest.cooldownMs;
      }

      if (nest.fireAt === 0 && time >= nest.nextShotAt) {
        nest.targetX = this.player.x;
        nest.targetY = this.player.y;
        nest.fireAt = time + 700;
        nest.warningLine.clear();
        nest.warningLine.lineStyle(2, 0xff6677, 0.85);
        nest.warningLine.beginPath();
        nest.warningLine.moveTo(nest.x, nest.y);
        nest.warningLine.lineTo(nest.targetX, nest.targetY);
        nest.warningLine.strokePath();
        nest.warningLine.setVisible(true);
        nest.warningReticle.setPosition(nest.targetX, nest.targetY).setVisible(true);
      }

      if (nest.fireAt > 0) {
        const pulse = 1 + Math.sin(time / 70) * 0.18;
        nest.warningReticle.setScale(pulse).setAlpha(0.7 + Math.sin(time / 50) * 0.2);
      }
    }
  }

  private updateLaserGates(time: number) {
    for (const gate of this.laserGates) {
      if (time >= gate.nextToggleAt) {
        gate.active = !gate.active;
        gate.nextToggleAt = time + (gate.active ? gate.activeDurationMs : gate.cycleMs - gate.activeDurationMs);
        gate.beam.setVisible(gate.active);
        gate.beam.setFillStyle(0xff4458, gate.active ? 0.45 : 0.12);
        gate.topCore.setFillStyle(gate.active ? 0xffc1c7 : 0xff8894, gate.active ? 1 : 0.8);
        gate.bottomCore.setFillStyle(gate.active ? 0xffc1c7 : 0xff8894, gate.active ? 1 : 0.8);
      }

      const pulse = gate.active ? 0.85 + Math.sin(time / 80) * 0.15 : 0.45;
      gate.topCore.setScale(pulse);
      gate.bottomCore.setScale(pulse);

      if (!gate.active || time < this.invincibleUntil) continue;

      const withinX = Math.abs(this.player.x - gate.x) < 12;
      const withinY = this.player.y > gate.topY && this.player.y < gate.topY + gate.height;
      if (withinX && withinY) {
        this.spawnHit(gate.x, this.player.y, 0xff7788);
        this.killPlayer();
      }
    }
  }

  // ─── Turrets ─────────────────────────────────────────────────────────────────

  private updateTurrets(time: number) {
    const camRight = this.cameras.main.scrollX + GAME_WIDTH;

    for (const t of this.turrets) {
      if (!t.base.active) continue;

      // Activate
      if (!t.activated) {
        if (t.base.x < camRight + TURRET_ACTIVATE_DIST) {
          t.activated = true;
        } else {
          continue;
        }
      }

      // Manual bullet-hit detection (avoids Phaser callback ordering issues)
      this.bullets.children.each(child => {
        const b = child as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
        if (!b.active || !t.base.active) return true;
        const halfW = (b.displayWidth + t.base.displayWidth) / 2;
        const halfH = (b.displayHeight + t.base.displayHeight) / 2;
        if (Math.abs(b.x - t.base.x) < halfW && Math.abs(b.y - t.base.y) < halfH) {
          b.disableBody(true, true);
          this.spawnHit(b.x, b.y, 0xffee66);
          t.hp -= 1;
          if (t.hp <= 0) {
            t.barrel.destroy();
            this.spawnExplosion(t.base.x, t.base.y);
            t.base.destroy();
            this.updateScore(SCORE_PER_TURRET);
            gamepadManager.vibrate(120, 0.4, 0.7);
          } else {
            t.base.setTint(0xff8888);
            this.time.delayedCall(100, () => t.base.active && t.base.clearTint());
          }
        }
        return true;
      });

      if (!t.base.active) continue;

      // Aim barrel at player
      const dx = this.player.x - t.base.x;
      const dy = this.player.y - (t.base.y - 16);
      const angle = Math.atan2(dy, dx);
      t.barrel.setRotation(angle + Math.PI / 2);

      // Shoot
      if (time > t.nextShotAt) {
        t.nextShotAt = time + TURRET_SHOOT_INTERVAL;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          const speed = ENEMY_BULLET_SPEED * 1.1;
          this.spawnEnemyBullet(t.base.x, t.base.y - 20, (dx / len) * speed, (dy / len) * speed);
        }
      }
    }
  }

  // ─── Boss ────────────────────────────────────────────────────────────────────

  private spawnBoss() {
    this.bossSpawned = true;

    const bx = this.levelDef.bossX;
    const by = GROUND_TOP_Y - 40;

    const sprite = this.physics.add.sprite(bx, by, "sc-boss-1") as
      Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    sprite.setCollideWorldBounds(true);
    sprite.body.setSize(BOSS_W - 10, 70);
    sprite.setDepth(4);
    this.physics.add.collider(sprite, this.ground);
    this.physics.add.collider(sprite, this.platforms, undefined, this.entityCanLandOnPlatform, this);

    // HP bar (fixed to camera)
    const hpBarBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, 300, 14, 0x111111, 0.9)
      .setScrollFactor(0).setDepth(100).setStrokeStyle(1, 0xffffff, 0.3);
    const hpBarFill = this.add.rectangle(GAME_WIDTH / 2 - 149, GAME_HEIGHT - 20, 298, 10, 0xff3344, 1)
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);
    const hpLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 36, "COMMANDER", {
      fontFamily: "Arial", fontSize: "13px", color: "#ffaaaa",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    void hpBarBg;

    this.boss = {
      sprite,
      hp: this.levelDef.bossHp,
      maxHp: this.levelDef.bossHp,
      phase: 1,
      dir: -1,
      nextShotAt: this.time.now + 1000,
      hpBar: hpBarBg,
      hpBarFill,
      hpLabel,
      defeated: false,
    };
  }

  private updateBoss(time: number) {
    // Spawn when player gets close
    if (!this.bossSpawned && this.player.x > this.levelDef.bossX - 300) {
      this.spawnBoss();
      return;
    }

    if (!this.boss || this.boss.defeated) return;

    const b = this.boss;

    // Manual bullet-hit detection (avoids Phaser callback argument-order issues)
    this.bullets.children.each(child => {
      const bullet = child as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
      if (!bullet.active || !this.boss || this.boss.defeated) return true;
      const s = this.boss.sprite;
      const halfW = (bullet.displayWidth + s.displayWidth) / 2;
      const halfH = (bullet.displayHeight + s.displayHeight) / 2;
      if (Math.abs(bullet.x - s.x) < halfW && Math.abs(bullet.y - s.y) < halfH) {
        bullet.disableBody(true, true);
        this.spawnHit(bullet.x, bullet.y, 0xffee00);
        this.boss.hp -= 1;

        if (this.boss.hp <= Math.floor(this.levelDef.bossHp * 0.33) && this.boss.phase < 3) {
          this.boss.phase = 3;
          s.setTexture("sc-boss-3");
          this.cameras.main.shake(200, 0.008);
        } else if (this.boss.hp <= Math.floor(this.levelDef.bossHp * 0.66) && this.boss.phase < 2) {
          this.boss.phase = 2;
          s.setTexture("sc-boss-2");
          this.cameras.main.shake(150, 0.005);
        }

        s.setTint(0xffffff);
        this.time.delayedCall(80, () => this.boss?.sprite.clearTint());

        if (this.boss.hp <= 0) {
          this.defeatBoss();
        }
      }
      return true;
    });

    if (!this.boss || this.boss.defeated) return;
    const speed =
      b.phase === 1 ? this.levelDef.bossSpeed[0] : b.phase === 2 ? this.levelDef.bossSpeed[1] : this.levelDef.bossSpeed[2];

    // Move toward player on X axis
    const dx = this.player.x - b.sprite.x;
    if (Math.abs(dx) > 60) {
      b.sprite.setVelocityX(dx > 0 ? speed : -speed);
      b.dir = dx > 0 ? 1 : -1;
    } else {
      b.sprite.setVelocityX(0);
    }

    b.sprite.setFlipX(b.dir < 0);

    // Shoot
    const shootInterval =
      b.phase === 1
        ? BOSS_SHOOT_INTERVAL_1
        : b.phase === 2
          ? BOSS_SHOOT_INTERVAL_2
          : BOSS_SHOOT_INTERVAL_3;

    if (time > b.nextShotAt) {
      b.nextShotAt = time + shootInterval;
      this.bossFire();
    }

    // Update HP bar
    const ratio = Phaser.Math.Clamp(b.hp / b.maxHp, 0, 1);
    b.hpBarFill.width = 298 * ratio;
    b.hpBarFill.setFillStyle(ratio > 0.5 ? 0xff3344 : ratio > 0.25 ? 0xff8800 : 0xffee00, 1);
  }

  private bossFire() {
    if (!this.boss) return;
    const b = this.boss;
    const bx = b.sprite.x;
    const by = b.sprite.y;
    const dx = this.player.x - bx;
    const dy = this.player.y - by;
    const baseAngle = Math.atan2(dy, dx);
    const speed = ENEMY_BULLET_SPEED * 1.2;

    const spreadAngles =
      b.phase === 1
        ? [0]
        : b.phase === 2
          ? [-0.35, 0, 0.35]
          : [-0.6, -0.3, 0, 0.3, 0.6];

    for (const offset of spreadAngles) {
      const a = baseAngle + offset;
      // Do not spawn bullets through terrain when the muzzle is flush with a platform edge.
      const spawnX = bx + Math.cos(a) * 50;
      const spawnY = by + Math.sin(a) * 50;
      if (this.isTerrainBlockingShot(bx, by, spawnX, spawnY)) continue;

      this.spawnEnemyBullet(spawnX, spawnY, Math.cos(a) * speed, Math.sin(a) * speed);
    }
  }

  // ─── Overlap / collision callbacks ───────────────────────────────────────────

  private onBulletsMeetBullets(playerBulletObj: ArcadeTarget, enemyBulletObj: ArcadeTarget) {
    const pb = playerBulletObj as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    const eb = enemyBulletObj as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    if (!pb.active || !eb.active) return;
    this.spawnHit((pb.x + eb.x) / 2, (pb.y + eb.y) / 2, 0xffffff);
    pb.disableBody(true, true);
    eb.disableBody(true, true);
  }

  private onBulletHitSoldier(bulletObj: ArcadeTarget, soldierObj: ArcadeTarget) {
    const bullet = bulletObj as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    const soldier = soldierObj as SoldierSprite;

    bullet.disableBody(true, true);
    soldier.hp -= 1;
    this.spawnHit(bullet.x, bullet.y, 0xffee66);

    if (soldier.hp <= 0) {
      this.spawnExplosion(soldier.x, soldier.y);
      soldier.destroy();
      this.updateScore(SCORE_PER_SOLDIER);
      gamepadManager.vibrate(80, 0.2, 0.5);
    } else {
      soldier.setTint(0xff8888);
      this.time.delayedCall(100, () => soldier.active && soldier.clearTint());
    }
  }

  private checkEnemyBulletsHitPlayer() {
    if (this.time.now < this.invincibleUntil) return;
    const px = this.player.x, py = this.player.y;
    const pw = this.player.displayWidth / 2, ph = this.player.displayHeight / 2;
    this.enemyBullets.children.each(child => {
      const b = child as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
      if (!b.active) return true;
      if (Math.abs(b.x - px) < pw + 4 && Math.abs(b.y - py) < ph + 4) {
        b.disableBody(true, true);
        this.spawnHit(b.x, b.y, 0xff4466);
        this.killPlayer();
      }
      return true;
    });
  }

  private onPickup(playerObj: ArcadeTarget, pickupObj: ArcadeTarget) {
    const pickup = pickupObj as Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
    const wt = pickup.getData("weapon") as WeaponType;
    this.weapon = wt;
    this.weaponText.setText(wt.toUpperCase());
    pickup.destroy();
    this.cameras.main.flash(120, 255, 220, 100, false);
  }

  private onBulletHitTerrain(bulletObj: ArcadeTarget) {
    const bullet = bulletObj as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    this.spawnHit(bullet.x, bullet.y, 0xaabbcc);
    bullet.disableBody(true, true);
  }

  // ─── Player death / respawn ───────────────────────────────────────────────────

  private killPlayer() {
    if (this.dead) return;
    this.dead = true;
    this.lives -= 1;
    this.refreshLives();
    if (this.lives > 0) {
      this.saveProgress();
    }

    this.player.play("sc-dead");
    this.player.setVelocity(0, -200);
    gamepadManager.vibrate(300, 0.7, 1);
    this.cameras.main.shake(250, 0.012);

    if (this.lives <= 0) {
      this.time.delayedCall(1200, () => this.showGameOver());
    } else {
      this.time.delayedCall(1200, () => this.respawnPlayer());
    }
  }

  private respawnPlayer() {
    this.dead = false;
    this.invincibleUntil = this.time.now + INVINCIBLE_MS;
    this.weapon = "pistol";
    this.weaponText.setText("PISTOL");

    const rx = Math.max(120, this.cameras.main.scrollX + 100);
    this.player.enableBody(true, rx, GROUND_TOP_Y - PLAYER_H / 2, true, true);
    this.player.play("sc-idle");
    this.player.setAlpha(1);
    this.player.body.setSize(20, 44);
    this.player.body.setOffset(6, 4);
    this.isCrouching = false;
    this.jumpsUsed = 0;
  }

  // ─── Boss defeat ─────────────────────────────────────────────────────────────

  private defeatBoss() {
    if (!this.boss) return;
    this.boss.defeated = true;

    this.spawnExplosion(this.boss.sprite.x, this.boss.sprite.y);
    this.spawnExplosion(this.boss.sprite.x + 20, this.boss.sprite.y - 20);
    this.spawnExplosion(this.boss.sprite.x - 20, this.boss.sprite.y + 10);

    this.boss.sprite.destroy();
    this.boss.hpBarFill.destroy();
    this.boss.hpLabel.destroy();

    this.updateScore(SCORE_PER_BOSS);
    gamepadManager.vibrate(400, 1, 1);
    this.cameras.main.shake(400, 0.018);

    this.time.delayedCall(1500, () => this.showLevelComplete());
  }

  // ─── Effects ─────────────────────────────────────────────────────────────────

  private spawnExplosion(x: number, y: number) {
    const sprite = this.add.sprite(x, y, "sc-explosion-0").setDepth(10);
    sprite.play("sc-explode");
    sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy());
  }

  private spawnHit(x: number, y: number, color: number) {
    const flash = this.add.circle(x, y, 5, color, 0.9).setDepth(10);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 120,
      ease: "Quad.Out",
      onComplete: () => flash.destroy(),
    });
  }

  // ─── Utility ─────────────────────────────────────────────────────────────────

  private cullOffscreenBullets() {
    const camLeft = this.cameras.main.scrollX - 100;
    const camRight = this.cameras.main.scrollX + GAME_WIDTH + 100;

    const cullGroup = (group: Phaser.Physics.Arcade.Group) => {
      group?.children.each((child) => {
        const b = child as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
        if (!b.active) return true;
        if (b.x < camLeft || b.x > camRight || b.y < -50 || b.y > GAME_HEIGHT + 50) {
          b.disableBody(true, true);
        }
        return true;
      });
    };

    if (this.bullets) cullGroup(this.bullets);
    if (this.enemyBullets) cullGroup(this.enemyBullets);
  }

  // ─── End screens ─────────────────────────────────────────────────────────────

  private showGameOver() {
    this.gameOver = true;
    this.physics.pause();
    clearSteelCommandoProgress();
    this.showOverlay("GAME OVER", `SCORE ${String(this.score).padStart(6, "0")}`, 0xff3344);
  }

  private showLevelComplete() {
    this.levelComplete = true;
    this.physics.pause();
    const isLast = this.currentLevel >= LEVEL_DEFS.length;
    if (isLast) {
      clearSteelCommandoProgress();
    } else {
      saveSteelCommandoProgress({
        level: this.currentLevel + 1,
        lives: this.lives,
        score: this.score,
      });
    }
    const title = isLast ? "ALL MISSIONS COMPLETE!" : `LEVEL ${this.currentLevel} CLEAR!`;
    const hint = isLast
      ? "Press R or START to restart"
      : `Press R or START for Level ${this.currentLevel + 1}`;
    this.showOverlay(title, `SCORE ${String(this.score).padStart(6, "0")}`, 0x44ff88, hint);
  }

  private showOverlay(title: string, subtitle: string, color: number, hint = "Press R or START to restart") {
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 420, 190, 0x050913, 0.94)
      .setStrokeStyle(2, color, 0.6)
      .setScrollFactor(0)
      .setDepth(200);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 36, title, {
        fontFamily: "Arial", fontSize: "34px",
        color: `#${color.toString(16).padStart(6, "0")}`,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, subtitle, {
        fontFamily: "Arial", fontSize: "22px", color: "#dff8ff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, hint, {
        fontFamily: "Arial", fontSize: "16px", color: "#8899cc",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);
  }
}
