-- Database Schema for E-Commerce Platform
-- Created: 2025-10-27
-- Purpose: Demonstrate SQL compression with realistic queries

/* Multi-line comment explaining the database structure
   This database contains tables for users, products, orders, and reviews
   It demonstrates various SQL features that can be compressed */

-- Create Users table with constraints
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email_address VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    account_status VARCHAR(20) DEFAULT 'active',
    CHECK (account_status IN ('active', 'suspended', 'deleted'))
);

CREATE INDEX idx_users_email ON users(email_address);
CREATE INDEX idx_users_username ON users(username);

-- Create Products table
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(200) NOT NULL,
    product_description TEXT,
    category_name VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (unit_price >= 0),
    CHECK (stock_quantity >= 0)
);

-- Begin transaction for data insertion
BEGIN TRANSACTION;

-- Insert sample users
INSERT INTO users (user_id, username, email_address, password_hash, first_name, last_name, phone_number, account_status) VALUES (1, 'john_smith', 'john.smith@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'John', 'Smith', '+1-555-0100', 'active');
INSERT INTO users (user_id, username, email_address, password_hash, first_name, last_name, phone_number, account_status) VALUES (2, 'jane_doe', 'jane.doe@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'Jane', 'Doe', '+1-555-0101', 'active');
INSERT INTO users (user_id, username, email_address, password_hash, first_name, last_name, phone_number, account_status) VALUES (3, 'bob_wilson', 'bob.wilson@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'Bob', 'Wilson', '+1-555-0102', 'active');
INSERT INTO users (user_id, username, email_address, password_hash, first_name, last_name, phone_number, account_status) VALUES (4, 'alice_brown', 'alice.brown@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'Alice', 'Brown', '+1-555-0103', 'suspended');
INSERT INTO users (user_id, username, email_address, password_hash, first_name, last_name, phone_number, account_status) VALUES (5, 'charlie_davis', 'charlie.davis@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'Charlie', 'Davis', '+1-555-0104', 'active');

-- Insert sample products
INSERT INTO products (product_id, product_name, product_description, category_name, unit_price, stock_quantity) VALUES (101, 'Wireless Mouse', 'Ergonomic wireless mouse with 2.4GHz connectivity', 'Electronics', 29.99, 150);
INSERT INTO products (product_id, product_name, product_description, category_name, unit_price, stock_quantity) VALUES (102, 'Mechanical Keyboard', 'RGB backlit mechanical gaming keyboard', 'Electronics', 89.99, 75);
INSERT INTO products (product_id, product_name, product_description, category_name, unit_price, stock_quantity) VALUES (103, 'USB-C Cable', 'High-speed USB-C charging and data cable', 'Accessories', 12.99, 500);
INSERT INTO products (product_id, product_name, product_description, category_name, unit_price, stock_quantity) VALUES (104, 'Monitor Stand', 'Adjustable ergonomic monitor stand with storage', 'Furniture', 49.99, 100);
INSERT INTO products (product_id, product_name, product_description, category_name, unit_price, stock_quantity) VALUES (105, 'Desk Lamp', 'LED desk lamp with adjustable brightness', 'Furniture', 34.99, 200);

COMMIT;

-- Explain query execution plan (will be removed in compression)
EXPLAIN SELECT * FROM users WHERE account_status = 'active';

-- Complex query with LEFT OUTER JOIN (OUTER keyword will be removed)
SELECT
    user_table.user_id,
    user_table.username,
    user_table.email_address,
    user_table.first_name,
    user_table.last_name,
    order_table.order_id,
    order_table.order_total
FROM public.users AS user_table
LEFT OUTER JOIN orders AS order_table
    ON user_table.user_id = order_table.user_id
WHERE user_table.account_status = 'active'
ORDER BY user_table.created_at DESC
LIMIT 100;

-- Another query with table aliases
SELECT
    product_catalog.product_name,
    product_catalog.unit_price,
    product_catalog.stock_quantity,
    category_info.category_name
FROM public.products AS product_catalog
INNER JOIN categories AS category_info
    ON product_catalog.category_id = category_info.category_id
WHERE product_catalog.stock_quantity > 0;

-- Drop temporary tables (will be removed in aggressive compression)
DROP TABLE IF EXISTS temp_users CASCADE;
DROP TABLE IF EXISTS temp_products CASCADE;

-- Alter table statements (will be removed in aggressive compression)
ALTER TABLE users ADD COLUMN last_login_date TIMESTAMP;
ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
