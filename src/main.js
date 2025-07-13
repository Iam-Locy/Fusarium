import config from "./config.js";
import Fungus from "./fungus.js";
import Plant from "./plant.js";
import { sample, shuffle, Vector } from "./util.js";
import { Gene, Genome } from "./genome.js";
import setupDisplays from "./displays.js";
/* import Simulation from "../node_modules/cacatoo/dist/cacatoo.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers"; */

// Configuration constant for the cacatoo simulation

export let sim;

// Declaration of the simulation
const fusarium = (config) => {
    let tips = []; //Array of updated hypha tips
    let fungi = []; //Array of living fungi
    let plants = []; //Array of living plants

    config.maxtime = config.year_len * config.max_season;
    sim = new Simulation(config);
    sim.setupRandom();

    sim.makeGridmodel("field");

    sim.initialGrid(sim.field, "colour", 0);
    sim.initialGrid(sim.field, "node_count", 0);
    sim.initialGrid(sim.field, "resources", 0);
    sim.initialGrid(sim.field, "eSpores", 0);

    sim.initialGrid(sim.field, "health", null);
    sim.initialGrid(sim.field, "plant", null);
    sim.initialGrid(sim.field, "plant_node", null);

    sim.initialGrid(sim.field, "food", 0);

    for (let x = 0; x < sim.config.ncol; x++) {
        for (let y = 0; y < sim.config.nrow; y++) {
            sim.field.grid[x][y].nodes = new Set([]);
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

        for (let g of ["k", "l", "m"]) {
            if (sim.rng.random() < 0.33) {
                coreGenes.push(new Gene(g, Gene.genes[g]));
            }
        }

        let genome = {
            core: coreGenes,
            acc: mobileGenes,
        };

        let colour = ["", "", ""];

        for (let gene of genome.core) {
            if (gene.name == "x") colour[0] = "x";
            if (gene.name == "y") colour[1] = "y";
            if (gene.name == "z") colour[2] = "z";
        }

        for (let gene of genome.acc) {
            if (gene.name == "x") colour[0] = "x";
            if (gene.name == "y") colour[1] = "y";
            if (gene.name == "z") colour[2] = "z";
        }

        colour = colour.join("");

        let fungus = new Fungus(
            pos,
            colour == "" ? "none" : colour,
            genome,
            200,
            sim.config.fungus_uptake,
            sim.config.fungus_upkeep
        );

        fungi.push(fungus);
        tips.push(...fungus.tips);
    }

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
                sim.config.plant_production,
                sim.config.plant_upkeep
            );

            plants.push(plant);
        }
    }

    let allFungi = fungi;
    let allPlants = plants;

    if (typeof window === "object") {
        setupDisplays(sim);
    }

    sim.field.update = () => {
        if (typeof window === "object") {
        }

        if (sim.time % (sim.config.year_len / 10) == 0) {
            if (typeof process === "object") {
                log(sim, plants, fungi);
            }

            if (typeof window === "object") {
                let fungiRes = [];

                for (let fungus of allFungi) {
                    fungiRes.push(fungus.resources.amount);
                }

                let coloursF = ["red"];

                for (let i = 0; i < allFungi.length - 1; i++) {
                    coloursF.push("grey");
                }

                sim.field.plotArray(
                    ["Amount"],
                    fungiRes,
                    coloursF,
                    "Fungi resources"
                );

                let plantRes = [];

                for (let plant of allPlants) {
                    plantRes.push(plant.resources.amount);
                }

                let coloursP = ["red"];

                for (let i = 0; i < allPlants.length - 1; i++) {
                    coloursP.push("grey");
                }

                sim.field.plotArray(
                    ["Amount"],
                    plantRes,
                    coloursP,
                    "Plants resources"
                );
            }
        }

        if (sim.time % sim.config.year_len == 0 && sim.time != 0) {
            let new_fungi = [];
            let new_tips = [];

            for (let x = 0; x < config.ncol; x++) {
                for (let y = 0; y < config.nrow; y++) {
                    sim.field.grid[x][y].colour = 0;
                    sim.field.grid[x][y].nodes = new Set([]);
                    sim.field.grid[x][y].node_count = 0;
                    sim.field.grid[x][y].resources = 0;
                    sim.field.grid[x][y].eSpores = 0;
                }
            }

            for (let fungus of fungi) {
                fungus.getContacts();
                for (let network of fungus.connectedTo) {
                    if (sim.rng.random() < sim.config.hgt_rate) {
                        [fungus.genome, network.genome] =
                            Genome.horizontalTransfer(
                                fungus.genome,
                                network.genome
                            );
                    }
                }

                let nSpores = Math.ceil(
                    (fungus.resources.amount * fungus.hypha.nodeCount) **
                        sim.config.sporulation_exponent
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
            }

            tips = new_tips;
            fungi = new_fungi;
            allFungi = fungi;
        }

        let new_fungi = [];
        let new_tips = [];

        tips = shuffle(tips, sim.rng);

        for (let tip of tips) {
            if (tip.grow()) {
                new_tips.push(tip);
            }

            if (sim.rng.random() < sim.config.branch_chance) {
                let branch_tip = tip.branch();

                if (branch_tip) new_tips.push(branch_tip);
            }
        }

        for (let fungus of fungi) {
            if (!fungus.vegetative()) {
                let temp = [];
                for (let tip of new_tips) {
                    if (!fungus.tips.find((t) => t.id === tip.id)) {
                        temp.push(tip);
                    }
                }

                new_tips = [...temp];
            } else {
                new_fungi.push(fungus);
            }
        }

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

            for (let p of positions) {
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
            }

            for (let x = 0; x < plantNcol; x++) {
                for (let y = 0; y < plantNrow; y++) {
                    if (newPlantGrid[y][x]) {
                        sim.plants.grid[x][y].plant = newPlantGrid[y][x];
                    } else {
                        sim.plants.grid[x][y].plant = null;
                    }
                }
            }

            allPlants = newPlants;
        } else {
            for (let plant of plants) {
                if (
                    plant.resources.amount < 0.1 ||
                    isNaN(plant.resources.amount)
                ) {
                    plant.die();
                } else {
                    plant.vegetative();
                    newPlants.push(plant);
                }
            }
        }

        plants = newPlants;
    };

    sim.start();
};

