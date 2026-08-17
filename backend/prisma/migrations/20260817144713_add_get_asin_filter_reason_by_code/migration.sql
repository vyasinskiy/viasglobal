-- Create an overloaded helper function that accepts ASIN code (String) instead of ID
CREATE OR REPLACE FUNCTION public.get_asin_filter_reason(p_asin_code TEXT, p_dominant_threshold INT DEFAULT 80)
RETURNS TEXT AS $$
DECLARE
    v_asin_id INT;
BEGIN
    -- Resolve the ASIN ID from the ASIN string code
    SELECT id INTO v_asin_id FROM "ASIN" WHERE code = p_asin_code LIMIT 1;
    
    IF v_asin_id IS NULL THEN
        RETURN 'ASIN_NOT_FOUND';
    END IF;
    
    -- Delegate to the main function
    RETURN public.get_asin_filter_reason(v_asin_id, p_dominant_threshold);
END;
$$ LANGUAGE plpgsql STABLE;