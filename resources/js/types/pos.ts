// ── Catalogue ─────────────────────────────────────────

export type Category = {
    id: number;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    products_count: number;
    active_products_count: number;
};

export type Expense = {
    id: number;
    date: string;
    amount: number | string;
    notes: string | null;
};

export type ProductVariant = {
    id: number;
    product_id: number;
    name: string;
    price_adjustment: number;
    is_active?: boolean;
};

export type Product = {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    base_price: number;
    is_active: boolean;
    has_variants: boolean;
    has_temperature: boolean;
    has_sugar_level: boolean;
    category?: Category;
    variants?: ProductVariant[];
    active_variants?: ProductVariant[];
    recipes?: Recipe[];
};

export type ProductAddon = {
    id: number;
    name: string;
    price: number;
    is_active: boolean;
};

export type Customer = {
    id: number;
    name: string;
    phone: string | null;
    email?: string | null;
    loyalty_points: number;
    transactions_count?: number;
};

// ── Sales ─────────────────────────────────────────────

export type PaymentMethodValue =
    | 'cash'
    | 'qris'
    | 'bank_transfer'
    | 'debit_card'
    | 'credit_card';

export type PaymentMethodOption = {
    value: PaymentMethodValue;
    label: string;
    description: string;
    /** Only cash asks the cashier for a tendered amount. */
    requires_tender: boolean;
};

export type Transaction = {
    id: number;
    transaction_number: string;
    customer_id: number | null;
    user_id: number;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    discount: number;
    total: number;
    payment_method: PaymentMethodValue | string;
    payment_amount: number;
    change_amount: number;
    status: 'completed' | 'voided' | 'held';
    notes: string | null;
    customer?: Customer;
    cashier?: { id: number; name: string };
    items?: TransactionItem[];
    created_at: string;
};

export type TransactionItem = {
    id: number;
    transaction_id: number;
    product_id: number;
    product_variant_id: number | null;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    unit_price: number;
    unit_cost: number;
    subtotal: number;
    cost_subtotal: number;
    temperature: Temperature | null;
    sugar_level: SugarLevel | null;
    notes: string | null;
    addons?: TransactionItemAddon[];
};

export type TransactionItemAddon = {
    id: number;
    transaction_item_id: number;
    product_addon_id: number;
    addon_name: string;
    addon_price: number;
    quantity: number;
};

export type Temperature = 'hot' | 'iced';
export type SugarLevel = 'normal' | 'less' | 'more' | 'none';

// ── Inventory & recipes ───────────────────────────────

export type IngredientUnit = 'gram' | 'ml' | 'pcs' | 'pack';

export type Ingredient = {
    id: number;
    name: string;
    unit: IngredientUnit;
    current_stock: number;
    min_stock: number;
    cost_per_unit: number;
    is_low_stock?: boolean;
};

export type IngredientEntry = {
    id: number;
    ingredient_id: number;
    type: 'in' | 'out';
    quantity: number;
    reference_type: string | null;
    reference_id: number | null;
    notes: string | null;
    user?: { id: number; name: string };
    created_at: string;
};

export type Recipe = {
    id: number;
    product_id: number;
    product_variant_id: number | null;
    ingredient_id: number;
    quantity: number;
    product?: Product;
    ingredient?: Ingredient;
};

// ── Cashier screen ────────────────────────────────────

/** Feature toggles the cashier screen reads from settings. */
export type PosConfig = {
    shop_name: string;
    tax_enabled: boolean;
    tax_rate: number;
    tax_label: string;
    addon_enabled: boolean;
    customer_enabled: boolean;
    discount_enabled: boolean;
    order_note_enabled: boolean;
    receipt_enabled: boolean;
};

export type CartItemAddon = {
    product_addon_id: number;
    name: string;
    price: number;
    quantity: number;
};

export type CartItem = {
    /** Local id so two configurations of the same product stay separate. */
    id: string;
    product_id: number;
    product_variant_id: number | null;
    product_name: string;
    variant_name: string | null;
    base_price: number;
    variant_adjustment: number;
    quantity: number;
    temperature: Temperature | null;
    sugar_level: SugarLevel | null;
    notes: string;
    addons: CartItemAddon[];
    /** base + variant + add-ons */
    unit_price: number;
    subtotal: number;
};

export type Receipt = {
    number: string;
    created_at: string;
    cashier: string | null;
    customer: string | null;
    items: {
        name: string;
        variant: string | null;
        quantity: number;
        unit_price: number;
        subtotal: number;
        temperature: Temperature | null;
        sugar_level: SugarLevel | null;
        notes: string | null;
        addons: { name: string; price: number; quantity: number }[];
    }[];
    subtotal: number;
    discount: number;
    tax_label: string;
    tax_rate: number;
    tax_amount: number;
    total: number;
    payment_method: string;
    payment_method_label: string;
    payment_amount: number;
    change_amount: number;
    notes: string | null;
    footer: string;
    shop: { name: string; tagline: string; address: string; phone: string };
};

// ── Dashboard ─────────────────────────────────────────

export type Metric = {
    value: number;
    previous: number;
    /** Percentage change against the previous period. */
    trend: number;
};

export type DashboardKpis = {
    revenue: Metric;
    transactions: Metric;
    itemsSold: Metric;
    averageOrder: Metric;
    grossProfit: Metric;
    netProfit: Metric;
    expenses: Metric;
    marginPercent: number;
    cogs: number;
    monthToDate: {
        revenue: number;
        transactions: number;
        profit: number;
        label: string;
    };
};

