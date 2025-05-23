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
        this.showGrid = false; // Grid setting
        this.showAxes = false; // Axes setting
        this.currentModelInfo = null; // Current model info
        this.modelWireframe = null; // Model wireframe mesh
        this.wireframeVisible = false; // Wireframe visibility
        
        // Layer slicing related properties
        this.currentLayer = 0; // Current layer (Y axis)
        this.maxLayer = 0; // Maximum number of layers
        this.layerMode = false; // Whether in layer mode
        this.layerMeshes = []; // Meshes for each layer
        this.useExteriorOnly = true; // Default to show only exterior voxels
        
        // Touch handling properties
        this.isMobile = this.detectMobile();
        
        this.init();
    }

    /**
     * Detect if running on mobile device
     */
    detectMobile() {
        return (window.innerWidth <= 768) || 
               (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }

    /**
     * Initialize Three.js scene, camera, renderer
     */
    init() {
        console.log('Setting up Three.js scene...');
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x808080); // Changed to gray background 0x808080
        
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
            
            // Adjust controls for mobile
            if (this.isMobile) {
                this.controls.rotateSpeed = 0.5;
                this.controls.zoomSpeed = 1.2;
                this.controls.screenSpacePanning = true;
                this.controls.touches = {
                    ONE: THREE.TOUCH.ROTATE,
                    TWO: THREE.TOUCH.DOLLY_PAN
                };
            }
            
            console.log('OrbitControls initialized successfully');
        } catch (error) {
            console.error('Error initializing OrbitControls:', error);
        }
        
        // Add lighting
        this.setupLights();
        
        // Add grid based on configuration
        if (this.showGrid) {
            this.addGrid();
        }
        
        // Add coordinate axes based on configuration
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
        // Enhance ambient light intensity, use white light to maintain original colors
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        // Reduce main directional light intensity
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight1.position.set(1, 2, 3);
        this.scene.add(dirLight1);
        
        // Reduce secondary directional light intensity
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
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
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
     * Show or hide model wireframe
     * @param {boolean} show - Whether to show the wireframe
     */
    toggleModelWireframe(show) {
        console.log('Toggle grid display:', show);
        this.wireframeVisible = show;
        
        // If in Layer Mode
        if (this.layerMode) {
            // Remove all existing wireframes
            this.removeOverlayWireframe();
            
            // If grid display is not needed, return directly
            if (!show) return;
            
            // Check if there are visible layers
            let hasVisibleLayers = false;
            this.layerMeshes.forEach(layer => {
                if (layer.visible) {
                    hasVisibleLayers = true;
                }
            });
            
            if (!hasVisibleLayers) {
                console.log('No visible layers, cannot display grid');
                return;
            }
            
            // Create wireframes
            this.createLayerWireframes();
            return;
        }
        
        // Processing in non-Layer Mode
        // If there is no current model, return directly
        if (!this.modelMesh) {
            console.log('No model loaded, cannot display grid');
            return;
        }
        
        // Check if the model has voxels
        let hasVoxels = false;
        this.modelMesh.traverse(child => {
            if ((child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) && child.visible) {
                hasVoxels = true;
            }
        });
        
        if (!hasVoxels) {
            console.log('Model has no visible voxels, cannot display grid');
            return;
        }
        
        // If wireframe display is enabled, create wireframe; otherwise remove wireframe
        if (show) {
            this.createOverlayWireframe();
        } else {
            this.removeOverlayWireframe();
        }
    }
    
    /**
     * Create wireframes for Layer Mode
     */
    createLayerWireframes() {
        // Remove any existing wireframes
        this.removeOverlayWireframe();
        
        // Create wireframe group
        this.modelWireframe = new THREE.Group();
        
        // Loop through all visible layers
        this.layerMeshes.forEach(layer => {
            if (!layer.visible) return;
            
            // Create wireframes for each voxel in the layer
            layer.children.forEach(voxelMesh => {
                // Create edge geometry
                const edgesGeometry = new THREE.EdgesGeometry(voxelMesh.geometry);
                
                // Create wireframe
                const edges = new THREE.LineSegments(
                    edgesGeometry,
                    new THREE.LineBasicMaterial({
                        color: 0x000000,
                        opacity: 0.5,
                        transparent: true
                    })
                );
                
                // Copy transformation
                edges.position.copy(voxelMesh.position);
                edges.rotation.copy(voxelMesh.rotation);
                edges.scale.copy(voxelMesh.scale);
                
                this.modelWireframe.add(edges);
            });
        });
        
        // Add to scene
        if (this.modelWireframe.children.length > 0) {
            this.scene.add(this.modelWireframe);
            console.log('Layer wireframe mesh created, child elements count:', this.modelWireframe.children.length);
        } else {
            console.log('Failed to create any wireframes, check layer structure');
        }
    }
    
    /**
     * Create overlay wireframe
     */
    createOverlayWireframe() {
        // First remove any existing wireframes
        this.removeOverlayWireframe();
        
        if (!this.modelMesh) return;
        
        // Create wireframe group
        this.modelWireframe = new THREE.Group();
        
        // Loop through each mesh in the model
        this.modelMesh.traverse(child => {
            // Process instanced meshes
            if (child instanceof THREE.InstancedMesh) {
                // Prepare geometry
                const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
                const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
                
                // Create wireframe for each instance
                const count = child.count;
                const matrix = new THREE.Matrix4();
                
                for (let i = 0; i < count; i++) {
                    // Get instance matrix
                    child.getMatrixAt(i, matrix);
                    
                    // Create wireframe
                    const edges = new THREE.LineSegments(
                        edgesGeometry,
                        new THREE.LineBasicMaterial({
                            color: 0x000000,
                            opacity: 0.5,
                            transparent: true
                        })
                    );
                    
                    // Apply transformation
                    edges.applyMatrix4(matrix);
                    
                    // Apply instance position offset
                    edges.position.x += child.position.x;
                    edges.position.y += child.position.y;
                    edges.position.z += child.position.z;
                    
                    this.modelWireframe.add(edges);
                }
            }
            // Process regular meshes
            else if (child instanceof THREE.Mesh) {
                // Create edge geometry
                const edgesGeometry = new THREE.EdgesGeometry(child.geometry);
                
                // Create wireframe
                const edges = new THREE.LineSegments(
                    edgesGeometry,
                    new THREE.LineBasicMaterial({
                        color: 0x000000,
                        opacity: 0.5,
                        transparent: true
                    })
                );
                
                // Copy transformation
                edges.position.copy(child.position);
                edges.rotation.copy(child.rotation);
                edges.scale.copy(child.scale);
                
                this.modelWireframe.add(edges);
            }
        });
        
        // Add to scene
        if (this.modelWireframe.children.length > 0) {
            this.scene.add(this.modelWireframe);
            console.log('Layer wireframe mesh created, child elements count:', this.modelWireframe.children.length);
        } else {
            console.log('Failed to create any wireframes, check layer structure');
        }
    }
    
    /**
     * Remove wireframe
     */
    removeOverlayWireframe() {
        if (this.modelWireframe) {
            this.scene.remove(this.modelWireframe);
            this.modelWireframe = null;
            console.log('Wireframe mesh removed');
        }
    }

    /**
     * Load a model from the catalog
     */
    loadCatalogModel(modelId) {
        const modelInfo = getModelById(modelId);
        if (!modelInfo) {
            console.error('Model not found:', modelId);
            return false;
        }

        this.currentModelInfo = modelInfo;
        
        // Update info panel
        this.updateInfoPanel(modelInfo);
        
        // Show loading indicator
        const loadingIndicator = document.querySelector('.loading-indicator');
        loadingIndicator.style.display = 'block';
        
        // Ensure the filename has proper path and caching prevention
        const filename = modelInfo.filename;
        console.log(`Loading model from catalog: ${modelInfo.title} (${filename})`);
        
        // Add a timestamp to prevent caching issues
        const fileUrl = `${filename}?t=${Date.now()}`;
        
        // First try to load using fetch API
        this.loadModelWithFetch(fileUrl)
            .catch(fetchError => {
                console.warn('Fetch loading failed, trying XMLHttpRequest as fallback:', fetchError);
                // If fetch fails, try XMLHttpRequest as fallback
                return this.loadModelWithXHR(fileUrl);
            })
            .then(buffer => this.processModelBuffer(buffer, modelInfo, modelId))
            .catch(error => {
                loadingIndicator.style.display = 'none';
                console.error('Error loading model:', error);
                
                let errorMessage = error.message;
                
                // Provide more helpful error messages
                if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
                    errorMessage = 'Network error: Could not load the model file. This might be caused by CORS restrictions or the file not being accessible. Make sure you\'re running from a local server.';
                    console.error('Attempted to load file from:', fileUrl);
                    console.error('Current origin:', window.location.origin);
                    console.error('Try accessing this URL directly in your browser to check if the file is accessible.');
                } else if (error.message.includes('HTTP error')) {
                    errorMessage = `${error.message}. The model file could not be found or accessed.`;
                } else if (error.message.includes('empty buffer')) {
                    errorMessage = 'Received empty data from server. The model file might be corrupted or inaccessible.';
                }
                
                alert(`Error loading model: ${errorMessage}`);
            });
            
        return true;
    }
    
    /**
     * Load model file using fetch API
     */
    loadModelWithFetch(fileUrl) {
        return fetch(fileUrl, {
            method: 'GET',
            cache: 'no-cache',
        })
        .then(response => {
            console.log('Fetch response:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(buffer => {
            console.log('Loaded buffer with fetch, size:', buffer.byteLength);
            
            if (buffer.byteLength === 0) {
                throw new Error('Received empty buffer from server');
            }
            
            return buffer;
        });
    }
    
    /**
     * Load model file using XMLHttpRequest (fallback method)
     */
    loadModelWithXHR(fileUrl) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', fileUrl, true);
            xhr.responseType = 'arraybuffer';
            
            xhr.onload = function() {
                if (xhr.status === 200) {
                    console.log('Loaded buffer with XHR, size:', xhr.response.byteLength);
                    if (xhr.response.byteLength === 0) {
                        reject(new Error('Received empty buffer from server'));
                    } else {
                        resolve(xhr.response);
                    }
                } else {
                    reject(new Error(`HTTP error! Status: ${xhr.status}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('XHR request failed'));
            };
            
            xhr.send();
        });
    }
    
    /**
     * Process the loaded model buffer
     */
    processModelBuffer(buffer, modelInfo, modelId) {
        console.log('Processing model buffer, size:', buffer.byteLength);
        
        // Hide loading indicator
        const loadingIndicator = document.querySelector('.loading-indicator');
        
        // Save current Layer Mode state
        const wasInLayerMode = this.layerMode;
        
        // Before loading new model, clear the current model and all layer meshes
        this.clearCurrentModel();
        this.clearLayerMeshes();
        
        // Load new model
        const success = this.loadVoxFile(buffer);
        loadingIndicator.style.display = 'none';
        
        if (!success) {
            console.error('Failed to parse or render the model');
            throw new Error(`Unable to load model "${modelInfo.title}". Please check the console for details.`);
        }
        
        console.log('Model loaded and rendered successfully');
        
        // Highlight the currently selected model
        this.highlightSelectedModel(modelId);
        
        // If currently in Layer Mode, reapply Layer Mode and reset layers
        if (wasInLayerMode) {
            console.log('Reapplying Layer Mode and resetting layers for new model');
            // First turn off Layer Mode to clean old data
            this.toggleLayerMode(false);
            // Turn Layer Mode back on and automatically set to first layer
            this.toggleLayerMode(true);
            
            // Ensure only the first layer is visible
            if (this.layerMeshes && this.layerMeshes.length > 0) {
                // Hide all layers
                this.layerMeshes.forEach(layer => {
                    layer.visible = false;
                });
                
                // Show only first layer
                this.layerMeshes[0].visible = true;
                this.currentLayer = 0;
                
                // Update layer info
                this.updateLayerInfoDisplay();
            }
        }
        
        // If set to display grid, apply grid
        if (this.wireframeVisible) {
            this.toggleModelWireframe(true);
        }
        
        return true;
    }

    /**
     * Update the information panel with the current model info
     */
    updateInfoPanel(modelInfo) {
        const titleElement = document.getElementById('current-model-title');
        const descElement = document.getElementById('current-model-desc');
        
        if (modelInfo) {
            titleElement.textContent = modelInfo.title;
            descElement.textContent = modelInfo.description;
        } else {
            titleElement.textContent = 'No Model Selected';
            descElement.textContent = 'Select a model from the list on the left to view it.';
        }
    }

    /**
     * Highlight the currently selected model item
     */
    highlightSelectedModel(modelId) {
        // Remove highlighting from all model items
        const modelItems = document.querySelectorAll('.model-item');
        modelItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add highlighting to the currently selected model
        const selectedItem = document.querySelector(`.model-item[data-model-id="${modelId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
    }

    /**
     * Load a VOX file from an ArrayBuffer
     */
    loadVoxFile(buffer) {
        try {
            if (!buffer || buffer.byteLength === 0) {
                console.error('Empty buffer received');
                return false;
            }
            
            console.log('Loading VOX file, buffer size:', buffer.byteLength);
            console.log('Buffer type:', Object.prototype.toString.call(buffer));
            console.log('First few bytes:', new Uint8Array(buffer).slice(0, 10));
            
            // Clear any existing model and wireframe before loading new one
            this.clearCurrentModel();
            this.clearLayerMeshes();
            
            // Parse the VOX file
            console.log('Parsing VOX file...');
            try {
                this.currentModel = this.voxParser.parse(buffer);
                console.log('Model parsed successfully:', this.currentModel);
                
                // Verify model data
                if (!this.currentModel || !this.currentModel.models || this.currentModel.models.length === 0) {
                    console.error('Parser returned empty model data');
                    return false;
                }
                
                // Render the model
                console.log('Rendering model...');
                this.renderModel(this.currentModel);
                
                // Adjust camera position based on model size
                this.focusCameraOnModel();
                console.log('Model loaded and displayed successfully');
                
                return true;
            } catch (parseError) {
                console.error('Error parsing VOX file:', parseError);
                return false;
            }
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
        
        // Clear any existing model and layers first
        this.clearCurrentModel();
        this.clearLayerMeshes();
        
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
            
            // Calculate max layer
            this.maxLayer = modelData.size.z;
        });
        
        // Add the model group to the scene
        this.scene.add(modelGroup);
        this.modelMesh = modelGroup;
        
        // If in layer mode, process the layers
        if (this.layerMode) {
            this.sliceModelIntoLayers();
        }
        
        // Apply wireframe if needed
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
        console.log('Clearing current model and disposing resources');
        
        // Clear wireframe
        this.removeOverlayWireframe();
        
        // Clear model
        if (this.modelMesh) {
            // Properly dispose of geometries and materials
            this.modelMesh.traverse(child => {
                if (child.geometry) {
                    child.geometry.dispose();
                    console.log('Disposed geometry');
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.dispose();
                            console.log('Disposed array material');
                        });
                    } else {
                        child.material.dispose();
                        console.log('Disposed material');
                    }
                }
            });
            
            // Remove from scene
            this.scene.remove(this.modelMesh);
            this.modelMesh = null;
            console.log('Removed model mesh from scene');
        }
    }

    /**
     * Position the camera to focus on the model
     */
    focusCameraOnModel() {
        if (!this.currentModel || !this.currentModel.models || this.currentModel.models.length === 0) {
            return;
        }
        
        // 计算模型的最大尺寸
        let maxSize = 0;
        this.currentModel.models.forEach(model => {
            maxSize = Math.max(maxSize, model.size.x, model.size.y, model.size.z);
        });
        
        // 基础距离
        const distance = maxSize * 2;
        
        // 设置相机位置 - 现在设置面板在底部，不再需要特别向下偏移
        this.camera.position.set(distance, distance, distance);
        this.controls.target.set(0, 0, 0);
        
        this.camera.lookAt(this.controls.target);
        this.controls.update();
    }

    /**
     * Slice the model into layers for layer-by-layer viewing
     * @param {boolean} exteriorOnly - Whether to only show exterior voxels
     */
    sliceModelIntoLayers(exteriorOnly = true) {
        if (!this.currentModel || !this.currentModel.models || this.currentModel.models.length === 0) {
            return;
        }
        
        // Clear existing layers first - ensure complete cleanup
        this.clearLayerMeshes();
        console.log("Cleared all existing layer meshes before slicing new layers");
        
        console.log("Slicing model into layers, exterior only:", exteriorOnly);
        
        // Group voxels by z-coordinate (height)
        const layerVoxels = {};
        
        // Sort voxels into layers
        this.currentModel.models.forEach(model => {
            model.voxels.forEach(voxel => {
                if (!layerVoxels[voxel.z]) {
                    layerVoxels[voxel.z] = [];
                }
                layerVoxels[voxel.z].push(voxel);
            });
        });
        
        // Create a mesh for each layer
        const layers = Object.keys(layerVoxels).sort((a, b) => a - b);
        
        // Filter layers by exterior only if needed
        if (exteriorOnly) {
            // Identify exterior voxels for each layer
            const zLayers = Object.keys(layerVoxels).map(z => parseInt(z));
            const minZ = Math.min(...zLayers);
            const maxZ = Math.max(...zLayers);
            
            // 创建完整的模型体素映射，用于检查和处理
            const fullVoxelMap = {};
            this.currentModel.models.forEach(model => {
                model.voxels.forEach(voxel => {
                    const key = `${voxel.x},${voxel.y},${voxel.z}`;
                    fullVoxelMap[key] = voxel;
                });
            });
            
            for (let z = minZ; z <= maxZ; z++) {
                const layerZ = z;
                if (!layerVoxels[layerZ]) continue;
                
                // Create a map of voxels in this layer for quick access
                const layerVoxelMap = {};
                layerVoxels[layerZ].forEach(voxel => {
                    const key = `${voxel.x},${voxel.y}`;
                    layerVoxelMap[key] = voxel;
                });
                
                // 创建一个包含所有体素的映射
                const voxelMap = {};
                this.currentModel.models.forEach(model => {
                    model.voxels.forEach(voxel => {
                        const key = `${voxel.x},${voxel.y},${voxel.z}`;
                        voxelMap[key] = voxel;
                    });
                });
                
                // 保留最底部的两层：如果当前层是最底层或次底层，则保留所有体素，不做精简
                if (layerZ === minZ || layerZ === minZ + 1) {
                    console.log(`Layer ${layerZ}: preserving bottom layer (${layerVoxels[layerZ].length} voxels)`);
                    // 底部两层不做精简，直接处理下一层
                    continue;
                }
                
                // 获取该层的原始体素数量
                const originalVoxelCount = layerVoxels[layerZ].length;
                
                // 检查模型在这一层的厚度
                let maxThickness = 0;
                const checkedPositions = new Set();
                
                // 遍历该层的所有体素计算厚度
                layerVoxels[layerZ].forEach(voxel => {
                    // 如果已经检查过这个位置，跳过
                    const posKey = `${voxel.x},${voxel.y}`;
                    if (checkedPositions.has(posKey)) return;
                    checkedPositions.add(posKey);
                    
                    // 计算X方向的厚度
                    let xThickness = 1;
                    let x = voxel.x + 1;
                    while (voxelMap[`${x},${voxel.y},${voxel.z}`]) {
                        xThickness++;
                        x++;
                    }
                    x = voxel.x - 1;
                    while (voxelMap[`${x},${voxel.y},${voxel.z}`]) {
                        xThickness++;
                        x--;
                    }
                    
                    // 计算Y方向的厚度
                    let yThickness = 1;
                    let y = voxel.y + 1;
                    while (voxelMap[`${voxel.x},${y},${voxel.z}`]) {
                        yThickness++;
                        y++;
                    }
                    y = voxel.y - 1;
                    while (voxelMap[`${voxel.x},${y},${voxel.z}`]) {
                        yThickness++;
                        y--;
                    }
                    
                    // 取该位置X和Y方向厚度的最小值作为该点的厚度
                    const thickness = Math.min(xThickness, yThickness);
                    maxThickness = Math.max(maxThickness, thickness);
                });
                
                // 如果模型厚度小于4个体素，不进行精简
                if (maxThickness < 4) {
                    console.log(`Layer ${layerZ}: model thickness is only ${maxThickness} voxels, keeping original (${originalVoxelCount} voxels)`);
                    continue;
                }
                
                // 执行精简，但保证至少保留2层厚度
                const exteriorVoxels = [];
                const interiorVoxels = [];
                
                // 首先确定哪些是外部体素（第一层）
                const firstLayerExteriorVoxels = this.identifyExteriorVoxels(layerVoxels[layerZ], layerVoxelMap, voxelMap);
                
                // 将外部体素加入结果集
                exteriorVoxels.push(...firstLayerExteriorVoxels);
                
                // 创建外部体素的映射，用于快速查找
                const exteriorVoxelMap = {};
                firstLayerExteriorVoxels.forEach(voxel => {
                    const key = `${voxel.x},${voxel.y},${voxel.z}`;
                    exteriorVoxelMap[key] = voxel;
                });
                
                // 找出所有非外部体素（内部体素）
                layerVoxels[layerZ].forEach(voxel => {
                    const key = `${voxel.x},${voxel.y},${voxel.z}`;
                    if (!exteriorVoxelMap[key]) {
                        interiorVoxels.push(voxel);
                    }
                });
                
                // 从内部体素中找出紧邻外部体素的第二层
                const secondLayerVoxels = [];
                const directions = [
                    { dx: 0, dy: 1, dz: 0 },   // 前
                    { dx: 0, dy: -1, dz: 0 },  // 后
                    { dx: 1, dy: 0, dz: 0 },   // 右
                    { dx: -1, dy: 0, dz: 0 },  // 左
                ];
                
                interiorVoxels.forEach(voxel => {
                    // 检查是否与任何外部体素相邻
                    let adjacentToExterior = false;
                    for (const dir of directions) {
                        const nx = voxel.x + dir.dx;
                        const ny = voxel.y + dir.dy;
                        const nz = voxel.z;
                        
                        const neighborKey = `${nx},${ny},${nz}`;
                        if (exteriorVoxelMap[neighborKey]) {
                            adjacentToExterior = true;
                            break;
                        }
                    }
                    
                    // 如果与外部体素相邻，加入第二层
                    if (adjacentToExterior) {
                        secondLayerVoxels.push(voxel);
                    }
                });
                
                // 将第二层体素加入结果集
                exteriorVoxels.push(...secondLayerVoxels);
                
                // 检查精简后的体素数量
                if (exteriorVoxels.length <= 4 && originalVoxelCount > exteriorVoxels.length) {
                    // 如果精简后体素数量小于或等于4且少于原始数量，保留原始层
                    console.log(`Layer ${layerZ}: keeping original voxels (${originalVoxelCount}) instead of exterior only (${exteriorVoxels.length})`);
                    // 不需要做任何修改，layerVoxels[layerZ]保持原样
                } else {
                    // 精简后体素数量大于4，使用包含至少2层厚度的精简结果
                    console.log(`Layer ${layerZ}: using voxels with 2-layer thickness (${exteriorVoxels.length} of ${originalVoxelCount})`);
                    layerVoxels[layerZ] = exteriorVoxels;
                }
            }
        }
        
        // Create a mesh for each layer
        let visibleLayerCount = 0;
        layers.forEach(z => {
            const voxels = layerVoxels[z];
            if (voxels && voxels.length > 0) {
                const layerMesh = this.createLayerMesh(voxels, parseInt(z));
                this.scene.add(layerMesh);
                this.layerMeshes.push(layerMesh);
                visibleLayerCount++;
            }
        });
        
        console.log(`Created ${visibleLayerCount} visible layers from ${layers.length} total layers`);
        
        // Update UI to show layer controls if needed
        this.updateLayerControls(layers);
        
        // Focus camera on the model
        this.focusCameraOnModel();
    }
    
    /**
     * Identify exterior voxels in a layer
     * Only returns voxels that are on the exterior of the model
     */
    identifyExteriorVoxels(layerVoxels, layerVoxelMap, voxelMap) {
        if (!layerVoxels || layerVoxels.length === 0) return [];
        
        // A voxel is exterior if at least one of its 6 faces is exposed
        // (meaning there's no voxel in that direction)
        const exteriorVoxels = [];
        
        // Neighbor directions: up, down, left, right, forward, backward
        const directions = [
            { dx: 0, dy: 0, dz: 1 },  // top
            { dx: 0, dy: 0, dz: -1 }, // bottom
            { dx: 0, dy: 1, dz: 0 },  // front
            { dx: 0, dy: -1, dz: 0 }, // back
            { dx: 1, dy: 0, dz: 0 },  // right
            { dx: -1, dy: 0, dz: 0 }  // left
        ];
        
        // Check each voxel
        layerVoxels.forEach(voxel => {
            // Check if at least one face is exposed
            let isExterior = false;
            
            for (const dir of directions) {
                const nx = voxel.x + dir.dx;
                const ny = voxel.y + dir.dy;
                const nz = voxel.z + dir.dz;
                
                // Check if there's a neighbor in this direction
                const neighborKey = `${nx},${ny},${nz}`;
                if (!voxelMap[neighborKey]) {
                    // No neighbor in this direction means this face is exposed
                    isExterior = true;
                    break;
                }
            }
            
            if (isExterior) {
                exteriorVoxels.push(voxel);
            }
        });
        
        return exteriorVoxels;
    }
    
    /**
     * Reset layer visibility (show only the first layer)
     */
    resetLayerVisibility() {
        if (!this.layerMeshes || this.layerMeshes.length === 0) return;
        
        // Make all layers invisible
        this.layerMeshes.forEach(layer => {
            layer.visible = false;
        });
        
        // Reset current layer to 0 (first layer)
        this.currentLayer = 0;
        
        // Show only the first layer
        if (this.layerMeshes.length > 0) {
            this.layerMeshes[0].visible = true;
        }
        
        // Update layer info display
        this.updateLayerInfoDisplay();
        
        // If grid is visible, update grid
        if (this.wireframeVisible) {
            // First remove old grid
            this.removeOverlayWireframe();
            // Create new grid
            this.createLayerWireframes();
        }
    }
    
    /**
     * Clear layer meshes
     */
    clearLayerMeshes() {
        console.log(`Clearing ${this.layerMeshes.length} layer meshes`);
        
        // Remove all layer meshes from scene
        this.layerMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            // Dispose geometries and materials to prevent memory leaks
            if (mesh.children) {
                mesh.children.forEach(child => {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => mat.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
        });
        
        // Reset arrays
        this.layerMeshes = [];
        this.currentLayer = 0;
    }
    
    /**
     * Set the current layer
     * @param {number} layerIndex - Index of the layer to display
     * @param {boolean} isNext - Whether we're going forward (true) or backward (false)
     */
    setCurrentLayer(layerIndex, isNext = true) {
        // Ensure layer index is valid
        if (this.layerMeshes.length === 0) {
            return;
        }
        
        // Clamp layer index to valid range
        layerIndex = Math.max(0, Math.min(this.layerMeshes.length - 1, layerIndex));
        
        if (isNext) {
            // When going forward (Next Layer), keep previous layers visible
            // Just make the new layer visible
            if (this.layerMeshes[layerIndex]) {
                this.layerMeshes[layerIndex].visible = true;
            }
        } else {
            // When going backward (Previous Layer), hide the current layer
            if (this.currentLayer < this.layerMeshes.length) {
                this.layerMeshes[this.currentLayer].visible = false;
            }
        }
        
        // Update current layer index
        this.currentLayer = layerIndex;
        
        // Update layer info display
        this.updateLayerInfoDisplay();
        
        // If grid is visible, update grid
        if (this.wireframeVisible) {
            // First remove old grid
            this.removeOverlayWireframe();
            // Create new grid
            this.createLayerWireframes();
        }
    }
    
    /**
     * Move to the next layer
     */
    nextLayer() {
        if (this.currentLayer < this.layerMeshes.length - 1) {
            this.setCurrentLayer(this.currentLayer + 1, true);
        }
    }
    
    /**
     * Move to the previous layer
     */
    prevLayer() {
        if (this.currentLayer > 0) {
            this.setCurrentLayer(this.currentLayer - 1, false);
        }
    }
    
    /**
     * Toggle layer mode on/off
     * @param {boolean} enabled - Whether to enable layer mode
     */
    toggleLayerMode(enabled) {
        if (enabled !== undefined) {
            this.layerMode = enabled;
        } else {
            this.layerMode = !this.layerMode;
        }
        
        const layerControls = document.getElementById('layer-controls');
        const toggleButton = document.getElementById('toggle-layer-btn');
        
        if (this.layerMode) {
            // Enable layer mode
            if (layerControls) layerControls.style.display = 'flex';
            if (toggleButton) toggleButton.classList.add('active');
            
            // Hide the main model
            if (this.modelMesh) this.modelMesh.visible = false;
            
            // Clear any existing layer meshes first
            this.clearLayerMeshes();
            
            // Slice the model and show the first layer
            this.sliceModelIntoLayers(this.useExteriorOnly);
            
            // Update layer controls
            if (this.layerMeshes && this.layerMeshes.length > 0) {
                // Update layer UI controls
                this.updateLayerControls(Object.keys(this.layerMeshes));
                
                // Hide all layers first
                this.layerMeshes.forEach(layer => {
                    layer.visible = false;
                });
                
                // Show only the first layer
                if (this.layerMeshes[0]) {
                    this.layerMeshes[0].visible = true;
                    this.currentLayer = 0;
                }
                
                // Update layer info display
                this.updateLayerInfoDisplay();
            }
        } else {
            // Disable layer mode
            if (layerControls) layerControls.style.display = 'none';
            if (toggleButton) toggleButton.classList.remove('active');
            
            // Show the main model
            if (this.modelMesh) this.modelMesh.visible = true;
            
            // Clear all layer meshes
            this.clearLayerMeshes();
        }
        
        // Update wireframe display
        if (this.wireframeVisible) {
            this.toggleModelWireframe(true);
        }
    }
    
    /**
     * Update layer information display
     */
    updateLayerInfoDisplay() {
        const layerInfo = document.getElementById('layer-info');
        if (layerInfo) {
            layerInfo.textContent = `Layer: ${this.currentLayer + 1}/${this.layerMeshes.length}`;
        }
    }

    /**
     * Evaluate the importance of a voxel
     * @param {Object} voxel - The voxel to evaluate
     * @param {Array} layerVoxels - All voxels in the same layer
     * @param {Map} voxelMap - Map of all voxels
     * @return {number} Importance score
     */
    evaluateVoxelImportance(voxel, layerVoxels, voxelMap) {
        let score = 0;
        
        // 1. Check if there is support from the layer below - voxels with support are more important
        const belowKey = `${voxel.x},${voxel.y},${voxel.z-1}`;
        if (voxelMap.has(belowKey)) {
            score += 5;
        }
        
        // 2. Check if there is load from the layer above - voxels supporting the layer above are more important
        const aboveKey = `${voxel.x},${voxel.y},${voxel.z+1}`;
        if (voxelMap.has(aboveKey)) {
            score += 5;
        }
        
        // 3. Number of horizontal connections - voxels connected to more others are more important
        const horizontalDirections = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // back
            { dx: 0, dy: 1 }   // front
        ];
        
        let connectionCount = 0;
        horizontalDirections.forEach(dir => {
            const nx = voxel.x + dir.dx;
            const ny = voxel.y + dir.dy;
            const neighborKey = `${nx},${ny},${voxel.z}`;
            
            // Check if there are adjacent voxels in the same layer
            if (voxelMap.has(neighborKey)) {
                connectionCount++;
                // If the adjacent voxel is an exterior voxel, connection to exterior voxels is more important
                const neighbor = voxelMap.get(neighborKey);
                if (!layerVoxels.find(v => 
                    v.x === nx && v.y === ny && v.z === voxel.z && v.isInterior)) {
                    score += 3;
                }
            }
        });
        
        score += connectionCount * 2;
        
        // 4. Edge voxels are more important (closer to model edge)
        const exteriorVoxels = layerVoxels.filter(v => !v.isInterior);
        if (exteriorVoxels.length > 0) {
            // Find the distance to the nearest exterior voxel
            let minDistance = Number.MAX_VALUE;
            exteriorVoxels.forEach(extVoxel => {
                const distance = Math.sqrt(
                    Math.pow(voxel.x - extVoxel.x, 2) + 
                    Math.pow(voxel.y - extVoxel.y, 2));
                minDistance = Math.min(minDistance, distance);
            });
            
            // The closer the distance, the higher the score (inverse relationship)
            score += 10 / (minDistance + 1);
        }
        
        return score;
    }

    /**
     * Generate a connection path between two points
     * This method is no longer used as we're not adding voxels
     */
    generatePath(from, to, layerZ, layerVoxelMap, voxelMap) {
        // Return empty array as we don't want to add voxels
        return [];
    }

    /**
     * Create a mesh for a specific layer of voxels
     * @param {Array} voxels - Voxels in this layer
     * @param {number} layerZ - The z-coordinate of this layer
     * @returns {THREE.Group} The layer mesh group
     */
    createLayerMesh(voxels, layerZ) {
        const layerGroup = new THREE.Group();
        layerGroup.userData.layer = layerZ;
        
        // Get the model palette
        const palette = this.currentModel.palette;
        
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
        
        // Create a box geometry for the voxels
        const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Create mesh for each voxel
        voxels.forEach(voxel => {
            if (voxel.colorIndex === 0) return; // Skip transparent voxels
            
            const material = materials[voxel.colorIndex];
            const voxelMesh = new THREE.Mesh(voxelGeometry, material);
            
            // Position the voxel (center the model)
            const modelSize = this.currentModel.models[0].size;
            voxelMesh.position.set(
                voxel.x - modelSize.x / 2, 
                voxel.z, // Y is up in Three.js, Z is up in MagicaVoxel
                voxel.y - modelSize.y / 2
            );
            
            // Store original voxel data in userData
            voxelMesh.userData.voxel = voxel;
            
            layerGroup.add(voxelMesh);
        });
        
        // Make layer invisible initially
        layerGroup.visible = false;
        
        return layerGroup;
    }
    
    /**
     * Update the layer controls in the UI
     * @param {Array} layers - Array of layer indices
     */
    updateLayerControls(layers) {
        if (!layers || layers.length === 0) return;
        
        // Reset layer visibility - ensure only first layer is visible
        this.layerMeshes.forEach((layer, index) => {
            layer.visible = index === 0;
        });
        
        // Reset current layer to 0
        this.currentLayer = 0;
        
        // Update layer slider max value
        const layerSlider = document.getElementById('layer-slider');
        if (layerSlider) {
            layerSlider.max = this.layerMeshes.length - 1;
            layerSlider.value = 0;
            
            // Update layer display for initial value
            this.onLayerSliderChange({target: {value: 0}});
        }
        
        // Update layer info display
        this.updateLayerInfoDisplay();
    }

    /**
     * Handle layer slider change event
     * @param {Event} event - The slider change event
     */
    onLayerSliderChange(event) {
        const layerIndex = parseInt(event.target.value);
        const layerIndicator = document.getElementById('layer-indicator');
        
        if (layerIndicator) {
            layerIndicator.textContent = `Layer: ${layerIndex + 1}/${this.layerMeshes.length}`;
        }
        
        // First, reset visibility - hide all layers
        this.layerMeshes.forEach(layer => {
            layer.visible = false;
        });
        
        // Then show layers from 0 to the current index (inclusive)
        for (let i = 0; i <= layerIndex; i++) {
            if (this.layerMeshes[i]) {
                this.layerMeshes[i].visible = true;
            }
        }
        
        // Set current layer
        this.currentLayer = layerIndex;
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}

/**
 * Create model list UI
 */
function createModelList(container, viewer) {
    console.log('Creating model list...');
    
    // Clear container
    container.innerHTML = '';
    
    // Create model items
    MODELS_CATALOG.forEach(model => {
        const modelItem = document.createElement('div');
        modelItem.className = 'model-item';
        modelItem.dataset.modelId = model.id;
        
        const modelTitle = document.createElement('div');
        modelTitle.className = 'model-title';
        modelTitle.textContent = model.title;
        
        const modelDesc = document.createElement('div');
        modelDesc.className = 'model-desc';
        modelDesc.textContent = model.description;
        
        modelItem.appendChild(modelTitle);
        modelItem.appendChild(modelDesc);
        
        // Handle click to load model
        modelItem.addEventListener('click', () => {
            viewer.loadCatalogModel(model.id);
            viewer.highlightSelectedModel(model.id);
            
            // Close model list on mobile after selection
            if (viewer.isMobile) {
                document.getElementById('model-list').classList.remove('open');
                document.getElementById('menu-overlay').classList.remove('active');
            }
        });
        
        container.appendChild(modelItem);
    });
}

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing application...');
    
    // Get containers
    const canvasContainer = document.getElementById('canvas-container');
    const modelListContainer = document.getElementById('model-list');
    
    // Create viewer
    const viewer = new VoxViewer(canvasContainer);
    
    // Make viewer globally accessible for mobile.js
    window.viewer = viewer;
    
    // Populate model list
    createModelList(modelListContainer, viewer);
    
    // Set up toggle handlers
    const gridToggle = document.getElementById('grid-toggle');
    const layerToggle = document.getElementById('layer-toggle');
    const exteriorToggle = document.getElementById('exterior-toggle');
    
    // Ensure exterior toggle is checked by default
    exteriorToggle.checked = true;
    
    // Grid toggle
    gridToggle.addEventListener('change', (event) => {
        viewer.toggleModelWireframe(event.target.checked);
    });
    
    // Layer mode toggle
    layerToggle.addEventListener('change', (event) => {
        viewer.toggleLayerMode(event.target.checked);
    });
    
    // Exterior only toggle
    exteriorToggle.addEventListener('change', (event) => {
        // 更新视图对象的useExteriorOnly属性
        viewer.useExteriorOnly = event.target.checked;
        
        if (viewer.layerMode) {
            // Re-slice model with new exterior setting
            viewer.sliceModelIntoLayers(event.target.checked);
        }
    });
    
    // Layer navigation buttons
    const prevLayerBtn = document.getElementById('prev-layer');
    const nextLayerBtn = document.getElementById('next-layer');
    const resetLayerBtn = document.getElementById('reset-layer');
    
    prevLayerBtn.addEventListener('click', () => {
        viewer.prevLayer();
    });
    
    nextLayerBtn.addEventListener('click', () => {
        viewer.nextLayer();
    });
    
    resetLayerBtn.addEventListener('click', () => {
        viewer.setCurrentLayer(0);
    });
    
    // Load a default model if available
    if (MODELS_CATALOG.length > 0) {
        const defaultModel = MODELS_CATALOG[0];
        viewer.loadCatalogModel(defaultModel.id);
        viewer.highlightSelectedModel(defaultModel.id);
    }
}); 