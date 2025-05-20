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
    let outVector = { x: vector.x, y: vector.y };

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

export function shuffle(array){ 
    for (let i = array.length - 1; i > 0; i--) { 
      const j = Math.floor(sim.rng.random() * (i + 1)); 
      [array[i], array[j]] = [array[j], array[i]]; 
    } 
    return array; 
}; 