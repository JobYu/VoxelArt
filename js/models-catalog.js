/**
 * Model Catalog
 * Contains information for all displayable models
 */
const MODELS_CATALOG = [
    {
        id: "test",
        title: "Test Model",
        filename: "models/test.vox",
        description: "A simple test model."
    },
    {
        id: "plant",
        title: "Scaredy-shroom",
        filename: "models/plant.vox",
        description: "Plants vs zombies model."
    },
    {
        id: "king",
        title: "King",
        filename: "models/king.vox",
        description: "A king model."
    },
    {
        id: "blue",
        title: "Blue Bird",
        filename: "models/blue.vox",
        description: "A blue bird model."
    },
    {
        id: "green",
        title: "Green Bird",
        filename: "models/green.vox",
        description: "A green bird model."
    },
    {
        id: "black",
        title: "Black Bird",
        filename: "models/black.vox",
        description: "A black bird model."
    },
    {
        id: "red",
        title: "Red Bird",
        filename: "models/Red.vox",
        description: "A red bird model."
    },
    {
        id: "camel",
        title: "Camel",
        filename: "models/camel.vox",
        description: "A camel model."
    },
    {
        id: "puff-shroom",
        title: "puff-shroom",
        filename: "models/puff-shroom.vox",
        description: "Also known as Puff-shroom or Cannon Fodder Mushroom."
    },
    {
        id: "angry_yellow",
        title: "Angry Bird Yellow ",
        filename: "models/angry_yellow.vox",
        description: "An angry bird yellow model."
    },
    {
        id: "angry_pig_xmas",
        title: "Christmas Angry Pig",
        filename: "models/angry_pig_Xmas.vox",
        description: "A Christmas-themed angry bird pig character."
    }
];

/**
 * Get model information by ID
 */
function getModelById(id) {
    return MODELS_CATALOG.find(model => model.id === id);
} 