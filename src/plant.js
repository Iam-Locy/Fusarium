import { sim } from "./main.js";
import { Node, Tree } from "./tree.js";
import { drawLine, drawSpot, idGenerator } from "./util.js";

let genID = idGenerator();

export default class Plant {
    constructor(pos, resource, genome, production, upkeep) {
        this.id = genID.next().value;
        this.genome = genome;
        this.pos = pos;
        this.center = Plant.plantCenter(this.pos);
        this.rootSystem = this.placePlant();
        this.resources = {
            amount: resource,
            production: production,
            upkeep: upkeep,
        };
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
        this.resource +=
            this.resource * this.production - this.resource ** 2 * this.upkeep;

        if (
            this.resource / (this.production / this.upkeep) < 0.1 ||
            isNaN(this.resource)
        ) {
            this.die;
        }

        return this.resource;
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

        drawSpot(
            sim.field,
            ["health", "plant", "pColour"],
            [1, this, this.genome],
            10,
            this.center
        );

        for (let i = 0; i < 3; i++) {
            let min_angle = (i * (2 * Math.PI)) / 3 + (30 * Math.PI) / 180;
            let max_angle =
                ((i + 1) * (2 * Math.PI)) / 3 - (30 * Math.PI) / 180;

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

            drawSpot(
                sim.field,
                ["health", "plant", "pColour"],
                [1, this, this.genome],
                10,
                layer_1_center
            );
            drawLine(
                sim.field,
                ["health", "plant", "pColour"],
                [1, this, this.genome],
                root.root.pos,
                layer_1_node.pos
            );

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

                drawSpot(
                    sim.field,
                    ["health", "plant", "pColour"],
                    [1, this, this.genome],
                    10,
                    layer_2_center
                );
                drawLine(
                    sim.field,
                    ["health", "plant", "pColour"],
                    [1, this, this.genome],
                    layer_1_node.pos,
                    layer_2_node.pos
                );
            }
        }

        return root;
    }
}

class plantNode extends Node {
    constructor(pos) {
        super(pos);
        this.occupant = undefined;
    }
}
