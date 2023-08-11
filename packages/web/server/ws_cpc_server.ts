import { FrameCpc, CpcFrame, CpcCmdList, Cpc, JBSON, toArrayJBSON, UniqueKeyMap } from "cpcall";
import { PlayerServer, WsCpc } from "./classes/player.js";
import { WebSocket } from "./web_socket.js";

export class WebSocketCpc<
    CallableCmd extends object = CpcCmdList,
    CmdList extends object = CpcCmdList
> extends FrameCpc<CallableCmd, CmdList> {
    constructor(private socket: WebSocket) {
        super();
        socket.on("frame", (buffer) => this.onMsg(buffer));

        socket.on("error", (e) => this.emit("error", e));
        socket.on("close", () => this.dispose());
    }
    private onMsg = (buf: Buffer) => {
        let offset = 0;
        let frame = JBSON.toArray<CpcFrame>(buf, offset);
        this.onCpcFrame(frame);
    };
    protected sendFrame(frame: CpcFrame): void {
        this.socket.send(toArrayJBSON(frame));
    }
}

export class ClientCenter {
    clientsMap = new UniqueKeyMap<WsCpc>(2 ** 32);
    get onlineCount() {
        return this.clientsMap.size;
    }
    constructor() {}
    createPlayer(name: string, cpc: Cpc) {
        const id = this.clientsMap.allowKeySet(cpc);
        const player = new PlayerServer(name, id, cpc);
        return player;
    }
    deletePlayer(id: number) {
        return this.clientsMap.delete(id);
    }
    broadcast(cmd: string | number, args: any[], ignore?: number) {
        if (ignore === undefined) {
            for (const [id, cpc] of this.clientsMap) cpc.exec<any>(cmd, args);
        } else {
            for (const [id, cpc] of this.clientsMap) {
                if (id === ignore) continue;
                cpc.exec<any>(cmd, args);
            }
        }
    }
}
