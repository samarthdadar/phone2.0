class AdminDashboard {
    constructor() {
        this.API_BASE = 'http://localhost:5000/api';
        this.token = localStorage.getItem('adminToken');
        this.init();
    }

    async init() {
        this.checkAuth();
        this.loadDashboard();
        this.setupEventListeners();
    }

    async checkAuth() {
        if (!this.token) {
            window.location.href = '/admin/login.html';
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/admin/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                window.location.href = '/admin/login.html';
            }
        } catch (error) {
            window.location.href = '/admin/login.html';
        }
    }

    async loadDashboard() {
        await Promise.all([
            this.loadStats(),
            this.loadRecentOrders(),
            this.loadLowStockProducts(),
            this.loadRecentTickets()
        ]);
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.API_BASE}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.updateStatsUI(data.stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsUI(stats) {
        document.getElementById('total-orders').textContent = stats.totalOrders;
        document.getElementById('total-revenue').textContent = `₹${stats.totalRevenue.toLocaleString()}`;
        document.getElementById('total-products').textContent = stats.totalProducts;
        document.getElementById('total-users').textContent = stats.totalUsers;
        document.getElementById('pending-orders').textContent = stats.pendingOrders;
        document.getElementById('active-tickets').textContent = stats.activeTickets;
    }

    async loadRecentOrders() {
        try {
            const response = await fetch(`${this.API_BASE}/admin/orders/recent`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.displayRecentOrders(data.orders);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    async loadLowStockProducts() {
        try {
            const response = await fetch(`${this.API_BASE}/admin/products/low-stock`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.displayLowStockProducts(data.products);
            }
        } catch (error) {
            console.error('Error loading low stock:', error);
        }
    }

    async loadRecentTickets() {
        try {
            const response = await fetch(`${this.API_BASE}/admin/support/recent`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.displayRecentTickets(data.tickets);
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.loadPage(page);
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login.html';
        });

        // Search
        document.getElementById('admin-search').addEventListener('input', (e) => {
            this.debouncedSearch(e.target.value);
        });
    }

    async loadPage(page) {
        const pages = {
            'products': this.loadProductsPage,
            'orders': this.loadOrdersPage,
            'users': this.loadUsersPage,
            'support': this.loadSupportPage,
            'analytics': this.loadAnalyticsPage,
            'settings': this.loadSettingsPage
        };

        if (pages[page]) {
            await pages[page].call(this);
        }
    }

    async loadProductsPage() {
        try {
            const response = await fetch(`${this.API_BASE}/admin/products`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.displayProductsTable(data.products);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async loadOrdersPage() {
        try {
            const response = await fetch(`${this.API_BASE}/admin/orders`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.displayOrdersTable(data.orders);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    // ... Additional methods for other pages

    debouncedSearch = this.debounce((query) => {
        this.performSearch(query);
    }, 300);

    async performSearch(query) {
        try {
            const response = await fetch(`${this.API_BASE}/admin/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.displaySearchResults(data.results);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

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

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-btn">&times;</button>
        `;

        document.getElementById('notifications-container').appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);

        notification.querySelector('.close-btn').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Initialize admin dashboard
const adminDashboard = new AdminDashboard();