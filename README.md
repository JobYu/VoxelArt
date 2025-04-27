# Voxel Art Gallery

An elegant Three.js-based voxel model viewer application for showcasing MagicaVoxel .vox format artwork. Specially designed for Pixel Bear Teacher's voxel art collection.

## Features

- Beautiful UI interface for showcasing voxel art works
- Model list for easily switching between different works (with scrolling support on mobile)
- Grid display feature to clearly show the boundaries of each voxel
- Layer mode for exploring models layer by layer
- **Optimized Mobile View**: Dedicated interface for smaller screens with bottom navigation and panel layout.
- **Exterior Only Mode (Default)**: Improves visibility of model structure by simplifying interior voxels (always active, toggle hidden).
- 3D navigation to view models from any angle (touch controls optimized for mobile)
- Optimized performance with instanced rendering for complex models

## How to Use

### Desktop View

1. Start the application via an HTTP server (as shown below)
2. Select a model from the list on the left
3. Use mouse for navigation:
   - Left-click and drag to rotate the model
   - Right-click and drag to pan the view
   - Scroll wheel to zoom
4. Use the toggle switches in the top right panel to control view options:
   - **Show Grid**: Toggle grid lines for better voxel boundary visibility
   - **Layer Mode**: Enable layer-by-layer viewing with navigation controls (appears when Layer Mode is active)

### Mobile View

1. Start the application via an HTTP server
2. Use the bottom navigation buttons:
   - **📋 (List Icon)**: Open/close the scrollable model list panel on the left.
   - **⚙️ (Settings Icon)**: Open/close the settings panel at the bottom.
   - **ℹ️ (Info Icon)**: Open/close the model information panel at the bottom.
3. Select a model from the list panel.
4. Use touch gestures for navigation:
   - One finger drag to rotate the model
   - Two finger pinch/spread to zoom
   - Two finger drag to pan
5. Use the toggle switches in the bottom settings panel:
   - **Show Grid**: Toggle grid lines.
   - **Layer Mode**: Enable layer-by-layer viewing.

_(Note: Exterior Only mode is enabled by default and its toggle is hidden to save space)_

## Layer Navigation

When Layer Mode is enabled (Desktop or Mobile Settings Panel):
- Use the **Next** button to add layers from bottom to top
- Use the **Previous** button to remove layers from top to bottom
- Use the **Reset** button to return to the first layer
- The layer counter shows your current position within the model

## Smart Exterior Simplification

The Exterior Only mode intelligently simplifies models while preserving structural integrity:
- Maintains at least 2-voxel thickness for structural stability
- Preserves complete structure for models with thickness less than 4 voxels
- Preserves the bottom two layers completely for stability
- Avoids over-simplification of sparse layers (keeps original structure when simplified voxels ≤ 4)

## Running the Application

Start a simple HTTP server to serve the files:

```bash
# Using Python 3 (recommended)
python -m http.server

# Using Node.js and npx
npx serve
```

Then access in your browser: `http://localhost:8000`

## Adding New Models

1. Place your .vox model files in the `models/` directory
2. Add model information in `js/models-catalog.js`, in the following format:
   ```js
   {
     id: "my-model",
     title: "My Model",
     filename: "models/my-model.vox",
     description: "This is my custom model description"
   }
   ```

## Technical Details

- **Rendering Engine**: Three.js for high-quality 3D rendering
- **Model Loading**: Built-in VOX file format parser, supporting MagicaVoxel specifications
- **Performance Optimization**: Instanced rendering technology for significantly improved voxel model performance
- **Visual Effects**: Support for voxel transparency and custom palettes
- **Grid Display**: Using EdgesGeometry and LineSegments for precise voxel boundary lines
- **Layer Processing**: Advanced algorithms for layer-by-layer model dissection
- **Exterior Analysis**: Intelligent exterior voxel detection with structural preservation

## Customization Options

- Adjustable UI styles, background colors, and lighting settings
- Support for additional descriptive information and metadata
- Extensible to support more features, such as animation, screenshots, etc.

## Author Information

Designed and maintained by Pixel Bear Teacher to showcase personal voxel artwork.

## License

