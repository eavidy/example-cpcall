import { CpcSocket } from "#rt/cpcp.js";
import { execCases, initEvent } from "../cmds.js";
import { Socket, TcpNetConnectOpts, createConnection } from "node:net";
function createTcpConnect(options: TcpNetConnectOpts) {
    return new Promise<Socket>((resolve, reject) => {
        const socket = createConnection(options);

        function onConnect() {
            resolve(socket);
            fin();
        }
        function onError() {
            reject();
            fin();
        }
        function fin() {
            socket.off("connect", onConnect);
            socket.off("error", onError);
        }
        socket.on("connect", onConnect);
        socket.on("error", onError);
    });
}
async function main() {
    const socket = await createTcpConnect({ port: 6660 });
    const cpc = new CpcSocket(socket);
    initEvent(cpc);
    await execCases(cpc);
    console.log("完毕");
    cpc.end();
}
main();
