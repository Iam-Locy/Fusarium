import Fungus from "./fungus.js";
import Plant from "./plant.js";
import { clamp, sample, shuffle } from "./util.js";
//import Simulation from "../node_modules/cacatoo/dist/cacatoo.js";
//import yargs from "yargs";
//import { hideBin } from "yargs/helpers";

// Configuration constant for the cacatoo simulation
var config = {
    title: "Fusarium",
    description: "",
    maxtime: 100000,
    ncol: 1300,
    nrow: 1300,
    wrap: [true, true],
    scale: 1,
    skip: 5,
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
        pColour: {
            xy: "yellow",
            xz: "blue",
            yz: "red",
        },
    },
    spores: 100, //Number of starting spores
    spore_ratio: 0.01,
    num_colours: 30,
    year_len: 1000,
    branch_chance: 0.8,
    plant_scale: 100,
    tilling: false,
    uptake: 1,
    upkeep: 0.1,
    mobile_ratio: 1,
    parasite_ratio: 0.5,
    hgt_rate: 0.05,
    loss_rate: 0.01,
    gain_rate: 0.01
};

export let sim;

// Declaration of the simulation
const fusarium = (config) => {
    let tips = []; //Array of updated hypha tips
    let fungi = []; //Array of living fungi
    let plants = [];

    sim = new Simulation(config);
    sim.setupRandom();
    sim.makeGridmodel("fusoxy");

    sim.config = {
        ...config,
        ncol: (Math.floor(config.ncol / config.plant_scale) - 1) / 2,
        nrow: (Math.floor(config.nrow / config.plant_scale) - 1) / 2,
        scale: config.plant_scale * config.scale,
    };

    sim.makeGridmodel("plants");

    sim.config = {
        ...config,
        ncol: Math.floor(config.ncol / config.plant_scale),
        nrow: Math.floor(config.nrow / config.plant_scale),
        scale: config.plant_scale * config.scale,
    };

    sim.makeGridmodel("field");

    sim.config = config;

    sim.initialGrid(sim.fusoxy, "fungus", null);
    sim.initialGrid(sim.fusoxy, "colour", 0);

    sim.initialGrid(sim.field, "health", null);
    sim.initialGrid(sim.field, "plant", null);

    sim.initialGrid(sim.plants, "plant", null);

    for (let i = 0; i < config.spores; i++) {
        let x = sim.rng.genrand_int(0, config.ncol - 1);
        let y = sim.rng.genrand_int(0, config.nrow - 1);

        let toxin = sample(["x", "y", "z"]);

        let genome = {
            core: {
                a: "hc",
                b: "hc",
                c: "hc",
            },
            mobile: {},
        };

        if (sim.rng.random() < sim.config.parasite_ratio) {
            if (sim.rng.random() < sim.config.mobile_ratio) {
                genome.mobile[toxin] = "toxin";
            } else {
                genome.core[toxin] = "toxin";
            }
        }

        ["k", "l", "m"].forEach((g) => {
            if (sim.rng.random() < 0.33) {
                genome.core[g] = "junk";
            }
        });

        let colour = ["", "", ""];

        Object.keys(genome.core).forEach((gene) => {
            if (gene == "x") colour[0] = "x";
            if (gene == "y") colour[1] = "y";
            if (gene == "z") colour[2] = "z";
        });

        Object.keys(genome.mobile).forEach((gene) => {
            if (gene == "x") colour[0] = "x";
            if (gene == "y") colour[1] = "y";
            if (gene == "z") colour[2] = "z";
        });

        colour = colour.join("");

        let fungus = new Fungus(
            colour == "" ? "none" : colour,
            genome,
            100,
            sim.config.uptake,
            sim.config.upkeep,
            null
        );
        fungi.push(fungus);

        let tip = fungus.addTip(x, y, sim.rng.random() * 2 * Math.PI);
        tips.push(tip);

        sim.fusoxy.grid[x][y].fungus = fungus;
        sim.fusoxy.grid[x][y].colour = fungus.colour;
    }

    sim.createDisplay("fusoxy", "colour", "Fusarium oxysporum mycelium");

    for (
        let x = 0;
        x < (Math.floor(sim.config.ncol / sim.config.plant_scale) - 1) / 2;
        x++
    ) {
        for (
            let y = 0;
            y < (Math.floor(sim.config.nrow / sim.config.plant_scale) - 1) / 2;
            y++
        ) {
            let genome =
                sim.rng.random() < 0.33
                    ? "xy"
                    : sim.rng.random() < 0.5
                    ? "xz"
                    : "yz";
            let plant = new Plant(x, y, 2000, genome, 0.02, 0.000005);

            plants.push(plant);

            sim.plants.grid[x][y].plant = plant;
            sim.field.grid[2 * x + 1][2 * y + 1].health =
                plant.resource / (plant.production / plant.upkeep);
            sim.field.grid[2 * x + 1][2 * y + 1].plant = plant;
            sim.field.grid[2 * x + 1][2 * y + 1].pColour = genome;
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
        label: "Field of plants",
        minval: 0,
        nticks: 10,
        maxval: 1,
    });

    sim.createDisplay("field", "pColour", "Fusarium oxysporum mycelium");

    sim.fusoxy.update = () => {
        if (sim.time % config.year_len == 0 && sim.time != 0) {
            getContacts();
            let new_fungi = [];
            let new_tips = [];

            for (let x = 0; x < config.ncol; x++) {
                for (let y = 0; y < config.nrow; y++) {
                    sim.fusoxy.grid[x][y].fungus = null;
                    sim.fusoxy.grid[x][y].colour = 0;
                }
            }

            fungi.forEach((fungus) => {
                fungus.connectedTo.forEach((network) => {
                    if (sim.rng.random() < 0.1) {
                        fungus.hgt(network);
                    }
                });

                let nSpores =
                    (fungus.resource * fungus.hypha.length) ** (1 / 3) *
                    sim.config.spore_ratio;

                for (let i = 0; i < nSpores; i++) {
                    let newFungus = fungus.getSpore(nSpores);

                    if (!newFungus) continue;
                    new_fungi.push(newFungus);

                    let sporePos;

                    if (config.tilling) {
                        sporePos = {
                            x: sim.rng.genrand_int(0, config.ncol - 1),
                            y: sim.rng.genrand_int(0, config.nrow - 1),
                        };
                    } else {
                        let index = sim.rng.genrand_int(
                            0,
                            fungus.hypha.length - 1
                        );
                        sporePos = {
                            x: fungus.hypha[index][0],
                            y: fungus.hypha[index][1],
                        };
                    }

                    let spore = newFungus.addTip(
                        sporePos.x,
                        sporePos.y,
                        sim.rng.random() * 2 * Math.PI
                    );

                    new_tips.push(spore);

                    sim.fusoxy.grid[sporePos.x][sporePos.y].fungus = newFungus;
                    sim.fusoxy.grid[sporePos.x][sporePos.y].colour =
                        newFungus.colour;
                }
            });

            tips = new_tips;
            fungi = new_fungi;
        }
        let new_fungi = [];
        let new_tips = [];

        fungi.forEach((fungus) => {
            if (!fungus.vegetative()) {
                return;
            }

            new_fungi.push(fungus);

            if (sim.rng.random() > config.branch_chance) {
                return;
            }

            let branch = fungus.branch();
            if (branch) {
                sim.fusoxy.grid[branch.x][branch.y].fungus = fungus;
                sim.fusoxy.grid[branch.x][branch.y].colour = fungus.colour;
                new_tips.push(branch);
            }
        });

        tips = shuffle(tips, sim.rng);

        tips.forEach((tip) => {
            if (tip.parent.resource <= 0) return;
            if (tip.grow(sim.fusoxy)) {
                new_tips.push(tip);
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

            for (
                let x = 0;
                x <
                (Math.floor(sim.config.ncol / sim.config.plant_scale) - 1) / 2;
                x++
            ) {
                for (
                    let y = 0;
                    y <
                    (Math.floor(sim.config.nrow / sim.config.plant_scale) - 1) /
                        2;
                    y++
                ) {
                    positions.push([x, y]);
                }
            }

            positions = shuffle(positions);

            positions.forEach((p) => {
                let x = p[0];
                let y = p[1];

                if (!sim.plants.grid[x][y].plant) {
                    let neighs = sim.plants
                        .getNeighbours8(this, x, y)
                        .map((n) => {
                            return n.plant;
                        });

                    /*  neighs = neighs.filter((n) => {
                        return n != null;
                    }); */

                    let neigh = sample(neighs);

                    if (neigh) {
                        let newPlant = new Plant(
                            x,
                            y,
                            1000,
                            neigh.genome,
                            neigh.production,
                            neigh.upkeep
                        );

                        newPlants.push(newPlant);

                        newPlantGrid[y][x] = newPlant;
                    }
                } else {
                    newPlants.push(sim.plants.grid[x][y].plant);
                    newPlantGrid[y][x] = sim.plants.grid[x][y].plant;
                }
            });

            for (
                let x = 0;
                x <
                (Math.floor(sim.config.ncol / sim.config.plant_scale) - 1) / 2;
                x++
            ) {
                for (
                    let y = 0;
                    y <
                    (Math.floor(sim.config.nrow / sim.config.plant_scale) - 1) /
                        2;
                    y++
                ) {
                    if (newPlantGrid[y][x]) {
                        sim.plants.grid[x][y].plant = newPlantGrid[y][x];
                        sim.field.grid[2 * x + 1][2 * y + 1].health =
                            newPlantGrid[y][x].resource /
                            (newPlantGrid[y][x].production /
                                newPlantGrid[y][x].upkeep);
                        sim.field.grid[2 * x + 1][2 * y + 1].plant =
                            newPlantGrid[y][x];
                        sim.field.grid[2 * x + 1][2 * y + 1].pColour =
                            newPlantGrid[y][x].genome;
                    } else {
                        sim.plants.grid[x][y].plant = null;
                        sim.field.grid[2 * x + 1][2 * y + 1].health = 0;
                        sim.field.grid[2 * x + 1][2 * y + 1].plant = null;
                        sim.field.grid[2 * x + 1][2 * y + 1].colour = null;
                    }
                }
            }
        }

        plants.forEach((plant) => {
            plant.vegetative();

            if (plant.resource < 0.1 || isNaN(plant.resource)) {
                plant.die();
            } else {
                newPlants.push(plant);

                sim.field.grid[2 * plant.x + 1][2 * plant.y + 1].health =
                    plant.resource / (plant.production / plant.upkeep);
            }
        });
        plants = newPlants;
    };

    sim.field.update = function () {
        if (sim.time % sim.config.year_len == 0) {
            let plantOut = "";

            plants.forEach((p) => {
                plantOut += `${p.genome},${p.resource}\t`;
            });

            sim.write_append(
                `${plantOut}\n`,
                `./output/Seed_${sim.config.seed}_uptake_${sim.config.uptake}_loss_${sim.config.loss_rate}_hgt_${sim.config.hgt_rate}_parasite_${sim.config.parasite_ratio}_mobile_${sim.config.mobile_ratio}_plants.txt`
            );

            let fungusOut = "";

            fungi.forEach((f) => {
                let genomeC = "";
                Object.keys(f.genome.core).forEach((g) => (genomeC += g));

                let genomeM = "";
                Object.keys(f.genome.mobile).forEach((g) => (genomeM += g));
                fungusOut += `${f.id},C:${genomeC},M:${genomeM},${f.uptake},${f.hosts.length},${f.parent}\t`;
            });

            sim.write_append(
                `${fungusOut}\n`,
                `./output/Seed_${sim.config.seed}_uptake_${sim.config.uptake}_loss_${sim.config.loss_rate}_hgt_${sim.config.hgt_rate}_parasite_${sim.config.parasite_ratio}_mobile_${sim.config.mobile_ratio}_fungi.txt`
            );
        }
    };

    sim.start();
};

const getContacts = () => {
    for (let x = 0; x < sim.config.ncol; x++) {
        for (let y = 0; y < sim.config.nrow; y++) {
            let cell = sim.fusoxy.grid[x][y];

            if (cell.fungus) {
                if (cell.fungus.resource <= 0) continue;
                let neigh = sim.fusoxy.getNeighbours4(sim.fusoxy, x, y);

                neigh.forEach((n) => {
                    if (!n.fungus) return;

                    if (n.fungus.id == cell.fungus.id) return;

                    if (cell.fungus.connectedTo.includes(n.fungus)) return;

                    cell.fungus.connectedTo.push(n.fungus);
                    n.fungus.connectedTo.push(cell.fungus);
                });
            }
        }
    }
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
