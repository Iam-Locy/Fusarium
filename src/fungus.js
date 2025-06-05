import Tip from "./tip.js";
import { idGenerator, sample, wrap } from "./util.js";
import { sim } from "./main.js";
import { Node, Tree } from "./tree.js";
import { Genome } from "./genome.js";
import { Gene } from "./genome.js";

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
}

const NEIGHBOUR_VECTORS = [
    { x: 0, y: 1, rotation: Math.PI / 2 },
    { x: -1, y: 0, rotation: Math.PI },
    { x: 1, y: 0, rotation: 0 },
    { x: 0, y: -1, rotation: (3 * Math.PI) / 2 },
];
