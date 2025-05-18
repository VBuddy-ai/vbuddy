-- Create job_categories table
CREATE TABLE IF NOT EXISTS job_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create job_skills table
CREATE TABLE IF NOT EXISTS job_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category_id UUID REFERENCES job_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert initial job categories
INSERT INTO job_categories (name, description) VALUES
    ('Customer Service Representatives', 'Handle customer inquiries, complaints, and support requests'),
    ('Social Media Managers', 'Manage social media presence and content strategy'),
    ('Virtual Assistants', 'Provide administrative and operational support'),
    ('Content Writers', 'Create engaging and informative content'),
    ('Real Estate Virtual Assistants', 'Support real estate professionals with administrative tasks'),
    ('Copywriters', 'Write persuasive marketing and advertising copy'),
    ('E-Commerce Assistant', 'Manage online stores and product listings'),
    ('Digital Marketers', 'Plan and execute digital marketing strategies'),
    ('Bookkeepers', 'Handle financial records and transactions'),
    ('Technical Support Representatives', 'Provide technical assistance and troubleshooting'),
    ('Administrative Assistants', 'Support day-to-day office operations'),
    ('Graphic Designers', 'Create visual content and designs'),
    ('Sales Representatives', 'Drive sales and manage client relationships'),
    ('Video Editors', 'Edit and produce video content'),
    ('Accountants', 'Manage financial records and prepare reports'),
    ('WordPress Developers', 'Develop and maintain WordPress websites')
ON CONFLICT (name) DO NOTHING;

-- Insert initial skills for each category
INSERT INTO job_skills (name, category_id) 
SELECT 'Microsoft Office', id FROM job_categories WHERE name = 'Administrative Assistants'
UNION ALL
SELECT 'Google Workspace', id FROM job_categories WHERE name = 'Administrative Assistants'
UNION ALL
SELECT 'Communication', id FROM job_categories WHERE name = 'Customer Service Representatives'
UNION ALL
SELECT 'Time Management', id FROM job_categories WHERE name = 'Virtual Assistants'
UNION ALL
SELECT 'Project Management', id FROM job_categories WHERE name = 'Virtual Assistants'
UNION ALL
SELECT 'Social Media', id FROM job_categories WHERE name = 'Social Media Managers'
UNION ALL
SELECT 'Content Creation', id FROM job_categories WHERE name = 'Content Writers'
UNION ALL
SELECT 'Data Analysis', id FROM job_categories WHERE name = 'Digital Marketers'
UNION ALL
SELECT 'Customer Support', id FROM job_categories WHERE name = 'Customer Service Representatives'
UNION ALL
SELECT 'Technical Support', id FROM job_categories WHERE name = 'Technical Support Representatives'
UNION ALL
SELECT 'Graphic Design', id FROM job_categories WHERE name = 'Graphic Designers'
UNION ALL
SELECT 'Web Development', id FROM job_categories WHERE name = 'WordPress Developers'
UNION ALL
SELECT 'SEO', id FROM job_categories WHERE name = 'Digital Marketers'
UNION ALL
SELECT 'Email Marketing', id FROM job_categories WHERE name = 'Digital Marketers'
UNION ALL
SELECT 'Research', id FROM job_categories WHERE name = 'Content Writers'
UNION ALL
SELECT 'WordPress', id FROM job_categories WHERE name = 'WordPress Developers'
UNION ALL
SELECT 'Shopify', id FROM job_categories WHERE name = 'E-Commerce Assistant'
UNION ALL
SELECT 'QuickBooks', id FROM job_categories WHERE name = 'Bookkeepers'
UNION ALL
SELECT 'Adobe Creative Suite', id FROM job_categories WHERE name = 'Graphic Designers'
UNION ALL
SELECT 'Video Editing', id FROM job_categories WHERE name = 'Video Editors'
UNION ALL
SELECT 'Copywriting', id FROM job_categories WHERE name = 'Copywriters'
UNION ALL
SELECT 'Social Media Marketing', id FROM job_categories WHERE name = 'Social Media Managers'
UNION ALL
SELECT 'Real Estate', id FROM job_categories WHERE name = 'Real Estate Virtual Assistants'
UNION ALL
SELECT 'Sales', id FROM job_categories WHERE name = 'Sales Representatives'
UNION ALL
SELECT 'Accounting', id FROM job_categories WHERE name = 'Accountants'
UNION ALL
SELECT 'Bookkeeping', id FROM job_categories WHERE name = 'Bookkeepers'
ON CONFLICT (name) DO NOTHING; 