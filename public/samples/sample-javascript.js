// E-Commerce Shopping Cart Module
// Version: 1.0.0
// Last Updated: 2025-10-27

/**
 * Shopping cart class for managing user cart items
 * Supports add, remove, update quantity, and calculate total
 */
class ShoppingCart {
    constructor() {
        this.items = [];
        this.discountCode = null;
        this.shippingCost = 0.00;
        this.taxRate = 0.08;
    }

    /**
     * Add an item to the shopping cart
     * @param {Object} product - Product object with id, name, price
     * @param {Number} quantity - Quantity to add
     * @returns {Boolean} Success status
     */
    addItem(product, quantity) {
        // Validate input parameters
        if (!product || !product.id) {
            console.error('Invalid product object');
            return false;
        }

        if (quantity <= 0) {
            console.error('Quantity must be greater than zero');
            return false;
        }

        // Check if item already exists in cart
        const existingItem = this.items.find(item => item.product.id === product.id);

        if (existingItem) {
            // Update quantity if item exists
            existingItem.quantity += quantity;
            console.log(`Updated quantity for ${product.name}`);
        } else {
            // Add new item to cart
            this.items.push({
                product: product,
                quantity: quantity,
                addedAt: new Date()
            });
            console.log(`Added ${product.name} to cart`);
        }

        return true;
    }

    /**
     * Remove an item from the cart
     * @param {String} productId - ID of product to remove
     * @returns {Boolean} Success status
     */
    removeItem(productId) {
        const initialLength = this.items.length;
        this.items = this.items.filter(item => item.product.id !== productId);

        if (this.items.length < initialLength) {
            console.log(`Removed product ${productId} from cart`);
            return true;
        }

        console.error(`Product ${productId} not found in cart`);
        return false;
    }

    /**
     * Update quantity of an item in the cart
     * @param {String} productId - ID of product to update
     * @param {Number} newQuantity - New quantity value
     * @returns {Boolean} Success status
     */
    updateQuantity(productId, newQuantity) {
        if (newQuantity <= 0) {
            console.error('Quantity must be greater than zero');
            return false;
        }

        const item = this.items.find(i => i.product.id === productId);

        if (item) {
            item.quantity = newQuantity;
            console.log(`Updated quantity for product ${productId}`);
            return true;
        }

        console.error(`Product ${productId} not found in cart`);
        return false;
    }

    /**
     * Calculate subtotal of all items in cart
     * @returns {Number} Subtotal amount
     */
    calculateSubtotal() {
        let subtotal = 0.00;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            subtotal += item.product.price * item.quantity;
        }

        return subtotal;
    }

    /**
     * Calculate tax amount
     * @returns {Number} Tax amount
     */
    calculateTax() {
        const subtotal = this.calculateSubtotal();
        return subtotal * this.taxRate;
    }

    /**
     * Calculate total price including tax and shipping
     * @returns {Number} Total amount
     */
    calculateTotal() {
        const subtotal = this.calculateSubtotal();
        const tax = this.calculateTax();
        const total = subtotal + tax + this.shippingCost;

        return total;
    }

    /**
     * Apply a discount code to the cart
     * @param {String} code - Discount code to apply
     * @returns {Boolean} Success status
     */
    applyDiscountCode(code) {
        const validCodes = {
            'SAVE10': 0.10,
            'SAVE20': 0.20,
            'FREESHIP': 0.00
        };

        if (validCodes[code] !== undefined) {
            this.discountCode = code;
            console.log(`Applied discount code: ${code}`);
            return true;
        }

        console.error(`Invalid discount code: ${code}`);
        return false;
    }

    /**
     * Clear all items from the cart
     */
    clearCart() {
        this.items = [];
        this.discountCode = null;
        console.log('Cart cleared');
    }

    /**
     * Get number of items in cart
     * @returns {Number} Item count
     */
    getItemCount() {
        let count = 0;

        for (let i = 0; i < this.items.length; i++) {
            count += this.items[i].quantity;
        }

        return count;
    }
}

// Export the shopping cart class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingCart;
}
