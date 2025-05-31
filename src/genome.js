export class Genome{
    constructor(coreGenes, accGenes = undefined){
        if(!Array.isArray(coreGenes)){
            console.error(`coreGenes: ${coreGenes} is not an Array!`);

        }else{
            this.core = coreGenes;
        }
        
        if(!Array.isArray(accGenes) && accGenes != undefined){
            console.error(`accGenes: ${accGenes} is not an Array!`);
        }else{
            this.acc = accGenes;
        }
        
    }
}

export class Gene{
    constructor(name, type, ){
        this.name = name;
        this.type = type;
    }
}