export default {
    "ncol":{
        alias: "nc",
        description: "The width of the grid in pixels.",
        type: "number"
    },
    "nrow":{
        alias: "nc",
        description: "The heigth of the grid in pixels.",
        type: "number"
    },
    "wrap":{
        alias: "w",
        description: "Specifies wether the edges of the grid are wrapped. Usage: --wrap vertical horizontal.",
        array: true,
        type: "boolean"
    },
    "seed":{
        alias: "sd",
        description: "The seed number for the random generator",
        type: "number"
    },
    "season_len":{
        alias: "yl",
        description: "The length of one season.",
        type: "number"
    },
    "max_season":{
        alias: "ms",
        description: "The number of simulated season.",
        type: "number"
    },
    "tilling":{
        alias: "t",
        description: "Wether the grid is mixed at the start of the season.",
        type: "boolean"
    },
    "spores":{
        alias: "sp",
        description: "The number spores at the start of the simulation.",
        type: "number"
    },
    "sporulation_exponent":{
        alias: "se",
        description: "The exponent determining the number of spores produced by the fungi.",
        type: "number"
    },
    "branch_chance":{
        alias: "bc",
        description: "Chance of tip branching (per tip per ts).",
        type: "number"
    },
    "max_node_count":{
        alias: "mnc",
        description: "Maximum numbe rof overlapping hypha nodes.",
        type: "number"
    },
    "fungus_uptake":{
        alias: "ft",
        description: "Amount of environmental resources aquired in 1 timestep by the hyphal nodes.",
        type: "number"
    },
    "fungal_upkeep":{
        alias: "fk",
        description: "Amount of internal resources consumed in 1 timestep by one hyphal node",
        type: "number"
    },
    "phi":{
        alias: "p",
        description: "The multiplier for the uptake from plants of parasitic nodes.",
        type: "number"
    },
    "mobile_ratio":{
        alias: "mr",
        description: "The ratio of parasites with accessory chromosome at the start.",
        type: "number"
    },
    "parasite_ratio":{
        alias: "pr",
        description: "The ratio of fungi with a virulence gene at the start.",
        type: "number"
    },
    "hgt_rate":{
        alias: "hr",
        description: "The chance of horizontal chromosome transfer at the end of the season.",
        type: "number"
    },
    "hgt_mode":{
        alias: "hm",
        description: "The mode of horizontal chromosome transfer.",
        choices: ["cut", "copy"],
        type: "string"
    },
    "gene_loss_rate":{
        alias: "lr",
        description: "The chance of losing a gene during sporulation.",
        type: "number"
    },
    "gene_gain_rate":{
        alias: "gr",
        description: "The chance of gaining a gene during sporulation.",
        type: "number"
    },
    "chromosome_loss_rate":{
        alias: "clr",
        description: "The chance of losing a chromosome during sporulation.",
        type: "number"
    },
    "relocation_rate":{
        alias: "rlr",
        description: "The chance of a gene moving between chromosome during sporulation.",
        type: "number"
    },
    "plant_scale":{
        alias: "ps",
        description: "The size of one cell on the plant grid.",
        type: "number"
    },
    "plant_production":{
        alis: "pp",
        description: "The production rate of the plants.",
        type: "number"
    },
    "plant_upkeep":{
        alias: "pk",
        description: "The resource consuption rate of the plants.",
        type: "number"
    }


}