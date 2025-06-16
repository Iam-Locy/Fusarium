import { Genome } from "./genome.js";
import { sim } from "./main.js";
import { Node, Tree } from "./tree.js";
import { clamp, drawLine, drawSpot, idGenerator, Vector } from "./util.js";

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

        if(sim.time % 10 == 0) this.releaseFood(this.resources.amount * 0.02);
        this.drawPlant();
        return this.resources.amount;
    }

    die() {
        this.resources.amount = 0;
        this.health = 0;

        this.drawPlant();
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
                ["health", "plant"],
                [this.health, this.health > 0 ? this : null],
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

    releaseFood(amount) {
        let mask = new Array(sim.field.nr);

        for (let x = 0; x < sim.field.nc; x++) {
            mask[x] = new Array(sim.field.nc);
            for (let y = 0; y < sim.field.nr; y++) {
                mask[x][y] = { food: 0 };
            }
        }

        for (let node of this.rootSystem.preOrderTraversal()) {
            drawSpot(mask, ["food"], [amount], 10, node.pos);
        }

      
        for (
            let x = sim.config.plant_scale * this.pos.x;
            x < sim.config.plant_scale * (this.pos.x + 1);
            x++
        ) {
            for (
                let y = sim.config.plant_scale * this.pos.y;
                y < sim.config.plant_scale * (this.pos.y + 1);
                y++
            ) {
                sim.field.grid[x][y].food += mask[x][y].food;
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
