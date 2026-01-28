export type BudgetItem = {
	l: string;
	v: number;
	c?: BudgetItem[];
	code?: string;
};

export type BudgetMeta = {
	total_budget: number;
};

export type BudgetData = {
	meta: BudgetMeta;
	data: BudgetItem[];
};
