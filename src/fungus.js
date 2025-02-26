import Tip from "./tip.js";
import { genID, sample, wrap } from "./util.js";
import { sim } from "./main.js";

const idGenerator = genID();

export default class Fungus {
    constructor(colour) {
        this.id = idGenerator.next().value;
        this.colour = colour;
        this.hypha = [];
        this.tips = [];
        this.hosts = [];
        //this.struct = null;
    }

    addTip(x, y, direction) {
        const tip = new Tip(x, y, direction, this);

        this.tips.push(tip);
        this.hypha.push([tip.x, tip.y]);
        return tip;
    }

    branch() {
        let branchPoint =
            this.hypha[sim.rng.genrand_int(0, this.hypha.length - 1)];

        let neighbours = [];

        for (let i = 0; i < 4; i++) {
            let rotation =
                NEIGHBOUR_VECTORS[i].rotation +
                [1, -1][sim.rng.genrand_int(0, 1)] *
                    (sim.rng.random() * Math.PI);

            let vector = {
                x: branchPoint[0] + NEIGHBOUR_VECTORS[i].x,
                y: branchPoint[1] + NEIGHBOUR_VECTORS[i].y,
                rotation: (rotation + 2 * Math.PI) % (2 * Math.PI),
            };

            vector = { ...wrap(vector), rotation: vector.rotation };
            let neighbour = sim.fusoxy.getGridpoint(vector.x, vector.y);

            if (neighbour) {
                neighbours.push([neighbour, vector]);
            }
        }


        neighbours = neighbours.filter((n) => {
            return !n[0].fungus;
        });

        if (neighbours.length == 0) {
            return;
        }

        let tip = sample(neighbours)[1];
        
        return this.addTip(tip.x, tip.y, tip.rotation);
    }
}

const NEIGHBOUR_VECTORS = [
    { x: 0, y: 1, rotation: Math.PI / 2 },
    { x: -1, y: 0, rotation: Math.PI },
    { x: 1, y: 0, rotation: 0 },
    { x: 0, y: -1, rotation: (3 * Math.PI) / 2 },
];
