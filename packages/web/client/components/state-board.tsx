import { Progress } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import React, { useEffect } from "react";

export function StateBoard(props: { percent: number }) {
    const { percent } = props;
    return (
        <div style={{ position: "fixed", bottom: "28px", right: "20px", width: "200px" }}>
            <Skill num={4}>
                <ThunderboltOutlined />
            </Skill>
            <Progress
                percent={percent}
                status="active"
                strokeColor={{ "0%": "#e92d10", "50%": "#d1be2b", "100%": "#5fad3e" }}
            />
        </div>
    );
}

function Skill(props: React.PropsWithChildren<{ num: number }>) {
    const { num, children } = props;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {children}
            <Progress percent={100} steps={num} showInfo={false} strokeColor="#5fad3e" />
        </div>
    );
}
