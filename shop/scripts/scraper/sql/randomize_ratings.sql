-- Скрипт рандомизации рейтингов и отзывов для существующих товаров в PostgreSQL
-- ~65% товаров получают естественный высокий рейтинг (4.6 - 5.0) и отзывы (5 - 80)
-- ~35% товаров маркируются как новинки без отзывов (rating = 0, review_count = 0)
-- ~15% товаров помечаются флагом is_bestseller = true

UPDATE products
SET 
  rating = CASE 
    WHEN (('x' || substr(md5(id), 1, 4))::bit(16)::int % 100) < 65 
    THEN (ARRAY[4.6, 4.7, 4.8, 4.9, 5.0, 4.7, 4.8, 4.9, 4.8, 4.9])[1 + (('x' || substr(md5(id), 5, 4))::bit(16)::int % 10)]
    ELSE 0
  END,
  review_count = CASE 
    WHEN (('x' || substr(md5(id), 1, 4))::bit(16)::int % 100) < 65 
    THEN 5 + (('x' || substr(md5(id), 9, 4))::bit(16)::int % 75)
    ELSE 0
  END,
  is_bestseller = (('x' || substr(md5(id), 1, 4))::bit(16)::int % 100) < 15
WHERE rating = 4.80;
