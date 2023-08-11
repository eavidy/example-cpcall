import { Food } from "./food.js";
import { Player } from "./player.js";

export class Scene {
    constructor(public width: number, public height: number) {}
    readonly players = new Set<Player>();
    private onPlayerAction = () => {};
    join(player: Player) {
        player.on("action", this.onPlayerAction);
        this.players.add(player);
    }
    leave(player: Player) {
        return this.players.delete(player);
    }
    readonly food = new Set<Food>();
    setFood(food: Food) {
        this.food.add(food);
    }
}
