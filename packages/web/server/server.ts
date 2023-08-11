import { createServer } from "node:http";
import { WebSocket } from "./web_socket.js";
import { ServerScene } from "./classes/scene.js";
import { ClientCenter, WebSocketCpc } from "./ws_cpc_server.js";
import { WsCpc } from "./classes/player.js";

export const server = createServer(function (req, res) {
    res.writeHead(403);
    res.end();
});

const clients = new ClientCenter();
const scene = new ServerScene(1000, 1000, clients);

/** web socket 连接 事件 */
server.on("upgrade", function (req, socket, header) {
    const cpc: WsCpc = new WebSocketCpc(WebSocket.responseWebSocket(socket, req.headers));
    cpc.setCmd("init", onInit);
    function onInit(name: string) {
        const player = clients.createPlayer(name, cpc);
        const allPlayers = scene.getAllPlayersState();
        scene.join(player);
        cpc.on("close", () => {
            clients.deletePlayer(player.id);
            scene.leave(player);
            console.log("客户端端断开连接：" + player.id);
        });
        return { self: player.getState(), allPlayers };
    }
});

server.listen(8888);
