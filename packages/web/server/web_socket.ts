import { Duplex } from "node:stream";
import { IncomingHttpHeaders, request } from "node:http";
import { EventEmitter } from "node:events";
import { createHash } from "node:crypto";
import { StreamReader } from "cpcall";
import { createReaderFromReadable } from "cpcall/util";

function SHA1(str: string) {
    return createHash("sha1").update(str).digest().toString("base64");
}

enum Opcode {
    continue = 0x0,
    text = 0x1,
    bin = 0x2,
    close = 0x8,
    ping = 0x9,
    pong = 0xa,
}

/**
 * @emits pong
 * @emits ping
 * @emits message
 * @emits close
 */
export class WebSocket extends EventEmitter {
    static async createWsConnection(url: string) {
        const req = request(url, {
            headers: {
                Upgrade: "websocket",
                Connection: "Upgrade",
                "Sec-WebSocket-Key": "CSZZ2veSXIGMaXK/5hd5mA==",
            },
        });
        return new Promise(function (resolve, reject) {
            req.on("abort", () => reject(new Error("服务器拒绝连接")));
            req.once("upgrade", (response, socket, head) => {
                const headers = response.headers;
                if (headers.upgrade === "websocket") resolve(WebSocket.responseWebSocket(socket, headers));
                else reject(new Error("不支持的协议"));
            });
            req.once("response", (response) => {
                const status = response.statusCode;
                if (status !== 101) reject(new Error("服务返回异常。status:" + status));
            });
            req.on("error", (err) => reject(err));
            req.end();
        });
    }
    static responseWebSocket(socket: Duplex, headers: IncomingHttpHeaders) {
        const oKey = headers["sec-websocket-key"];
        const reKey = SHA1(oKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
        const response =
            "HTTP/1.1 101 Switching Protocols\r\n" +
            "Access-Control-Allow-Origin: *\n\r" +
            "Access-Control-Allow-Methods: GET,POST,OPTIONS,PUT,DELETE\n\r" +
            "Upgrade: websocket\r\n" +
            "Connection: Upgrade\r\n" +
            `Sec-WebSocket-Accept: ${reKey}\r\n\r\n`;

        socket.write(response); //webSocket连接成功事件
        return new WebSocket(socket);
    }
    private constructor(private socket: Duplex) {
        super();

        socket.on("error", (err) => this.emit("error", err));
        socket.on("close", () => this.emit("close"));
        this.startRead(createReaderFromReadable(this.socket)).catch(() => this.finalClose());
    }
    private async startRead(read: StreamReader) {
        let frame: WsFrameHead | undefined;
        while ((frame = await this.readFrame(read))) {
            let content: Buffer;
            if (frame.payloadLength) {
                if (frame.payloadLength > 2 ** 32) {
                    //todo: 转为流
                    this.destroy(new Error("过长的帧"));
                    return;
                }
                content = await read(Number(frame.payloadLength));
            } else content = await read(frame.firstLength);
            if (frame.useMask) encodeMsg(content, frame.maskKey!);

            switch (frame.opcode) {
                case Opcode.close:
                    this.close();
                    return;
                case Opcode.bin:
                    this.emit("frame", content);
                    break;

                case Opcode.text:
                    this.emit("frame", content.toString("utf-8"));
                    break;
                case Opcode.ping:
                    this.pong();
                    break;
                case Opcode.pong:
                    this.emit("pong");
                    break;

                default:
                    break;
            }
        }
    }
    private async readFrame(read: StreamReader) {
        const head = await read(2, true);
        if (!head) return;
        const frame = decodeWsHead(head);
        switch (frame.firstLength) {
            case 0x7e: {
                let lenBuf = await read(2);
                frame.payloadLength = BigInt(lenBuf.readUint16BE());
                break;
            }
            case 0x7f: {
                let lenBuf = await read(8);
                frame.payloadLength = lenBuf.readBigUint64BE();
                break;
            }
            case 0:
                return frame;
        }
        if (frame.useMask) frame.maskKey = await read(4);
        return frame;
    }

    /**
     * @description 发送数据帧
     * @param data <Buffer|String>:要发送的数据
     * @param maskKey
     * @param hasSplit 是否还有继续帧
     * @return 此次否成功可以发送
     */
    send(data: Buffer | String, maskKey?: number, hasSplit?: boolean) {
        let opcode: Opcode; //二进制
        if (typeof data === "string") {
            opcode = Opcode.text;
            data = Buffer.from(data, "utf-8");
        } else if (Buffer.isBuffer(data)) {
            opcode = Opcode.bin;
        } else throw new UnsupportedDataType();

        const head = encodeWsHead(data.length, opcode, maskKey, hasSplit);
        this.socket.write(head);
        if (typeof maskKey === "number") encodeMsg(data, head.subarray(head.length - 4), 0n);
        this.socket.write(data);
        return true;
    }
    sendSplit(data: Buffer | String, maskKey?: number, hasSplit?: boolean) {
        if (typeof data === "string") {
            data = Buffer.from(data, "utf-8");
        } else if (!Buffer.isBuffer(data)) throw new UnsupportedDataType();

        const head = encodeWsHead(data.length, Opcode.continue, maskKey, hasSplit);
        this.socket.write(head);
        if (typeof maskKey === "number") encodeMsg(data, head.subarray(head.length - 4), 0n);
        this.socket.write(data);
        return true;
    }
    private pong() {
        const head = encodeWsHead(0, Opcode.pong);
        this.socket.write(head);
    }
    ping(timeout: number) {
        //ping操作
        const head = encodeWsHead(0, Opcode.ping);
        this.socket.write(head);

        return new Promise<void>((resolve, reject) => {
            const id = setTimeout(reject, timeout);
            this.once("pong", () => {
                resolve();
                clearTimeout(id);
            });
        });
    }
    destroy(err?: any) {
        return this.socket.destroy(err);
    }
    private finalClose() {
        this.#closed = true;
        if (!this.socket.writableEnded) this.socket.end(() => this.socket.destroy());
        else this.socket.destroy();
        this.emit("close");
    }
    #closed = false;
    get closed() {
        return this.#closed;
    }
    /** 关闭连接 */
    close(data?: SocketData) {
        if (this.#closed) return;
        let size: number = 0;
        if (typeof data === "string") {
            data = Buffer.from(data, "utf-8");
            size = data.byteLength;
        } else if (Buffer.isBuffer(data)) size = data.byteLength;

        const head = encodeWsHead(size, Opcode.close);
        this.socket.write(head);
    }
}
type SocketData = string | Buffer;

class UnsupportedDataType extends Error {
    constructor() {
        super("不支持的数据类型");
    }
}

interface WsFrameHead {
    fin: boolean;
    rsv1: boolean;
    rsv2: boolean;
    rsv3: boolean;

    opcode: Opcode;
    useMask: boolean;
    firstLength: number;
    payloadLength?: bigint;
    maskKey?: Uint8Array;
}

/**
 * @description 编码webSocket数据帧的头部
 * @param size 此次要写入的数据大小(字节)
 * @param opcode 可选。数据帧类型代码
 * @param maskKey 可选。<boolean>:是否使用随机掩码 <Buffer>:使用MASK的前4位作为掩码，MASK的长度小于4位则抛出异常
 * @param hasSplit 是否是分片
 */
function encodeWsHead(size: number | bigint, opcode: Opcode, maskKey?: number, hasSplit?: boolean) {
    //编码webSocket头部
    if (size <= 0) throw new Error("参数必须为正数");
    const useMask = typeof maskKey === "number";

    let buffer: Buffer;
    const baseLen = useMask ? 6 : 2;
    if (size > 0xffff) {
        buffer = Buffer.allocUnsafe(baseLen + 8);
        buffer[1] = useMask ? 0x7f | 0x80 : 0x7f;

        buffer.writeBigInt64BE(BigInt(size), 2);
    } else {
        size = Number(size);
        if (size < 0x7e) {
            buffer = Buffer.allocUnsafe(baseLen);
            buffer[1] = useMask ? size | 0x80 : size;
        } else {
            buffer = Buffer.allocUnsafe(baseLen + 2);
            buffer[1] = useMask ? 0x7e | 0x80 : 0x7e;
            buffer.writeUInt16BE(size, 2);
        }
    }
    const FIN: number = hasSplit ? 0 : 0x80;
    buffer[0] = FIN + opcode;

    if (useMask) buffer.writeUint32BE(maskKey, baseLen);
    return buffer;
}
/** 解码ws头部 */
function decodeWsHead(buf: Buffer): WsFrameHead {
    return {
        fin: Boolean(buf[0] >>> 7),
        rsv1: Boolean((buf[0] & 0x40) >>> 6),
        rsv2: Boolean((buf[0] & 0x20) >>> 5),
        rsv3: Boolean((buf[0] & 0x10) >>> 4),
        opcode: buf[0] & 0x0f,
        useMask: Boolean(buf[1] >>> 7),
        firstLength: buf[1] & 0x7f,
    };
}
function encodeMsg(data: Buffer, maskKey: Uint8Array, offset: bigint = 0n) {
    let k = Number(offset % 4n);
    for (let i = 0; i < data.length; i++) {
        data[i] = data[i] ^ maskKey[k % 4];
        k++;
    }
}