© 2025 Pixel Bear Teacher

---

# 像素熊老师Voxel作品集

一个优雅的基于Three.js的体素模型展示应用，用于展示MagicaVoxel .vox格式的体素模型作品。专为像素熊老师的作品集设计。

## 功能

- 精美的UI界面，展示体素艺术作品
- 模型列表，便于切换展示不同的作品 (移动端支持滚动)
- 网格显示功能，清晰展示每个体素的边界
- 分层模式，可以逐层探索模型结构
- **优化移动视图**: 为小屏幕设计的专属界面，包含底部导航和面板布局。
- **仅显示外部模式 (默认)**: 通过简化内部体素提高模型结构可视性 (始终启用，开关已隐藏)。
- 3D导航，可以任意角度查看模型 (移动端优化触摸控制)
- 优化的性能，使用实例化渲染支持复杂模型

## 使用方法

### 桌面视图

1. 通过HTTP服务器启动应用（如下所示）
2. 从左侧模型列表中选择一个模型进行查看
3. 使用鼠标进行导航：
   - 左键点击并拖动旋转模型
   - 右键点击并拖动平移视图
   - 滚轮缩放
4. 使用右上角面板中的开关控制查看选项：
   - **显示网格**：切换网格线以更好地显示体素边界
   - **分层模式**：启用逐层查看功能，附带导航控制 (仅在分层模式激活时显示)

### 移动视图

1. 通过HTTP服务器启动应用
2. 使用底部导航按钮:
   - **📋 (列表图标)**: 打开/关闭左侧可滚动的模型列表面板。
   - **⚙️ (设置图标)**: 打开/关闭底部的设置面板。
   - **ℹ️ (信息图标)**: 打开/关闭底部的模型信息面板。
3. 从列表面板中选择一个模型。
4. 使用触摸手势进行导航:
   - 单指拖动旋转模型
   - 双指捏合/张开缩放
   - 双指拖动平移
5. 使用底部设置面板中的开关:
   - **显示网格**: 切换网格线。
   - **分层模式**: 启用逐层查看功能。

_(注意: 仅显示外部模式已默认启用，其开关被隐藏以节省空间)_

## 分层导航

启用分层模式后 (桌面视图或移动端设置面板):
- 使用**下一层**按钮从底部向顶部添加层
- 使用**上一层**按钮从顶部向底部移除层
- 使用**重置**按钮返回到第一层
- 层计数器显示您在模型中的当前位置

## 智能外部体素精简

仅显示外部模式智能精简模型，同时保持结构完整性：
- 保持至少2个体素的厚度以确保结构稳定性
- 对厚度小于4个体素的模型保留完整结构，不进行精简
- 完全保留底部两层以确保稳定性
- 避免过度精简稀疏层（当精简后体素数量≤4时保留原始结构）

## 运行应用

启动一个简单的HTTP服务器来提供文件：

```bash
# 使用Python 3（推荐）
python -m http.server

# 使用Node.js和npx
npx serve
```

然后在浏览器中访问：`http://localhost:8000`

## 添加新模型

1. 将您的.vox模型文件放入`models/`目录
2. 在`js/models-catalog.js`中添加模型信息，格式如下：
   ```js
   {
     id: "my-model",
     title: "我的模型",
     filename: "models/my-model.vox",
     description: "这是我的自定义模型描述"
   }
   ```

## 技术详情

- **渲染引擎**：Three.js实现高质量3D渲染
- **模型加载**：内置VOX文件格式解析器，支持MagicaVoxel规范
- **性能优化**：使用实例化渲染技术，大幅提升体素模型性能
- **视觉效果**：支持体素透明度和自定义调色板
- **网格显示**：使用EdgesGeometry和LineSegments实现精确的体素边界线
- **分层处理**：先进的算法实现模型逐层分解
- **外部体素分析**：智能外部体素检测并保持结构完整性

## 自定义选项

- 可以调整UI样式、背景颜色和光照设置
- 支持添加更多描述信息和元数据
- 可扩展支持更多功能，如动画、截图等

## 作者信息

由像素熊老师设计和维护，展示个人体素艺术作品。

## 许可证

© 2025 像素熊老师

