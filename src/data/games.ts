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
    tagline: "横版突击射击，作为第二个核心项目推进。",
    genre: "Run & Gun",
    players: "1P planned",
    status: "prototype",
    controller: true,
    accent: "from-fuchsia-500 via-rose-400 to-amber-300",
    description:
      "面向类魂斗罗玩法的预研位，后续会接入跳跃、方向射击、敌兵与 Boss 模块。",
    features: ["手柄预留", "关卡模块化", "武器系统规划", "Boss 战规划"],
  },
];

export function getGameBySlug(slug: string) {
  return games.find((game) => game.slug === slug);
}
