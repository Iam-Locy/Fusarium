import { Genome } from "./genome.js";
import { sim } from "./main.js";
import { Node, Tree } from "./tree.js";
import { clamp, drawLine, drawSpot, idGenerator } from "./util.js";

let genID = idGenerator();

export default class Plant {
    constructor(pos, resource, genes, production, upkeep) {
        this.id = genID.next().value;
        this.genome = new Genome(genes);
        this.pos = pos;
        this.center = Plant.plantCenter(this.pos);
        this.resources = {
            amount: resource,
            production: production,
            upkeep: upkeep,
        };
        this.health = clamp(
            0,
            1,
            this.resources.amount /
                (this.resources.production / this.resources.upkeep)
        );
        this.rootSystem = this.placePlant();
        this.drawPlant();
    }

    static plantCenter(vec) {
        let newVec = {
            x:
                vec.x * sim.config.plant_scale +
                Math.floor(sim.config.plant_scale / 2),
            y:
                vec.y * sim.config.plant_scale +
                Math.floor(sim.config.plant_scale / 2),
        };

        return newVec;
    }

    vegetative() {
        this.resources.amount +=
            this.resources.amount * this.resources.production -
            this.resources.amount ** 2 * this.resources.upkeep;

        if (
            this.resources.amount /
                (this.resources.production / this.resources.upkeep) <
                0.1 ||
            isNaN(this.resources.amount)
        ) {
            this.die;
        }

        this.health = clamp(
            0,
            1,
            this.resources.amount /
                (this.resources.production / this.resources.upkeep)
        );
        this.drawPlant();
        return this.resources.amount;
    }

    die() {
        this.resource = 0;
        sim.plants.grid[this.pos.x][this.pos.y].plant = null;
        sim.field.grid[2 * this.pos.x + 1][2 * this.pos.y + 1].plant = null;
        sim.field.grid[2 * this.pos.x + 1][2 * this.pos.y + 1].health = 0;
        sim.field.grid[2 * this.pos.x + 1][2 * this.pos.y + 1].pColour = null;
    }

    placePlant() {
        let root = new Tree(new plantNode(this.center));

        for (let i = 0; i < 3; i++) {
            let min_angle = (i * (2 * Math.PI)) / 3 + (35 * Math.PI) / 180;
            let max_angle =
                ((i + 1) * (2 * Math.PI)) / 3 - (35 * Math.PI) / 180;

            let layer_1_dir =
                min_angle + sim.rng.random() * (max_angle - min_angle);

            let layer_1_center = {
                x:
                    root.root.pos.x +
                    Math.round(
                        sim.rng.genrand_int(10, 15) * Math.cos(layer_1_dir)
                    ),
                y:
                    root.root.pos.y +
                    Math.round(
                        sim.rng.genrand_int(10, 15) * Math.sin(layer_1_dir)
                    ),
            };

            let layer_1_node = new plantNode(layer_1_center);
            root.root.addChild(layer_1_node);

            for (let j = 0; j < 2; j++) {
                let modifier = j > 0 ? 1 : -1;
                let layer_2_dir =
                    layer_1_dir +
                    modifier * ((sim.rng.genrand_int(30, 60) * Math.PI) / 180);

                let layer_2_center = {
                    x:
                        layer_1_node.pos.x +
                        Math.round(
                            sim.rng.genrand_int(10, 15) * Math.cos(layer_2_dir)
                        ),
                    y:
                        layer_1_node.pos.y +
                        Math.round(
                            sim.rng.genrand_int(10, 15) * Math.sin(layer_2_dir)
                        ),
                };

                let layer_2_node = new plantNode(layer_2_center);
                layer_1_node.addChild(layer_2_node);
            }
        }
        return root;
    }

    drawPlant() {
        for (let node of this.rootSystem.preOrderTraversal()) {
            drawSpot(
                sim.field,
                ["health", "plant"],
                [this.health, this],
                3,
                node.pos
            );

            if (node.children.length > 0) {
                node.children.forEach((child) => {
                    drawLine(
                        sim.field,
                        ["health"],
                        [this.health],
                        node.pos,
                        child.pos
                    );
                });
            }
        }
    }
}

class plantNode extends Node {
    constructor(pos) {
        super(pos);
        this.occupant = undefined;
    }
}
