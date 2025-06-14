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
        let newChr1 = [...chr1];
        let newChr2 = [...chr2];

        for (let i = 0; i < chr1.length; i++) {
            if (sim.rng.random() < 0.01) {
                newChr2.splice(i, 0, chr1[i]);
                newChr1.splice(i, 1);
            }
        }

        for (let i = 0; i < chr2.length; i++) {
            if (sim.rng.random() < 0.01) {
                newChr1.splice(i, 0, chr2[i]);
                newChr2.splice(i, 1);
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

        for (let gene of Object.keys(Gene.genes)) {
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
            newGenome1.acc.forEach((gene) => {
                newGenome2.acc.push(new Gene(gene.name, gene.type));
            });
        } else if (newGenome1.acc.length == 0 && newGenome2.acc.length > 0) {
            newGenome2.acc.forEach((gene) => {
                newGenome1.acc.push(new Gene(gene.name, gene.type));
            });
        }

        return [newGenome1, newGenome2];
    }

    hasGenes(genes) {
        if (!Array.isArray(genes)) {
            genes = [genes];
        }

        if(genes.length == 0) return false

        if (this.core) {
            genes = genes.filter((gene) => {
                let found = false;

                this.core.forEach((g) => {
                    if (g.name == gene) found = true;
                });

                return !found;
            });
        }

        if (this.acc) {
            genes = genes.filter((gene) => {
                let found = false;

                this.acc.forEach((g) => {
                    if (g.name == gene) found = true;
                });

                return !found;
            });
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
