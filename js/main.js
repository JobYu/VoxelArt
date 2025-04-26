/**
 * VOX Viewer - Main Application
 */
class VoxViewer {
    constructor(container) {
        console.log('Initializing VoxViewer...');
        this.container = container;
        this.voxParser = new VoxParser();
        this.currentModel = null;
        this.modelMesh = null;
        this.useInstancedRendering = true; // Use instanced rendering for better performance
        this.showGrid = false; // 不显示场景网格
        this.showAxes = false; // 不显示坐标轴
        this.currentModelInfo = null; // 当前加载的模型信息
        this.modelWireframe = null; // 模型的线框网格
        this.wireframeVisible = false; // 线框网格是否可见
        
        this.init();
    }

    /**
     * Initialize Three.js scene, camera, renderer
     */
    init() {
        console.log('Setting up Three.js scene...');
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222034); // 修改为深色背景 0x222034
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            45, // Field of view
            this.container.clientWidth / this.container.clientHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        console.log('Adding OrbitControls...');
        // Add OrbitControls
        try {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.25;
            console.log('OrbitControls initialized successfully');
        } catch (error) {
            console.error('Error initializing OrbitControls:', error);
        }
        
        // Add lighting
        this.setupLights();
        
        // 根据配置决定是否添加网格
        if (this.showGrid) {
            this.addGrid();
        }
        
        // 根据配置决定是否添加坐标轴
        if (this.showAxes) {
            // Add axes helper
            const axesHelper = new THREE.AxesHelper(20);
            this.scene.add(axesHelper);
        }
        
        // Handle window resize
        window.addEventListener('resize', this.onResize.bind(this));
        
