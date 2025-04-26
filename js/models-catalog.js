/**
 * 模型目录
 * 包含所有可供展示的模型信息
 */
const MODELS_CATALOG = [
    {
        id: "test",
        title: "Test Model",
        filename: "models/test.vox",
        description: "A simple test model to verify the system's functionality."
    },
    {
        id: "puff-shroom",
        title: "puff-shroom",
        filename: "models/puff-shroom.vox",
        description: "Also known as Puff-shroom or Cannon Fodder Mushroom, a character from the tower defense strategy game series 'Plants vs. Zombies'."
    },
    {
        id: "angry_yellow",
        title: "Angry Bird Yellow ",
        filename: "models/angry_yellow.vox",
        description: "An angry bird yellow model with distinctive facial expressions and a sleek design style."
    },
    {
        id: "angry_pig_xmas",
        title: "Christmas Angry Pig",
        filename: "models/angry_pig_Xmas.vox",
        description: "A Christmas-themed angry pig character, combining holiday elements with a cute voxel style."
    }
];

/**
 * 获取模型信息通过ID
 */
function getModelById(id) {
    return MODELS_CATALOG.find(model => model.id === id);
} 