import { ClientCmd, ServerCmd } from "#common/action.js";
import { Cpc } from "cpcall";

type WsCpc = Cpc<ServerCmd, ClientCmd>;
