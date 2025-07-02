import Tip from "./tip.js";
import { clamp, drawSpot, idGenerator, sample, Vector, wrap } from "./util.js";
import { sim } from "./main.js";
import { Node, Tree } from "./tree.js";
import { Genome } from "./genome.js";

const genID = idGenerator();

export default class Fungus {
    constructor(pos, colour, genes, resource, uptake, upkeep) {
        this.id = genID.next().value;
        this.colour = colour;
        this.genome = new Genome(genes.core, genes.acc);
        this.resources = {
            amount: resource,
            uptake: uptake,
            upkeep: upkeep,
        };
        this.tips = [];
        this.hypha = this.placeHypha(pos);
        this.cells = new Set([]);
        this.hosts = new Set([]);
        this.connectedTo = new Set([]);
    }

    placeHypha(pos) {
        let hypha = new Tree(new Node(pos));

        let tip = new Tip(pos, this);

        hypha.root.addChild(tip);
        this.tips.push(tip);

        sim.field.grid[pos.x][pos.y].fungi.add(this);
        sim.field.grid[pos.x][pos.y].filaments += 1;
        sim.field.grid[pos.x][pos.y].colour = this.colour;

        return hypha;
    }

    vegetative() {
        for (let node of this.hypha.preOrderTraversal()) {
            let pos = Vector.floored(node.pos);

            this.resources.amount +=
                this.resources.uptake * sim.field.grid[pos.x][pos.y].food;
            this.resources.amount -= this.resources.upkeep;

            let plant = sim.field.grid[pos.x][pos.y].plant;

            if (plant) {
                if (this.hosts.has(plant)) {
                    this.resources.amount += clamp(
                        0,
                        plant.resources.amount,
                        this.resources.uptake * sim.config.phi
                    );
                    plant.resources.amount -= clamp(
                        0,
                        plant.resources.amount,
                        this.resources.uptake * sim.config.phi
                    );
                }
            }
        }

        for (let cell of this.cells) {
            cell.resources = this.resources.amount / 1000;
            cell.eSpores = Math.ceil(
                (this.resources.amount * this.hypha.nodeCount) ** (1 / 3) *
                    sim.config.spore_ratio
            );
        }

        return this.resources.amount > 0;
    }

    getContacts() {
        for (let node of this.hypha.preOrderTraversal()) {
            let pos = Vector.rounded(node.pos);

            for (let fungus of sim.field.grid[pos.x][pos.y].fungi) {
                if (fungus.id != this.id) {
                    this.connectedTo.add(fungus);
                    fungus.connectedTo.add(this);
                }
            }
        }
    }

    getSpore(pos, nSpores) {
        let newGenome = new Genome([...this.genome.core], [...this.genome.acc]);

        newGenome.core = Genome.geneLoss(newGenome.core);
        newGenome.core = Genome.geneGain(newGenome.core);

        if (newGenome.acc.length > 0) {
            [newGenome.core, newGenome.acc] = Genome.cutNPaste(
                newGenome.core,
                newGenome.acc
            )[(newGenome.acc, newGenome.core)] = Genome.cutNPaste(
                newGenome.acc,
                newGenome.core
            );
            newGenome.acc = Genome.geneLoss(newGenome.acc);
            newGenome.acc = Genome.geneGain(newGenome.acc);
        }

        let colour = ["", "", ""];

        for (let gene of newGenome.core) {
            if (gene.name == "x") colour[0] = "x";
            if (gene.name == "y") colour[1] = "y";
            if (gene.name == "z") colour[2] = "z";
        }

        for (let gene of newGenome.acc) {
            if (gene.name == "x") colour[0] = "x";
            if (gene.name == "y") colour[1] = "y";
            if (gene.name == "z") colour[2] = "z";
        }

        //console.log(newGenome.core.a, "after")

        colour = colour.join("");

        if (!newGenome.hasGenes("a", "b", "c")) {
            return false;
        }

        let spore = new Fungus(
            pos,
            colour == "" ? "none" : colour,
            newGenome,
            clamp(0, 200, this.resources.amount / nSpores),
            this.resources.uptake,
            this.resources.upkeep
        );

        return spore;
    }
}

const NEIGHBOUR_VECTORS = [
    { x: 0, y: 1, rotation: Math.PI / 2 },
    { x: -1, y: 0, rotation: Math.PI },
    { x: 1, y: 0, rotation: 0 },
    { x: 0, y: -1, rotation: (3 * Math.PI) / 2 },
];
