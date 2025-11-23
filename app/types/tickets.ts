export interface TicketsData {
	ticket_id: string;
	title: string;
	description: string;
	priority: string;
	current_status: number;
	channel: string;
	device: string;
	tags: string[];
	dates: {
		created_at: string;
		closed_at: string | null;
		first_response_at: string | null;
	};
	assigned_agent: {
		id: number;
		full_name: string;
		email: string;
		department: string;
	};
	created_by_user: {
		id: number;
		full_name: string;
		email: string;
		cpf: string;
		phone: string;
		is_vip: boolean;
	};
	category: {
		id: number;
		name: string;
	};
	subcategory: {
		id: number;
		name: string;
	};
	company: {
		id: number;
		name: string;
		cnpj: string;
		segment: string;
	};
	product: {
		id: number;
		code: string;
		name: string;
		description: string;
	};
	sla_plan: number;
	sla_metrics: {
		first_response_sla_breached: boolean;
		first_response_time_minutes: number | null;
		resolution_sla_breached: boolean;
		resolution_time_minutes: number | null;
	};
	status_history: unknown[]; // Definir melhor se necessário
	search_text: string;
}

export interface TicketsResponse {
	data: TicketsData[];
	pagination: {
		current_page: number;
		per_page: number;
		total_pages: number;
		total_records: number;
		has_next: boolean;
		has_prev: boolean;
	};
	message: string;
	success: boolean;
	timestamp: string;
	request_id: string;
}
