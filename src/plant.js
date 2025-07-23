import { Genome } from "./genome.js";
import { sim } from "./main.js";
import { Node, Tree } from "./tree.js";
import { clamp, drawLine, drawSpot, idGenerator, Vector } from "./util.js";

let genID = idGenerator();

export default class Plant {
    constructor(pos, resource, chr, production, upkeep) {
        this.id = genID.next().value;
        this.genome = new Genome([chr]);

        this.pColour = "";

        if (this.genome.karyotype[0].length > 0) {
            for (let gene of this.genome.karyotype[0]) {
                this.pColour += gene.name;
            }
        } else {
            this.pColour = "none";
        }

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
        for (let node of this.rootSystem.preOrderTraversal()) {
            drawSpot(
                sim.field.grid,
                ["food", "plant_node"],
                [1, this],
                15,
                node.pos
            );
        }

        this.drawPlant();
    }

    static plantCenter(vec) {
        let newVec = new Vector(
            vec.x * sim.config.plant_scale +
                Math.floor(sim.config.plant_scale / 2),
            vec.y * sim.config.plant_scale +
                Math.floor(sim.config.plant_scale / 2)
        );

        return newVec;
    }

    vegetative() {
        this.resources.amount +=
            this.resources.amount * this.resources.production -
            this.resources.amount ** 2 * this.resources.upkeep;

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
        this.resources.amount = 0;
        this.health = 0;
        this.pColour = null;

        this.drawPlant();

        for (let node of this.rootSystem.preOrderTraversal()) {
            drawSpot(
                sim.field.grid,
                ["food", "plant_node"],
                [0, null],
                15,
                node.pos
            );
        }
        sim.plants.grid[this.pos.x][this.pos.y].plant = null;
    }

    placePlant() {
        let root = new Tree(new plantNode(this.center));

        for (let i = 0; i < 3; i++) {
            let min_angle = (i * (2 * Math.PI)) / 3 + (35 * Math.PI) / 180;
            let max_angle =
                ((i + 1) * (2 * Math.PI)) / 3 - (35 * Math.PI) / 180;

            let layer_1_dir =
                min_angle + sim.rng.random() * (max_angle - min_angle);

            let layer_1_center = new Vector(
                root.root.pos.x +
                    Math.round(
                        sim.rng.genrand_int(10, 15) * Math.cos(layer_1_dir)
                    ),
                root.root.pos.y +
                    Math.round(
                        sim.rng.genrand_int(10, 15) * Math.sin(layer_1_dir)
                    )
            );

            let layer_1_node = new plantNode(layer_1_center);
            root.root.addChild(layer_1_node);

            for (let j = 0; j < 2; j++) {
                let modifier = j > 0 ? 1 : -1;
                let layer_2_dir =
                    layer_1_dir +
                    modifier * ((sim.rng.genrand_int(30, 60) * Math.PI) / 180);

                let layer_2_center = new Vector(
                    layer_1_node.pos.x +
                        Math.round(
                            sim.rng.genrand_int(10, 15) * Math.cos(layer_2_dir)
                        ),
                    layer_1_node.pos.y +
                        Math.round(
                            sim.rng.genrand_int(10, 15) * Math.sin(layer_2_dir)
                        )
                );

                let layer_2_node = new plantNode(layer_2_center);
                layer_1_node.addChild(layer_2_node);
            }
        }

        sim.plants.grid[this.pos.x][this.pos.y].plant = this;

        return root;
    }

    drawPlant() {
        for (let node of this.rootSystem.preOrderTraversal()) {
            drawSpot(
                sim.field.grid,
                ["health", "plant", "pColour"],
                [this.health, this.health > 0 ? this : null, this.pColour],
                3,
                node.pos
            );

            if (node.children.length > 0) {
                for (let child of node.children) {
                    drawLine(
                        sim.field,
                        ["health", "pColour"],
                        [this.health, this.pColour],
                        node.pos,
                        child.pos
                    );
                }
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
