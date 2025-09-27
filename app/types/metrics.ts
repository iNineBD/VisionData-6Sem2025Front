export interface MetricsData {
  totalTickets: number;
  metrics: Array<{
    name: 'TicketsByCategory' | 'TicketsByPriority' | 'TicketsByChannel' | 'TicketsByTag' | 'TicketsByDepartment';
    values: Array<{
      name: string;
      value: number;
    }>;
  }>;
};
