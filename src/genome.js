import { sim } from "./main.js";
import { deepCopyArray, filterObject } from "./util.js";

export class Genome {
    constructor(karyotype) {
        this.karyotype = [];
        for (let chr of karyotype) {
            if (!Array.isArray(chr)) {
                console.error(`${chr} in not an Array`);
            }

            this.karyotype.push(chr);
        }
    }

    static cutNPaste(genome) {
        let newKaryotype = new Array(genome.karyotype.length);
        for (let i = 0; i < newKaryotype.length; i++) {
            newKaryotype[i] = [];
        }

        for (let i = 0; i < genome.karyotype.length; i++) {
            for (let gene of genome.karyotype[i]) {
                let moved = false;
                for (let j = 0; j < newKaryotype.length; j++) {
                    if (
                        i != j &&
                        sim.rng.random() < sim.config.relocation_rate
                    ) {
                        let index = sim.rng.genrand_int(
                            0,
                            newKaryotype[i].length
                        );
                        moved = true;
                        newKaryotype[j].splice(index, 0, gene);
                        break;
                    }
                }

                if (!moved) {
                    newKaryotype[i].push(gene);
                }
            }
        }
        return new Genome(newKaryotype);
    }

    static geneLoss(chr) {
        let newChr = [];

        for (let gene of chr) {
            if (sim.rng.random() >= sim.config.gene_loss_rate) {
                newChr.push(gene);
            }
        }

        return newChr;
    }

    static geneGain(chr) {
        let newChr = [...chr];

        if (sim.rng.random() < sim.config.gene_gain_rate) {
            let gene = Object.keys(Gene.genes)[
                sim.rng.genrand_int(0, Object.keys(Gene.genes).length - 1)
            ];
            let index = sim.rng.genrand_int(0, newChr.length);
            newChr.splice(index, 0, new Gene(gene, Gene.genes[gene]));
        }

        return newChr;
    }

    static chromosomeLoss(genome) {
        let chrs = [];
        for (let chr of genome.karyotype) {
            if (sim.rng.random() >= sim.config.chromosome_loss_rate) {
                chrs.push(chr);
            }
        }

        return new Genome(chrs);
    }

    static horizontalTransfer(genome1, genome2) {
        let newGenome1 = new Genome(deepCopyArray(genome1.karyotype));
        let newGenome2 = new Genome(deepCopyArray(genome2.karyotype));

        if (
            newGenome1.karyotype.length > 1 &&
            newGenome2.karyotype.length == 1
        ) {
            newGenome2.karyotype.push([...newGenome1.karyotype[1]]);

            if (sim.config.hgt_mode == "cut") {
                newGenome1.karyotype.splice(1, 1);
            }
        } else if (
            newGenome2.karyotype.length > 1 &&
            newGenome1.karyotype.length == 1
        ) {
            newGenome1.karyotype.push([...newGenome2.karyotype[1]]);

            if (sim.config.hgt_mode == "cut") {
                newGenome2.karyotype.splice(1, 1);
            }
        }

        return [newGenome1, newGenome2];
    }

    hasGenes(genes) {
        if (!Array.isArray(genes)) {
            genes = [genes];
        }

        if (genes.length == 0) return false;

        for (let chr of this.karyotype) {
            let temp = [];

            for (let gene of genes) {
                let found = false;

                for (let g of chr) {
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

        if(type === "resistance"){
            this.target = "p" + name.slice(1)
        }
    }

    static genes = {
        h1: "house_keeping",
        h2: "house_keeping",
        h3: "house_keeping",
        h4: "house_keeping",
        h5: "house_keeping",
        h6: "house_keeping",
        p1: "pathogenicity",
        p2: "pathogenicity",
        p3: "pathogenicity",
        p4: "pathogenicity",
        p5: "pathogenicity",
        p6: "pathogenicity",
        r1: "resistance",
        r2: "resistance",
        r3: "resistance",
        r4: "resistance",
        r5: "resistance",
        r6: "resistance",
        n1: "neutral",
        n2: "neutral",
        n3: "neutral",
        n4: "neutral",
        n5: "neutral",
        n6: "neutral",
    };

    
    static house_keeping_genes = filterObject(Gene.genes, type => type == "house_keeping")
    static pathogenicity_genes = filterObject(Gene.genes, type => type == "pathogenicity")
    static neutral_genes = filterObject(Gene.genes, type => type == "neutral")
}
