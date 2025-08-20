const colourMap = {
    none: "grey",
    x: "red",
    y: "blue",
    z: "yellow",
    xy: "purple",
    xz: "orange",
    yz: "green",
    xyz: "white",
};

export default {
    //Settings of the simulation
    title: "Fusarium",
    description: "",
    ncol: 1000,
    nrow: 1000,
    wrap: [true, true],
    scale: 1,
    skip: 10,
    seed: Math.floor(Math.random() * 100),
    statecolours: {
        colour: colourMap,
        pColour: colourMap,
        food: {
            1: "white",
        },
    },
    season_len: 1000,               // Number of timesteps (ts) in one season
    max_season: 150,                // Number of seasons
    tilling: false,                  // Mixing the grid between seasons

    //Settings for the Fungus class
    spores: 100,                      // Number of starting spores
    sporulation_exponent: 0.25,     // Exponent in the 
                                    // f() = (resources * hypha_node_count) ** (s_e)
                                    // function which determines the number of spores produced by the fungal network
    branch_chance: 0.005,           // Chance of tip branching (per tip per ts)
    tip_speed: 0.2,                 // Step length of hyphal growth
    max_node_count: 4,              // Maximum number of overlapping hypha nodes
    fungus_uptake: 0.01,            // Amount of environmental resources aquired in 1 ts by a node of the hyphal network
    fungus_upkeep: 0.005,           // Amount of internal resources used in 1 ts by a node of the hyphal network
    phi: 20,                        // Multiplier for the uptake of parasitic nodes
                                    // Parasitic nodes take up (1 + phi) * uptake amount of resources
    virulence_gene_penalty: 0.0005, // The amount of extra cost per virulence gene per node per ts
    mobile_ratio: 0.5,              // Ratio of fungi with mobile genomic compartment (on which the pathogenicity gene resides)
    parasite_ratio: 0.5,            // Ratio og fungi with pathogenicity gene
    hgt_rate: 0.1,                  // Chance of horizontal chromosome transfer (hgt) between connected fungal networks
    hgt_mode: "copy",               // Mode of hgt, it can be "copy" (copy-paste) or "cut" (cut&paste)
    gene_loss_rate: 0.01,           // Chance of losing a gene during sporulation
    gene_gain_rate: 0.01,           // Chance of gaining a gene during sporulation
    chromosome_loss_rate: 0.05,     // Chance of losing a chromosome during sporulation
    relocation_rate: 0.02,          // Chance of genes moving between compartments during sporulation

    //Settings for the Plants class
    plant_scale: 100,               // The size of one cell on the plant grid
    plant_production: 0.02,         // Resource production rate of the plants
    plant_upkeep: 0.000005,         // Resource usage rate of the plants
    plant_genes: "xyz",

    //Display settings
    display_refresh: 100,           // Refresh rate of the resource heavy displays: accumulated resources and expected spores
    hypha_display: true,
    hyphal_density_display: false,
    resources_display: false,
    resources_display_unit: 10,     // The unit multiplier for the accumulated resources display
    expected_spores_display: false,
    plant_health_display: true,
    plant_immunity_display: true
};
