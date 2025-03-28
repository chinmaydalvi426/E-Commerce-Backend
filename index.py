from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)

# Sample product data
sample_products = [
    {
        "id": "1",
        "name": "Classic White T-Shirt",
        "description": "A comfortable and versatile white t-shirt made from 100% cotton.",
        "price": 24.99,
        "category": "men",
        "rating": 4.5,
        "reviews": 120,
        "isNew": True
    },
    {
        "id": "2",
        "name": "Slim Fit Jeans",
        "description": "Modern slim fit jeans with a comfortable stretch fabric.",
        "price": 59.99,
        "originalPrice": 79.99,
        "category": "men",
        "rating": 4.2,
        "reviews": 85,
        "discount": 25
    },
    # More products would be here in a real application
]

# In a real application, you would use a database instead of in-memory data
products = sample_products
carts = {}  # Dictionary to store user carts by user_id
users = {}  # Dictionary to store user data

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products with optional filtering"""
    category = request.args.get('category')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    
    filtered_products = products
    
    if category:
        filtered_products = [p for p in filtered_products if p['category'] == category]
    
    if min_price:
        filtered_products = [p for p in filtered_products if p['price'] >= float(min_price)]
    
    if max_price:
        filtered_products = [p for p in filtered_products if p['price'] <= float(max_price)]
    
    return jsonify(filtered_products)

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get a specific product by ID"""
    product = next((p for p in products if p['id'] == product_id), None)
    
    if product:
        return jsonify(product)
    else:
        return jsonify({"error": "Product not found"}), 404

@app.route('/api/products/related', methods=['GET'])
def get_related_products():
    """Get related products based on category"""
    category = request.args.get('category')
    exclude_id = request.args.get('exclude_id')
    
    if not category:
        return jsonify({"error": "Category parameter is required"}), 400
    
    related = [p for p in products if p['category'] == category and p['id'] != exclude_id]
    
    # Limit to 4 related products
    related = related[:4]
    
    return jsonify(related)

@app.route('/api/cart', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_cart():
    """Manage the user's shopping cart"""
    # In a real app, you would get the user_id from authentication
    user_id = request.headers.get('X-User-ID', 'default_user')
    
    if request.method == 'GET':
        # Get the user's cart
        user_cart = carts.get(user_id, [])
        return jsonify(user_cart)
    
    elif request.method == 'POST':
        # Add item to cart
        item = request.json
        
        if not item or 'product_id' not in item or 'quantity' not in item:
            return jsonify({"error": "Invalid item data"}), 400
        
        # Check if product exists
        product = next((p for p in products if p['id'] == item['product_id']), None)
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        # Initialize user's cart if it doesn't exist
        if user_id not in carts:
            carts[user_id] = []
        
        # Check if item already in cart
        cart_item = next((i for i in carts[user_id] if i['product_id'] == item['product_id']), None)
        
        if cart_item:
            # Update quantity if item already in cart
            cart_item['quantity'] += item['quantity']
        else:
            # Add new item to cart
            carts[user_id].append(item)
        
        return jsonify(carts[user_id])
    
    elif request.method == 'PUT':
        # Update item quantity
        item = request.json
        
        if not item or 'product_id' not in item or 'quantity' not in item:
            return jsonify({"error": "Invalid item data"}), 400
        
        # Check if user has a cart
        if user_id not in carts:
            return jsonify({"error": "Cart not found"}), 404
        
        # Find item in cart
        cart_item = next((i for i in carts[user_id] if i['product_id'] == item['product_id']), None)
        
        if not cart_item:
            return jsonify({"error": "Item not in cart"}), 404
        
        # Update quantity
        cart_item['quantity'] = item['quantity']
        
        return jsonify(carts[user_id])
    
    elif request.method == 'DELETE':
        # Remove item from cart
        product_id = request.args.get('product_id')
        
        if not product_id:
            # Clear entire cart
            carts[user_id] = []
            return jsonify({"message": "Cart cleared"})
        
        # Check if user has a cart
        if user_id not in carts:
            return jsonify({"error": "Cart not found"}), 404
        
        # Remove item from cart
        carts[user_id] = [i for i in carts[user_id] if i['product_id'] != product_id]
        
        return jsonify(carts[user_id])

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    user_data = request.json
    
    if not user_data or 'email' not in user_data or 'password' not in user_data:
        return jsonify({"error": "Invalid user data"}), 400
    
    # Check if user already exists
    if user_data['email'] in users:
        return jsonify({"error": "User already exists"}), 409
    
    # In a real app, you would hash the password
    # Store user data (excluding password in response)
    users[user_data['email']] = {
        "email": user_data['email'],
        "password": user_data['password'],  # Would be hashed in real app
        "name": user_data.get('name', ''),
        "created_at": "2023-01-01T00:00:00Z"  # Would be current timestamp in real app
    }
    
    # Return user data without password
    response_data = users[user_data['email']].copy()
    del response_data['password']
    
    return jsonify(response_data), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login a user"""
    credentials = request.json
    
    if not credentials or 'email' not in credentials or 'password' not in credentials:
        return jsonify({"error": "Invalid credentials"}), 400
    
    # Check if user exists and password matches
    user = users.get(credentials['email'])
    if not user or user['password'] != credentials['password']:
        return jsonify({"error": "Invalid email or password"}), 401
    
    # In a real app, you would generate a JWT token here
    token = "sample_jwt_token"
    
    # Return user data without password
    response_data = user.copy()
    del response_data['password']
    response_data['token'] = token
    
    return jsonify(response_data)

@app.route('/api/hello', methods=['GET'])
def hello_world():
    """Test endpoint"""
    return jsonify({"message": "Hello from Flask!"})

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5328))
    app.run(host='0.0.0.0', port=port)

