import Tip from "./tip.js";
import { idGenerator, sample, wrap } from "./util.js";
import { sim } from "./main.js";

const genID = idGenerator();

export default class Fungus {
    constructor(colour, genome, resource, uptake, upkeep, parent) {
        this.id = genID.next().value;
        this.colour = colour;
        this.hypha = [];
        this.tips = [];
        this.hosts = [];
        this.genome = genome;
        this.uptake = uptake;
        this.upkeep = upkeep;
        this.resource = resource;
        this.connectedTo = [];
        this.parent = parent;
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

            let plantVec = {
                x: Math.floor(vector.x / sim.config.plant_scale),
                y: Math.floor(vector.y / sim.config.plant_scale),
            };

            let plant = sim.field.grid[plantVec.x][plantVec.y].plant;

            if (plant) {
                if (
                    !this.hosts.find((host) => {
                        return host == plant;
                    })
                ) {
                    let canInvade = false;

                    Object.keys(this.genome.core).forEach((key) => {
                        if (this.genome.core[key] == "toxin") {
                            if (!plant.genome.includes(key)) canInvade = true;
                        }
                    });

                    Object.keys(this.genome.mobile).forEach((key) => {
                        if (this.genome.mobile[key] == "toxin") {
                            if (!plant.genome.includes(key)) canInvade = true;
                        }
                    });

                    if (canInvade) {
                        this.hosts.push(plant);
                    }
                }
            }

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

    vegetative() {
        this.hypha.forEach((h) => {
            let plant =
                sim.field.grid[Math.floor(h[0] / sim.config.plant_scale)][
                    Math.floor(h[1] / sim.config.plant_scale)
                ].plant;

            if (plant) {
                if (
                    this.hosts.find((host) => {
                        return host == plant;
                    })
                    
                ) {
                    this.resource = this.resource + this.uptake;

                    plant.resource -= this.uptake;
                    if (
                        plant.resource / (plant.production / plant.upkeep) <
                            0.1 ||
                        isNaN(plant.resource)
                    ) {
                        plant.die();
                    }
                }

                this.resource +=
                    (plant.resource ** 2 * plant.upkeep) /
                    sim.config.plant_scale;
            }

            this.resource -= this.upkeep;
        });

        return this.resource > 0;
    }

    getSpore(nSpores) {
        let newGenome = {
            core: { ...this.genome.core },
            mobile: { ...this.genome.mobile },
        };

        this.geneLoss(newGenome.core);
        this.geneGain(newGenome.core);

        if (Object.keys(this.genome.mobile).length > 0) {
            this.cutNpaste(newGenome.core, newGenome.mobile);
            this.cutNpaste(newGenome.mobile, newGenome.core);
            this.geneLoss(newGenome.mobile);
            this.geneGain(newGenome.mobile);
        }

        // #console.log(newGenome.core.a)
        if (
            newGenome.core.a === undefined &&
            newGenome.mobile.a === undefined
        ) {
            return false;
        }

        if (
            newGenome.core.b === undefined &&
            newGenome.mobile.b === undefined
        ) {
            return false;
        }

        if (
            newGenome.core.c === undefined &&
            newGenome.mobile.c === undefined
        ) {
            return false;
        }

        let colour = ["", "", ""];

        Object.keys(newGenome.core).forEach((gene) => {
            if (gene == "x") colour[0] = "x";
            if (gene == "y") colour[1] = "y";
            if (gene == "z") colour[2] = "z";
        });

        Object.keys(newGenome.mobile).forEach((gene) => {
            if (gene == "x") colour[0] = "x";
            if (gene == "y") colour[1] = "y";
            if (gene == "z") colour[2] = "z";
        });

        //console.log(newGenome.core.a, "after")

        colour = colour.join("")

        let spore = new Fungus(
            colour == "" ? "none" : colour,
            newGenome,
            1000,
            this.uptake,
            this.upkeep,
            this.id
        );

        //console.log(spore.genome)
        return spore;
    }

    cutNpaste(chr1, chr2) {
        Object.keys(chr1).forEach((gene) => {
            if (sim.rng.random() < 0.01) {
                chr2[gene] = chr1[gene];
                delete chr1[gene];
            }
        });
    }

    geneLoss(chr) {
        Object.keys(chr).forEach((gene) => {
            if (sim.rng.random() < sim.config.loss_rate) {
                delete chr[gene];
            }
        });
    }

    geneGain(chr) {
        const genes = {
            a: "hc",
            b: "hc",
            c: "hc",
            x: "toxin",
            y: "toxin",
            z: "toxin",
            k: "junk",
            l: "junk",
            m: "junk",
        };

        Object.keys(genes).forEach((gene) => {
            if (sim.rng.random() < sim.config.gain_rate) {
                chr[gene] = genes[gene];
            }
        });
    }

    hgt(network) {
        if (Object.keys(this.genome.mobile).length == 0) return;

        Object.keys(network.genome.mobile).forEach((gene) => {
            if (!gene in this.genome.mobile) {
                this.genome.mobile[gene] = network.genome.mobile[gene];
            }
        });

        let colour = ["", "", ""];

        Object.keys(this.genome.core).forEach((gene) => {
            if (gene == "x") colour[0] = "x";
            if (gene == "y") colour[1] = "y";
            if (gene == "z") colour[2] = "z";
        });

        Object.keys(this.genome.mobile).forEach((gene) => {
            if (gene == "x") colour[0] = "x";
            if (gene == "y") colour[1] = "y";
            if (gene == "z") colour[2] = "z";
        });

        colour = colour.join("")

        this.colour = colour == "" ? "none" : colour
    }
}

const NEIGHBOUR_VECTORS = [
    { x: 0, y: 1, rotation: Math.PI / 2 },
    { x: -1, y: 0, rotation: Math.PI },
    { x: 1, y: 0, rotation: 0 },
    { x: 0, y: -1, rotation: (3 * Math.PI) / 2 },
];
