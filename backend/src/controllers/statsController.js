import supabase from '../supabaseClient.js';

/**
 * Get ticket statistics by priority
 * @route GET /api/stats/priority
 * @access Admin
 */
export const getTicketsByPriority = async (req, res) => {
  try {
    // Get counts of tickets by priority
    const { data, error } = await supabase
      .rpc('get_tickets_by_priority');
    
    if (error) {
      console.error('Error fetching priority stats:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch priority statistics', 
        error: error.message 
      });
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get tickets by priority error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

/**
 * Get general ticket statistics
 * @route GET /api/stats
 * @access Admin, Agent
 */
export const getTicketStats = async (req, res) => {
  try {
    // Get open tickets count
    const { count: openCount, error: openError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress', 'pending']);
    
    if (openError) {
      console.error('Error counting open tickets:', openError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to count open tickets', 
        error: openError.message 
      });
    }
    
    // Get closed tickets count
    const { count: closedCount, error: closedError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['resolved', 'closed']);
    
    if (closedError) {
      console.error('Error counting closed tickets:', closedError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to count closed tickets', 
        error: closedError.message 
      });
    }
    
    // Get high priority tickets count
    const { count: highPriorityCount, error: priorityError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('priority', 'high')
      .not('status', 'in', ['resolved', 'closed']);
    
    if (priorityError) {
      console.error('Error counting high priority tickets:', priorityError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to count high priority tickets', 
        error: priorityError.message 
      });
    }
    
    // Calculate average response time
    // This query requires a custom function in Supabase or complex SQL
    // For now, we'll use a simplified approach
    const { data: resolvedTickets, error: avgTimeError } = await supabase
      .from('tickets')
      .select('created_at, resolved_at')
      .not('resolved_at', 'is', null);
    
    if (avgTimeError) {
      console.error('Error fetching resolved tickets:', avgTimeError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to calculate average response time', 
        error: avgTimeError.message 
      });
    }
    
    // Calculate average response time in hours
    let totalResponseTime = 0;
    
    for (const ticket of resolvedTickets) {
      const createdAt = new Date(ticket.created_at);
      const resolvedAt = new Date(ticket.resolved_at);
      const responseTime = (resolvedAt - createdAt) / (1000 * 60 * 60); // hours
      totalResponseTime += responseTime;
    }
    
    const avgResponseTimeHours = resolvedTickets.length > 0 
      ? totalResponseTime / resolvedTickets.length 
      : 0;
    
    // Format average response time as "Xh Ym"
    const avgHours = Math.floor(avgResponseTimeHours);
    const avgMinutes = Math.floor((avgResponseTimeHours - avgHours) * 60);
    const avgResponseTime = `${avgHours}h ${avgMinutes}m`;
    
    // Return stats
    return res.status(200).json({
      success: true,
      data: {
        open: openCount || 0,
        closed: closedCount || 0,
        highPriority: highPriorityCount || 0,
        avgResponseTime
      }
    });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
