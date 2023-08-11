import { Scene } from "#common/classes/scene.js";
import { PlayerClient } from "./player.js";

export class SceneClient extends Scene {
    private renderer = new Frame(this);
    constructor(readonly div: HTMLDivElement, public master: PlayerClient) {
        super(div.clientWidth, div.clientHeight);
        this.initDivEvent(div);
        this.join(this.master);
        this.renderer.startRender();
    }
    addId = setInterval(() => {
        for (const player of this.players) {
            if (player.energy >= 100) continue;
            player.energy += 5;
            player.emit("energy");
        }
    }, 1000);
    private initDivEvent(div: HTMLDivElement) {
        document.body.addEventListener("mousemove", (e: MouseEvent): void => {
            if (!this.master) return;
            this.master.setLookAt(e.x, e.y);
        });
        document.body.addEventListener("mousedown", (e) => {
            if (!this.master || e.button !== 0) return;
            this.master.pressOnward(0);
        });
        document.body.addEventListener("keydown", (e) => {
            if (!this.master) return;
            switch (e.key) {
                case "w":
                    this.master.forwarding = true;
                    break;
                case "q":
                    this.master.fury();

                default:
                    break;
            }
        });
        document.body.addEventListener("keyup", (e) => {
            switch (e.key) {
                case "w":
                    this.master.forwarding = false;
                    break;
            }
        });
    }

    playerMap = new Map<number, PlayerClient>();
    join(player: PlayerClient): void {
        if (this.players.has(player)) return;
        if (!this.master) {
            this.master = player;
        }
        super.join(player);
        this.playerMap.set(player.id, player);
        this.div.appendChild(player.div);
    }
    leave(player: PlayerClient): boolean {
        if (super.leave(player)) {
            this.div.removeChild(player.div);
            this.playerMap.delete(player.id);
            return true;
        }
        return false;
    }
    dispose() {
        this.renderer.stopRender();
        for (const player of this.players) {
            this.div.removeChild(player.div);
        }
        this.players.clear();
        clearInterval(this.addId);
    }
    render() {
        for (const player of this.players) player.render();
    }
    declare players: Set<PlayerClient>;
}

class Frame {
    rendering = false;
    startRender() {
        if (this.rendering) return;
        this.rendering = true;
        requestAnimationFrame(this.#onRender);
    }
    #onRender = () => {
        this.scene.render();
        if (this.rendering) requestAnimationFrame(this.#onRender);
    };
    stopRender() {
        if (!this.rendering) return;
        this.rendering = false;
    }
    constructor(private scene: SceneClient) {}
}
