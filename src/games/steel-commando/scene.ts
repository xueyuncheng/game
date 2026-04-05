import * as Phaser from "phaser";
import { gamepadManager } from "@/lib/gamepad/gamepad-manager";
import {
  BOSS_HP,
  BOSS_SHOOT_INTERVAL_1,
  BOSS_SHOOT_INTERVAL_2,
  BOSS_SHOOT_INTERVAL_3,
  BOSS_SPEED_1,
  BOSS_SPEED_2,
  BOSS_SPEED_3,
  BOSS_W,
  BOSS_X,
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
  PLAYER_W,
  SCORE_PER_BOSS,
  SCORE_PER_SOLDIER,
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
  WORLD_WIDTH,
  type WeaponType,
} from "@/games/steel-commando/config";
import { type ArcadeTarget, type BossData, type SoldierSprite, type TurretEntry } from "@/games/steel-commando/types";
import { PICKUP_DEFS, PLATFORM_DEFS, SOLDIER_DEFS, TURRET_DEFS } from "@/games/steel-commando/level-data";
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
  private weapon: WeaponType = "pistol";
  private lastShotAt = 0;
  private invincibleUntil = 0;
  private lives = MAX_LIVES;
  private score = 0;
  private dead = false;
  private gameOver = false;
  private levelComplete = false;

  // Gamepad edge detection
  private prevGpJump = false;
  private prevGpShoot = false;

  // Physics groups
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private soldierGroup!: Phaser.Physics.Arcade.Group;
  private pickupGroup!: Phaser.Physics.Arcade.StaticGroup;

  // Enemy data
  private turrets: TurretEntry[] = [];
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

  constructor() {
    super("steel-commando");
  }

  // ─── Preload ────────────────────────────────────────────────────────────────

  preload() {
    preloadTextures(this);
  }

  // ─── Create ─────────────────────────────────────────────────────────────────

  create() {
    this.resetState();
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.physics.world.gravity.y = 900; // PLAYER_GRAVITY

    this.createBackground();
    this.createTerrain();
    this.createPlayer();
    createAnimations(this);
    this.spawnEnemies();
    this.placePickups();
    this.setupCamera();
    this.setupInput();
    this.createGroups();
    this.setupColliders();
    this.createHud();
  }

  private resetState() {
    this.facingRight = true;
    this.aimUp = false;
    this.isCrouching = false;
    this.isOnGround = false;
    this.weapon = "pistol";
    this.lastShotAt = 0;
    this.invincibleUntil = 0;
    this.lives = MAX_LIVES;
    this.score = 0;
    this.dead = false;
    this.gameOver = false;
    this.levelComplete = false;
    this.prevGpJump = false;
    this.prevGpShoot = false;
    this.turrets = [];
    this.boss = null;
    this.bossSpawned = false;
  }

  // ─── Background ──────────────────────────────────────────────────────────────

  private createBackground() {
    // Sky (static, full canvas)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "sc-sky").setScrollFactor(0).setDepth(-10);

    // Mountains (slow parallax)
    for (let i = 0; i < Math.ceil(WORLD_WIDTH / GAME_WIDTH) + 1; i++) {
      this.add
        .image(i * GAME_WIDTH, GAME_HEIGHT - 260, "sc-mountains")
        .setOrigin(0, 0)
        .setScrollFactor(0.15)
        .setDepth(-9);
    }

    // Buildings (medium parallax)
    for (let i = 0; i < Math.ceil(WORLD_WIDTH / GAME_WIDTH) + 1; i++) {
      this.add
        .image(i * GAME_WIDTH, GAME_HEIGHT - 220, "sc-buildings")
        .setOrigin(0, 0)
        .setScrollFactor(0.4)
        .setDepth(-8);
    }
  }

  // ─── Terrain ─────────────────────────────────────────────────────────────────

  private createTerrain() {
    this.ground = this.physics.add.staticGroup();
    this.platforms = this.physics.add.staticGroup();

    // Ground strip: cover the whole world width with 64px tiles
    const tileW = 64;
    const numTiles = Math.ceil(WORLD_WIDTH / tileW) + 1;
    for (let i = 0; i < numTiles; i++) {
      const tile = this.ground.create(i * tileW + tileW / 2, GROUND_TOP_Y + 32, "sc-ground") as
        Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
      tile.refreshBody();
    }

    // Platforms
    for (const [cx, cy, w] of PLATFORM_DEFS) {
      const numPTiles = Math.ceil(w / tileW);
      for (let i = 0; i < numPTiles; i++) {
        const tx = cx - w / 2 + i * tileW + tileW / 2;
        const pt = this.platforms.create(tx, cy, "sc-platform") as
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

    for (const [sx, patrolRadius] of SOLDIER_DEFS) {
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
    for (let i = 0; i < TURRET_DEFS.length; i++) {
      const [tx, ty] = TURRET_DEFS[i];
      const base = this.physics.add.staticSprite(tx, ty, "sc-turret-base") as
        Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
      base.refreshBody();
      base.setDepth(3);
      base.setData("turretIdx", i);

      const barrel = this.add.image(tx, ty - 16, "sc-turret-barrel");
      barrel.setOrigin(0.5, 1);
      barrel.setDepth(3);

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

    for (const [px, wt] of PICKUP_DEFS) {
      const py = GROUND_TOP_Y - 24;
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

  // ─── Camera ──────────────────────────────────────────────────────────────────

  private setupCamera() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
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
  }

  // ─── Groups ──────────────────────────────────────────────────────────────────

  private createGroups() {
    this.bullets = this.physics.add.group({ maxSize: 50, classType: Phaser.Physics.Arcade.Image });
    this.enemyBullets = this.physics.add.group({ maxSize: 60, classType: Phaser.Physics.Arcade.Image });
  }

  // ─── Colliders ───────────────────────────────────────────────────────────────

  private setupColliders() {
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.platforms, this.onPlayerPlatform, this.playerCanLandOnPlatform, this);
    this.physics.add.collider(this.soldierGroup, this.ground);
    this.physics.add.collider(this.soldierGroup, this.platforms, undefined, this.entityCanLandOnPlatform, this);

    this.physics.add.overlap(this.player, this.pickupGroup, this.onPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.bullets, this.soldierGroup, this.onBulletHitSoldier as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.enemyBullets, this.player, this.onEnemyBulletHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    // Bullets vs ground/platforms (destroy bullet)
    this.physics.add.collider(this.bullets, this.ground, this.onBulletHitTerrain as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.collider(this.bullets, this.platforms, this.onBulletHitTerrain as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
  }

  private playerCanLandOnPlatform(
    playerObj: ArcadeTarget,
    _platformObj: ArcadeTarget,
  ): boolean {
    const p = playerObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    // Only land if falling downward (not jumping through)
    return p.body.velocity.y >= 0;
  }

  private entityCanLandOnPlatform(
    _entityObj: ArcadeTarget,
    _platformObj: ArcadeTarget,
  ): boolean {
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

    this.weaponText = this.add
      .text(16, 36, "PISTOL", { fontFamily: "Arial", fontSize: "14px", color: "#ffee88" })
      .setScrollFactor(0)
      .setDepth(100);

    // Lives icons
    this.livesContainer = this.add.container(GAME_WIDTH - 20, 12).setScrollFactor(0).setDepth(100);
    this.refreshLives();

    // Controls hint
    this.add
      .text(GAME_WIDTH / 2, 12, "← → Move  Z/Space Jump  X/Ctrl Shoot  ↑ AimUp  ↓ Crouch  R Restart", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#8899bb",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100);
  }

  private refreshLives() {
    this.livesContainer.removeAll(true);
    for (let i = 0; i < this.lives; i++) {
      const icon = this.add.image(-i * 24, 0, "sc-life-icon").setOrigin(1, 0);
      this.livesContainer.add(icon);
    }
  }

  private updateScore(delta: number) {
    this.score += delta;
    this.scoreText.setText(`SCORE ${String(this.score).padStart(6, "0")}`);
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  update(time: number, delta: number) {
    if (this.gameOver || this.levelComplete) {
      const gp = gamepadManager.poll();
      const restart = Phaser.Input.Keyboard.JustDown(this.restartKey) || (gp.start && !this.prevGpJump);
      if (restart) this.scene.restart();
      return;
    }

    if (this.dead) return;

    const input = this.gatherInput(time);
    this.updatePlayer(time, input);
    this.updateSoldiers(time);
    this.updateTurrets(time);
    this.updateBoss(time);
    this.cullOffscreenBullets();
    void delta;
  }

  // ─── Input gathering ─────────────────────────────────────────────────────────

  private gatherInput(time: number) {
    const kb = this.cursors;
    const gp = gamepadManager.poll();

    const moveLeft = Boolean(kb.left.isDown);
    const moveRight = Boolean(kb.right.isDown);
    const aimUpKb = Boolean(kb.up.isDown);
    const crouchKb = Boolean(kb.down.isDown || this.crouchKey.isDown);
    const jumpJustDown =
      Phaser.Input.Keyboard.JustDown(this.jumpKey) ||
      Phaser.Input.Keyboard.JustDown(kb.up) ||
      (gp.altShoot && !this.prevGpJump);
    const shootDown =
      Boolean(this.shootKey.isDown) ||
      Boolean(this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL).isDown) ||
      Boolean(kb.space?.isDown) ||
      gp.shoot;
    const shootJustDown = shootDown && !this.prevGpShoot;

    this.prevGpJump = gp.altShoot;
    this.prevGpShoot = gp.shoot;

    void time;
    void shootJustDown;

    return {
      left: moveLeft || gp.moveLeft,
      right: moveRight || gp.moveRight,
      aimUp: aimUpKb || gp.moveUp,
      crouch: crouchKb || gp.moveDown,
      jumpJustDown,
      shootDown,
    };
  }

  // ─── Player update ───────────────────────────────────────────────────────────

  private updatePlayer(time: number, input: ReturnType<typeof this.gatherInput>) {
    const body = this.player.body;
    this.isOnGround = body.blocked.down;
    this.aimUp = input.aimUp && !input.crouch;

    // Crouch (only on ground)
    const wantCrouch = input.crouch && this.isOnGround;
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

    // Horizontal movement (no movement while crouching)
    if (!this.isCrouching) {
      if (input.left) {
        this.player.setVelocityX(-PLAYER_SPEED);
        this.facingRight = false;
      } else if (input.right) {
        this.player.setVelocityX(PLAYER_SPEED);
        this.facingRight = true;
      } else {
        this.player.setVelocityX(0);
      }
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    if (input.jumpJustDown && this.isOnGround) {
      this.player.setVelocityY(PLAYER_JUMP_VEL);
      this.isOnGround = false;
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
      this.doPlayerShoot();
    }

    // Invincibility blink
    if (time < this.invincibleUntil) {
      this.player.setAlpha(Math.sin(time / 80) > 0 ? 1 : 0.3);
    } else {
      this.player.setAlpha(1);
    }
  }

  // ─── Player shoot ────────────────────────────────────────────────────────────

  private doPlayerShoot() {
    const x = this.player.x + (this.facingRight ? 18 : -18);
    const baseVX = this.facingRight ? BULLET_SPEED : -BULLET_SPEED;
    const baseVY = this.aimUp ? -BULLET_SPEED : 0;

    // Normalize diagonal
    if (baseVX !== 0 && baseVY !== 0) {
      const len = Math.hypot(baseVX, baseVY);
      this.spawnBullet(x, this.player.y, (baseVX / len) * BULLET_SPEED, (baseVY / len) * BULLET_SPEED);
    } else if (this.weapon === "spread") {
      // 3-way spread
      const angles = [-0.3, 0, 0.3];
      for (const a of angles) {
        const vx = Math.cos(a) * (this.facingRight ? BULLET_SPEED : -BULLET_SPEED);
        const vy = Math.sin(a) * BULLET_SPEED * (this.facingRight ? 1 : -1);
        this.spawnBullet(x, this.player.y, vx, vy);
      }
    } else if (this.weapon === "laser") {
      // Fast straight laser
      this.spawnBullet(x, this.player.y, baseVX * 1.4, 0, "sc-bullet-laser");
    } else {
      this.spawnBullet(x, this.player.y, baseVX, baseVY);
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

    // Rotate to match velocity direction
    if (vy !== 0) {
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

    const bx = BOSS_X;
    const by = GROUND_TOP_Y - 40;

    const sprite = this.physics.add.sprite(bx, by, "sc-boss-1") as
      Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    sprite.setCollideWorldBounds(true);
    sprite.body.setSize(BOSS_W - 10, 70);
    sprite.setDepth(4);
    this.physics.add.collider(sprite, this.ground);

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
      hp: BOSS_HP,
      maxHp: BOSS_HP,
      phase: 1,
      dir: -1,
      nextShotAt: this.time.now + 1000,
      hpBar: hpBarBg,
      hpBarFill,
      hpLabel,
      defeated: false,
    };

    // Register bullet overlap
    this.physics.add.overlap(
      this.bullets,
      sprite,
      this.onBulletHitBoss as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
  }

  private updateBoss(time: number) {
    // Spawn when player gets close
    if (!this.bossSpawned && this.player.x > BOSS_X - 600) {
      this.spawnBoss();
      return;
    }

    if (!this.boss || this.boss.defeated) return;

    const b = this.boss;
    const speed =
      b.phase === 1 ? BOSS_SPEED_1 : b.phase === 2 ? BOSS_SPEED_2 : BOSS_SPEED_3;

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
      this.spawnEnemyBullet(bx, by, Math.cos(a) * speed, Math.sin(a) * speed);
    }
  }

  // ─── Overlap / collision callbacks ───────────────────────────────────────────

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

  private onBulletHitBoss(bulletObj: ArcadeTarget, _bossObj: ArcadeTarget) {
    if (!this.boss || this.boss.defeated) return;

    const bullet = bulletObj as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    bullet.disableBody(true, true);
    this.spawnHit(bullet.x, bullet.y, 0xffee00);

    this.boss.hp -= 1;

    // Phase transitions
    if (this.boss.hp <= Math.floor(BOSS_HP * 0.33) && this.boss.phase < 3) {
      this.boss.phase = 3;
      this.boss.sprite.setTexture("sc-boss-3");
      this.cameras.main.shake(200, 0.008);
    } else if (this.boss.hp <= Math.floor(BOSS_HP * 0.66) && this.boss.phase < 2) {
      this.boss.phase = 2;
      this.boss.sprite.setTexture("sc-boss-2");
      this.cameras.main.shake(150, 0.005);
    }

    this.boss.sprite.setTint(0xffffff);
    this.time.delayedCall(80, () => this.boss?.sprite.clearTint());

    if (this.boss.hp <= 0) {
      this.defeatBoss();
    }
  }

  private onEnemyBulletHitPlayer(bulletObj: ArcadeTarget, _playerObj: ArcadeTarget) {
    const bullet = bulletObj as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

    if (this.time.now < this.invincibleUntil) return;

    bullet.disableBody(true, true);
    this.spawnHit(bullet.x, bullet.y, 0xff4466);
    this.killPlayer();
  }

  private onPickup(playerObj: ArcadeTarget, pickupObj: ArcadeTarget) {
    const pickup = pickupObj as Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
    const wt = pickup.getData("weapon") as WeaponType;
    this.weapon = wt;
    this.weaponText.setText(wt.toUpperCase());
    pickup.destroy();
    this.cameras.main.flash(120, 255, 220, 100, false);
  }

  private onBulletHitTerrain(bulletObj: ArcadeTarget, _terrainObj: ArcadeTarget) {
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
    this.showOverlay("GAME OVER", `SCORE ${String(this.score).padStart(6, "0")}`, 0xff3344);
  }

  private showLevelComplete() {
    this.levelComplete = true;
    this.physics.pause();
    this.showOverlay("MISSION COMPLETE", `SCORE ${String(this.score).padStart(6, "0")}`, 0x44ff88);
  }

  private showOverlay(title: string, subtitle: string, color: number) {
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
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, "Press R or START to restart", {
        fontFamily: "Arial", fontSize: "16px", color: "#8899cc",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);
  }
}
