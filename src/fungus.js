import { fungalNode, Tip } from "./fungalNode.js";
import { clamp, idGenerator, Vector } from "./util.js";
import { sim } from "./main.js";
import { Tree } from "./tree.js";
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
        this.cells = new Set([]);
        this.hypha = this.placeHypha(pos);
        this.hosts = new Set([]);
        this.connectedTo = new Set([]);
    }

    placeHypha(pos) {
        let hypha = new Tree(new fungalNode(pos, this));

        let tip = new Tip(pos, this);

        hypha.root.addChild(tip);
        this.tips.push(tip);

        sim.field.grid[pos.x][pos.y].nodes.add(hypha.root);
        sim.field.grid[pos.x][pos.y].node_count += 1;
        sim.field.grid[pos.x][pos.y].colour = this.colour;
        return hypha;
    }

    vegetative() {
        for (let cell of this.cells) {
            let pos = cell.pos;
            let gridPoint = sim.field.grid[pos.x][pos.y];

            if (gridPoint.food == 0) {
                this.cells.delete(cell);
                continue;
            }

            this.resources.amount += this.resources.uptake;

            let plant = gridPoint.plant;

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

        this.resources.amount -= this.hypha.nodeCount * this.resources.upkeep;

        if (
            typeof window === "object" &&
            sim.time % sim.config.display_refresh == 0
        ) {
            for (let node of this.hypha.preOrderTraversal()) {
                let pos = Vector.floored(node.pos);
                if (sim.config.resources_display) {
                    sim.field.grid[pos.x][pos.y].resources =
                        this.resources.amount /
                        sim.config.resources_display_unit;
                }

                if (sim.config.expected_spores_display) {
                    sim.field.grid[pos.x][pos.y].eSpores =
                        (this.resources.amount * this.hypha.nodeCount) ** sim.config.sporulation_exponent
                }
            }
        }

        return this.resources.amount > 0;
    }

    getContacts() {
        for (let node of this.hypha.preOrderTraversal()) {
            let pos = Vector.floored(node.pos);

            for (let node of sim.field.grid[pos.x][pos.y].nodes) {
                if (node.fungus.id != this.id) {
                    this.connectedTo.add(node.fungus);
                    node.fungus.connectedTo.add(this);
                }
            }
        }
    }

    getSpore(pos, nSpores) {
        let newGenome = new Genome([...this.genome.core], [...this.genome.acc]);

        newGenome.core = Genome.geneLoss(newGenome.core);
        newGenome.core = Genome.geneGain(newGenome.core);

        if (newGenome.acc.length > 0) {
            newGenome.acc = Genome.geneLoss(newGenome.acc);
            newGenome.acc = Genome.geneGain(newGenome.acc);

            [newGenome.core, newGenome.acc] = Genome.cutNPaste(
                newGenome.core,
                newGenome.acc
            );
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

        colour = colour.join("");

        if (!newGenome.hasGenes("a", "b", "c")) {
            return false;
        }

        let spore = new Fungus(
            Vector.floored(pos),
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
