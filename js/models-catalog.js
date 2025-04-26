/**
 * 模型目录
 * 包含所有可供展示的模型信息
 */
const MODELS_CATALOG = [
    {
        id: "test",
        title: "Test Model",
        filename: "test.vox",
        description: "A simple test model to verify the system's functionality."
    },
    {
        id: "puff-shroom",
        title: "小喷菇",
        filename: "models/puff-shroom.vox",
        description: "别名喷射蘑菇、炮灰菇，益智策略类塔防御战游戏《植物大战僵尸》系列中的角色。"
    },
    {
        id: "angry_yellow",
        title: "Angry Yellow Bird",
        filename: "angry_yellow.vox",
        description: "An angry yellow bird model with distinctive facial expressions and a sleek design style."
    },
    {
        id: "angry_pig_xmas",
        title: "Christmas Angry Pig",
        filename: "angry_pig_Xmas.vox",
        description: "A Christmas-themed angry pig character, combining holiday elements with a cute voxel style."
    }
];

/**
 * 获取模型信息通过ID
 */
function getModelById(id) {
    return MODELS_CATALOG.find(model => model.id === id);
} 