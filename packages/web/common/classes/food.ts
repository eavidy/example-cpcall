import { Coord, FoodState } from "common/action.js";

export class Food implements FoodState {
    constructor(public coordinate: Coord) {}
}
