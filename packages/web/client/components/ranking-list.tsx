import React, { CSSProperties } from "react";

export type RankingItem = { name: string; id: number; grade: number };
export function RankingList(props: { grades: RankingItem[]; masterId?: number }) {
    const { grades, masterId } = props;

    return (
        <div
            style={{
                position: "fixed",
                top: 20,
                right: 20,
                border: "solid 2px",
                borderRadius: "16px",
                width: "200px",
                padding: "8px",
            }}
        >
            {grades.map((item, index) => {
                const addStyle: CSSProperties | undefined =
                    item.id === masterId ? { background: "#88bc8f" } : undefined;
                return (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            fontSize: 14,
                            padding: "2px 8px",
                            ...addStyle,
                            borderRadius: "8px",
                        }}
                        key={item.id}
                    >
                        <div>{index + 1}</div>
                        <div>{item.name}</div>
                        <div>{item.grade}</div>
                    </div>
                );
            })}
        </div>
    );
}
