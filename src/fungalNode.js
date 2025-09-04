import { Vector, wrap, drawLine } from "./util.js";
import { sim } from "./main.js";
import { Node } from "./tree.js";

export class fungalNode extends Node {
    constructor(pos, fungus) {
        super(pos);
        this.fungus = fungus;
    }
}

export class Tip extends fungalNode {
    constructor(
        pos,
        fungus,
        direction = sim.rng.random() * 2 * Math.PI,
        speed = sim.config.tip_speed
    ) {
        super(pos, fungus);
        this.direction = direction;
        this.speed = speed;
        this.step = {
            x: Math.cos(this.direction) * this.speed,
            y: Math.sin(this.direction) * this.speed,
        };
    }

    grow() {
        let xStep = this.step.x;
        let yStep = this.step.y;

        if (Math.abs(xStep) > Math.abs(yStep)) {
            yStep += sim.rng.random() - 0.5;
        } else {
            xStep += sim.rng.random() - 0.5;
        }

        let newPos = new Vector(this.pos.x + xStep, this.pos.y + yStep);

        let newPos_wrapped = wrap(newPos);

        let pos_floored = Vector.floored(this.pos);
        let newPos_floored = Vector.floored(newPos_wrapped);

        if (!newPos_wrapped.isInBounds) return false;

        if (
            sim.field.grid[newPos_floored.x][newPos_floored.y].node_count >=
            sim.config.max_node_count
        ) {
            return false;
        }

        let plant = sim.field.grid[newPos_floored.x][newPos_floored.y].plant;

        if (plant) {
            let pathoGenes = new Set([]);
            let resistGenes = new Set([]);

            for (let chr of this.fungus.genome.karyotype) {
                for (let gene of chr) {
                    if (gene.type == "pathogenicity") {
                        pathoGenes.add(gene.name);
                    }
                }
            }

            if (pathoGenes.size > 0) {
                for (let chr of plant.genome.karyotype) {
                    for (let gene of chr) {
                        if (pathoGenes.has(gene.target)) {
                            resistGenes.add(gene.target);
                        }
                    }
                }

                if (pathoGenes.size > resistGenes.size) {
                    this.fungus.hosts.add(plant);
                }
            }
        }

        if (
            pos_floored.x != newPos_floored.x ||
            pos_floored.y != newPos_floored.y
        ) {
            let pos = new Vector(pos_floored.x, pos_floored.y);
            let node = new fungalNode(pos, this.fungus);

            this.parent.addChild(node);
            this.parent.removeChild(this.id);
            node.addChild(this);

            let gridPoint = sim.field.grid[node.pos.x][node.pos.y];

            if (gridPoint.food) {
                this.fungus.cells.add(node);
            }

            gridPoint.nodes.add(node);
            gridPoint.node_count += 1;
        }

        drawLine(sim.field, ["colour"], [this.fungus.colour], this.pos, newPos);

        this.pos = newPos_wrapped;
        return true;
    }

    branch() {
        let branchNode = this.parent;

        let currCell = sim.field.grid[branchNode.pos.x][branchNode.pos.y];

        if (currCell.node_count >= 5) return null;

        let newTip = new Tip(
            branchNode.pos,
            this.fungus,
            this.direction + (sim.rng.random() - 0.5) * (Math.PI / 2)
        );

        branchNode.addChild(newTip);

        this.fungus.tips.push(newTip);

        return newTip;
    }
}
