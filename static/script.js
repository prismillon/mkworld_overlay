class ModernMMROverlay {
    constructor() {
        this.apiBaseUrl = '/api/player/details';
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds cache
        this.autoRefreshInterval = null;
        this.currentPlayerName = '';
        this.hasValidData = false; // Track if we have valid MMR data

        // DOM elements
        this.overlayContainer = document.getElementById('overlay-container');
        this.mainApp = document.getElementById('main-app');
        this.mmrDisplay = document.getElementById('mmr-display');
        this.mmrValue = document.getElementById('mmr-value');
        this.playerNameDisplay = document.getElementById('player-name');
        this.searchForm = document.getElementById('search-form');
        this.playerInput = document.getElementById('player-input');
        this.searchButton = document.getElementById('search-button');
        this.errorMessage = document.getElementById('error-message');
        this.playerCard = document.getElementById('player-card');
        this.displayPlayerName = document.getElementById('display-player-name');
        this.mmrText = document.getElementById('mmr-text');
        this.copyUrlButton = document.getElementById('copy-url-button');

        this.init();
    }

    init() {
        this.bindEvents();
        const playerName = this.getPlayerNameFromUrl();

        if (playerName) {
            this.showOverlayMode();
            this.currentPlayerName = playerName;
            this.fetchPlayerData(playerName);
            this.startAutoRefresh(60000); // Auto refresh every minute for overlay mode
        } else {
            this.showMainApp();
        }
    }

    bindEvents() {
        // Search form submission
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const playerName = this.playerInput.value.trim();
            if (playerName) {
                this.currentPlayerName = playerName;
                this.fetchPlayerData(playerName);
            }
        });

        // Copy URL button
        this.copyUrlButton.addEventListener('click', () => {
            this.copyOverlayUrl();
        });

        // Real-time input validation
        this.playerInput.addEventListener('input', () => {
            this.validateInput();
        });

        // Enter key on input
        this.playerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    getPlayerNameFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('name');
    }

    showOverlayMode() {
        this.overlayContainer.classList.remove('hidden');
        this.mainApp.classList.add('hidden');
        document.body.style.background = 'transparent';
    }

    showMainApp() {
        this.mainApp.classList.remove('hidden');
        this.overlayContainer.classList.add('hidden');
        document.body.style.background = '#f8fafc';
    }

    validateInput() {
        const value = this.playerInput.value.trim();
        const isValid = value.length > 0;

        this.searchButton.disabled = !isValid;

        if (isValid) {
            this.searchButton.classList.remove('disabled');
        } else {
            this.searchButton.classList.add('disabled');
        }
    }

    async fetchPlayerData(playerName) {
        try {
            // Check cache first
            const cacheKey = playerName.toLowerCase();
            const cached = this.cache.get(cacheKey);

            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                this.displayPlayerData(cached.data, playerName);
                return;
            }

            this.setLoadingState(true);

            const url = `${this.apiBaseUrl}?name=${encodeURIComponent(playerName)}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache the result
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            // Clean old cache entries
            this.cleanCache();

            this.displayPlayerData(data, playerName);

        } catch (error) {
            console.error('Error fetching player data:', error);
            this.displayError(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    displayPlayerData(data, playerName) {
        const mmr = data.mmr;
        const mmrValue = mmr !== undefined && mmr !== null ? Math.round(mmr) : 'N/A';

        // Mark that we have valid data
        this.hasValidData = true;

        // Update overlay mode - only show the number
        if (this.mmrValue) {
            this.mmrValue.textContent = mmrValue === 'N/A' ? 'N/A' : mmrValue.toString();
            this.mmrDisplay.classList.remove('error');
        }

        // Update main app mode - only update the MMR number
        if (this.displayPlayerName && this.mmrText) {
            // Only update player name on first load (when card is hidden)
            if (this.playerCard.classList.contains('hidden')) {
                this.displayPlayerName.textContent = playerName;
                this.playerCard.classList.remove('hidden');
            }

            // Always update the MMR number
            this.mmrText.textContent = mmrValue === 'N/A' ? 'N/A' : mmrValue.toString();
            this.hideError();
        }
    }

    displayError(message) {
        // Only show error in overlay mode if we don't have valid data yet
        if (this.mmrValue && !this.hasValidData) {
            this.mmrValue.textContent = 'Error Loading';
            this.mmrDisplay.classList.add('error');
        }

        // Update main app mode - only show error if we don't have valid data
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.classList.remove('hidden');

            // Only hide player card if we don't have valid data yet
            if (!this.hasValidData) {
                this.playerCard.classList.add('hidden');
            }
        }

        console.error('MMR Overlay Error:', message);
    }

    hideError() {
        if (this.errorMessage) {
            this.errorMessage.classList.add('hidden');
        }
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            // Update search button
            this.searchButton.classList.add('loading');
            this.searchButton.disabled = true;
            this.searchButton.querySelector('.button-text').textContent = 'Loading...';

            // Update overlay
            if (this.mmrValue) {
                this.mmrValue.textContent = 'Loading...';
                this.mmrValue.classList.add('loading');
            }
        } else {
            // Reset search button
            this.searchButton.classList.remove('loading');
            this.searchButton.disabled = false;
            this.searchButton.querySelector('.button-text').textContent = 'Get MMR';

            // Reset overlay
            if (this.mmrValue) {
                this.mmrValue.classList.remove('loading');
            }
        }
    }

    startAutoRefresh(intervalMs) {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        if (!this.currentPlayerName) return;

        this.autoRefreshInterval = setInterval(() => {
            console.log('Auto-refreshing MMR data...');
            this.fetchPlayerData(this.currentPlayerName);
        }, intervalMs);

        console.log(`Auto-refresh enabled: updating every ${intervalMs / 1000} seconds`);
    }

    async copyOverlayUrl() {
        if (!this.currentPlayerName) return;

        const url = `${window.location.origin}${window.location.pathname}?name=${encodeURIComponent(this.currentPlayerName)}`;

        try {
            await navigator.clipboard.writeText(url);
            this.showCopySuccess();
        } catch (err) {
            // Fallback for older browsers
            this.fallbackCopyTextToClipboard(url);
        }
    }

    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showCopySuccess();
        } catch (err) {
            console.error('Fallback: Unable to copy', err);
        }

        document.body.removeChild(textArea);
    }

    showCopySuccess() {
        const copyIcon = this.copyUrlButton.querySelector('.copy-icon');
        const checkIcon = this.copyUrlButton.querySelector('.check-icon');
        const copyText = this.copyUrlButton.querySelector('.copy-text');

        copyIcon.classList.add('hidden');
        checkIcon.classList.remove('hidden');
        copyText.textContent = 'Copied!';

        setTimeout(() => {
            copyIcon.classList.remove('hidden');
            checkIcon.classList.add('hidden');
            copyText.textContent = 'Copy Overlay URL';
        }, 2000);
    }

    addSuccessAnimation() {
        // Add a subtle success animation to the player card
        if (this.playerCard && !this.playerCard.classList.contains('hidden')) {
            this.playerCard.style.animation = 'none';
            setTimeout(() => {
                this.playerCard.style.animation = 'slideUp 0.5s ease-out';
            }, 10);
        }
    }

    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout * 2) {
                this.cache.delete(key);
            }
        }
    }

    // Public method to manually refresh data
    refresh() {
        if (this.currentPlayerName) {
            this.fetchPlayerData(this.currentPlayerName);
        }
    }
}

// Initialize the overlay when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const overlay = new ModernMMROverlay();

    // Make overlay globally available for debugging
    window.mmrOverlay = overlay;

    // Handle browser back/forward navigation
    window.addEventListener('popstate', () => {
        location.reload();
    });

    // Preload font for better performance
    if (document.fonts) {
        document.fonts.ready.then(() => {
            console.log('Custom font loaded successfully');
        });
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + R to refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r' && overlay.currentPlayerName) {
            e.preventDefault();
            overlay.refresh();
        }

        // Escape to clear input
        if (e.key === 'Escape' && overlay.playerInput === document.activeElement) {
            overlay.playerInput.value = '';
            overlay.playerInput.blur();
            overlay.validateInput();
        }
    });

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add intersection observer for animations
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe instruction cards
        document.querySelectorAll('.instruction-card').forEach(card => {
            observer.observe(card);
        });
    }
});

// Add CSS for intersection observer animations
const style = document.createElement('style');
style.textContent = `
    .instruction-card {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .instruction-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .search-button.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style); 