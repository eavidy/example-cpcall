import { Quaternion } from "#common/action.js";
import { Player } from "#common/classes/player.js";

export class PlayerClient extends Player {
    readonly div: HTMLDivElement;
    constructor(name: string, id: number, public speed = 2) {
        super(name, id);
        this.div = this.createView();
    }

    setLookAt(x: int, y: int) {
        this.quaternion[2] = x;
        this.quaternion[3] = y;
    }
    forwarding = false;
    private forward(d: number = this.speed) {
        if (this.isFurling) {
            if (this.energy >= 2) {
                this.energy -= 0.5;
                d *= 3;
            } else this.fury(); //精力不足
        }
        const quaternion = this.quaternion;
        const dx = quaternion[2] - quaternion[0];
        const dy = quaternion[3] - quaternion[1];
        const c = Math.sqrt(dx * dx + dy * dy);

        let x1 = (d * dx) / c;
        let y1 = (d * dy) / c;

        this.quaternion = [(x1 += quaternion[0]), y1 + quaternion[1], quaternion[2], quaternion[3]];
    }
    private createView(): HTMLDivElement {
        const div = document.createElement("div");
        Object.assign(div.style, {
            display: "inline-block",
            // border: "solid 2px",
            position: "absolute",
        } as CSSStyleDeclaration);

        const img = document.createElement("img");
        img.src = "/icons/ghost.svg";
        img.style.width = "40px";
        div.appendChild(img);
        this.setDivPosition(div.style, this.quaternion);

        const nameDiv = document.createElement("div");
        nameDiv.innerText = this.name;
        nameDiv.style.position = "relative";
        nameDiv.style.color = "#126058";
        nameDiv.style.top = "-10px";
        div.appendChild(nameDiv);
        return div;
    }
    private setDivPosition(style: CSSStyleDeclaration, quaternion: Quaternion) {
        const ow = 20;
        const ov = 20;
        style.left = quaternion[0] - ov + "px";
        style.top = quaternion[1] - ow + "px";
    }

    private lastFrameData: Quaternion = [...this.quaternion];
    render() {
        const style = this.div.style;
        const lastFrame = this.lastFrameData;
        const quaternion = this.quaternion;

        if (this.forwarding) this.forward();
        if (lastFrame[0] !== quaternion[0] || lastFrame[1] !== quaternion[1]) {
            this.emit("setQuaternion", quaternion);
            this.setDivPosition(style, quaternion);
            style.transform = `rotate(${this.execRad()}rad)`;
            this.lastFrameData = [...quaternion];
            return true;
        } else if (lastFrame[2] !== quaternion[2] || lastFrame[3] !== quaternion[3]) {
            this.emit("setQuaternion", quaternion);
            style.transform = `rotate(${this.execRad()}rad)`;
            this.lastFrameData = [...quaternion];
            return true;
        }
    }

    private execRad() {
        const quaternion = this.quaternion;
        const dx = quaternion[2] - this.quaternion[0],
            dy = quaternion[3] - this.quaternion[1];
        const tan = dy / dx;
        let rad = Math.atan(tan) + Math.PI / 2;
        if (dx < 0) rad += Math.PI;
        return rad;
    }
}
