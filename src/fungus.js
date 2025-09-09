import { fungalNode, Tip } from "./fungalNode.js";
import { clamp, deepCopyArray, idGenerator, Vector } from "./util.js";
import { sim } from "./main.js";
import { Tree } from "./tree.js";
import { Genome, Gene } from "./genome.js";

const genID = idGenerator();

export default class Fungus {
    constructor(pos, colour, genome, resource, uptake, upkeep) {
        this.id = genID.next().value;
        this.colour = colour;
        this.genome = genome;
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

        let virulence_gene_count = 0;

        for (let chromosome of this.genome.karyotype) {
            for (let gene of chromosome) {
                if (gene.type == "pathogenicity") {
                    virulence_gene_count += 1;
                }
            }
        }

        this.resources.amount -=
            this.hypha.nodeCount *
            (this.resources.upkeep +
                virulence_gene_count * sim.config.virulence_gene_penalty);

        if (
            typeof window === "object" &&
            sim.time % sim.config.display_refresh === 0 &&
            (sim.config.expected_spores_display || sim.config.resources_display)
        ) {
            for (let node of this.hypha.preOrderTraversal()) {
                let pos = Vector.floored(node.pos);
                if (sim.config.resources_display) {
                    sim.field.grid[pos.x][pos.y].resources =
                        this.resources.amount /
                        sim.config.resources_display_unit;
                }

                if (sim.config.expected_spores_display) {
                    sim.field.grid[pos.x][pos.y].eSpores = Math.floor(
                        this.hypha.nodeCount ** sim.config.sporulation_exponent
                    );
                }
            }
        }

        return this.resources.amount > 0;
    }

    getContacts() {
        for (let tip of this.tips) {
            let pos = Vector.floored(tip.pos);

            for (let node of sim.field.grid[pos.x][pos.y].nodes) {
                if (node.fungus.id != this.id) {
                    this.connectedTo.add(node.fungus);
                    node.fungus.connectedTo.add(this);
                }
            }
        }
    }

    getSpore(pos, nSpores) {
        let newGenome = new Genome(deepCopyArray(this.genome.karyotype));

        for (let i = 0; i < newGenome.karyotype.length; i++) {
            {
                newGenome.karyotype[i] = Genome.geneLoss(
                    newGenome.karyotype[i]
                );
                newGenome.karyotype[i] = Genome.geneGain(
                    newGenome.karyotype[i]
                );
                newGenome.karyotype[i] = Genome.geneTransition(
                    newGenome.karyotype[i]
                );
            }
        }

        if (newGenome.karyotype.length > 1) {
            newGenome = Genome.cutNPaste(newGenome);
        }

        newGenome = Genome.chromosomeLoss(newGenome);

       

        if (!newGenome.hasGenes(Object.keys(Gene.house_keeping_genes))) {
            return false;
        }

        let spore = new Fungus(
            Vector.floored(pos),
            this.colour,
            newGenome,
            clamp(0, 200, this.resources.amount / nSpores),
            this.resources.uptake,
            this.resources.upkeep
        );

        return spore;
    }
}
