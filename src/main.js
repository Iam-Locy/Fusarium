import Fungus from "./fungus.js";
import Plant from "./plant.js";
import { drawSpot, sample, shuffle, Vector } from "./util.js";
import { Gene, Genome } from "./genome.js";
/* import Simulation from "../node_modules/cacatoo/dist/cacatoo.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
 */
// Configuration constant for the cacatoo simulation
var config = {
    title: "Fusarium",
    description: "",
    maxtime: 100000,
    ncol: 1000,
    nrow: 1000,
    wrap: [true, true],
    scale: 1,
    skip: 10,
    seed: Math.floor(Math.random() * 100),
    statecolours: {
        colour: {
            none: "grey",
            x: "red",
            y: "blue",
            z: "yellow",
            xy: "purple",
            xz: "orange",
            yz: "green",
            xyz: "white",
        },
        food: {
            1: "white",  
        },
    },
    spores: 1, //Number of starting spores
    spore_ratio: 0.01,
    year_len: 1000,
    branch_chance: 0.005,
    tip_speed: 0.2,
    plant_scale: 100,
    tilling: false,
    uptake: 10,
    upkeep: 0.25,
    phi: 4,
    mobile_ratio: 1,
    parasite_ratio: 0.1,
    hgt_rate: 0.1,
    hgt_mode: "copy",
    loss_rate: 0.0,
    gain_rate: 0.0,
    food_decay_rate: 0.9,
};

export let sim;

