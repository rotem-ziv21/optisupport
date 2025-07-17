-- יצירת View לסטטיסטיקות עומס לקוחות
CREATE OR REPLACE VIEW client_ticket_stats AS
SELECT 
    customer_email,
    customer_name,
    customer_phone,
    company_name,
    COUNT(*) as total_tickets,
    ROUND(
        AVG(
            EXTRACT(EPOCH FROM (updated_at - created_at)) / 60
        )::numeric, 
        2
    ) as avg_handling_time_minutes,
    MAX(updated_at) as last_closed_date,
    CASE 
        WHEN COUNT(*) > 5 AND AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) > 240 THEN 'high'
        WHEN COUNT(*) BETWEEN 3 AND 5 OR AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) BETWEEN 120 AND 240 THEN 'medium'
        ELSE 'low'
    END as load_rating
FROM tickets 
WHERE status = 'closed'
GROUP BY customer_email, customer_name, customer_phone, company_name
HAVING COUNT(*) > 0
ORDER BY avg_handling_time_minutes DESC NULLS LAST;

-- הוספת הרשאות לצפייה ב-View
GRANT SELECT ON client_ticket_stats TO authenticated;