const log = (sim, plants, fungi) => {
    let fileName =
        "./output/" +
        `Seed_${sim.config.seed}_` +
        `mSeason_${sim.config.max_season}_` +
        `tilling_${sim.config.tilling}_` +
        `sporeExp_${sim.config.sporulation_exponent}_` +
        `uptake_${sim.config.fungus_uptake}_` +
        `phi_${sim.config.phi}_` +
        `mobile_${sim.config.mobile_ratio}_` +
        `parasite_${sim.config.parasite_ratio}_` +
        `hgt_${sim.config.hgt_rate}_` +
        `mode_${sim.config.hgt_mode}_` +
        `relocation_${sim.config.relocation_rate}_` +
        `sPlant_${sim.config.plant_scale}`;
    let plantOut = "";

    for (let p of plants) {
        let genome = "";
        for (let g of p.genome.core) {
            genome += g.name;
        }

        plantOut += `${p.id};${genome};${p.resources.amount}\t`;
    }

    sim.write_append(`${plantOut}\n`, `${fileName}_plants.txt`);

    let fungusOut = "";

    for (let f of fungi) {
        let genomeC = "";
        for (let g of f.genome.core) {
            genomeC += g.name;
        }

        let genomeA = "";
        for (let g of f.genome.acc) {
            genomeA += g.name;
        }

        let hosts = "";
        for (let host of f.hosts) {
            hosts += `${host.id},`;
        }

        hosts = hosts.substring(0, hosts.length - 1);

        fungusOut += `F:${f.id};C:${genomeC};A:${genomeA};R:${f.resources.amount};S:${f.hypha.nodeCount};H:${hosts}\t`;
    }

    sim.write_append(`${fungusOut}\n`, `${fileName}_fungi.txt`);
};

// Run the simulation
if (typeof process === "object") {
    let cmd_params = yargs(hideBin(process.argv)).argv;

    for (let arg in config) {
        if (typeof cmd_params[arg] != "undefined") {
            config[arg] = cmd_params[arg];
        }
    }

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
