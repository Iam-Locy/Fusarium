import { Vector, wrap, drawLine } from "./util.js";
import { sim } from "./main.js";
import { Node } from "./tree.js";

export default class Tip extends Node {
    constructor(pos, direction, fungus, speed = 1) {
        super(pos);
        this.fungus = fungus;
        this.direction = direction;
        this.speed = speed;
        this.step = {
            x: Math.cos(this.direction) * this.speed,
            y: Math.sin(this.direction) * this.speed,
        };
    }

    grow() {
        let newPos = new Vector(
            this.pos.x + this.step.x + (sim.rng.random() - 0.5),
            this.pos.y + this.step.y + (sim.rng.random() - 0.5)
        );

        let newPos_wrapped = wrap(newPos);

        if (!newPos_wrapped.isInBounds) return false;

        drawLine(
            sim.fusoxy,
            ["fungus", "colour"],
            [this.fungus, this.fungus.colour],
            this.pos,
            newPos
        );

        this.pos = newPos_wrapped;
        return true;
    }
}
