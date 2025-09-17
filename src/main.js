import config from "./config.js";
import Fungus from "./fungus.js";
import Plant from "./plant.js";
import { sample, shuffle, Vector, fileIDGenerator } from "./util.js";
import { Gene, Genome } from "./genome.js";
import setupDisplays from "./displays.js";

/* import { makeIndex, log, writeGrids } from "./log.js";
import Simulation from "../node_modules/cacatoo/dist/cacatoo.js";
import yargs from "yargs";
import yargs_options from "./options.js";
import { hideBin } from "yargs/helpers"; */

// Configuration constant for the cacatoo simulation

export let sim;

let fileName = "";

// Declaration of the simulation
const fusarium = async (config) => {
    let tips = []; //Array of updated hypha tips
    let fungi = []; //Array of living fungi
    let plants = []; //Array of living plants

    config.maxtime = config.season_len * config.max_season + 1;
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

        let pathogenicity = sample(
            Object.keys(Gene.pathogenicity_genes).slice(0, 2)
        );

        let chromosomes = [
            [
                ...Object.keys(Gene.house_keeping_genes).map(
                    (key) => new Gene(key, Gene.genes[key])
                ),
            ],
        ];

        if (sim.rng.random() < sim.config.parasite_ratio) {
            if (sim.rng.random() < sim.config.mobile_ratio) {
                chromosomes.push([
                    new Gene(pathogenicity, Gene.genes[pathogenicity]),
                ]);
            } else {
                chromosomes[0].push(
                    new Gene(pathogenicity, Gene.genes[pathogenicity])
                );
            }
        }

        let fungus = new Fungus(
            pos,
            sim.rng.genrand_int(3, 15),
            new Genome(chromosomes),
            200,
            sim.config.fungus_uptake,
            sim.config.fungus_upkeep
        );

        fungi.push(fungus);
        tips.push(...fungus.tips);
    }

    let plantNcol = Math.floor(sim.config.ncol / sim.config.plant_scale);
    let plantNrow = Math.floor(sim.config.nrow / sim.config.plant_scale);

    let toggle_plant_genes = false;

    for (let x = 0; x < plantNcol; x++) {
        for (let y = 0; y < plantNrow; y++) {
            let chr = [];

            for (let i = 1; i <= 3; i++) {
                let gene = `r${i + toggle_plant_genes * 3}`;

                chr.push(gene);
            }

            let plant = new Plant(
                { x, y },
                sim.rng.genrand_int(1000, 4000),
                chr.map((g) => new Gene(g, Gene.genes[g])),
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
        if (sim.time % (sim.config.season_len / 10) == 0) {
            if (typeof process === "object") {
                log(sim, plants, fungi, fileName);

                if (
                    sim.time ===
                    sim.config.max_season * sim.config.season_len
                ) {
                    writeGrids(sim, fileName);
                }
            }

            if (typeof window === "object") {
                if (sim.time % sim.config.season_len == 0) {
                    sim.field.resetPlots();
                }

                let fungiRes = [];

                for (let fungus of allFungi) {
                    fungiRes.push(fungus.resources.amount);
                }

                sim.field.plotArray(
                    ["Amount"],
                    fungiRes,
                    new Array(allFungi.length).fill("grey"),
                    "Fungi resources",
                    {
                        showLabelsOnHighlight: false,
                        highlightSeriesOpts: {
                            strokeWidth: 5,
                            strokeBorderWidth: 1,
                            highlightCircleSize: 1,
                        },
                    }
                );

                let plantRes = [];

                for (let plant of allPlants) {
                    plantRes.push(plant.resources.amount);
                }

                sim.field.plotArray(
                    ["Amount"],
                    plantRes,
                    new Array(allPlants.length).fill("grey"),
                    "Plants resources",
                    {
                        showLabelsOnHighlight: false,
                        highlightSeriesOpts: {
                            strokeWidth: 5,
                            strokeBorderWidth: 1,
                            highlightCircleSize: 1,
                        },
                    }
                );
            }
        }

        if (sim.time % sim.config.season_len == 0 && sim.time != 0) {
            let new_fungi = [];
            let new_tips = [];

            
            for (let x = 0; x < sim.field.nc; x++) {
                for (let y = 0; y < sim.field.nr; y++) {
                    sim.field.grid[x][y].colour = 0;
                    sim.field.grid[x][y].nodes = new Set([]);
                    sim.field.grid[x][y].node_count = 0;
                    sim.field.grid[x][y].resources = 0;
                    sim.field.grid[x][y].eSpores = 0;
                    sim.field.grid[x][y].plant = null;
                    sim.field.grid[x][y].plant_node = null;
                    sim.field.grid[x][y].health = 0;
                    sim.field.grid[x][y].food = 0;
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

                let nSpores = Math.floor(
                    fungus.hypha.nodeCount ** sim.config.sporogenic_exponent
                );

                

                for (let i = 0; i < nSpores; i++) {
                    let sporePos;

                    if (sim.config.tilling) {
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

                if (
                    sim.config.resources_display ||
                    sim.config.expected_spores_display
                )
                    for (let node of fungus.hypha.preOrderTraversal()) {
                        let pos = Vector.floored(node.pos);

                        sim.field.grid[pos.x][pos.y].resources = 0;

                        sim.field.grid[pos.x][pos.y].eSpores = 0;
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

        if (sim.time % sim.config.season_len == 0 && sim.time != 0) {
            if (
                sim.time %
                    (sim.config.crop_rotation_period * sim.config.season_len) ==
                0
            ) {
                toggle_plant_genes = !toggle_plant_genes;
            }

            for (let x = 0; x < sim.plants.nc; x++) {
                for (let y = 0; y < sim.plants.nr; y++) {
                    let chr = [];

                    for (let i = 1; i <= 3; i++) {
                        let gene = `r${i + toggle_plant_genes * 3}`;

                        chr.push(gene);
                    }

                    let plant = new Plant(
                        { x, y },
                        sim.rng.genrand_int(1000, 4000),
                        chr.map((g) => new Gene(g, Gene.genes[g])),
                        sim.config.plant_production,
                        sim.config.plant_upkeep
                    );

                    newPlants.push(plant);
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
    sim.addButton("Toggle", function () {
        sim.toggle_play();
    });

    if (typeof process == "object") {
        const fileID = fileIDGenerator();

        fileName = await makeIndex(sim, fileID);

        sim.start();
    } else {
        sim.start();
    }
};

// Run the simulation
if (typeof process === "object") {
    let cmd_params = yargs()
        .options(yargs_options)
        .parse(hideBin(process.argv));

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
