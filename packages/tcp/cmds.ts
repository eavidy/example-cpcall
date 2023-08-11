import type { Cpc } from "#rt/cpc.js";
export function setCmd(cpc: Cpc) {
    cpc.setCmd("cb", (...args: any[]) => {
        console.log(args);

        return args;
    });
    cpc.setCmd("setTimeout", (time: number) => {
        console.log("setTimeout:" + time);

        return new Promise((resolve, reject) => setTimeout(resolve, time));
    });
}
export function initEvent(cpc: Cpc) {
    cpc.on("close", (err: any) => {
        console.log("close" + err);
    });
    cpc.on("error", (err) => {
        console.log("err:" + err);
    });
    cpc.on("end", () => {
        console.log("end");
    });
}
export async function execCases(cpc: Cpc) {
    let res = await cpc.call("cb", [1, true, "abcd"]);
    console.log(res);

    await cpc.call("setTimeout", [2000]);
}
