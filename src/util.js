import { sim } from "./main.js";

export function* idGenerator() {
    let index = 1;
    while (true) {
        yield index++;
    }
}

export function sample(arr, probs = null) {
    probs = probs ? probs : new Array(arr.length).fill(1 / arr.length);
    let cdf = probs.map(
        (
            (sum) => (value) =>
                (sum += value)
        )(0)
    );

    let r = sim.rng.random();

    return arr[cdf.findIndex((el) => r <= el)];
}

export function isInBounds(vector) {
    if ((vector.x < 0 || vector.x >= sim.config.ncol) && !sim.config.wrap[0]) {
        return false;
    }

    if ((vector.y < 0 || vector.y >= sim.config.nrow) && !sim.config.wrap[1]) {
        return false;
    }

    return true;
}

export function clamp(min, max, val) {
    if (min > val) {
        return min;
    }

    if (max < val) {
        return max;
    }

    return val;
}

export function wrap(vector) {
    let outVector = new Vector(vector.x, vector.y);

    if (vector.x < 0) {
        outVector.x = sim.config.wrap[0] ? sim.config.ncol + vector.x : 0;
    }

    if (vector.x >= sim.config.ncol) {
        outVector.x = sim.config.wrap[0]
            ? 0 + (vector.x - sim.config.ncol)
            : sim.config.ncol - 1;
    }

    if (vector.y < 0) {
        outVector.y = sim.config.wrap[1] ? sim.config.nrow + vector.y : 0;
    }

    if (vector.y >= sim.config.nrow) {
        outVector.y = sim.config.wrap[1]
            ? 0 + (vector.y - sim.config.nrow)
            : sim.config.nrow - 1;
    }

    return outVector;
}

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(sim.rng.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

//This is a modified version of Xiaolin Wu's Line Algorithm
export function drawLine(model, props, values, start, end) {
    if (!Array.isArray(props)) {
        props = [props];
    }

    if (!Array.isArray(values)) {
        values = [values];
    }

    start = new Vector(Math.round(start.x), Math.round(start.y));

    end = new Vector(Math.round(end.x), Math.round(end.y));

    if (Math.abs(end.y - start.y) < Math.abs(end.x - start.x)) {
        if (end.x < start.x) {
            let temp = start;
            start = end;
            end = temp;
        }

        let vector = new Vector(end.x - start.x, end.y - start.y);
        let m = vector.x !== 0 ? vector.y / vector.x : 1;

        for (let i = 0; i < Math.floor(vector.x) + 1; i++) {
            let x = start.x + i;
            let y = start.y + i * m;

            let ivec1 = wrap(new Vector(Math.floor(x), Math.floor(y)));
            let ivec2 = wrap(new Vector(ivec1.x, ivec1.y + 1));

            let cell1 = model.grid[ivec1.x][ivec1.y];
            let cell2 = model.grid[ivec2.x][ivec2.y];

            for (let p = 0; p < props.length; p++) {
                if (cell1[props[p]] instanceof Set) {
                    cell1[props[p]].add(values[p]);
                    cell2[props[p]].add(values[p]);
                } else {
                    cell1[props[p]] = values[p];
                    cell2[props[p]] = values[p];
                }
            }
        }
    } else {
        if (end.y < start.y) {
            let temp = start;
            start = end;
            end = temp;
        }

        let vector = { x: end.x - start.x, y: end.y - start.y };
        let m = vector.y !== 0 ? vector.x / vector.y : 1;

        for (let i = 0; i < Math.floor(vector.y) + 1; i++) {
            let x = start.x + i * m;
            let y = start.y + i;

            let ivec1 = wrap(new Vector(Math.floor(x), Math.floor(y)));

            let ivec2 = wrap(new Vector(ivec1.x + 1, ivec1.y));

            let cell1 = model.grid[ivec1.x][ivec1.y];
            let cell2 = model.grid[ivec2.x][ivec2.y];

            for (let p = 0; p < props.length; p++) {
                if (cell1[props[p]] instanceof Set) {
                    cell1[props[p]].add(values[p]);
                    cell2[props[p]].add(values[p]);
                } else {
                    cell1[props[p]] = values[p];
                    cell2[props[p]] = values[p];
                }
            }
        }
    }
}

export function drawSpot(model, props, values, r, pos) {
    if (!Array.isArray(props)) {
        props = [props];
    }

    if (!Array.isArray(values)) {
        values = [values];
    }

    let x = 0; //We start from
    let y = -r; //the highest point on the circle

    //p shows whether we are inside or outside of the circle.
    //y+0.5 is the y coordinate of the vertical midpoint between 2 pixels.
    //p = x^2 + (y+0.5)^2 - r^2 = 0^2 + (-r+0.5)^2 - r^2
    let p = -r + 0.25;

    while (x < -y) {
        if (p > 0) {
            y++; //The midpoint is outside of the circle ==> we take a step down.

            //delta_p = p_next - p
            //p_next  = (x+1)^2 + (y+0.5)^2 - r^2 and y is already increased
            //so we have to use the previous midpoint: y-0.5.
            //delta_p = (x+1)^2 + (y+0.5)^2 - r^2 - x^2 - (y-0.5)^2 + r^2
            //delta_p = (x+1)^2 + (y+0.5)^2 - x^2 - (y-0.5)^2 = 2(x+y) + 1
            p += 2 * (x + y) + 1;
        } else {
            //delta_p = p_next - p
            //p_next  = (x+1)^2 + (y+0.5)^2 - r^2
            //delta_p = (x+1)^2 + (y+0.5)^2 - r^2 - x^2 - (y+0.5)^2 + r^2
            //delta_p = (x+1)^2 - x^2 = 2x + 1
            p += 2 * x + 1;
        }

        for (let i = 0; i < props.length; i++) {
            let cell = model.grid[pos.x + delta][pos.y + y];

            if (cell[props[i]] instanceof Set) {
                for (let delta = -x; delta <= x; delta++) {
                    model.grid[pos.x + delta][pos.y + y][props[i]].add(
                        values[i]
                    );
                    model.grid[pos.x + delta][pos.y - y][props[i]].add(
                        values[i]
                    );
                }

                for (let delta = -y; delta >= y; delta--) {
                    model.grid[pos.x + delta][pos.y + x][props[i]].add(
                        values[i]
                    );
                    model.grid[pos.x + delta][pos.y - x][props[i]].add(
                        values[i]
                    );
                }
            } else {
                for (let delta = -x; delta <= x; delta++) {
                    model.grid[pos.x + delta][pos.y + y][props[i]] = values[i];
                    model.grid[pos.x + delta][pos.y - y][props[i]] = values[i];
                }

                for (let delta = -y; delta >= y; delta--) {
                    model.grid[pos.x + delta][pos.y + x][props[i]] = values[i];
                    model.grid[pos.x + delta][pos.y - x][props[i]] = values[i];
                }
            }
        }

        x++;
    }
}

export class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isInBounds = isInBounds(this);
    }

    static rounded(vector) {
        let x = Math.round(vector.x);
        let y = Math.round(vector.y);

        return new Vector(x, y);
    }

    static add(vec1, vec2) {
        return new Vector(vec1.x + vec2.x, vec1.y + vec2.y);
    }

    static substract(vec1, vec2) {
        return new Vector(vec1.x - vec2.x, vec1.y - vec2.y);
    }

    static multiply(vec, num) {
        return new Vector(vec.x * num, vec.y * num);
    }
}
