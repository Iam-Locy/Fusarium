import Plant from "./plant.js";
import { Gene } from "./genome.js";
import { sample, shuffle, Vector } from "./util.js";

const agriculture = (sim) => {
    for (let x = 0; x < sim.field.nc; x++) {
        for (let y = 0; y < sim.field.nr; y++) {
            sim.field.grid[x][y].plant = null;
            sim.field.grid[x][y].plant_node = null;
            sim.field.grid[x][y].health = 0;
            sim.field.grid[x][y].food = 0;
        }
    }

    let plant_genes_shift =
        Math.floor(
            sim.time / (sim.config.crop_rotation_period * sim.config.season_len)
        ) %
            2 !=
        0;

    let newGeneration = [];

    for (let x = 0; x < sim.plants.nc; x++) {
        for (let y = 0; y < sim.plants.nr; y++) {
            let chr = [];

            for (let i = 1; i <= 3; i++) {
                let gene = `r${i + plant_genes_shift * 3}`;

                chr.push(gene);
            }

            let plant = new Plant(
                { x, y },
                sim.rng.genrand_int(1000, 4000),
                chr.map((g) => new Gene(g, Gene.genes[g])),
                sim.config.plant_production,
                sim.config.plant_upkeep
            );

            newGeneration.push(plant);
        }
    }

    return newGeneration;
};

const nature = (sim) => {
    let newGeneration = [];
    let positions = [];

    for (let x = 0; x < sim.plants.nc; x++) {
        for (let y = 0; y < sim.plants.nr; y++) {
            positions.push(new Vector(x, y));
        }
    }

    positions = shuffle(positions);

    for (let pos of positions) {
        if (sim.plants.grid[pos.x][pos.y].plant) {
            newGeneration.push(sim.plants.grid[pos.x][pos.y].plant);
        } else {
            let neighs = sim.plants
                .getNeighbours8(sim.plants, pos.x, pos.y)
                .map((n) => {
                    return n.plant;
                });

            let neigh = sample(neighs);

            if (neigh) {
                newGeneration.push(
                    new Plant(
                        pos,
                        1000,
                        neigh.genome.karyotype[0],
                        sim.config.plant_production,
                        sim.config.plant_upkeep
                    )
                );
            }
        }
    }

    return newGeneration;
};

export const random = (sim) => {
    sim.field.grid[x][y].plant = null;
    sim.field.grid[x][y].plant_node = null;
    sim.field.grid[x][y].health = 0;
    sim.field.grid[x][y].food = 0;

    let newGeneration = [];

    for (let x = 0; x < sim.plants.nc; x++) {
        for (let y = 0; y < sim.plants.nr; y++) {
            let chr = [];

            for (let i = 1; i <= 3; i++) {
                let gene = `r${sim.rng.genrand_int(1, 6)}`;

                chr.push(gene);
            }

            let plant = new Plant(
                { x, y },
                sim.rng.genrand_int(1000, 4000),
                chr.map((g) => new Gene(g, Gene.genes[g])),
                sim.config.plant_production,
                sim.config.plant_upkeep
            );

            newGeneration.push(plant);
        }
    }

    return newGeneration;
};

export default {
    agriculture,
    nature,
    random,
};
