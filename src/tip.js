import { sample, isInBounds, wrap } from "./util.js";
import { sim } from "./main.js";

export default class Tip {
    constructor(x, y, direction, parent) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.direction = direction;
        this.vectors = this.getMovementVectors(this.direction);
    }

    getMovementVectors(direction) {
        const AXIS_VECTORS = {
            0: { x: 1, y: 0 },
            [Math.PI / 2]: { x: 0, y: 1 },
            [Math.PI]: { x: -1, y: 0 },
            [(3 * Math.PI) / 2]: { x: 0, y: -1 },
        };

        let v1 = AXIS_VECTORS[0];
        let v2 = AXIS_VECTORS[0];

        let angle1 = direction;
        let angle2 = 2 * Math.PI - direction;

        for (let i = 0; i < 2 * Math.PI; i += Math.PI / 2) {
            if (direction > i) {
                v1 = AXIS_VECTORS[i];
                angle1 = direction - i;
            } else {
                v2 = AXIS_VECTORS[i];
                angle2 = i - direction;
                break;
            }
        }

        return [
            { x: v1.x, y: v1.y, prob: angle1 / (angle1 + angle2) },
            { x: v2.x, y: v2.y, prob: angle2 / (angle1 + angle2) },
        ];
    }

    grow(model) {
        let step;

        let vectors = this.vectors
            .filter((v) => {
                return isInBounds({ x: this.x + v.x, y: this.y + v.y });
            })
            .filter((v) => {
                let vec = wrap({ x: this.x + v.x, y: this.y + v.y });

                let plantVec = {
                    x: Math.floor(vec.x / sim.config.plant_scale),
                    y: Math.floor(vec.y / sim.config.plant_scale),
                };

                if (sim.plants.grid[plantVec.x][plantVec.y].plant) {
                    if (
                        !this.parent.hosts.find((host) => {
                            host ==
                                sim.plants.grid[plantVec.x][plantVec.y].plant;
                        })
                    ) {
                        if (sim.rng.random() < sim.config.colonisation_chance) {
                            this.parent.hosts.push(sim.plants.grid[plantVec.x][plantVec.y].plant)
                        } else {
                            return false
                        }
                    }
                }

                return !model.grid[vec.x][vec.y].fungus;
            });

        switch (vectors.length) {
            case 1:
                step = vectors[0];
                break;
            case 2:
                step = sample(
                    vectors,
                    vectors.map((v) => v.prob)
                );
                break;
            default:
                return false;
        }

        let nextPos = wrap({ x: this.x + step.x, y: this.y + step.y });

        this.x = nextPos.x;
        this.y = nextPos.y;

        this.parent.hypha.push([this.x, this.y]);
        model.grid[this.x][this.y].fungus = this.parent;
        model.grid[this.x][this.y].colour = this.parent.colour;

        return true;
    }
}
