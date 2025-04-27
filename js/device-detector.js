/**
 * Device Detector - Redirect mobile users to mobile page 
 */
(function() {
    // Check if running on mobile device
    function isMobileDevice() {
        // Use both viewport width and user agent detection for better accuracy
        const isMobileViewport = window.innerWidth <= 768;
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        return isMobileViewport || isMobileUserAgent;
    }
    
    // Check if this is the mobile page
    function isMobilePage() {
        return window.location.pathname.endsWith('/mobile.html');
    }
    
    // Main index page
    function isMainPage() {
        const path = window.location.pathname;
        return path.endsWith('/index.html') || path.endsWith('/') || path === '';
    }
    
    // Redirect logic
    function handleRedirect() {
        const isMobile = isMobileDevice();
        
        // If mobile device and on main page, redirect to mobile page
        if (isMobile && isMainPage()) {
            window.location.href = 'mobile.html';
        }
        
        // If desktop device and on mobile page, redirect to main page
        if (!isMobile && isMobilePage()) {
            window.location.href = 'index.html';
        }
    }
    
    // Add link to switch between views
    function addViewToggle() {
        const isMobile = isMobileDevice();
        
        // Only show the toggle in specific cases:
        // 1. On mobile page but user is on desktop - show "Switch to Desktop"
        // 2. On desktop page but user explicitly wants mobile - show "Switch to Mobile"
        if ((isMobilePage() && !isMobile) || 
            (!isMobilePage() && localStorage.getItem('preferMobile') === 'true')) {
            
            // Create toggle element
            const toggle = document.createElement('div');
            toggle.style.position = 'fixed';
            toggle.style.bottom = '50px';
            toggle.style.right = '10px';
            toggle.style.background = 'rgba(51, 93, 255, 0.8)';
            toggle.style.color = 'white';
            toggle.style.padding = '8px 12px';
            toggle.style.borderRadius = '5px';
            toggle.style.fontSize = '12px';
            toggle.style.cursor = 'pointer';
            toggle.style.zIndex = '9999';
            toggle.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
            
            // Set text based on current page
            if (isMobilePage()) {
                toggle.textContent = 'Switch to Desktop View';
                toggle.onclick = function() {
                    localStorage.setItem('preferDesktop', 'true');
                    window.location.href = 'index.html';
                };
            } else {
                toggle.textContent = 'Switch to Mobile View';
                toggle.onclick = function() {
                    localStorage.setItem('preferMobile', 'true');
                    window.location.href = 'mobile.html';
                };
            }
            
            document.body.appendChild(toggle);
        }
    }
    
    // Check for user preferences
    function checkUserPreference() {
        // Honor user's explicit preference
        if (localStorage.getItem('preferDesktop') === 'true' && isMobilePage()) {
            window.location.href = 'index.html';
            return true;
        }
        
        if (localStorage.getItem('preferMobile') === 'true' && isMainPage()) {
            window.location.href = 'mobile.html';
            return true;
        }
        
        return false;
    }
    
    // Run on page load
    document.addEventListener('DOMContentLoaded', function() {
        // First check if user has explicitly chosen a view
        if (!checkUserPreference()) {
            // If no preference set, use automatic redirection
            handleRedirect();
        }
        
        // Add view toggle button
        addViewToggle();
    });
})(); 