import { Player } from "#common/classes/player.js";
import { Cpc } from "cpcall";
import { ClientCmd, RoleAction, ServerCmd } from "#common/action.js";

export type WsCpc = Cpc<ClientCmd, ServerCmd>;
export class PlayerServer extends Player {
    constructor(name: string, id: number, readonly cpc: Cpc) {
        super(name, id);
        cpc.setCmd("fury", this.fury.bind(this));
        cpc.setCmd("pressOnward", this.pressOnward.bind(this));
        cpc.setCmd("teleport", this.teleport.bind(this));
        cpc.setCmd(RoleAction.action, (quaternion) => {
            //更新位置，这里不做反外挂检测
            this.quaternion = quaternion;
        });
    }
}
