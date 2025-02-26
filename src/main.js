import Fungus from "./fungus.js";
import Plant from "./plant.js";

// Configuration constant for the cacatoo simulation
const config = {
    title: "Fusarium",
    description: "",
    maxtime: 1000000,
    ncol: 600,
    nrow: 600,
    wrap: [true, true],
    scale: 1,
    skip: 10,
    statecolours: {
        colour: "random",
    },
    spores: 10, //Number of starting spores
    spore_ratio: 0.001,
    sporulation_rate: 0.2,
    num_colours: 30,
    year_len: 1000,
    branch_chance: 0.5,
    plant_scale: 40,
    colonisation_chance: 0.1,
    tilling: true,
};

// Run the simulation
document.addEventListener(
    "DOMContentLoaded",
    () => {
        fusarium(config);
    },
    false
);

export let sim;

// Declaration of the simulation
const fusarium = (config) => {
    let tips = []; //Array of updated hypha tips
    let fungi = []; //Array of living fungi
    let plants = [];

    sim = new Simulation(config);
    sim.makeGridmodel("fusoxy");

    let plantsModel = new Gridmodel(
        "plants",
        {
            ...config,
            ncol: Math.floor(config.ncol / config.plant_scale),
            nrow: Math.floor(config.nrow / config.plant_scale),
            scale: config.plant_scale * config.scale,
        },
        sim.rng
    );
    sim["plants"] = plantsModel;
    sim.gridmodels.push(plantsModel);

    sim.initialGrid(sim.fusoxy, "fungus", null);
    sim.initialGrid(sim.fusoxy, "colour", 0);
    sim.initialGrid(sim.plants, "health", null);
    sim.initialGrid(sim.plants, "plant", null);

    for (let i = 0; i < config.spores; i++) {
        let x = sim.rng.genrand_int(0, config.ncol - 1);
        let y = sim.rng.genrand_int(0, config.nrow - 1);

        //let fungus = new Fungus(sim.rng.genrand_int(0, config.num_colours));
        let fungus = new Fungus(sim.rng.genrand_int(0, config.num_colours));
        fungi.push(fungus);

        let tip = fungus.addTip(x, y, sim.rng.random() * 2 * Math.PI);
        tips.push(tip);

        sim.fusoxy.grid[x][y].fungus = fungus;
        sim.fusoxy.grid[x][y].colour = fungus.colour;
    }

    sim.createDisplay("fusoxy", "colour", "Fusarium oxysporum mycelium");

    for (let x = 0; x < Math.floor(config.ncol / config.plant_scale); x++) {
        for (let y = 0; y < Math.floor(config.nrow / config.plant_scale); y++) {
            if (x % 3 == 1 && y % 3 == 1) {
                let plant = new Plant(x, y, 5);

                plants.push(plant);
                sim.plants.grid[x][y].health = plant.health;
                sim.plants.grid[x][y].plant = plant.id;
            }
        }
    }

    sim.plants.colourGradient(
        "health",
        100,
        [0, 0, 0],
        [120, 90, 10],
        [50, 170, 80]
    );
    sim.createDisplay_continuous({
        model: "plants",
        property: "health",
        //drawdots: true,
        //radius: 5,
        label: "Field of plants",
        minval: 0,
        nticks: 10,
        maxval: 5,
    });

    sim.fusoxy.update = () => {
        if (sim.time % config.year_len == 0 && sim.time != 0) {
            let new_fungi = [];
            let new_tips = [];

            for (let x = 0; x < config.ncol; x++) {
                for (let y = 0; y < config.nrow; y++) {
                    sim.fusoxy.grid[x][y].fungus = null;
                    sim.fusoxy.grid[x][y].colour = 0;
                }
            }

            fungi.forEach((fungus) => {
                let nSpores = Math.floor(
                    fungus.hypha.length * config.spore_ratio
                );

                for (let i = 0; i < nSpores; i++) {
                    if (sim.rng.random() > config.sporulation_rate) continue;

                    /* let newFungus = new Fungus(
                        sim.rng.genrand_int(0, config.num_colours)
                    ); */

                    let newFungus = new Fungus(fungus.colour);
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

        let new_tips = [];
        tips = shuffle(tips, sim.rng);

        tips.forEach((tip) => {
            if (tip.grow(sim.fusoxy)) {
                new_tips.push(tip);
            }
        });

        fungi.forEach((fungus) => {
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

        tips = new_tips;
    };

    sim.plants.update = () => {
        plants.forEach((plant) => {
            let parasites = 0;

            for (let x = plant.xRange[0]; x < plant.xRange[1]; x++) {
                for (let y = plant.yRange[0]; y < plant.yRange[1]; y++) {
                    if (sim.fusoxy.grid[x][y].fungus) {
                        parasites += 1;
                    }
                }
            }

            plant.health = Math.floor(
                (5 * ((config.plant_scale ^ 2) - parasites)) /
                    (config.plant_scale ^ 2)
            );

            sim.plants.grid[plant.x][plant.y].health = plant.health;
        });
    };

    sim.start();
};
