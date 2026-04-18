// logout.js - Full working logout functionality
(async function performLogout() {
    console.log('Logout process started...');
    
    try {
        // Step 1: Call logout API
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Logout API response status:', response.status);
        
        // Step 2: Clear any stored data
        localStorage.removeItem('theme');
        localStorage.removeItem('adminBgColor');
        localStorage.removeItem('adminSidebarColor');
        localStorage.removeItem('adminCardBgColor');
        sessionStorage.clear();
        
        // Step 3: Redirect to login page after short delay
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 500);
        
    } catch (error) {
        console.error('Logout error:', error);
        
        // Show error message on page
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = 'Logout failed: ' + error.message;
            errorDiv.style.display = 'block';
        }
        
        // Still redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    }
})();