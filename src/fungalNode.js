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
            let pathoGenes = [];

            for (let gene of this.fungus.genome.core) {
                if (gene.type == "pathogenicity") {
                    pathoGenes.push(gene.name);
                }
            }

            for (let gene of this.fungus.genome.acc) {
                if (gene.type == "pathogenicity") {
                    pathoGenes.push(gene.name);
                }
            }

            if (!plant.genome.hasGenes(pathoGenes) && pathoGenes.length > 0) {
                this.fungus.hosts.add(plant);
            }
        }

        drawLine(
            sim.field,
            ["colour"],
            [this.fungus.colour],
            this.pos,
            newPos
        );

        if (
            pos_floored.x != newPos_floored.x ||
            pos_floored.y != newPos_floored.y
        ) {
            let pos = new Vector(pos_floored.x, pos_floored.y);
            let node = new fungalNode(pos, this.fungus);

            this.parent.addChild(node);
            this.parent.removeChild(this.id);
            node.addChild(this);

            let gridPoint = sim.field.grid[node.pos.x][node.pos.y]

            if(gridPoint.food){
                this.fungus.cells.add(node)
            }

            gridPoint.nodes.add(node);
            gridPoint.node_count += 1;
        }

        this.pos = newPos_wrapped;
        return true;
    }

    branch() {
        let branchNode = this.parent

        let currCell = sim.field.grid[branchNode.pos.x][branchNode.pos.y]

        if(currCell.node_count >= 5) return null

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
