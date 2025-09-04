export default function setupDisplays(sim) {
    if (sim.config.hypha_display) {
        sim.createDisplay("field", "colour", "Fusarium oxysporum mycelium");
    }

    if (sim.config.hyphal_density_display) {
        sim.field.colourViridis("node_count", 100, false, "inferno");

        sim.createDisplay_continuous({
            model: "field",
            property: "node_count",
            label: "Hyphal density",
            minval: 0,
            nticks: 6,
            maxval: sim.config.max_node_count,
        });
    }

    if (sim.config.resources_display) {
        sim.field.colourViridis("resources", 100);

        sim.createDisplay_continuous({
            model: "field",
            property: "resources",
            label: `Accumulated resources (x${sim.config.resources_display_unit})`,
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
            maxval: 10,
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
}
