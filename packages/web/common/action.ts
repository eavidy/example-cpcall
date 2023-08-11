export interface ServerCmd {
    init(name: string): { self: PlayerState; allPlayers: PlayerState[] };

    join(name: string): void;

    teleport(target: Coord): void;
    pressOnward(direction: Coord): void;
    fury(stop?: boolean): void;

    [RoleAction.action](quaternion: Quaternion): void;
}
export interface ClientCmd {
    onPlayersJoin(...players: PlayerState[]): void;
    onPlayersLeave(...ids: int[]): void;
    onPlayerGradeChange(...args: { id: int; grade: int }[]): void;
    [RoleAction.action](...args: { id: int; quaternion: Quaternion }[]): void;

    onTeleport(target: Coord): void;
    onPressOnward(direction: Coord): void;
    onFury(stop?: boolean): void;

    onSelfChange(state: Pick<PlayerState, "grade" | "energy" | "skills">): void;
}

export enum RoleAction {
    rote = 0,
    action = 1,
}
export enum Skill {
    /** 瞬移 */
    teleport = "teleport",
}

export type Quaternion = [x: double, y: double, dx: double, dy: double];
export type Coord = [x: int, y: int];
export type Direction = [dx: double, dy: double];

/**
 * 狂暴模式和突进会消耗精力
 * 使用突进时如果撞到其他玩家精力会大大衰减
 */
export interface PlayerState {
    id: int;
    name: string;

    grade: int;
    energy: int;
    skills: Record<Skill, int>;
}
export interface FoodState {
    coordinate: Coord;
    speed?: int;
    energy?: int;
    grade?: int;
    duration?: int;
}
