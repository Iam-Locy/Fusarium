import { idGenerator } from "./util.js";
import { sim } from "./main.js";

const genID = idGenerator();

export default class Plant {
    constructor(x, y, resource, genome, production, upkeep) {
        this.id = genID.next().value;
        this.x = x;
        this.y = y;
        this.xRange = [
            x * sim.config.plant_scale,
            (x + 1) * sim.config.plant_scale - 1,
        ];
        this.yRange = [
            y * sim.config.plant_scale,
            (y + 1) * sim.config.plant_scale - 1,
        ];
        this.genome = genome;
        this.resource = resource;
        this.production = production;
        this.upkeep = upkeep;
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
        this.resource = 0
        sim.plants.grid[this.x][this.y].plant = null;
        sim.field.grid[2 * this.x + 1][2 * this.y + 1].plant = null;
        sim.field.grid[2 * this.x + 1][2 * this.y + 1].health = 0;
        sim.field.grid[2 * this.x + 1][2 * this.y + 1].pColour = null;
    }
}
