import * as Phaser from "phaser";
import { gamepadManager } from "@/lib/gamepad/gamepad-manager";
import {
  BASE_HP,
  BULLET_HEIGHT,
  BULLET_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  TANK_HITBOX_SIZE,
  TANK_SIZE,
  TILE_SIZE,
  WALL_SIZE,
} from "@/games/tank-blitz/config";

type BulletOwner = "player" | "enemy";
type WallKind = "brick" | "steel";

type BulletData = {
  owner: BulletOwner;
};

type ArcadeCollisionTarget =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

type EnemyTank = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & {
  nextShotAt?: number;
  /** Current grid tile the enemy is on (always a tile center). */
  gridCol?: number;
  gridRow?: number;
  /** Direction the enemy is currently moving. */
  heading?: Phaser.Math.Vector2;
  /** Progress 0..1 from current tile center toward the next tile center. */
  moveProgress?: number;
};

type WallSprite = Phaser.Types.Physics.Arcade.SpriteWithStaticBody & {
  wallKind: WallKind;
};

const arenaRows = [
  "SSSSSSSSSSSSSSS",
  "S0000000000000S",
  "S0B00BB0BB00B0S",
  "S0000000000000S",
  "S0BB0S000S0BB0S",
  "S0000B0B0B0000S",
  "S0BB00000000B0S",
  "S000B0S0S0B000S",
  "S0BB00000000B0S",
  "S00000BBB00000S",
];

const spawnColumns = [1, 4, 7, 10, 13];
const CARDINAL_DIRECTIONS = [
  new Phaser.Math.Vector2(0, -1),
  new Phaser.Math.Vector2(0, 1),
  new Phaser.Math.Vector2(-1, 0),
  new Phaser.Math.Vector2(1, 0),
];
const LANE_SNAP_TOLERANCE = 10;
const ENEMY_SPEED = 124;

function tileCenter(index: number) {
  return index * TILE_SIZE + TILE_SIZE / 2;
}

function nearestTileCenter(position: number) {
  return tileCenter(Math.round((position - TILE_SIZE / 2) / TILE_SIZE));
}

function toWallKind(tile: string): WallKind | null {
  if (tile === "B") {
    return "brick";
  }

  if (tile === "S") {
    return "steel";
  }

  return null;
}

function cloneDirection(direction: Phaser.Math.Vector2) {
  return new Phaser.Math.Vector2(direction.x, direction.y);
}

function cardinalFromVector(vector: Phaser.Math.Vector2, fallback = new Phaser.Math.Vector2(0, -1)) {
  if (vector.lengthSq() === 0) {
    return cloneDirection(fallback);
  }

  if (Math.abs(vector.x) > Math.abs(vector.y)) {
    return new Phaser.Math.Vector2(Math.sign(vector.x) || fallback.x || 1, 0);
  }

  return new Phaser.Math.Vector2(0, Math.sign(vector.y) || fallback.y || -1);
}

function separateTanks(
  firstTank: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  secondTank: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
) {
  const delta = new Phaser.Math.Vector2(secondTank.x - firstTank.x, secondTank.y - firstTank.y);
  const separationAxis = cardinalFromVector(delta, new Phaser.Math.Vector2(0, 1));
  const overlapX = TANK_HITBOX_SIZE - Math.abs(delta.x);
  const overlapY = TANK_HITBOX_SIZE - Math.abs(delta.y);

  if (separationAxis.x !== 0) {
    const push = Math.max(overlapX / 2 + 1, 2);
    firstTank.x -= separationAxis.x * push;
    secondTank.x += separationAxis.x * push;
    return separationAxis;
  }

  const push = Math.max(overlapY / 2 + 1, 2);
  firstTank.y -= separationAxis.y * push;
  secondTank.y += separationAxis.y * push;
  return separationAxis;
}

