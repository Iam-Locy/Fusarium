export default function setupDisplays(sim) {
    sim.createDisplay("field", "colour", "Fusarium oxysporum mycelium");

    sim.field.colourViridis("filaments", 100, false, "inferno");

    sim.createDisplay_continuous({
        model: "field",
        property: "filaments",
        label: "Hyphal density",
        minval: 0,
        nticks: 6,
        maxval: 5,
    });

    sim.field.colourViridis("resources", 100);

    sim.createDisplay_continuous({
        model: "field",
        property: "resources",
        label: "Accumulated resources (x1000)",
        minval: 0,
        nticks: 11,
        maxval: 500,
    });

     sim.field.colourGradient(
        "eSpores",
        100,
        [0, 0, 0],
        [255, 251, 213],
        [178, 10, 44]
    );

    sim.createDisplay_continuous({
        model: "field",
        property: "eSpores",
        label: "Expected number of spores",
        minval: 0,
        nticks: 9,
        maxval: 8,
    });

    sim.field.colourGradient(
        "health",
        100,
        [0, 0, 0],
        [120, 90, 10],
        [50, 170, 80]
    );

    sim.createDisplay_continuous({
        model: "field",
        property: "health",
        label: "Root placement",
        minval: 0,
        nticks: 10,
        maxval: 1,
    });

    sim.createDisplay("field", "pColour", "Fusarium oxysporum mycelium");
}
