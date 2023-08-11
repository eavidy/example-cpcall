import React, { useEffect, useState } from "react";
import { Modal, Input, Form } from "antd";
import { Scene } from "../components/scene.js";

export function Play() {
    const [name, setName] = useState(localStorage.getItem("name"));
    const [from] = Form.useForm();
    const onSet = () => {
        const name = from.getFieldValue("name");
        localStorage.setItem("name", name);
        setName(name);
    };

    useEffect(() => {
        document.oncontextmenu = () => false;
    }, []);
    return (
        <div style={{}}>
            {name && <Scene height={1000} width={1000} />}

            <Modal title="你的名字：" onOk={onSet} open={!name}>
                <Form form={from}>
                    <Form.Item name="name">
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
