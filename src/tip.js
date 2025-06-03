import { Vector, wrap, drawLine } from "./util.js";
import { sim } from "./main.js";
import { Node } from "./tree.js";

export default class Tip extends Node {
    constructor(
        pos,
        fungus,
        direction = sim.rng.random() * 2 * Math.PI,
        speed = sim.config.tip_speed
    ) {
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
            ["fungi", "colour"],
            [this.fungus, this.fungus.colour],
            this.pos,
            newPos
        );

        this.pos = newPos_wrapped;
        return true;
    }

    branch() {

        let branchNode = new Node(this.pos);

        this.parent.addChild(branchNode);

        this.parent.removeChild(this.id);

        let newTip = new Tip(branchNode.pos, this.fungus);

        branchNode.addChild(newTip);
        branchNode.addChild(this);

        return newTip;
    }
}
