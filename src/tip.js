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
        this.lasLine = new Set([]);
    }

    grow() {
        let newPos = new Vector(
            this.pos.x + this.step.x + (sim.rng.random() - 0.5),
            this.pos.y + this.step.y + (sim.rng.random() - 0.5)
        );

        let newPos_wrapped = wrap(Vector.rounded(newPos));

        if (!newPos_wrapped.isInBounds) return false;

        if(sim.field.grid[newPos_wrapped.x][newPos_wrapped.y].filaments >= 5){
            return false;
        }

        let plant = sim.field.grid[newPos_wrapped.x][newPos_wrapped.y].plant;

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

        let cells = drawLine(
            sim.field,
            ["fungi", "colour"],
            [this.fungus, this.fungus.colour],
            this.pos,
            newPos
        );

        for (let cell of cells) {
            let endPoint = false;
            for (let coord of this.lasLine) {
                if (cell == coord) {
                    endPoint = true;
                    break;
                }
            }

            if (!endPoint) {
                cell.filaments += 1;
            }
        }

        this.lasLine = new Set([
            cells[0],
            cells[1],
            cells[cells.length - 1],
            cells[cells.length - 2],
        ]);

        this.pos = newPos_wrapped;
        return true;
    }

    branch() {
        let branchNode = new Node(this.pos);

        this.parent.addChild(branchNode);

        this.parent.removeChild(this.id);

        let newTip = new Tip(
            branchNode.pos,
            this.fungus,
            this.direction + (sim.rng.random() - 0.5) * (Math.PI / 2)
        );

        branchNode.addChild(newTip);
        branchNode.addChild(this);
        sim.field.grid[newTip.pos.x][newTip.pos.y].filaments += 1;

        this.fungus.tips.push(newTip);
        let pos = Vector.floored(newTip.pos);

        return newTip;
    }
}
