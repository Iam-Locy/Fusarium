import { fileIDGenerator } from "./util.js";
import fs from "fs";

export function makeIndex(sim, fileID) {
    let indexId;
    let outText = "";

    for (let file of fs.readdirSync("./output/")) {
        if (file.includes("INDEX")) {
            indexId = file.replace("INDEX_", "").replace(".txt", "");
            break;
        }
    }

    if (!indexId) {
        indexId =
            `${new Date().toJSON().slice(0, 10).replace(/-/g, "_")}_` +
            `${fileIDGenerator()}`;

        outText += "id";

        for (let param in sim.config) {
            if (
                [
                    "title",
                    "description",
                    "statecolours",
                    "scale",
                    "skip",
                    "sleep",
                    "maxtime",
                ].includes(param)
            )
                continue;
            if (param.includes("display") || param.includes("graph")) continue;
            outText += `;${param}`;
        }
    }

    outText += `\n${fileID}`;

    for (let param in sim.config) {
        if (
            [
                "title",
                "description",
                "statecolours",
                "scale",
                "skip",
                "sleep",
                "maxtime",
            ].includes(param)
        )
            continue;
        if (param.includes("display") || param.includes("graph")) continue;
        outText += `;${sim.config[param]}`;
    }

    sim.write_append(outText, `./output/INDEX_${indexId}.txt`);
    return `${indexId}_${fileID}`;
}

export function log(sim, plants, fungi, fileID) {
    let fileName = "./output/" + `${fileID}`;
    let plantOut = "";

    for (let p of plants) {
        let genome = "";
        for (let g of p.genome.karyotype[0]) {
            genome += g.name;
        }
        plantOut += `P:${p.id};G:${genome};R:${p.resources.amount.toFixed(
            2
        )}\t`;
    }

    sim.write_append(`${plantOut}\n`, `${fileName}_plants.txt`);

    let fungusOut = "";

    for (let f of fungi) {
        let genomeC = "";

        for (let g of f.genome.karyotype[0]) {
            genomeC += g.name;
        }

        let genomeA = "";
        if (f.genome.karyotype.length > 1) {
            for (let g of f.genome.karyotype[1]) {
                genomeA += g.name;
            }
        }

        let hosts = "";
        for (let host of f.hosts) {
            hosts += `${host.id},`;
        }

        hosts = hosts.substring(0, hosts.length - 1);

        fungusOut += `F:${
            f.id
        };C:${genomeC};A:${genomeA};R:${f.resources.amount.toFixed(2)};S:${
            f.hypha.nodeCount
        };H:${hosts}\t`;
    }

    sim.write_append(`${fungusOut}\n`, `${fileName}_fungi.txt`);
}

export function writeGrids(sim, fileID) {
    let fileName = "./output/" + `${fileID}`;

    let fungiOut = "X;Y;IDs";
    let plantsOut = "X;Y;ID";

    for (let i = 0; i < sim.field.nc; i++) {
        for (let j = 0; j < sim.field.nr; j++) {
            let fungiLine = `\n${i};${j}`;
            let fungi = new Set([]);

            for (let node of sim.field.grid[i][j].nodes) {
                fungi.add(node.fungus.id);
            }

            if (fungi.size == 0) continue;

            for (let id of fungi) {
                fungiLine += `;${id}`;
            }

            fungiOut += fungiLine;
        }
    }

    for (let i = 0; i < sim.plants.nc; i++) {
        for (let j = 0; j < sim.plants.nr; j++) {
            let plant = sim.plants.grid[i][j].plant;
            plantsOut += `\n${i};${j};${plant ? plant.id : ""}`;
        }
    }

    sim.write_append(fungiOut, `${fileName}_fungiGrid.txt`);
    sim.write_append(plantsOut, `${fileName}_plantsGrid.txt`);
}
