import { Socket, createServer } from "node:net";
import { CpcSocket } from "#rt/cpcp.js";
import { initEvent, setCmd } from "./cmds.js";

const server = createServer((socket: Socket) => {
    console.log("connection");

    const cpc = new CpcSocket(socket);
    initEvent(cpc);
    setCmd(cpc);
});
server.listen(6660);
