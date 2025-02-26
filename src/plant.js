import { genID } from "./util.js"
import { sim } from "./main.js";

const idGenerator = genID();

export default class Plant{
    constructor(x, y, health){
        this.id = idGenerator.next().value;
        this.health = health;
        this.x = x;
        this.y = y;
        this.xRange = [x * sim.config.plant_scale, (x+1) * sim.config.plant_scale];
        this.yRange = [y * sim.config.plant_scale, (y+1) * sim.config.plant_scale];
    }


}