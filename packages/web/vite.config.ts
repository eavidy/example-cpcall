import { resolve } from "node:path";

export default {
    server: {
        proxy: {
            "/ws": {
                target: "http://127.0.0.1:8888",
                changeOrigin: true,
            },
        },
    },
    resolve: {
        alias: {
            "#common": resolve(__dirname, "/common"),
        },
    },
};