// Declaration of the simulation
const fusarium = (config) => {
    let tips = []; //Array of updated hypha tips
    let fungi = []; //Array of living fungi
    let plants = []; //Array of living plants

    sim = new Simulation(config);
    sim.setupRandom();

    sim.makeGridmodel("field");

    sim.initialGrid(sim.field, "colour", 0);
    sim.initialGrid(sim.field, "filaments", 0)

    sim.initialGrid(sim.field, "health", null);
    sim.initialGrid(sim.field, "plant", null);
     sim.initialGrid(sim.field, "node", null);

    sim.initialGrid(sim.field, "food", 0);
   

    for (let x = 0; x < sim.config.ncol; x++) {
        for (let y = 0; y < sim.config.nrow; y++) {
            sim.field.grid[x][y].fungi = new Set([]);
        }
    }

    sim.config = {
        ...config,
        ncol: Math.floor(config.ncol / config.plant_scale),
        nrow: Math.floor(config.nrow / config.plant_scale),
        scale: config.plant_scale * config.scale,
    };

    sim.makeGridmodel("plants");

    sim.initialGrid(sim.plants, "plant", null);

    sim.config = config;

    for (let i = 0; i < config.spores; i++) {
        let pos = {
            x: sim.rng.genrand_int(0, config.ncol - 1),
            y: sim.rng.genrand_int(0, config.nrow - 1),
        };

        let pathogenicity = sample(["x", "y", "z"]);

        let coreGenes = [
            new Gene("a", Gene.genes.a),
            new Gene("b", Gene.genes.b),
            new Gene("c", Gene.genes.c),
        ];

        let mobileGenes = [];

        if (sim.rng.random() < sim.config.parasite_ratio) {
            if (sim.rng.random() < sim.config.mobile_ratio) {
                mobileGenes.push(
                    new Gene(pathogenicity, Gene.genes[pathogenicity])
                );
            } else {
                coreGenes.push(
                    new Gene(pathogenicity, Gene.genes[pathogenicity])
                );
            }
        }

        ["k", "l", "m"].forEach((g) => {
            if (sim.rng.random() < 0.33) {
                coreGenes.push(new Gene(g, Gene.genes[g]));
            }
        });

        let genome = {
            core: coreGenes,
            acc: mobileGenes,
        };

        let colour = ["", "", ""];

        genome.core.forEach((gene) => {
            if (gene.name == "x") colour[0] = "x";
            if (gene.name == "y") colour[1] = "y";
            if (gene.name == "z") colour[2] = "z";
        });

        genome.acc.forEach((gene) => {
            if (gene.name == "x") colour[0] = "x";
            if (gene.name == "y") colour[1] = "y";
            if (gene.name == "z") colour[2] = "z";
        });

        colour = colour.join("");

        let fungus = new Fungus(
            pos,
            colour == "" ? "none" : colour,
            genome,
            200,
            sim.config.uptake,
            sim.config.upkeep
        );

        fungi.push(fungus);
        tips.push(...fungus.tips);
    }

    sim.createDisplay("field", "colour", "Fusarium oxysporum mycelium");

    let plantNcol = Math.floor(sim.config.ncol / sim.config.plant_scale);
    let plantNrow = Math.floor(sim.config.nrow / sim.config.plant_scale);

    for (let x = 0; x < plantNcol; x++) {
        for (let y = 0; y < plantNrow; y++) {
            let geneList = [];

            let genes = sample(["xy", "xz", "yz"]);

            for (let g of genes) {
                geneList.push(new Gene(g, Gene.genes[g]));
            }

            let plant = new Plant(
                { x, y },
                sim.rng.genrand_int(1000, 4000),
                geneList,
                0.02,
                0.000005
            );

            plants.push(plant);
        }
    }

    sim.field.colourGradient(
        "health",
        100,
        [0, 0, 0],
        [120, 90, 10],
        [50, 170, 80]
    );

    sim.createDisplay_continuous({
        model: "field",
        property: "health",
        label: "Root placement",
        minval: 0,
        nticks: 10,
        maxval: 1,
    });

    sim.createDisplay("field", "food", "Available resources")

    sim.field.colourGradient(
        "filaments",
        100,
        [0,0,0],
        [245,245,66],
        [255,0,0]
    );
    sim.createDisplay_continuous({
        model: "field",
        property: "filaments",
        label: "Hyphal density",
        minval: 0,
        nticks: 6,
        maxval: 5,
    });

    sim.field.update = () => {
        console.log(sim.time)
        sim.field.plotArray( ["Number"],[tips.length], ["red"], "Tips")
        sim.field.plotArray( ["Number"],[fungi.length], ["blue"], "Fungi")

        if (sim.time % sim.config.year_len == 0 && typeof process == "object")
            log(sim, plants, fungi);

        if (sim.time % sim.config.year_len == 0 && sim.time != 0) {
            let new_fungi = [];
            let new_tips = [];

            for (let x = 0; x < config.ncol; x++) {
                for (let y = 0; y < config.nrow; y++) {
                    sim.field.grid[x][y].fungi = new Set([]);
                    sim.field.grid[x][y].colour = 0;
                    sim.field.grid[x][y].filaments = 0;
                }
            }

            fungi.forEach((fungus) => {
                fungus.getContacts();
                fungus.connectedTo.forEach((network) => {
                    if (sim.rng.random() < sim.config.hgt_rate) {
                        [fungus.genome, network.genome] =
                            Genome.horizontalTransfer(
                                fungus.genome,
                                network.genome
                            );
                    }
                });

                let nSpores = Math.ceil(
                    (fungus.resources.amount * fungus.hypha.nodeCount) **
                        (1 / 3) *
                        sim.config.spore_ratio
                );

                for (let i = 0; i < nSpores; i++) {
                    let sporePos;

                    if (config.tilling) {
                        sporePos = {
                            x: sim.rng.genrand_int(0, config.ncol - 1),
                            y: sim.rng.genrand_int(0, config.nrow - 1),
                        };
                    } else {
                        let index = sim.rng.genrand_int(
                            0,
                            fungus.tips.length - 1
                        );
                        sporePos = new Vector(
                            fungus.tips[index].pos.x,
                            fungus.tips[index].pos.y
                        );
                    }

                    let newFungus = fungus.getSpore(sporePos, nSpores);

                    if (!newFungus) continue;
                    new_fungi.push(newFungus);

                    new_tips.push(...newFungus.tips);
                }
            });

            tips = new_tips;
            fungi = new_fungi;
        }

        let new_fungi = [];
        let new_tips = [];

        tips = shuffle(tips, sim.rng);

        tips.forEach((tip) => {
            if (tip.grow()) {
                new_tips.push(tip);
            }

            if (sim.rng.random() < sim.config.branch_chance) {
                new_tips.push(tip.branch());
            }
        });

        fungi.forEach((fungus) => {
            if (!fungus.vegetative()) {
                new_tips = new_tips.filter((tip) => {
                    return !fungus.tips.find((t) => t.id === tip.id);
                });
            } else {
                new_fungi.push(fungus);
            }
        });

        fungi = new_fungi;
        tips = new_tips;
    };

    sim.plants.update = function () {
        let newPlants = [];

        if (sim.time % sim.config.year_len == 0 && sim.time != 0) {
            let newPlantGrid = [...Array(sim.plants.grid.length)].map((e) =>
                Array(sim.plants.grid[0].length).fill(null)
            );

            let positions = [];

            for (let x = 0; x < plantNcol; x++) {
                for (let y = 0; y < plantNrow; y++) {
                    positions.push(new Vector(x, y));
                }
            }

            positions = shuffle(positions);

            positions.forEach((p) => {
                if (!sim.plants.grid[p.x][p.y].plant) {
                    let neighs = sim.plants
                        .getNeighbours8(this, p.x, p.y)
                        .map((n) => {
                            return n.plant;
                        });

                    let neigh = sample(neighs);

                    if (neigh) {
                        let newPlant = new Plant(
                            p,
                            1000,
                            neigh.genome.core,
                            neigh.resources.production,
                            neigh.resources.upkeep
                        );

                        newPlants.push(newPlant);

                        newPlantGrid[p.y][p.x] = newPlant;
                    }
                } else {
                    newPlants.push(sim.plants.grid[p.x][p.y].plant);
                    newPlantGrid[p.y][p.x] = sim.plants.grid[p.x][p.y].plant;
                }
            });

            for (let x = 0; x < plantNcol; x++) {
                for (let y = 0; y < plantNrow; y++) {
                    if (newPlantGrid[y][x]) {
                        sim.plants.grid[x][y].plant = newPlantGrid[y][x];
                    } else {
                        sim.plants.grid[x][y].plant = null;
                    }
                }
            }
        } else {
            plants.forEach((plant) => {
                if (
                    plant.resources.amount < 0.1 ||
                    isNaN(plant.resources.amount)
                ) {
                    plant.die();
                } else {
                    plant.vegetative();
                    newPlants.push(plant);
                }
            });
        }

        plants = newPlants;
    };

    sim.start();
};

