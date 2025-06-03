import Tip from "./tip.js";
import { idGenerator, sample, wrap } from "./util.js";
import { sim } from "./main.js";
import { Node, Tree } from "./tree.js";
import { Genome } from "./genome.js";

const genID = idGenerator();

export default class Fungus {
    constructor(pos, colour, genes, resource, uptake, upkeep) {
        this.id = genID.next().value;
        this.colour = colour;
        this.genome = new Genome(genes.core, genes.mobile);
        this.resources = {
            amount: resource,
            uptake: uptake,
            upkeep: upkeep,
        };
        this.tips = [];
        this.hypha = this.placeHypha(pos);
        this.hosts = [];
        this.connectedTo = [];
    }

    placeHypha(pos) {
        let hypha = new Tree(new Node(pos));

        let tip = new Tip(pos, this);

        hypha.root.addChild(tip);
        this.tips.push(tip);

        return hypha;
    }

    vegetative() {
        return true;
    }

    getSpore(nSpores) {
        let newGenome = {
            core: { ...this.genome.core },
            mobile: { ...this.genome.mobile },
        };

        this.geneLoss(newGenome.core);
        this.geneGain(newGenome.core);

        if (Object.keys(this.genome.mobile).length > 0) {
            this.cutNpaste(newGenome.core, newGenome.mobile);
            this.cutNpaste(newGenome.mobile, newGenome.core);
            this.geneLoss(newGenome.mobile);
            this.geneGain(newGenome.mobile);
        }

        // #console.log(newGenome.core.a)
        if (
            newGenome.core.a === undefined &&
            newGenome.mobile.a === undefined
        ) {
            return false;
        }

        if (
            newGenome.core.b === undefined &&
            newGenome.mobile.b === undefined
        ) {
            return false;
        }

        if (
            newGenome.core.c === undefined &&
            newGenome.mobile.c === undefined
        ) {
            return false;
        }

        let colour = ["", "", ""];

        Object.keys(newGenome.core).forEach((gene) => {
            if (gene == "x") colour[0] = "x";
            if (gene == "y") colour[1] = "y";
            if (gene == "z") colour[2] = "z";
        });

        Object.keys(newGenome.mobile).forEach((gene) => {
            if (gene == "x") colour[0] = "x";
            if (gene == "y") colour[1] = "y";
            if (gene == "z") colour[2] = "z";
        });

        //console.log(newGenome.core.a, "after")

        colour = colour.join("");

        let spore = new Fungus(
            colour == "" ? "none" : colour,
            newGenome,
            1000,
            this.uptake,
            this.upkeep,
            this.id
        );

        //console.log(spore.genome)
        return spore;
    }

    cutNpaste(chr1, chr2) {
        Object.keys(chr1).forEach((gene) => {
            if (sim.rng.random() < 0.01) {
                chr2[gene] = chr1[gene];
                delete chr1[gene];
            }
        });
    }

    geneLoss(chr) {
        Object.keys(chr).forEach((gene) => {
            if (sim.rng.random() < sim.config.loss_rate) {
                delete chr[gene];
            }
        });
    }

    geneGain(chr) {
        const genes = {
            a: "hc",
            b: "hc",
            c: "hc",
            x: "toxin",
            y: "toxin",
            z: "toxin",
            k: "junk",
            l: "junk",
            m: "junk",
        };

        Object.keys(genes).forEach((gene) => {
            if (sim.rng.random() < sim.config.gain_rate) {
                chr[gene] = genes[gene];
            }
        });
    }

    hgt(network) {
        if (Object.keys(this.genome.mobile).length == 0) return;

        Object.keys(network.genome.mobile).forEach((gene) => {
            if (!gene in this.genome.mobile) {
                this.genome.mobile[gene] = network.genome.mobile[gene];
            }
        });

        let colour = ["", "", ""];

        Object.keys(this.genome.core).forEach((gene) => {
            if (gene == "x") colour[0] = "x";
            if (gene == "y") colour[1] = "y";
            if (gene == "z") colour[2] = "z";
        });

        Object.keys(this.genome.mobile).forEach((gene) => {
            if (gene == "x") colour[0] = "x";
            if (gene == "y") colour[1] = "y";
            if (gene == "z") colour[2] = "z";
        });

        colour = colour.join("");

        this.colour = colour == "" ? "none" : colour;
    }
}

const NEIGHBOUR_VECTORS = [
    { x: 0, y: 1, rotation: Math.PI / 2 },
    { x: -1, y: 0, rotation: Math.PI },
    { x: 1, y: 0, rotation: 0 },
    { x: 0, y: -1, rotation: (3 * Math.PI) / 2 },
];
