/**
 * 模型目录
 * 包含所有可供展示的模型信息
 */
const MODELS_CATALOG = [
    {
        id: "test-model",
        title: "测试模型",
        filename: "models/test.vox",
        description: "默认测试模型，展示基本的体素结构。"
    },
    {
        id: "puff-shroom",
        title: "小喷菇",
        filename: "models/puff-shroom.vox",
        description: "别名喷射蘑菇、炮灰菇，益智策略类塔防御战游戏《植物大战僵尸》系列中的角色。"
    },
    {
        id: "angry-yellow",
        title: "愤怒的黄色小鸟",
        filename: "models/angry_yellow.vox",
        description: "表情愤怒的黄色小鸟模型，具有鲜明的表情特征和简洁的设计风格。"
    },
    {
        id: "angry-pig-xmas",
        title: "圣诞愤怒猪",
        filename: "models/angry_pig_Xmas.vox",
        description: "圣诞节主题的愤怒猪角色，融合了节日元素和可爱的体素风格。"
    }
];

/**
 * 获取模型信息通过ID
 */
function getModelById(id) {
    return MODELS_CATALOG.find(model => model.id === id);
} 