export type SalesPoint = {
    date: string;
    label: string;
    revenue: number;
    transactions: number;
};

export type ProfitPoint = {
    date: string;
    label: string;
    revenue: number;
    cost: number;
    profit: number;
};

export type HourlyPoint = {
    hour: number;
    label: string;
    transactions: number;
    average: number;
    revenue: number;
    today: number;
};

export type HourlyTraffic = {
    series: HourlyPoint[];
    peakHour: number | null;
    peakHourLabel: string | null;
    peakHourTransactions: number;
    peakHourToday: number | null;
    windowDays: number;
};

export type TopProduct = {
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
    margin_percent: number;
};

export type CategorySlice = {
    name: string;
    revenue: number;
    quantity: number;
    share: number;
};

export type PaymentSlice = {
    method: string;
    label: string;
    transactions: number;
    revenue: number;
    share: number;
};

export type WeekdayPoint = {
    weekday: string;
    revenue: number;
    transactions: number;
};

export type LowStockItem = {
    id: number;
    name: string;
    unit: string;
    current_stock: number;
    min_stock: number;
    ratio: number;
    is_out: boolean;
};

export type RecentTransaction = {
    id: number;
    number: string;
    customer: string;
    cashier: string | null;
    items: number;
    total: number;
    payment_method: string;
    payment_label: string;
    time: string;
    date: string;
};

export type TopCustomer = {
    id: number;
    name: string;
    visits: number;
    spent: number;
    loyalty_points: number;
};

export type Highlight = {
    tone: 'info' | 'success' | 'warning';
    title: string;
    body: string;
};

// ── HPP / costing ─────────────────────────────────────

export type CostHealth = 'healthy' | 'watch' | 'critical' | 'unknown';

export type CostMetrics = {
    hpp: number;
    margin: number;
    margin_percent: number;
    food_cost_percent: number;
    markup_percent: number;
    health: CostHealth;
};

export type HppVariant = CostMetrics & {
    id: number;
    name: string;
    price: number;
};

export type HppIngredientLine = {
    id: number;
    ingredient_id: number;
    name: string;
    unit: string;
    quantity: number;
    cost_per_unit: number;
    cost: number;
};

export type HppProduct = CostMetrics & {
    id: number;
    name: string;
    category: string | null;
    is_active: boolean;
    has_recipe: boolean;
    price: number;
    suggested_price: number;
    ingredients: HppIngredientLine[];
    variants: HppVariant[];
};

export type HppSummary = {
    productsTotal: number;
    productsCosted: number;
    productsWithoutRecipe: { id: number; name: string }[];
    averageMarginPercent: number;
    averageFoodCostPercent: number;
    healthyCount: number;
    watchCount: number;
    criticalCount: number;
    bestMargin: HppProduct[];
    worstMargin: HppProduct[];
};

// ── Reports ───────────────────────────────────────────

export type ReportPeriod = {
    preset: string;
    start: string;
    end: string;
    label: string;
    days: number;
};

export type ReportSummary = {
    transactions: number;
    itemsSold: number;
    subtotal: number;
    discount: number;
    tax: number;
    revenue: number;
    netRevenue: number;
    cogs: number;
    grossProfit: number;
    marginPercent: number;
    foodCostPercent: number;
    averageOrderValue: number;
    averageItemsPerOrder: number;
    dailyAverage: number;
    previous: Omit<
        ReportSummary,
        'previous' | 'revenueTrend' | 'transactionsTrend' | 'profitTrend'
    >;
    revenueTrend: number;
    transactionsTrend: number;
    profitTrend: number;
};

export type ReportTimelinePoint = {
    bucket: string;
    label: string;
    transactions: number;
    revenue: number;
    cost: number;
    profit: number;
};

export type ReportProductRow = {
    name: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
    margin_percent: number;
};

export type ReportTransactionRow = {
    id: number;
    number: string;
    datetime: string;
    date: string;
    time: string;
    customer: string;
    cashier: string;
    quantity: number;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    cost: number;
    profit: number;
    payment_method: string;
    payment_label: string;
};

export type ShopProfile = {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    logo_url: string | null;
    tax_label: string;
};

export type Report = {
    period: ReportPeriod;
    summary: ReportSummary;
    timeline: ReportTimelinePoint[];
    products: ReportProductRow[];
    categories: (CategorySlice & { profit: number })[];
    payments: PaymentSlice[];
    cashiers: {
        name: string;
        transactions: number;
        revenue: number;
        average: number;
    }[];
    transactions: ReportTransactionRow[];
    shop: ShopProfile;
};

// ── Settings ──────────────────────────────────────────

export type SettingFieldType =
    | 'string'
    | 'text'
    | 'bool'
    | 'int'
    | 'float'
    | 'image';

export type PosSettings = {
    shop_name: string;
    shop_tagline: string;
    shop_address: string;
    shop_phone: string;
    shop_email: string;
    shop_logo: string;
    tax_enabled: boolean;
    tax_rate: number;
    tax_label: string;
    payment_cash: boolean;
    payment_qris: boolean;
    payment_bank_transfer: boolean;
    payment_debit_card: boolean;
    payment_credit_card: boolean;
    addon_enabled: boolean;
    customer_enabled: boolean;
    discount_enabled: boolean;
    order_note_enabled: boolean;
    receipt_enabled: boolean;
    receipt_footer: string;
    printer_name: string;
    session_lifetime: number;
    session_keepalive: boolean;
};
