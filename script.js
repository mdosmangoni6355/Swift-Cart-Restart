// --- State Management ---
        const state = {
            products: [],
            categories: [],
            cart: JSON.parse(localStorage.getItem('swiftCart_cart')) || [],
            activeCategory: 'all',
            loading: true
        };

        // --- DOM Elements ---
        const els = {
            productsGrid: document.getElementById('products-grid'),
            trendingContainer: document.getElementById('trending-container'),
            categoryFilters: document.getElementById('category-filters'),
            cartCount: document.getElementById('cart-count'),
            cartSidebar: document.getElementById('cart-sidebar'),
            cartOverlay: document.getElementById('cart-overlay'),
            cartItems: document.getElementById('cart-items'),
            cartTotal: document.getElementById('cart-total'),
            modal: document.getElementById('product-modal'),
            modalContent: document.getElementById('modal-content'),
            toast: document.getElementById('toast')
        };

        // --- Initialization ---
        async function init() {
            try {
                // Fetch Products and Categories concurrently
                const [productsRes, categoriesRes] = await Promise.all([
                    fetch('https://fakestoreapi.com/products'),
                    fetch('https://fakestoreapi.com/products/categories')
                ]);

                state.products = await productsRes.json();
                state.categories = await categoriesRes.json();
                state.loading = false;

                renderCategories();
                renderProducts();
                renderTrending();
                updateCartUI();
                
                // Set default view
                navigate('home');

            } catch (error) {
                console.error("Failed to fetch data:", error);
                els.productsGrid.innerHTML = `<p class="text-center text-red-500 col-span-full">Failed to load products. Please try again later.</p>`;
            }
        }
        
        // --- Navigation ---
        function navigate(page) {
            const homeIds = ['home', 'features', 'trending'];
            const productIds = ['products-section'];
            
            window.scrollTo(0, 0);

            if (page === 'home') {
                homeIds.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
                productIds.forEach(id => document.getElementById(id)?.classList.add('hidden'));
            } else if (page === 'products') {
                homeIds.forEach(id => document.getElementById(id)?.classList.add('hidden'));
                productIds.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
            }
        }

        // --- Rendering ---

        function renderCategories() {
            const allBtn = `<button onclick="filterProducts('all')" class="category-btn px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${state.activeCategory === 'all' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}">All</button>`;
            
            const catBtns = state.categories.map(cat => {
                const isActive = state.activeCategory === cat;
                // Escape single quotes (e.g., "men's clothing") to prevent syntax errors in onclick
                const escapedCat = cat.replace(/'/g, "\\'");
                return `<button onclick="filterProducts('${escapedCat}')" class="category-btn px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${isActive ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}">${cat}</button>`;
            }).join('');

            els.categoryFilters.innerHTML = allBtn + catBtns;
        }

        function renderProducts() {
            const filtered = state.activeCategory === 'all' 
                ? state.products 
                : state.products.filter(p => p.category === state.activeCategory);

            if (filtered.length === 0) {
                els.productsGrid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-500">No products found in this category.</div>`;
                return;
            }

            els.productsGrid.innerHTML = filtered.map(product => createProductCard(product)).join('');
        }

        function renderTrending() {
            // Sort by rating count/rate algorithm or just high rating
            // FakeStoreAPI rating is { rate: 3.9, count: 120 }
            const trending = [...state.products]
                .sort((a, b) => b.rating.rate - a.rating.rate)
                .slice(0, 3);

            els.trendingContainer.innerHTML = trending.map(product => createProductCard(product, true)).join('');
        }

        function createProductCard(product, isTrending = false) {
            return `
                <div class="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full border border-gray-100/50">
                    <!-- Image Container -->
                    <div class="relative bg-[#f3f4f6] rounded-t-xl p-6 h-64 flex items-center justify-center overflow-hidden cursor-pointer" onclick="openModal(${product.id})">
                        <img src="${product.image}" alt="${product.title}" class="h-full w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110">
                        ${isTrending ? '<span class="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm">Hot</span>' : ''}
                    </div>

                    <!-- Content -->
                    <div class="p-5 flex-1 flex flex-col">
                        <!-- Category & Rating -->
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">${product.category}</span>
                            <div class="flex items-center text-xs font-semibold text-gray-700">
                                <i class="fa-solid fa-star text-yellow-400 mr-1.5 text-[10px]"></i>
                                ${product.rating.rate} <span class="text-gray-400 font-normal ml-0.5">(${product.rating.count})</span>
                            </div>
                        </div>

                        <!-- Title -->
                        <h3 class="text-gray-900 font-bold text-sm leading-snug mb-2 line-clamp-2 hover:text-primary cursor-pointer transition-colors" onclick="openModal(${product.id})">
                            ${product.title}
                        </h3>

                        <!-- Price -->
                        <div class="text-lg font-extrabold text-gray-900 mb-5">$${product.price.toFixed(2)}</div>

                        <!-- Buttons -->
                        <div class="mt-auto grid grid-cols-2 gap-3">
                            <button onclick="openModal(${product.id})" class="flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors uppercase tracking-wide">
                                <i class="fa-regular fa-eye mr-2"></i> Details
                            </button>
                            <button onclick="addToCart(${product.id})" class="flex items-center justify-center px-3 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg text-xs font-semibold transition-colors shadow-sm hover:shadow-md uppercase tracking-wide">
                                <i class="fa-solid fa-cart-shopping mr-2"></i> Add
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // --- User Actions ---

        function filterProducts(category) {
            state.activeCategory = category;
            renderCategories(); // Re-render buttons to update active state
            
            // Add a small fade effect
            els.productsGrid.classList.add('opacity-50');
            setTimeout(() => {
                renderProducts();
                els.productsGrid.classList.remove('opacity-50');
            }, 200);
        }

        function addToCart(productId) {
            const product = state.products.find(p => p.id === productId);
            const existingItem = state.cart.find(item => item.id === productId);

            if (existingItem) {
                existingItem.qty++;
            } else {
                state.cart.push({ ...product, qty: 1 });
            }

            saveCart();
            updateCartUI();
            showToast(`Added ${product.title.substring(0, 20)}... to cart!`);
            
            // Open cart to show user
            if (document.getElementById('cart-sidebar').classList.contains('translate-x-full')) {
                toggleCart();
            }
        }

        function removeFromCart(productId) {
            state.cart = state.cart.filter(item => item.id !== productId);
            saveCart();
            updateCartUI();
        }

        function changeQty(productId, change) {
            const item = state.cart.find(i => i.id === productId);
            if (item) {
                item.qty += change;
                if (item.qty <= 0) {
                    removeFromCart(productId);
                } else {
                    saveCart();
                    updateCartUI();
                }
            }
        }

        function saveCart() {
            localStorage.setItem('swiftCart_cart', JSON.stringify(state.cart));
        }

        function updateCartUI() {
            // Update Badge
            const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
            els.cartCount.innerText = totalItems;
            
            // Animate badge
            if (totalItems > 0) {
                els.cartCount.classList.remove('scale-0');
                els.cartCount.classList.add('scale-100');
            } else {
                els.cartCount.classList.remove('scale-100');
                els.cartCount.classList.add('scale-0');
            }

            // Render Cart Items
            if (state.cart.length === 0) {
                els.cartItems.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                        <i class="fa-solid fa-cart-arrow-down text-4xl opacity-20"></i>
                        <p>Your cart is empty.</p>
                        <button onclick="toggleCart()" class="text-primary hover:underline">Start Shopping</button>
                    </div>`;
                els.cartTotal.innerText = '$0.00';
            } else {
                els.cartItems.innerHTML = state.cart.map(item => `
                    <div class="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <img src="${item.image}" alt="${item.title}" class="w-16 h-16 object-contain bg-white rounded-md p-1">
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-medium text-gray-900 truncate">${item.title}</h4>
                            <p class="text-sm text-gray-500">$${item.price} x ${item.qty}</p>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <button onclick="removeFromCart(${item.id})" class="text-gray-400 hover:text-red-500 transition text-xs">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            <div class="flex items-center bg-white border border-gray-200 rounded text-xs">
                                <button onclick="changeQty(${item.id}, -1)" class="px-2 py-1 hover:bg-gray-100">-</button>
                                <span class="px-2 font-medium">${item.qty}</span>
                                <button onclick="changeQty(${item.id}, 1)" class="px-2 py-1 hover:bg-gray-100">+</button>
                            </div>
                        </div>
                    </div>
                `).join('');

                const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
                els.cartTotal.innerText = '$' + total.toFixed(2);
            }
        }

        // --- UI Interactions ---

        function toggleCart() {
            els.cartSidebar.classList.toggle('translate-x-full');
            
            if (els.cartOverlay.classList.contains('hidden')) {
                els.cartOverlay.classList.remove('hidden');
                setTimeout(() => els.cartOverlay.classList.remove('opacity-0'), 10); // Fade in
            } else {
                els.cartOverlay.classList.add('opacity-0');
                setTimeout(() => els.cartOverlay.classList.add('hidden'), 300); // Wait for fade out
            }
        }

        function openModal(productId) {
            const product = state.products.find(p => p.id === productId);
            if (!product) return;

            els.modalContent.innerHTML = `
                <div class="w-full md:w-1/2 flex items-center justify-center p-4 bg-gray-50 rounded-xl">
                    <img src="${product.image}" alt="${product.title}" class="max-h-[300px] w-auto object-contain mix-blend-multiply">
                </div>
                <div class="w-full md:w-1/2 flex flex-col">
                    <div class="flex justify-between items-start">
                        <span class="text-xs font-bold text-primary bg-indigo-50 px-3 py-1 rounded-full capitalize mb-3 inline-block">${product.category}</span>
                        <div class="flex items-center text-yellow-400 text-sm">
                            <i class="fa-solid fa-star"></i>
                            <span class="text-gray-500 ml-1 font-medium">${product.rating.rate} <span class="font-normal text-xs">(${product.rating.count} reviews)</span></span>
                        </div>
                    </div>
                    
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">${product.title}</h2>
                    
                    <div class="prose prose-sm text-gray-500 mb-6 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        <p>${product.description}</p>
                    </div>
                    
                    <div class="mt-auto pt-4 border-t border-gray-100">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-3xl font-bold text-gray-900">$${product.price}</span>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="addToCart(${product.id}); closeModal();" class="flex-1 bg-primary hover:bg-primaryHover text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex justify-center items-center gap-2">
                                <i class="fa-solid fa-cart-plus"></i> Add to Cart
                            </button>
                            <button onclick="showToast('Feature coming soon!');" class="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5">
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            els.modal.classList.remove('hidden');
        }

        function closeModal() {
            els.modal.classList.add('hidden');
        }

        function showToast(message) {
            els.toast.textContent = message;
            els.toast.className = "show";
            setTimeout(function(){ els.toast.className = els.toast.className.replace("show", ""); }, 3000);
        }

        function checkout() {
            if (state.cart.length === 0) {
                showToast("Cart is empty!");
                return;
            }
            alert(`Proceeding to checkout with Total: ${els.cartTotal.innerText}`);
        }

        // Close Modal on Esc key
        document.addEventListener('keydown', function(event) {
            if(event.key === "Escape") {
                closeModal();
                if (!els.cartSidebar.classList.contains('translate-x-full')) toggleCart();
            }
        });

        // Start
        init();