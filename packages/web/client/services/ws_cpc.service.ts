import { Cpc } from "cpcall";
import { WebSocketCpc } from "cpcall/ws-cpc";
import { createContext } from "react";
import { ServerCmd, ClientCmd } from "#common/action.js";
export const cpcContext = createContext(null);

export type ClientCpc = Cpc<ServerCmd, ClientCmd>;
export async function createConnect(name: string) {
    const cpc: ClientCpc = await WebSocketCpc.createConnect(`ws://${location.hostname}:8888`);
    const res = await cpc.call("init", [name]);
    return { cpc, ...res };
}
