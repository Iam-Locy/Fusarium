import { sim } from "./main.js";

export class Genome {
    constructor(coreGenes, accGenes = undefined) {
        if (!Array.isArray(coreGenes)) {
            console.error(`coreGenes: ${coreGenes} is not an Array!`);
        } else {
            this.core = coreGenes;
        }

        if (!Array.isArray(accGenes) && accGenes != undefined) {
            console.error(`accGenes: ${accGenes} is not an Array!`);
        } else {
            this.acc = accGenes;
        }
    }

    static cutNPaste(chr1, chr2) {
        let newChr1 = [];
        let newChr2 = [];

        for (let gene of chr1) {
            if (sim.rng.random() < sim.config.relocation_rate) {
                let place = sim.rng.genrand_int(0, newChr2.length + 1);
                newChr2.splice(place, 0, gene);
            } else {
                newChr1.push(gene);
            }
        }

        for (let gene of chr2) {
            if (sim.rng.random() < sim.config.relocation_rate) {
                let place = sim.rng.genrand_int(0, newChr1.length + 1);
                newChr1.splice(place, 0, gene);
            } else {
                newChr2.push(gene);
            }
        }

        return [newChr1, newChr2];
    }

    static geneLoss(chr) {
        let newChr = [...chr];

        for (let i = 0; i < chr.length; i++) {
            if (sim.rng.random() < sim.config.loss_rate) {
                newChr.splice(i, 1);
            }
        }

        return newChr;
    }

    static geneGain(chr) {
        let newChr = [...chr];

        for (let gene in Gene.genes) {
            if (sim.rng.random() < sim.config.gain_rate) {
                newChr.push(new Gene(gene, Gene.genes[gene]));
            }
        }

        return newChr;
    }

    static horizontalTransfer(genome1, genome2) {
        if (!genome1.acc || !genome2.acc) return [genome1, genome2];

        let newGenome1 = new Genome(genome1.core, genome1.acc);
        let newGenome2 = new Genome(genome2.core, genome2.acc);

        if (newGenome1.acc.length > 0 && newGenome2.acc.length == 0) {
            for (let gene of newGenome1.acc) {
                newGenome2.acc.push(new Gene(gene.name, gene.type));
            }

            if (sim.config.hgt_mode == "cut") {
                newGenome1.acc = [];
            }
        } else if (newGenome1.acc.length == 0 && newGenome2.acc.length > 0) {
            for (let gene of newGenome2.acc) {
                newGenome1.acc.push(new Gene(gene.name, gene.type));
            }

            if (sim.config.hgt_mode == "cut") {
                newGenome2.acc = [];
            }
        }

        return [newGenome1, newGenome2];
    }

    hasGenes(genes) {
        if (!Array.isArray(genes)) {
            genes = [genes];
        }

        if (genes.length == 0) return false;

        if (this.core) {
            let temp = [];

            for (let gene of genes) {
                let found = false;

                for (let g of this.core) {
                    if (g.name == gene) found = true;
                }

                if (!found) temp.push(gene);
            }

            genes = [...temp];
        }

        if (this.acc) {
            let temp = [];

            for (let gene of genes) {
                let found = false;

                for (let g of this.acc) {
                    if (g.name == gene) found = true;
                }

                if (!found) temp.push(gene);
            }

            genes = [...temp];
        }

        if (genes.length == 0) {
            return true;
        } else {
            return false;
        }
    }
}

export class Gene {
    constructor(name, type) {
        this.name = name;
        this.type = type;
    }

    static genes = {
        a: "house_keeping",
        b: "house_keeping",
        c: "house_keeping",
        x: "pathogenicity",
        y: "pathogenicity",
        z: "pathogenicity",
        k: "junk",
        l: "junk",
        m: "junk",
    };
}