        // Start render loop
        this.animate();
        console.log('Scene setup complete');
    }

    /**
     * Set up lights for the scene
     */
    setupLights() {
        // 增强环境光照强度，使用白光以保持原始颜色
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        // 减弱主方向光的强度
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight1.position.set(1, 2, 3);
        this.scene.add(dirLight1);
        
        // 减弱辅助方向光的强度
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
        dirLight2.position.set(-1, -1, -1);
        this.scene.add(dirLight2);
    }

    /**
     * Add a grid to the scene
     */
    addGrid() {
        const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0x444444);
        this.scene.add(gridHelper);
    }

    /**
     * Handle window resize
     */
    onResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 显示或隐藏模型网格
     * @param {boolean} show - 是否显示网格
     */
    toggleModelWireframe(show) {
        console.log('切换网格显示:', show);
        this.wireframeVisible = show;
        
        // 如果当前没有模型，则直接返回
        if (!this.modelMesh) {
            console.log('没有加载模型，无法显示网格');
            return;
        }
        
        // 如果开启线框效果，则创建线框；否则移除线框
        if (show) {
            this.createOverlayWireframe();
        } else {
            this.removeOverlayWireframe();
        }
    }
    
    /**
     * 创建叠加在模型上的线框
     */
    createOverlayWireframe() {
        // 先移除可能存在的线框
        this.removeOverlayWireframe();
        
        if (!this.modelMesh) return;
        
        // 创建线框组
        this.modelWireframe = new THREE.Group();
        
        // 遍历模型中的每个mesh
        this.modelMesh.traverse(child => {
            // 处理实例化网格
            if (child instanceof THREE.InstancedMesh) {
                // 准备几何体
                const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
                const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
                
                // 为每个实例创建线框
                const count = child.count;
                const matrix = new THREE.Matrix4();
                
                for (let i = 0; i < count; i++) {
                    // 获取实例矩阵
                    child.getMatrixAt(i, matrix);
                    
                    // 创建线框
                    const edges = new THREE.LineSegments(
                        edgesGeometry,
                        new THREE.LineBasicMaterial({
                            color: 0x000000,
                            opacity: 0.5,
                            transparent: true
                        })
                    );
                    
                    // 应用变换
                    edges.applyMatrix4(matrix);
                    
                    // 应用实例位置偏移
                    edges.position.x += child.position.x;
                    edges.position.y += child.position.y;
                    edges.position.z += child.position.z;
                    
                    this.modelWireframe.add(edges);
                }
            }
            // 处理普通网格
            else if (child instanceof THREE.Mesh) {
                // 创建边缘几何体
                const edgesGeometry = new THREE.EdgesGeometry(child.geometry);
                
                // 创建线框
                const edges = new THREE.LineSegments(
                    edgesGeometry,
                    new THREE.LineBasicMaterial({
                        color: 0x000000,
                        opacity: 0.5,
                        transparent: true
                    })
                );
                
                // 复制变换
                edges.position.copy(child.position);
                edges.rotation.copy(child.rotation);
                edges.scale.copy(child.scale);
                
                this.modelWireframe.add(edges);
            }
        });
        
        // 添加到场景
        if (this.modelWireframe.children.length > 0) {
            this.scene.add(this.modelWireframe);
            console.log('已创建线框网格，子元素数量:', this.modelWireframe.children.length);
        } else {
            console.log('未能创建任何线框，检查模型结构');
        }
    }
    
    /**
     * 移除线框
     */
    removeOverlayWireframe() {
        if (this.modelWireframe) {
            this.scene.remove(this.modelWireframe);
            this.modelWireframe = null;
            console.log('已移除线框网格');
        }
    }

    /**
     * 加载模型目录中的模型
     */
    loadCatalogModel(modelId) {
        const modelInfo = getModelById(modelId);
        if (!modelInfo) {
            console.error('Model not found:', modelId);
            return false;
        }

        this.currentModelInfo = modelInfo;
        
        // 更新信息面板
        this.updateInfoPanel(modelInfo);
        
        // 显示加载指示器
        const loadingIndicator = document.querySelector('.loading-indicator');
        loadingIndicator.style.display = 'block';
        
        console.log(`Loading model from catalog: ${modelInfo.title} (${modelInfo.filename})`);
        
        // 从服务器加载模型文件
        fetch(modelInfo.filename)
            .then(response => {
                console.log('Fetch response:', response.status, response.statusText);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(buffer => {
                console.log('Loaded buffer, size:', buffer.byteLength);
                const success = this.loadVoxFile(buffer);
                loadingIndicator.style.display = 'none';
                
                if (!success) {
                    console.error('Failed to parse or render the model');
                    alert(`无法加载模型 "${modelInfo.title}"。请检查控制台获取详细信息。`);
                } else {
                    console.log('Model loaded and rendered successfully');
                    
                    // 高亮当前选中的模型
                    this.highlightSelectedModel(modelId);
                    
                    // 如果设置为显示网格，则应用网格
                    if (this.wireframeVisible) {
                        this.toggleModelWireframe(true);
                    }
                }
            })
            .catch(error => {
                loadingIndicator.style.display = 'none';
                console.error('Error loading model:', error);
                alert(`加载模型时出错: ${error.message}`);
            });
            
        return true;
    }

    /**
     * 更新信息面板显示当前模型信息
     */
    updateInfoPanel(modelInfo) {
        const titleElement = document.getElementById('current-model-title');
        const descElement = document.getElementById('current-model-desc');
        
        if (modelInfo) {
            titleElement.textContent = modelInfo.title;
            descElement.textContent = modelInfo.description;
        } else {
            titleElement.textContent = '未选择模型';
            descElement.textContent = '从左侧列表选择一个模型进行查看。';
        }
    }

    /**
     * 高亮当前选中的模型项
     */
    highlightSelectedModel(modelId) {
        // 移除所有模型项的高亮
        const modelItems = document.querySelectorAll('.model-item');
        modelItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // 为当前选中的模型添加高亮
        const selectedItem = document.querySelector(`.model-item[data-id="${modelId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
    }

    /**
     * Load a VOX file from an ArrayBuffer
     */
    loadVoxFile(buffer) {
        try {
            console.log('Loading VOX file, buffer size:', buffer.byteLength);
            // Remove previous model if it exists
            this.clearCurrentModel();
            
            // Parse the VOX file
            console.log('Parsing VOX file...');
            this.currentModel = this.voxParser.parse(buffer);
            console.log('Model parsed successfully:', this.currentModel);
            
            // Render the model
            console.log('Rendering model...');
            this.renderModel(this.currentModel);
            
            // Adjust camera position based on model size
            this.focusCameraOnModel();
            console.log('Model loaded and displayed successfully');
            
            return true;
        } catch (error) {
            console.error('Error loading VOX file:', error);
            return false;
        }
    }

    /**
     * Render the voxel model using Three.js
     */
    renderModel(model) {
        if (!model || !model.models || model.models.length === 0) {
            console.error('No model data to render');
            return;
        }
        
        // Group to hold all model meshes
        const modelGroup = new THREE.Group();
        
        // Process each model in the VOX file
        model.models.forEach((modelData, index) => {
            // Create a mesh for this model
            const modelMesh = this.useInstancedRendering 
                ? this.createInstancedModelMesh(modelData, model.palette)
                : this.createModelMesh(modelData, model.palette);
                
            modelMesh.position.set(0, 0, 0);
            modelGroup.add(modelMesh);
        });
        
        // Add the model group to the scene
        this.scene.add(modelGroup);
        this.modelMesh = modelGroup;
        
        // 如果需要显示线框，应用线框
        if (this.wireframeVisible) {
            this.toggleModelWireframe(true);
        }
    }

    /**
     * Create a Three.js mesh for a voxel model (individual meshes approach)
     */
    createModelMesh(modelData, palette) {
        // Create a group to hold all voxels
        const modelGroup = new THREE.Group();
        
        // Create materials for each color in the palette
        const materials = palette.map(color => {
            return new THREE.MeshLambertMaterial({
                color: new THREE.Color(
                    color.r / 255, 
                    color.g / 255, 
                    color.b / 255
                ),
                transparent: color.a < 255,
                opacity: color.a / 255
            });
        });
        
        // Create a box geometry for the voxels (we'll reuse this)
        const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Create a mesh for each voxel
        modelData.voxels.forEach(voxel => {
            if (voxel.colorIndex === 0) return; // Skip transparent voxels
            
            const material = materials[voxel.colorIndex];
            const voxelMesh = new THREE.Mesh(voxelGeometry, material);
            
            // Position the voxel
            voxelMesh.position.set(
                voxel.x - modelData.size.x / 2, 
                voxel.z, // Y is up in Three.js, Z is up in MagicaVoxel
                voxel.y - modelData.size.y / 2
            );
            
            modelGroup.add(voxelMesh);
        });
        
        return modelGroup;
    }

    /**
     * Create a Three.js model using instanced mesh for better performance
     * (Much more efficient for large models)
     */
    createInstancedModelMesh(modelData, palette) {
        const modelGroup = new THREE.Group();
        
        // Group voxels by color
        const voxelsByColor = {};
        
        modelData.voxels.forEach(voxel => {
            if (voxel.colorIndex === 0) return; // Skip transparent voxels
            
            if (!voxelsByColor[voxel.colorIndex]) {
                voxelsByColor[voxel.colorIndex] = [];
            }
            
            voxelsByColor[voxel.colorIndex].push(voxel);
        });
        
        // Create a single box geometry to be instanced
        const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Create an instanced mesh for each color
        Object.entries(voxelsByColor).forEach(([colorIndex, voxels]) => {
            const color = palette[colorIndex];
            const material = new THREE.MeshLambertMaterial({
                color: new THREE.Color(
                    color.r / 255, 
                    color.g / 255, 
                    color.b / 255
                ),
                transparent: color.a < 255,
                opacity: color.a / 255
            });
            
            // Create instanced mesh
            const instancedMesh = new THREE.InstancedMesh(
                voxelGeometry,
                material,
                voxels.length
            );
            
            // Set position and rotation for each instance
            const matrix = new THREE.Matrix4();
            voxels.forEach((voxel, index) => {
                matrix.setPosition(
                    voxel.x - modelData.size.x / 2,
                    voxel.z, // Y is up in Three.js, Z is up in MagicaVoxel
                    voxel.y - modelData.size.y / 2
                );
                instancedMesh.setMatrixAt(index, matrix);
            });
            
            instancedMesh.instanceMatrix.needsUpdate = true;
            modelGroup.add(instancedMesh);
        });
        
        return modelGroup;
    }

    /**
     * Remove the current model from the scene
     */
    clearCurrentModel() {
        // 清除线框
        this.removeOverlayWireframe();
        
        // 清除模型
        if (this.modelMesh) {
            this.scene.remove(this.modelMesh);
            this.modelMesh = null;
        }
    }

    /**
     * Position the camera to focus on the model
     */
    focusCameraOnModel() {
        if (!this.currentModel || !this.currentModel.models || this.currentModel.models.length === 0) {
            return;
        }
        
        // Calculate the maximum size of the model
        let maxSize = 0;
        this.currentModel.models.forEach(model => {
            maxSize = Math.max(maxSize, model.size.x, model.size.y, model.size.z);
        });
        
        // Set camera position based on model size
        const distance = maxSize * 2;
        this.camera.position.set(distance, distance, distance);
        this.camera.lookAt(0, 0, 0);
        
        // Update controls
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }
}

/**
 * 创建模型列表UI
 */
function createModelList(container, viewer) {
    // 添加每个模型到列表
    MODELS_CATALOG.forEach(model => {
        const modelItem = document.createElement('div');
        modelItem.className = 'model-item';
        modelItem.dataset.id = model.id;
        
        const title = document.createElement('div');
        title.className = 'model-title';
        title.textContent = model.title;
        
        const desc = document.createElement('div');
        desc.className = 'model-desc';
        desc.textContent = model.description;
        
        modelItem.appendChild(title);
        modelItem.appendChild(desc);
        
        // 添加点击事件
        modelItem.addEventListener('click', () => {
            viewer.loadCatalogModel(model.id);
        });
        
        // 插入到容器中
        container.appendChild(modelItem);
    });
}

/**
 * Application initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing viewer...');
    const container = document.getElementById('canvas-container');
    const viewer = new VoxViewer(container);
    
    // 创建模型列表
    const modelListContainer = document.getElementById('model-list');
    createModelList(modelListContainer, viewer);
    
    // 设置网格显示开关
    const gridToggle = document.getElementById('grid-toggle');
    gridToggle.addEventListener('change', (event) => {
        viewer.toggleModelWireframe(event.target.checked);
    });
    
    // 默认加载第一个模型
    if (MODELS_CATALOG.length > 0) {
        viewer.loadCatalogModel(MODELS_CATALOG[0].id);
    }
}); 