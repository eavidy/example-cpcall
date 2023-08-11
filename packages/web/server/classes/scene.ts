import { PlayerServer, WsCpc } from "./player.js";
import { Scene } from "#common/classes/scene.js";
import { ClientCenter } from "server/ws_cpc_server.js";
import { PlayerState, Quaternion, RoleAction } from "#common/action.js";

export class ServerScene extends Scene {
    constructor(width: number, height: number, private clientCenter: ClientCenter) {
        super(width, height);
    }
    join(player: PlayerServer): void {
        this.clientCenter.broadcast("onPlayersJoin", [player.getState()], player.id);
        super.join(player);
    }
    leave(player: PlayerServer): boolean {
        if (super.leave(player)) {
            this.clientCenter.deletePlayer(player.id);
            this.clientCenter.broadcast("onPlayersLeave", [player.id], player.id);
            return true;
        }
        return false;
    }
    syncFrame() {
        const frame: { id: int; quaternion: Quaternion }[] = [];
        for (const player of this.players) {
            frame.push({ id: player.id, quaternion: player.quaternion });
        }
        return frame;
    }
    getAllPlayersState() {
        let states: PlayerState[] = [];
        for (const player of this.players) {
            states.push(player.getState());
        }
        return states;
    }
    timerId = setInterval(() => {
        const frame = this.syncFrame();
        this.clientCenter.broadcast(RoleAction.action, frame);
    }, 1000/45);
}
