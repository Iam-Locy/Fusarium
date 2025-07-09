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
    ncol: 500,
    nrow: 500,
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
    year_len: 1000,           // Number of timesteps (ts) in one season
    max_season: 100,            // Number of seasons
    tilling: false,             // Mixing the grid between seasons

    //Settings for the Fungus class
    spores: 10,                  // Number of starting spores
    sporulation_exponent: 0.1,  // Exponent in the 
                                // f() = (resources * hypha_node_count) ** (s_e)
                                // function which determines the number of spores produced by the fungal network
    branch_chance: 0.005,       // Chance of tip branching (per tip per ts)
    tip_speed: 0.2,             // Step length of hyphal growth
    max_node_count: 4,          // Maximum number of overlapping hypha nodes
    fungus_uptake: 0.06,         // Amount of environmental resources aquired in 1 ts by a node of the hyphal network
    fungus_upkeep: 0.02,         // Amount of internal resources used in 1 ts by a node of the hyphal network
    phi: 1,                     // Multiplier for the uptake of parasitic nodes
                                // Parasitic nodes take up (1 + phi) * uptake amount of resources
    mobile_ratio: 0.5,            // Ratio of fungi with mobile genomic compartment (on which the pathogenicity gene resides)
    parasite_ratio: 0.1,        // Ratio og fungi with pathogenicity gene
    hgt_rate: 1,              // Chance of horizontal chromosome transfer (hgt) between connected fungal networks
    hgt_mode: "copy",           // Mode of hgt, it can be "copy" (copy-paste) or "cut" (cut&paste)
    loss_rate: 0.0,             // Chance of losing a gene during sporulation
    gain_rate: 0.0,             // Chance of gaining a gene during sporulation
    relocation_rate: 0.01,      // Chance of genes moving between compartments during sporulation

    //Settings for the Plants class
    plant_scale: 100,           // Scale of one cell on 
    plant_production: 0.02,     // Resource production rate of the plants
    plant_upkeep: 0.0000025,     // Resource usage rate of the plants

    //Display settings
    display_refresh: 10,            // Refresh rate of the resource heavy displays: accumulated resources and expected spores
    hypha_display: true,
    hyphal_density_display: true,
    resources_display: true,
    resources_display_unit: 100,   // The unit multiplier for the accumulated resources display
    expected_spores_display: true,
    plant_health_display: true,
    plant_immunity_display: true
};
