// Complete frontend JavaScript with all features

class BhaskarStore {
    constructor() {
        this.API_BASE = 'http://localhost:5000/api';
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user'));
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.init();
    }

    async init() {
        this.attachEventListeners();
        this.checkAuth();
        this.loadCartCount();
        this.loadProducts();
        this.setupRealTimeUpdates();
    }

    // Authentication
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                this.showNotification('Login successful!', 'success');
                window.location.href = '/dashboard.html';
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Login failed', 'error');
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Registration successful! Please verify your email.', 'success');
                window.location.href = '/login.html';
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Registration failed', 'error');
        }
    }

    checkAuth() {
        if (this.token && this.user) {
            this.updateAuthUI();
        }
    }

    updateAuthUI() {
        const authElements = document.querySelectorAll('.auth-required');
        authElements.forEach(el => {
            el.style.display = this.user ? 'block' : 'none';
        });

        const guestElements = document.querySelectorAll('.guest-required');
        guestElements.forEach(el => {
            el.style.display = this.user ? 'none' : 'block';
        });

        if (this.user) {
            const userElements = document.querySelectorAll('.user-name');
            userElements.forEach(el => {
                el.textContent = this.user.name;
            });
        }
    }

    // Product Management
    async loadProducts(category = null) {
        try {
            let url = `${this.API_BASE}/products`;
            if (category) url += `/category/${category}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                this.displayProducts(data.products);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async getProductDetails(productId) {
        try {
            const response = await fetch(`${this.API_BASE}/products/${productId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.product;
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        }
        return null;
    }

    async searchProducts(query) {
        try {
            const response = await fetch(`${this.API_BASE}/products/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.success) {
                this.displaySearchResults(data.products);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    // Cart Management
    async addToCart(productId, quantity = 1, variant = null) {
        if (!this.user) {
            this.showNotification('Please login to add items to cart', 'warning');
            window.location.href = '/login.html';
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    productId,
                    quantity,
                    variant
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.cart = data.cart.items;
                this.saveCart();
                this.loadCartCount();
                this.showNotification('Added to cart!', 'success');
            }
        } catch (error) {
            this.showNotification('Failed to add to cart', 'error');
        }
    }

    async updateCartItem(itemId, quantity) {
        try {
            const response = await fetch(`${this.API_BASE}/cart/update/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ quantity })
            });

            const data = await response.json();
            
            if (data.success) {
                this.cart = data.cart.items;
                this.saveCart();
                this.loadCartCount();
                this.showNotification('Cart updated', 'success');
            }
        } catch (error) {
            this.showNotification('Failed to update cart', 'error');
        }
    }

    async removeCartItem(itemId) {
        try {
            const response = await fetch(`${this.API_BASE}/cart/remove/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.cart = data.cart.items;
                this.saveCart();
                this.loadCartCount();
                this.showNotification('Item removed', 'success');
            }
        } catch (error) {
            this.showNotification('Failed to remove item', 'error');
        }
    }

    async getCart() {
        if (!this.user) return [];

        try {
            const response = await fetch(`${this.API_BASE}/cart`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.cart = data.cart.items;
                this.saveCart();
                return this.cart;
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
        return [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    loadCartCount() {
        const cartCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartBadges = document.querySelectorAll('.cart-badge');
        cartBadges.forEach(badge => {
            badge.textContent = cartCount;
            badge.style.display = cartCount > 0 ? 'flex' : 'none';
        });
    }

    // Order Management
    async createOrder(orderData) {
        try {
            const response = await fetch(`${this.API_BASE}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();
            
            if (data.success) {
                return data.order;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showNotification('Failed to create order', 'error');
            throw error;
        }
    }

    async getOrders() {
        try {
            const response = await fetch(`${this.API_BASE}/orders`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                return data.orders;
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
        return [];
    }

    async getOrderDetails(orderId) {
        try {
            const response = await fetch(`${this.API_BASE}/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                return data.order;
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        }
        return null;
    }

    // Payment Processing
    async initiatePayment(orderId, paymentMethod) {
        try {
            const response = await fetch(`${this.API_BASE}/orders/${orderId}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ method: paymentMethod })
            });

            const data = await response.json();
            
            if (data.success) {
                return data.payment;
            }
        } catch (error) {
            console.error('Payment initiation error:', error);
        }
        return null;
    }

    async verifyPayment(orderId, paymentData) {
        try {
            const response = await fetch(`${this.API_BASE}/orders/${orderId}/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(paymentData)
            });

            const data = await response.json();
            
            if (data.success) {
                return data;
            }
        } catch (error) {
            console.error('Payment verification error:', error);
        }
        return null;
    }

    // AI Features
    async generateProductImages(productId) {
        try {
            const response = await fetch(`${this.API_BASE}/products/${productId}/generate-images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('AI images generated successfully!', 'success');
                return data.images;
            }
        } catch (error) {
            this.showNotification('Failed to generate images', 'error');
        }
        return [];
    }

    async getAISuggestions(productId) {
        try {
            const response = await fetch(`${this.API_BASE}/products/${productId}/ai-suggestions`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                return data.suggestions;
            }
        } catch (error) {
            console.error('AI suggestions error:', error);
        }
        return [];
    }

    // Support System
    async createSupportTicket(ticketData) {
        try {
            const response = await fetch(`${this.API_BASE}/support/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(ticketData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Ticket created successfully!', 'success');
                return data.ticket;
            }
        } catch (error) {
            this.showNotification('Failed to create ticket', 'error');
        }
        return null;
    }

    async getSupportTickets() {
        try {
            const response = await fetch(`${this.API_BASE}/support/tickets`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                return data.tickets;
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        }
        return [];
    }

    // Real-time Updates
    setupRealTimeUpdates() {
        // Connect to WebSocket for real-time updates
        const socket = io(process.env.WS_URL || 'http://localhost:5000');
        
        socket.on('connect', () => {
            console.log('Connected to real-time updates');
        });

        socket.on('orderUpdate', (data) => {
            if (this.user && data.userId === this.user.id) {
                this.showNotification(`Order ${data.orderId} status: ${data.status}`, 'info');
                this.updateOrderUI(data);
            }
        });

        socket.on('stockUpdate', (data) => {
            this.updateStockIndicator(data.productId, data.stock);
        });

        socket.on('priceUpdate', (data) => {
            this.updatePriceDisplay(data.productId, data.price);
        });
    }

    // UI Helpers
    displayProducts(products) {
        const container = document.getElementById('products-container');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product._id}">
                <div class="product-image">
                    <img src="${product.images[0]?.url || 'default-product.jpg'}" alt="${product.name}">
                    ${product.aiGeneratedImages?.length > 0 ? 
                        '<span class="ai-badge">AI Enhanced</span>' : ''}
                    ${product.tags?.includes('new') ? 
                        '<span class="new-badge">New</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-desc">${product.shortDescription || product.description.substring(0, 100)}...</p>
                    <div class="product-meta">
                        <span class="category">${product.category}</span>
                        <span class="rating">⭐ ${product.ratings.average.toFixed(1)}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-view" onclick="store.viewProduct('${product._id}')">View Details</button>
                        <button class="btn-cart" onclick="store.addToCart('${product._id}', 1)">
                            <i class="fas fa-cart-plus"></i> Add to Inquiry
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-btn">&times;</button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // Close button
        notification.querySelector('.close-btn').addEventListener('click', () => {
            notification.remove();
        });
    }

    attachEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.debouncedSearch(e.target.value);
            });
        }

        // Category filters
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.loadProducts(category);
            });
        });

        // Cart interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart')) {
                const productId = e.target.closest('.product-card').dataset.id;
                this.addToCart(productId, 1);
            }
        });

        // Initialize tooltips
        this.initTooltips();
    }

    debouncedSearch = this.debounce((query) => {
        if (query.length > 2) {
            this.searchProducts(query);
        }
    }, 300);

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    initTooltips() {
        // Initialize tooltip library or custom tooltips
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(el => {
            el.addEventListener('mouseenter', this.showTooltip);
            el.addEventListener('mouseleave', this.hideTooltip);
        });
    }

    showTooltip(e) {
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = e.target.dataset.tooltip;
        document.body.appendChild(tooltip);

        const rect = e.target.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;

        e.target.tooltipElement = tooltip;
    }

    hideTooltip(e) {
        if (e.target.tooltipElement) {
            e.target.tooltipElement.remove();
            e.target.tooltipElement = null;
        }
    }
}

// Initialize store
const store = new BhaskarStore();

// Export for use in other modules
window.BhaskarStore = store;