export class TankBlitzScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private shootKey!: Phaser.Input.Keyboard.Key;
  private dashKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerTurret!: Phaser.GameObjects.Rectangle;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private baseZone!: Phaser.GameObjects.Rectangle;
  private baseHpBarBack!: Phaser.GameObjects.Rectangle;
  private baseHpBarFill!: Phaser.GameObjects.Rectangle;
  private scoreText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private enemySpawnText!: Phaser.GameObjects.Text;
  private gameOverText?: Phaser.GameObjects.Text;
  private restartHintText?: Phaser.GameObjects.Text;
  private score = 0;
  private wave = 1;
  private baseHp = BASE_HP;
  private lastPlayerShotAt = 0;
  private lastDashAt = 0;
  private nextEnemySpawnAt = 0;
  private gameOver = false;

  constructor() {
    super("tank-blitz");
  }

  preload() {
    const graphics = this.add.graphics();

    this.drawTankTexture(graphics, "tank-player", 0x66f2ff, 0x123556);
    this.drawTankTexture(graphics, "tank-enemy", 0xff6b9e, 0x5a1028);

    graphics.clear();
    graphics.fillStyle(0xffef99, 1);
    graphics.fillRoundedRect(0, 0, BULLET_WIDTH, BULLET_HEIGHT, 3);
    graphics.generateTexture("bullet", BULLET_WIDTH, BULLET_HEIGHT);

    graphics.clear();
    graphics.fillStyle(0x663d2a, 1);
    graphics.fillRect(0, 0, WALL_SIZE, WALL_SIZE);
    graphics.lineStyle(2, 0xffb685, 0.22);
    graphics.strokeRect(1, 1, WALL_SIZE - 2, WALL_SIZE - 2);
    graphics.lineStyle(2, 0x2d1a11, 0.18);
    graphics.lineBetween(0, WALL_SIZE / 2, WALL_SIZE, WALL_SIZE / 2);
    graphics.lineBetween(WALL_SIZE / 3, 0, WALL_SIZE / 3, WALL_SIZE / 2);
    graphics.lineBetween((WALL_SIZE / 3) * 2, WALL_SIZE / 2, (WALL_SIZE / 3) * 2, WALL_SIZE);
    graphics.generateTexture("wall-brick", WALL_SIZE, WALL_SIZE);

    graphics.clear();
    graphics.fillStyle(0x384a68, 1);
    graphics.fillRect(0, 0, WALL_SIZE, WALL_SIZE);
    graphics.lineStyle(2, 0xc5d7ff, 0.24);
    graphics.strokeRect(1, 1, WALL_SIZE - 2, WALL_SIZE - 2);
    graphics.lineStyle(2, 0x162131, 0.24);
    graphics.lineBetween(WALL_SIZE / 2, 0, WALL_SIZE / 2, WALL_SIZE);
    graphics.lineBetween(0, WALL_SIZE / 2, WALL_SIZE, WALL_SIZE / 2);
    graphics.generateTexture("wall-steel", WALL_SIZE, WALL_SIZE);
    graphics.destroy();
  }

  create() {
    this.resetState();
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x08101f, 0.92);
    this.drawGrid();
    this.createWalls();
    this.createBaseAndPlayer();
    this.createGroups();
    this.setupInput();
    this.setupColliders();
    this.createHud();
    this.spawnEnemyWave(4);
  }

  update(time: number, delta: number) {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.scene.restart();
      }

      return;
    }

    const keyboard = this.readKeyboardInput();
    const gamepad = gamepadManager.poll();
    const input = {
      moveUp: keyboard.moveUp || gamepad.moveUp,
      moveDown: keyboard.moveDown || gamepad.moveDown,
      moveLeft: keyboard.moveLeft || gamepad.moveLeft,
      moveRight: keyboard.moveRight || gamepad.moveRight,
      shoot: keyboard.shoot || gamepad.shoot,
      altShoot: keyboard.altShoot || gamepad.altShoot,
      restart: keyboard.restart || gamepad.start,
    };

    if (input.restart) {
      this.scene.restart();
      return;
    }

    const currentDirection =
      (this.player.getData("direction") as Phaser.Math.Vector2 | undefined) ?? new Phaser.Math.Vector2(0, -1);
    const desiredMovement = this.resolvePlayerMovement(
      Number(input.moveRight) - Number(input.moveLeft),
      Number(input.moveDown) - Number(input.moveUp),
      currentDirection,
    );
    const movement = this.resolveTankMovement(this.player, desiredMovement, currentDirection);

    if (movement.lengthSq() > 0) {
      const dashBoost = input.altShoot && time - this.lastDashAt > 800 ? 1.55 : 1;
      const speed = 210 * dashBoost;

      if (dashBoost > 1) {
        this.lastDashAt = time;
        gamepadManager.vibrate(70, 0.25, 0.5);
      }

      this.alignTankToLane(this.player, movement);
      this.player.setVelocity(movement.x * speed, movement.y * speed);
      this.player.setRotation(movement.angle() + Math.PI / 2);
      this.player.setData("direction", cloneDirection(movement));
      this.syncTurretWithPlayer();
    } else {
      this.player.setVelocity(0, 0);
      this.syncTurretWithPlayer();
    }

    if (input.shoot && time - this.lastPlayerShotAt > 220) {
      this.lastPlayerShotAt = time;
      this.fireBullet(this.player, this.bullets, "player");
      gamepadManager.vibrate(45, 0.2, 0.45);
    }

    this.keepEntitiesInsideBounds();
    this.updateEnemies(time, delta);
    this.maybeSpawnEnemies(time);
    this.checkBaseDamage();
  }

  private drawTankTexture(
    graphics: Phaser.GameObjects.Graphics,
    key: string,
    bodyColor: number,
    detailColor: number,
  ) {
    graphics.clear();
    graphics.fillStyle(bodyColor, 1);
    graphics.fillRoundedRect(0, 0, TANK_SIZE, TANK_SIZE, 8);
    graphics.fillStyle(detailColor, 0.95);
    graphics.fillRoundedRect(TANK_SIZE / 2 - 4, 0, 8, 28, 4);
    graphics.fillRoundedRect(2, 6, 12, TANK_SIZE - 12, 4);
    graphics.fillRoundedRect(TANK_SIZE - 14, 6, 12, TANK_SIZE - 12, 4);
    graphics.fillStyle(0xf8fbff, 0.24);
    graphics.fillCircle(TANK_SIZE / 2, TANK_SIZE / 2 + 4, 14);
    graphics.generateTexture(key, TANK_SIZE, TANK_SIZE);
  }

  private resetState() {
    this.score = 0;
    this.wave = 1;
    this.baseHp = BASE_HP;
    this.lastPlayerShotAt = 0;
    this.lastDashAt = 0;
    this.nextEnemySpawnAt = 0;
    this.gameOver = false;
  }

  private createGroups() {
    this.bullets = this.physics.add.group({ maxSize: 30 });
    this.enemyBullets = this.physics.add.group({ maxSize: 40 });
    this.enemies = this.physics.add.group();
  }

  private createBaseAndPlayer() {
    const centerColumn = Math.floor(arenaRows[0].length / 2);
    const baseX = tileCenter(centerColumn);
    const baseY = tileCenter(arenaRows.length - 1) + 2;

    this.baseZone = this.add.rectangle(baseX, baseY, 96, 22, 0xffd84d, 0.9);
    this.baseHpBarBack = this.add.rectangle(baseX, baseY - 20, 72, 8, 0x170f0f, 0.9);
    this.baseHpBarBack.setStrokeStyle(1, 0xffffff, 0.16).setDepth(4);
    this.baseHpBarFill = this.add.rectangle(baseX, baseY - 20, 68, 4, 0x7cff9b, 0.95);
    this.baseHpBarFill.setOrigin(0.5).setDepth(5);
    this.updateBaseHpBar();

    this.player = this.physics.add.sprite(baseX, tileCenter(arenaRows.length - 2), "tank-player");
    this.player.setCollideWorldBounds(true);
    this.player.setDamping(false);
    this.player.setDrag(0);
    this.player.setMaxVelocity(260, 260);
    this.player.body.setSize(TANK_HITBOX_SIZE, TANK_HITBOX_SIZE);
    this.player.body.setOffset((TANK_SIZE - TANK_HITBOX_SIZE) / 2, (TANK_SIZE - TANK_HITBOX_SIZE) / 2);
    this.player.setDepth(2);
    this.player.setData("direction", new Phaser.Math.Vector2(0, -1));

    this.playerTurret = this.add.rectangle(baseX, tileCenter(arenaRows.length - 2) - 18, 8, 32, 0xe8f7ff, 0.95);
    this.playerTurret.setDepth(3);
    this.syncTurretWithPlayer();
  }

  private setupInput() {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error("Keyboard plugin unavailable");
    }

    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
    this.shootKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.dashKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.restartKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  private setupColliders() {
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this);
    // No enemy-wall collider — enemies use pure grid movement and never enter wall tiles.
    // Use overlap (not collider) so Phaser does NOT physically separate enemies.
    // Grid logic (isEnemyOnTile) keeps them from choosing the same target tile.
    this.physics.add.overlap(this.enemies, this.enemies, this.handleEnemyBounce, undefined, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.handlePlayerBulletHitEnemy, undefined, this);
    this.physics.add.overlap(this.enemyBullets, this.player, this.handleEnemyBulletHitPlayer, undefined, this);
    this.physics.add.collider(this.bullets, this.walls, this.handleBulletHitWall, undefined, this);
    this.physics.add.collider(this.enemyBullets, this.walls, this.handleBulletHitWall, undefined, this);
    this.physics.add.overlap(this.bullets, this.enemyBullets, this.handleBulletHitBullet, undefined, this);
  }

  private createHud() {
    this.scoreText = this.add.text(20, 16, "SCORE 0000", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#dff8ff",
    });

    this.statusText = this.add.text(20, 44, `BASE HP ${this.baseHp}`, {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffe79a",
    });

    this.enemySpawnText = this.add
      .text(GAME_WIDTH - 20, 16, `WAVE ${this.wave}`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#f0c6ff",
      })
      .setOrigin(1, 0);

    this.add.text(GAME_WIDTH - 20, 44, "R / START RESTART", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#9aa7cb",
    }).setOrigin(1, 0);
  }

  private updateBaseHpBar() {
    const ratio = Phaser.Math.Clamp(this.baseHp / BASE_HP, 0, 1);
    const width = 68 * ratio;
    this.baseHpBarFill.width = Math.max(width, 0);
    this.baseHpBarFill.setVisible(width > 0);

    if (ratio > 0.6) {
      this.baseHpBarFill.setFillStyle(0x7cff9b, 0.95);
      return;
    }

    if (ratio > 0.3) {
      this.baseHpBarFill.setFillStyle(0xffd86b, 0.95);
      return;
    }

    this.baseHpBarFill.setFillStyle(0xff7b7b, 0.95);
  }

  private drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x59f3ff, 0.08);

    for (let x = 0; x <= GAME_WIDTH; x += TILE_SIZE) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, GAME_HEIGHT);
    }

    for (let y = 0; y <= GAME_HEIGHT; y += TILE_SIZE) {
      graphics.moveTo(0, y);
      graphics.lineTo(GAME_WIDTH, y);
    }

    graphics.strokePath();
  }

  private createWalls() {
    this.walls = this.physics.add.staticGroup();
    const centerColumn = Math.floor(arenaRows[0].length / 2);
    const defenseRow = arenaRows.length - 1;

    arenaRows.forEach((row, rowIndex) => {
      row.split("").forEach((tile, colIndex) => {
        const wallKind = toWallKind(tile);
        if (!wallKind) {
          return;
        }

        this.createWall(colIndex, rowIndex, wallKind);
      });
    });

    // Build a tighter guard around the base so the last line feels intentional.
    [
      [centerColumn - 1, defenseRow],
      [centerColumn + 1, defenseRow],
      [centerColumn - 1, defenseRow - 1],
      [centerColumn + 1, defenseRow - 1],
      [centerColumn, defenseRow - 2],
    ].forEach(([colIndex, rowIndex]) => this.createWall(colIndex, rowIndex, "brick"));
  }

  private createWall(colIndex: number, rowIndex: number, wallKind: WallKind) {
    const texture = wallKind === "brick" ? "wall-brick" : "wall-steel";
    const wall = this.walls.create(tileCenter(colIndex), tileCenter(rowIndex), texture) as WallSprite;
    wall.wallKind = wallKind;
    wall.setScale(1);
    wall.setDepth(1);
    wall.refreshBody();
  }

  private readKeyboardInput() {
    return {
      moveUp: Boolean(this.cursors.up.isDown || this.wasd.up.isDown),
      moveDown: Boolean(this.cursors.down.isDown || this.wasd.down.isDown),
      moveLeft: Boolean(this.cursors.left.isDown || this.wasd.left.isDown),
      moveRight: Boolean(this.cursors.right.isDown || this.wasd.right.isDown),
      shoot: Boolean(this.shootKey.isDown),
      altShoot: Boolean(this.dashKey.isDown),
      restart: Phaser.Input.Keyboard.JustDown(this.restartKey),
    };
  }

  private resolvePlayerMovement(horizontal: number, vertical: number, fallback: Phaser.Math.Vector2) {
    if (horizontal === 0 && vertical === 0) {
      return new Phaser.Math.Vector2(0, 0);
    }

    if (horizontal !== 0 && vertical !== 0) {
      if (fallback.x !== 0 && horizontal === Math.sign(fallback.x)) {
        return new Phaser.Math.Vector2(horizontal, 0);
      }

      if (fallback.y !== 0 && vertical === Math.sign(fallback.y)) {
        return new Phaser.Math.Vector2(0, vertical);
      }

      return new Phaser.Math.Vector2(0, vertical);
    }

    if (horizontal !== 0) {
      return new Phaser.Math.Vector2(horizontal, 0);
    }

    return new Phaser.Math.Vector2(0, vertical);
  }

  private canTurnToDirection(
    tank: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    direction: Phaser.Math.Vector2,
  ) {
    if (direction.x !== 0) {
      return Math.abs(tank.y - nearestTileCenter(tank.y)) <= LANE_SNAP_TOLERANCE;
    }

    if (direction.y !== 0) {
      return Math.abs(tank.x - nearestTileCenter(tank.x)) <= LANE_SNAP_TOLERANCE;
    }

    return true;
  }

  private resolveTankMovement(
    tank: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    desiredDirection: Phaser.Math.Vector2,
    currentDirection: Phaser.Math.Vector2,
  ) {
    if (desiredDirection.lengthSq() === 0) {
      return new Phaser.Math.Vector2(0, 0);
    }

    if (currentDirection.lengthSq() === 0) {
      return this.canTurnToDirection(tank, desiredDirection) ? desiredDirection : new Phaser.Math.Vector2(0, 0);
    }

    const sameAxis =
      (desiredDirection.x !== 0 && currentDirection.x !== 0) ||
      (desiredDirection.y !== 0 && currentDirection.y !== 0);

    if (sameAxis) {
      return desiredDirection;
    }

    if (this.canTurnToDirection(tank, desiredDirection)) {
      return desiredDirection;
    }

    return currentDirection;
  }

  private alignTankToLane(
    tank: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    direction: Phaser.Math.Vector2,
  ) {
    if (direction.x !== 0) {
      const targetY = nearestTileCenter(tank.y);
      if (Math.abs(tank.y - targetY) <= LANE_SNAP_TOLERANCE) {
        tank.setY(targetY);
        return;
      }

      tank.setY(Phaser.Math.Linear(tank.y, targetY, 0.18));
      return;
    }

    if (direction.y !== 0) {
      const targetX = nearestTileCenter(tank.x);
      if (Math.abs(tank.x - targetX) <= LANE_SNAP_TOLERANCE) {
        tank.setX(targetX);
        return;
      }

      tank.setX(Phaser.Math.Linear(tank.x, targetX, 0.18));
    }
  }

  private tileIndex(position: number) {
    return Math.round((position - TILE_SIZE / 2) / TILE_SIZE);
  }

  private hasWallAt(colIndex: number, rowIndex: number) {
    return this.walls.getChildren().some((child) => {
      const wall = child as WallSprite;
      return wall.active && this.tileIndex(wall.x) === colIndex && this.tileIndex(wall.y) === rowIndex;
    });
  }

  private isTilePassable(colIndex: number, rowIndex: number) {
    const maxCol = arenaRows[0].length - 1;
    const maxRow = arenaRows.length - 1;

    if (colIndex < 0 || colIndex > maxCol || rowIndex < 0 || rowIndex > maxRow) {
      return false;
    }

    return !this.hasWallAt(colIndex, rowIndex);
  }

  /**
   * Check whether any other active enemy currently occupies OR is moving toward
   * the given tile.  Each enemy "reserves" both its current tile and the tile
   * it is heading toward, preventing two enemies from overlapping.
   */
  private isEnemyOnTile(colIndex: number, rowIndex: number, ignoredEnemy?: EnemyTank) {
    return this.enemies.getChildren().some((child) => {
      const other = child as EnemyTank;
      if (other === ignoredEnemy || !other.active) {
        return false;
      }

      const oCol = other.gridCol ?? 0;
      const oRow = other.gridRow ?? 0;

      // Current tile matches.
      if (oCol === colIndex && oRow === rowIndex) {
        return true;
      }

      // Destination tile matches (enemy has a heading and hasn't arrived yet).
      if (other.heading && other.heading.lengthSq() > 0) {
        if (oCol + other.heading.x === colIndex && oRow + other.heading.y === rowIndex) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Choose a direction for an enemy at grid position (gridCol, gridRow).
   * Only picks directions where the next tile is passable (no wall, in bounds).
   * Prefers tiles not occupied by other enemies.
   * Prefers continuing in the current direction if possible.
   */
  private chooseEnemyDirection(
    enemy: EnemyTank,
    currentHeading?: Phaser.Math.Vector2,
  ) {
    const col = enemy.gridCol ?? 0;
    const row = enemy.gridRow ?? 0;

    // All directions where the next tile has no wall.
    const passable = CARDINAL_DIRECTIONS.filter((d) =>
      this.isTilePassable(col + d.x, row + d.y),
    );

    // Among passable, prefer ones without another enemy.
    const free = passable.filter(
      (d) => !this.isEnemyOnTile(col + d.x, row + d.y, enemy),
    );

    const candidates = free.length > 0 ? free : passable;

    if (candidates.length === 0) {
      // Completely boxed in.
      return new Phaser.Math.Vector2(0, 0);
    }

    // 60% chance to continue in the same direction if possible.
    if (currentHeading && currentHeading.lengthSq() > 0 && Math.random() < 0.6) {
      const same = candidates.find(
        (d) => d.x === currentHeading.x && d.y === currentHeading.y,
      );
      if (same) {
        return cloneDirection(same);
      }
    }

    return cloneDirection(Phaser.Utils.Array.GetRandom(candidates));
  }

  private syncTurretWithPlayer() {
    const direction = (this.player.getData("direction") as Phaser.Math.Vector2 | undefined) ?? new Phaser.Math.Vector2(0, -1);
    this.playerTurret.setPosition(this.player.x + direction.x * 14, this.player.y + direction.y * 14);
    this.playerTurret.setRotation(direction.angle() + Math.PI / 2);
  }

  private fireBullet(
    actor: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    group: Phaser.Physics.Arcade.Group,
    owner: BulletOwner,
  ) {
    const direction = (actor.getData("direction") as Phaser.Math.Vector2 | undefined)?.clone();
    const velocity = direction && direction.lengthSq() > 0 ? direction.normalize() : new Phaser.Math.Vector2(0, -1);
    const bullet = group.get(actor.x, actor.y, "bullet") as Phaser.Types.Physics.Arcade.ImageWithDynamicBody | null;
    const spawnX = actor.x + velocity.x * (TANK_SIZE / 2 + 8);
    const spawnY = actor.y + velocity.y * (TANK_SIZE / 2 + 8);

    if (!bullet) {
      return;
    }

    bullet.enableBody(true, spawnX, spawnY, true, true);
    bullet.setDepth(1);
    bullet.setRotation(velocity.angle() + Math.PI / 2);
    bullet.setVelocity(velocity.x * 430, velocity.y * 430);
    bullet.setTint(owner === "player" ? 0xffef99 : 0xffb8d1);
    bullet.setData("bullet", { owner } satisfies BulletData);
  }

  private spawnImpactEffect(x: number, y: number, color: number) {
    const flash = this.add.circle(x, y, 7, color, 0.9).setDepth(5);
    const ring = this.add.circle(x, y, 5).setDepth(5);
    ring.setStrokeStyle(2, color, 0.8);

    const sparks = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((rotation) => {
      const spark = this.add.rectangle(x, y, 12, 3, color, 0.85).setDepth(5);
      spark.setRotation(rotation);
      return spark;
    });

    this.tweens.add({
      targets: [flash, ring, ...sparks],
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 140,
      ease: "Quad.Out",
      onComplete: () => {
        flash.destroy();
        ring.destroy();
        sparks.forEach((spark) => spark.destroy());
      },
    });
  }

  private spawnEnemyWave(count: number) {
    const spawnRow = 1;

    for (let index = 0; index < count; index += 1) {
      const col = spawnColumns[index % spawnColumns.length];
      const enemy = this.enemies.create(
        tileCenter(col),
        tileCenter(spawnRow),
        "tank-enemy",
      ) as EnemyTank | undefined;

      if (!enemy) {
        continue;
      }

      // Enemies don't collide with world bounds — grid logic keeps them in.
      enemy.setCollideWorldBounds(false);
      enemy.setBounce(0, 0);
      enemy.setDrag(0);
      enemy.setMaxVelocity(0, 0);
      // Mark immovable so Phaser colliders never push the enemy body.
      // Position is fully controlled by grid interpolation in updateEnemies.
      enemy.setImmovable(true);
      // Disable physics-driven motion entirely. Phaser will no longer touch
      // the body position during its internal preUpdate/postUpdate steps.
      // We still get overlap/collider callbacks because the body exists.
      enemy.body.moves = false;
      enemy.body.setSize(TANK_HITBOX_SIZE, TANK_HITBOX_SIZE);
      enemy.body.setOffset((TANK_SIZE - TANK_HITBOX_SIZE) / 2, (TANK_SIZE - TANK_HITBOX_SIZE) / 2);

      enemy.gridCol = col;
      enemy.gridRow = spawnRow;
      enemy.moveProgress = 0;

      const heading = this.chooseEnemyDirection(enemy, new Phaser.Math.Vector2(0, 1));
      enemy.heading = heading;
      enemy.setData("direction", cloneDirection(heading));
      enemy.setRotation(heading.angle() + Math.PI / 2);
      enemy.nextShotAt = this.time.now + Phaser.Math.Between(900, 1700);
    }
  }

  /**
   * Pure grid-based enemy movement.
   *
   * Each enemy sits on a grid tile (gridCol, gridRow) and interpolates
   * toward the next tile using moveProgress (0 → 1).  When progress
   * reaches 1 the enemy "arrives", snaps to the new tile center, and
   * picks a new direction.  No Phaser velocity or wall collider is used —
   * position is set directly each frame.
   */
  private updateEnemies(time: number, delta: number) {
    // How many pixels the enemy moves per millisecond.
    const pxPerMs = ENEMY_SPEED / 1000;

    this.enemies.children.each((child) => {
      const enemy = child as EnemyTank;
      if (!enemy.body) {
        return true;
      }

      // Initialise grid position if missing.
      if (enemy.gridCol === undefined || enemy.gridRow === undefined) {
        enemy.gridCol = this.tileIndex(enemy.x);
        enemy.gridRow = this.tileIndex(enemy.y);
        enemy.moveProgress = 0;
      }

      // If the enemy has no heading, pick one.
      if (!enemy.heading || enemy.heading.lengthSq() === 0) {
        enemy.heading = this.chooseEnemyDirection(enemy);
        enemy.moveProgress = 0;
        if (enemy.heading.lengthSq() === 0) {
          // Completely boxed in — stay put, retry next frame.
          enemy.setPosition(tileCenter(enemy.gridCol), tileCenter(enemy.gridRow));
          enemy.body.updateFromGameObject();
          this.enemyShoot(enemy, time);
          return true;
        }
        enemy.setData("direction", cloneDirection(enemy.heading));
        enemy.setRotation(enemy.heading.angle() + Math.PI / 2);
      }

      // Advance progress.
      const progressDelta = (pxPerMs * delta) / TILE_SIZE;
      enemy.moveProgress = (enemy.moveProgress ?? 0) + progressDelta;

      if (enemy.moveProgress >= 1) {
        // Arrived at next tile.
        enemy.gridCol += enemy.heading.x;
        enemy.gridRow += enemy.heading.y;
        enemy.moveProgress = 0;

        // Snap to tile center.
        enemy.setPosition(tileCenter(enemy.gridCol), tileCenter(enemy.gridRow));
        enemy.body.updateFromGameObject();

        // Choose new direction.
        enemy.heading = this.chooseEnemyDirection(enemy, enemy.heading);
        if (enemy.heading.lengthSq() === 0) {
          this.enemyShoot(enemy, time);
          return true;
        }
        enemy.setData("direction", cloneDirection(enemy.heading));
        enemy.setRotation(enemy.heading.angle() + Math.PI / 2);
      }

      // Interpolate position between current tile and next tile.
      const progress = enemy.moveProgress ?? 0;
      const fromX = tileCenter(enemy.gridCol!);
      const fromY = tileCenter(enemy.gridRow!);
      const toX = fromX + enemy.heading.x * TILE_SIZE;
      const toY = fromY + enemy.heading.y * TILE_SIZE;

      enemy.setPosition(
        fromX + (toX - fromX) * progress,
        fromY + (toY - fromY) * progress,
      );
      enemy.body.updateFromGameObject();

      this.enemyShoot(enemy, time);
      return true;
    });
  }

  private enemyShoot(enemy: EnemyTank, time: number) {
    if ((enemy.nextShotAt ?? 0) < time) {
      enemy.nextShotAt = time + Phaser.Math.Between(1100, 2200);
      this.fireBullet(enemy, this.enemyBullets, "enemy");
    }
  }

  private maybeSpawnEnemies(time: number) {
    if (this.enemies.countActive(true) > 0 || this.nextEnemySpawnAt > time) {
      return;
    }

    this.wave += 1;
    this.enemySpawnText.setText(`WAVE ${this.wave}`);
    this.nextEnemySpawnAt = time + 1600;
    this.time.delayedCall(1500, () => {
      if (this.gameOver) {
        return;
      }

      this.spawnEnemyWave(Math.min(3 + this.wave, 8));
    });
  }

  private handlePlayerBulletHitEnemy(
    bulletObject: ArcadeCollisionTarget,
    enemyObject: ArcadeCollisionTarget,
  ) {
    const bullet = bulletObject as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    const enemy = enemyObject as EnemyTank;

    this.spawnImpactEffect(bullet.x, bullet.y, 0xffd67a);
    bullet.disableBody(true, true);
    enemy.destroy();
    this.score += 100;
    this.scoreText.setText(`SCORE ${String(this.score).padStart(4, "0")}`);
    gamepadManager.vibrate(90, 0.25, 0.65);
  }

  private handleEnemyBulletHitPlayer(
    bulletObject: ArcadeCollisionTarget,
    playerObject: ArcadeCollisionTarget,
  ) {
    const bullet = bulletObject as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    const player = playerObject as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

    this.spawnImpactEffect(bullet.x, bullet.y, 0xff9ab8);
    bullet.disableBody(true, true);
    player.setTint(0xff8fa3);
    this.playerTurret.setFillStyle(0xffd7e6, 1);
    this.time.delayedCall(120, () => {
      player.clearTint();
      this.playerTurret.setFillStyle(0xe8f7ff, 0.95);
    });
    gamepadManager.vibrate(140, 0.35, 1);
    this.triggerGameOver("PLAYER DESTROYED", "Press R or START to restart");
  }

  private handleBulletHitWall(
    bulletObject: ArcadeCollisionTarget,
    wallObject: ArcadeCollisionTarget,
  ) {
    const bullet = bulletObject as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    const wall = wallObject as WallSprite;
    const data = bullet.getData("bullet") as BulletData | undefined;

    this.spawnImpactEffect(
      bullet.x,
      bullet.y,
      wall.wallKind === "steel" ? 0xc5d7ff : 0xffb685,
    );
    bullet.disableBody(true, true);

    if (wall.wallKind === "brick" && data?.owner === "player") {
      wall.destroy();
      this.cameras.main.shake(60, 0.0015);
      return;
    }

    wall.setTint(wall.wallKind === "steel" ? 0xe3ecff : 0xffd0bf);
    this.time.delayedCall(90, () => wall.clearTint());
  }

  private handleBulletHitBullet(
    firstBulletObject: ArcadeCollisionTarget,
    secondBulletObject: ArcadeCollisionTarget,
  ) {
    const firstBullet = firstBulletObject as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    const secondBullet = secondBulletObject as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

    this.spawnImpactEffect(
      (firstBullet.x + secondBullet.x) / 2,
      (firstBullet.y + secondBullet.y) / 2,
      0xffef99,
    );
    firstBullet.disableBody(true, true);
    secondBullet.disableBody(true, true);
  }

  private handleEnemyBounce(
    firstEnemyObject: ArcadeCollisionTarget,
    secondEnemyObject: ArcadeCollisionTarget,
  ) {
    // Grid positions don't change — just let them pass through each other
    // visually for one frame.  The grid reservation (isEnemyOnTile) prevents
    // them from choosing the same target tile next time.
    void firstEnemyObject;
    void secondEnemyObject;
  }

  private handlePlayerEnemyCollision(
    playerObject: ArcadeCollisionTarget,
    enemyObject: ArcadeCollisionTarget,
  ) {
    const player = playerObject as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    const enemy = enemyObject as EnemyTank;
    separateTanks(player, enemy);
    player.body.updateFromGameObject();
    // The enemy's position is overwritten by updateEnemies on the next frame
    // based on grid interpolation, so no further action is needed.
  }

  private keepEntitiesInsideBounds() {
    this.syncTurretWithPlayer();

    this.bullets.children.each((child) => {
      const bullet = child as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
      if (!bullet.active) {
        return true;
      }

      if (bullet.x < -20 || bullet.x > GAME_WIDTH + 20 || bullet.y < -20 || bullet.y > GAME_HEIGHT + 20) {
        bullet.disableBody(true, true);
      }

      return true;
    });

    this.enemyBullets.children.each((child) => {
      const bullet = child as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
      if (!bullet.active) {
        return true;
      }

      if (bullet.x < -20 || bullet.x > GAME_WIDTH + 20 || bullet.y < -20 || bullet.y > GAME_HEIGHT + 20) {
        bullet.disableBody(true, true);
      }

      return true;
    });
  }

  private checkBaseDamage() {
    this.enemyBullets.children.each((child) => {
      const bullet = child as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
      if (!bullet.active) {
        return true;
      }

      if (Phaser.Geom.Rectangle.Contains(this.baseZone.getBounds(), bullet.x, bullet.y)) {
        this.spawnImpactEffect(bullet.x, bullet.y, 0xffc86b);
        bullet.disableBody(true, true);
        this.baseHp -= 1;
        this.statusText.setText(`BASE HP ${Math.max(this.baseHp, 0)}`);
        this.updateBaseHpBar();
        this.baseZone.setFillStyle(0xff8a5b, 1);
        this.time.delayedCall(100, () => this.baseZone.setFillStyle(0xffd84d, 0.9));
        gamepadManager.vibrate(150, 0.45, 1);
        this.checkGameOver();
      }

      return true;
    });
  }

  private checkGameOver() {
    if (this.baseHp > 0 || this.gameOver) {
      return;
    }

    this.triggerGameOver("BASE DESTROYED", "Press R or START to restart");
  }

  private triggerGameOver(title: string, subtitle: string) {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.player.setTint(0xff6b9e);
    this.playerTurret.setFillStyle(0xffcadf, 1);
    this.physics.pause();
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 380, 180, 0x050913, 0.94)
      .setStrokeStyle(1, 0xff6b9e, 0.45)
      .setDepth(50);
    this.gameOverText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24, title, {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#ffe1ef",
      })
      .setOrigin(0.5)
      .setDepth(51);
    this.restartHintText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28, subtitle, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#c7d7ff",
      })
      .setOrigin(0.5)
      .setDepth(51);
  }
}
