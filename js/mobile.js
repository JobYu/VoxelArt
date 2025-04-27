/**
 * Mobile-specific functionality for Voxel Viewer
 */
document.addEventListener('DOMContentLoaded', () => {
    // Mobile elements
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const modelList = document.getElementById('model-list');
    const viewControls = document.getElementById('view-controls');
    const infoPanel = document.getElementById('info-panel');
    const overlay = document.getElementById('menu-overlay');
    
    // Mobile control buttons
    const mobileModelsBtn = document.getElementById('mobile-models-btn');
    const mobileSettingsBtn = document.getElementById('mobile-settings-btn');
    const mobileInfoBtn = document.getElementById('mobile-info-btn');
    
    // Layer toggle handler (moved from index.html)
    const layerToggle = document.getElementById('layer-toggle');
    const layerControls = document.getElementById('layer-controls');
    const exteriorToggle = document.getElementById('exterior-toggle');
    
    // 确保Exterior Only开关始终处于开启状态
    exteriorToggle.checked = true;
    
    layerToggle.addEventListener('change', (event) => {
        layerControls.style.display = event.target.checked ? 'flex' : 'none';
    });
    
    // Touch events for mobile
    let touchStartY = 0;
    
    // Mobile menu button toggle
    mobileMenuButton.addEventListener('click', () => {
        modelList.classList.toggle('open');
        overlay.classList.toggle('active');
        
        // Close other panels when opening menu
        viewControls.classList.remove('open');
        viewControls.classList.add('closed');
        infoPanel.classList.remove('open');
    });
    
    // Mobile models button
    mobileModelsBtn.addEventListener('click', () => {
        modelList.classList.toggle('open');
        overlay.classList.toggle('active');
        
        // 关闭其他面板
        viewControls.classList.remove('open');
        viewControls.classList.add('closed');
        infoPanel.classList.remove('open');
    });
    
    // Mobile settings button
    mobileSettingsBtn.addEventListener('click', () => {
        // 切换设置面板的显示状态
        if (viewControls.classList.contains('open')) {
            viewControls.classList.remove('open');
            viewControls.classList.add('closed');
        } else {
            viewControls.classList.remove('closed');
            viewControls.classList.add('open');
        }
        
        // 不再使用overlay覆盖整个屏幕
        // 关闭其他面板
        modelList.classList.remove('open');
        infoPanel.classList.remove('open');
        
        // 仅在打开模型列表和信息面板时显示overlay
        if (modelList.classList.contains('open') || infoPanel.classList.contains('open')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    });
    
    // Mobile info button
    mobileInfoBtn.addEventListener('click', () => {
        infoPanel.classList.toggle('open');
        
        // 关闭其他面板
        modelList.classList.remove('open');
        viewControls.classList.remove('open');
        viewControls.classList.add('closed');
        
        // 仅当信息面板打开时激活overlay
        if (infoPanel.classList.contains('open')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    });
    
    // Info panel toggle (swipe up/down)
    const infoToggle = document.getElementById('info-toggle');
    
    infoToggle.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });
    
    infoToggle.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent scrolling while dragging
    });
    
    infoToggle.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        
        // Swipe up to open, swipe down to close
        if (diff > 30) { // Swipe up
            infoPanel.classList.add('open');
        } else if (diff < -30) { // Swipe down
            infoPanel.classList.remove('open');
        }
    });
    
    // 修改overlay点击处理，当点击overlay且viewControls是打开状态时不要关闭viewControls
    overlay.addEventListener('click', (e) => {
        // 如果点击事件的目标元素是overlay自身，而不是其中包含的元素
        if (e.target === overlay) {
            // 关闭model列表和info面板
            modelList.classList.remove('open');
            infoPanel.classList.remove('open');
            overlay.classList.remove('active');
        }
    });
    
    // 防止设置面板内的点击事件传播到overlay
    viewControls.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        // Force redraw after orientation change
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 200);
    });
    
    // Fix: Add model selection handling for mobile views
    const setupModelListHandling = () => {
        // Find all model items in the list
        const modelItems = document.querySelectorAll('.model-item');
        
        modelItems.forEach(item => {
            // Remove any existing click listeners to avoid duplicates
            const clone = item.cloneNode(true);
            item.parentNode.replaceChild(clone, item);
            
            // Add new click listener that closes the panel after selection
            clone.addEventListener('click', () => {
                const modelId = clone.dataset.modelId;
                
                // Load the model
                if (window.viewer) {
                    window.viewer.loadCatalogModel(modelId);
                    window.viewer.highlightSelectedModel(modelId);
                }
                
                // Close model list panel and overlay
                modelList.classList.remove('open');
                overlay.classList.remove('active');
            });
        });
    };
    
    // Fix: Make view controls panel clickable on mobile
    const fixViewControlsInteractivity = () => {
        // Fix toggle controls interactivity
        const toggleControls = viewControls.querySelectorAll('.toggle-control');
        toggleControls.forEach(control => {
            // Find the checkbox input and label inside this toggle control
            const input = control.querySelector('input[type="checkbox"]');
            const label = control.querySelector('label');
            
            if (input && label) {
                // Make the entire toggle control area clickable
                control.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Toggle the checkbox
                    input.checked = !input.checked;
                    // Trigger change event to ensure event handlers execute
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                });
                
                // Ensure label click works properly
                label.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Let the native label behavior work
                });
                
                // Prevent direct input clicks from being processed twice
                input.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
        });
        
        // Make all buttons inside layer-controls clickable
        const controlButtons = viewControls.querySelectorAll('.control-btn');
        controlButtons.forEach(button => {
            button.addEventListener('click', e => {
                e.stopPropagation();
            });
        });
    };
    
    // Run both fixes
    setupModelListHandling();
    fixViewControlsInteractivity();
    
    // Also run the model list setup when models are loaded
    // This ensures it works even if models are loaded dynamically
    if (window.viewer) {
        // Create a MutationObserver to watch for changes to the model list
        const modelListObserver = new MutationObserver(() => {
            setupModelListHandling();
        });
        
        // Start observing the model list for changes
        modelListObserver.observe(modelList, { childList: true, subtree: true });
    }
    
    // Adjust touch sensitivity for controls on mobile
    if (isMobileDevice()) {
        // Add pinch-to-zoom support if OrbitControls support it
        if (window.viewer && window.viewer.controls) {
            window.viewer.controls.enablePan = true;
            window.viewer.controls.enableZoom = true;
            window.viewer.controls.rotateSpeed = 0.5; // Slower rotation for better control
            window.viewer.controls.zoomSpeed = 1.2;
        }
    }
    
    // Helper function to detect mobile devices
    function isMobileDevice() {
        return (window.innerWidth <= 768) || 
               (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }
}); 