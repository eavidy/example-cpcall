import React, { useEffect, useRef, useState } from "react";
import { PropsWithChildren } from "react";
import { SceneClient } from "../entities/scene.js";
import { StateBoard } from "./state-board.js";
import { PlayerClient } from "../entities/player.js";
import { RankingItem, RankingList } from "./ranking-list.js";
import { ClientCpc, createConnect } from "../services/ws_cpc.service.js";
import { PlayerState, Quaternion, RoleAction } from "#common/action.js";

export type SceneProps = PropsWithChildren<{ width: number; height: number }>;
export function Scene(props: SceneProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [energy, setEnergy] = useState(0);
    const [grade, setGrade] = useState<RankingItem[]>([
        { name: "sdg", grade: 99, id: 0 },
        { name: "sdg", grade: 99, id: 1 },
        { name: "sdg", grade: 99, id: 2 },
    ]);
    useEffect(() => {
        function onEnergyChange(this: PlayerClient) {
            setEnergy(this.energy);
        }
        let scene: SceneClient | undefined;
        async function init(res: { self: PlayerState; cpc: ClientCpc; allPlayers: PlayerState[] }) {
            console.log("init");

            const { cpc, allPlayers, self } = res;
            const master = new PlayerClient(localStorage.getItem("name") ?? "unknow", self.id);
            scene = new SceneClient(ref.current!, master);

            setEnergy(scene.master.energy);
            scene.master.on("energy", onEnergyChange);
            scene.master.on(
                "setQuaternion",
                createThrottle((que: Quaternion): void => {
                    cpc.exec(RoleAction.action, [que]);
                }, 1000 / 45)
            );

            cpc.setCmd("onPlayerGradeChange", (...args) => {
                resetRankingList(grade, args);
            });
            cpc.setCmd(RoleAction.action, (...args) => {
                for (const { id, quaternion } of args) {
                    if (master.id === id) continue;
                    const player = scene!.playerMap.get(id);
                    player?.setQuaternion(quaternion);
                }
            });

            function onPlayersJoin(...args: PlayerState[]) {
                for (const arg of args) {
                    scene!.join(new PlayerClient(arg.name, arg.id));
                }
            }
            onPlayersJoin(...allPlayers);
            cpc.setCmd("onPlayersJoin", onPlayersJoin);
            cpc.setCmd("onPlayersLeave", (...args) => {
                for (const id of args) {
                    const player = scene!.playerMap.get(id);
                    if (player) scene!.leave(player);
                }
            });
        }
        createConnect(localStorage.getItem("name") ?? "undefined").then(init);

        return () => {
            scene?.master.off("energy", onEnergyChange);
            scene?.dispose();
        };
    }, []);
    return (
        <>
            <div ref={ref} style={{ width: 1000, height: 1000 }}></div>
            <StateBoard percent={energy} />
            <RankingList grades={grade} masterId={2} />
        </>
    );
}

function resetRankingList(list: RankingItem[], changes: Omit<RankingItem, "name">[]) {
    for (let i = 0; i < changes.length; i++) {
        const { grade, id } = changes[i];
        for (let j = 0; i < list.length; j++) {
            if (id === list[j].id) {
                moveItemAdd(grade, list, j);
            }
        }
    }
    return [...list];
}
function moveItemAdd(value: number, arr: RankingItem[], i: number) {
    let item = arr[i];
    for (let j = i; j > 0; j--) {
        if (arr[j - 1].grade > value) {
            arr[j] = item;
            return;
        } else {
            arr[j] = arr[j - 1];
        }
    }
    arr[0] = item;
}
function createThrottle<T extends (...args: any[]) => any>(fn: T, time: number): (...args: Parameters<T>) => void | T {
    let last = Date.now();
    return (...args: any[]) => {
        if (Date.now() - last > time) {
            last = Date.now();
            return fn(...args);
        }
    };
}
