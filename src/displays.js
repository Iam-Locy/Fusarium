export default function setupDisplays(sim) {
    if (sim.config.hypha_display) {
        sim.createDisplay("field", "colour", "Fusarium oxysporum mycelium");
    }

    if (sim.config.hyphal_density_display) {
        sim.field.colourViridis("filaments", 100, false, "inferno");

        sim.createDisplay_continuous({
            model: "field",
            property: "filaments",
            label: "Hyphal density",
            minval: 0,
            nticks: 6,
            maxval: 5,
        });
    }

    if (sim.config.fungi_resources_display) {
        sim.field.colourViridis("resources", 100);

        sim.createDisplay_continuous({
            model: "field",
            property: "resources",
            label: "Accumulated resources (x1000)",
            minval: 0,
            nticks: 11,
            maxval: 500,
        });
    }

    if (sim.config.expected_spores_display) {
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
            nticks: 6,
            maxval: 5,
        });
    }

    if (sim.config.plant_health_display) {
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
            label: "Health of plants",
            minval: 0,
            nticks: 10,
            maxval: 1,
        });
    }

    if (sim.config.plant_immunity_display) {
        sim.createDisplay("field", "pColour", "Fusarium oxysporum mycelium");
    }
}
