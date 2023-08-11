import React from "react";
import { createRoot } from "react-dom/client";
import { Play } from "./pages/page.js";
import { ConfigProvider } from "antd";
import { Buffer } from "buffer";
import zhCN from "antd/locale/zh_CN";
window.Buffer = Buffer;
const dom = document.getElementById("app")!;
createRoot(dom).render(
    <ConfigProvider locale={zhCN}>
        <Play />
    </ConfigProvider>
);