const decayProp = (model, property, rate) => {
    for (let x = 0; x < model.nc; x++) {
        for (let y = 0; y < model.nr; y++) {
            model.grid[x][y][property] *= rate;
        }
    }
};

const log = (sim, plants, fungi) => {
    let plantOut = "";

    plants.forEach((p) => {
        let genome = "";
        p.genome.core.forEach((g) => (genome += g.name));
        plantOut += `${genome},${p.resources.amount}\t`;
    });

    sim.write_append(
        `${plantOut}\n`,
        `./output/Seed_${sim.config.seed}_uptake_${sim.config.uptake}_phi_${sim.config.phi}_mode_${sim.config.hgt_mode}_hgt_${sim.config.hgt_rate}_speed_${sim.config.tip_speed}_plants.txt`
    );

    let fungusOut = "";

    fungi.forEach((f) => {
        let genomeC = "";
        f.genome.core.forEach((g) => (genomeC += g.name));

        let genomeA = "";
        f.genome.acc.forEach((g) => (genomeA += g.name));
        fungusOut += `${f.id},C:${genomeC},A:${genomeA},${f.hosts.size}\t`;
    });

    sim.write_append(
        `${fungusOut}\n`,
        `./output/Seed_${sim.config.seed}_uptake_${sim.config.uptake}_phi_${sim.config.phi}_mode_${sim.config.hgt_mode}_hgt_${sim.config.hgt_rate}_speed_${sim.config.tip_speed}_fungi.txt`
    );

    let foodOut = 0;

    for (let x = 0; x < sim.field.nc; x++) {
        for (let y = 0; y < sim.field.nr; y++) {
            foodOut += sim.field.grid[x][y].food;
        }
    }

    sim.write_append(
        `${foodOut}\n`,
        `./output/Seed_${sim.config.seed}_uptake_${sim.config.uptake}_phi_${sim.config.phi}_mode_${sim.config.hgt_mode}_hgt_${sim.config.hgt_rate}_speed_${sim.config.tip_speed}_food.txt`
    );
};

// Run the simulation
if (typeof process === "object") {
    let cmd_params = yargs(hideBin(process.argv)).argv;

    Object.keys(config).forEach((arg) => {
        if (typeof cmd_params[arg] != "undefined") {
            config[arg] = cmd_params[arg];
        }
    });

    fusarium(config);
} else {
    document.addEventListener(
        "DOMContentLoaded",
        () => {
            fusarium(config);
        },
        false
    );
}
