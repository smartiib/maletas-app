-- Set the existing template as default
UPDATE pdf_templates 
SET is_default = true 
WHERE type = 'etiqueta' 
AND is_active = true 
AND id = 'ccb73c5b-636d-4dd5-a40c-c7598e77ea93';