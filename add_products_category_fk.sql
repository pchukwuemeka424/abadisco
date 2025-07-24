ALTER TABLE products
ADD CONSTRAINT fk_products_category
FOREIGN KEY (category_id)
REFERENCES business_categories(id)
ON DELETE SET NULL; 