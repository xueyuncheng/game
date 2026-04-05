export type GameSummary = {
  slug: string;
  name: string;
  tagline: string;
  genre: string;
  players: string;
  status: "playable" | "prototype";
  controller: boolean;
  accent: string;
  description: string;
  features: string[];
};

export const games: GameSummary[] = [
  {
    slug: "tank-blitz",
    name: "Tank Blitz",
    tagline: "俯视角街机坦克战，适合先做成完整 MVP。",
    genre: "Action / Arena",
    players: "1P / 2P planned",
    status: "playable",
    controller: true,
    accent: "from-cyan-400 via-sky-400 to-indigo-500",
    description:
      "守住基地、穿梭砖墙、压制敌方装甲。当前版本已经能移动、开火、生成敌军和记录分数。",
    features: ["手柄支持", "波次敌人", "基地守卫", "即时得分"],
  },
  {
    slug: "steel-commando",
    name: "Steel Commando",
    tagline: "横版突击射击，魂斗罗风格关卡闯关。",
    genre: "Run & Gun",
    players: "1P",
    status: "playable",
    controller: true,
    accent: "from-fuchsia-500 via-rose-400 to-amber-300",
    description:
      "横版跑轰射击游戏：奔跑、跳跃、瞄准八方向开火，穿越士兵与炮台的防线，最终击败机甲指挥官 Boss。",
    features: ["三种武器", "士兵与炮台", "三阶段 Boss", "手柄支持"],
  },
];

export function getGameBySlug(slug: string) {
  return games.find((game) => game.slug === slug);
}
