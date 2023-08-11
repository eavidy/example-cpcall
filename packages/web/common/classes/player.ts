import { Coord, Direction, PlayerState, Quaternion, ServerCmd, Skill } from "../action.js";
import { Food } from "./food.js";
import { EventEmitter } from "cpcall";

const PRESS_ONWARD_CONFIG = {
    consume: -10,
    distance: 100,
};

export class Player<T extends object = {}> extends EventEmitter<PlayerEvents & T> implements PlayerState {
    energy = 100;
    grade = 0;
    skills = { [Skill.teleport]: 1 };
    constructor(public name: string, public id: number) {
        super();
    }
    quaternion: Quaternion = [500, 500, 500, 501];
    setQuaternion(quaternion: Quaternion) {
        this.quaternion = [...quaternion];
        this.emit("setQuaternion", quaternion);
    }
    getState(): PlayerState {
        return {
            energy: this.energy,
            grade: this.grade,
            id: this.id,
            name: this.name,
            skills: this.skills,
        };
    }
    teleport(target: Coord) {
        const reset = this.skills[Skill.teleport];
        if (reset === 0) return false;
        this.skills[Skill.teleport]--;

        this.quaternion[0] = target[0];
        this.quaternion[1] = target[1];
        this.emit("teleport", target);
    }
    /** @param direction: tan X */
    pressOnward(direction: double) {
        if (this.energy < PRESS_ONWARD_CONFIG.consume) return false;
        this.energy += PRESS_ONWARD_CONFIG.consume;
    }

    isFurling = false;
    fury() {
        this.isFurling = !this.isFurling;

        this.emit("fury", this.isFurling);
    }
    eat(food: Food) {}
}

export type PlayerEvents = ServerCmd & {
    setQuaternion(qua: Quaternion): void;
};

// export interface Player {
// on<T extends keyof PlayerEvents>(name: T, fn: PlayerEvents[T]): this;
// on(name: string, fn: Function): this;
// emit<T extends keyof PlayerEvents>(name: T, ...args: Parameters<PlayerEvents[T]>): boolean;
// emit(name: string, ...args: any[]): boolean;
// off(name: keyof PlayerEvents, fn: Function): this;
// off(name: string, fn: Function): this;
// }
