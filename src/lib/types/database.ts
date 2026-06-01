export type UserRole = "admin" | "order_manager" | "vendor";

export type CustomerOrderStatus =
  | "draft"
  | "open"
  | "partially_shipped"
  | "shipped"
  | "completed"
  | "cancelled";

export type VendorPoStatus =
  | "draft"
  | "sent"
  | "confirmed"
  | "backordered"
  | "partially_shipped"
  | "shipped"
  | "delivered"
  | "cancelled";

export type DeliveryStatus =
  | "pending"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export type EntityType = "customer_order" | "vendor_purchase_order";

export type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  vendor_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  ship_to_line1: string | null;
  ship_to_line2: string | null;
  ship_to_city: string | null;
  ship_to_state: string | null;
  ship_to_postal_code: string | null;
  ship_to_country: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Vendor = {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  payment_terms: string | null;
  lead_time_days: number | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerOrder = {
  id: string;
  order_number: string;
  customer_id: string;
  customer_po_number: string | null;
  salesperson: string | null;
  requested_ship_date: string | null;
  ship_to_line1: string | null;
  ship_to_line2: string | null;
  ship_to_city: string | null;
  ship_to_state: string | null;
  ship_to_postal_code: string | null;
  ship_to_country: string | null;
  internal_notes: string | null;
  status: CustomerOrderStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerOrderItem = {
  id: string;
  customer_order_id: string;
  sku: string | null;
  description: string | null;
  quantity: number;
  unit_cost: number | null;
  sell_price: number | null;
  tracking_number: string | null;
  ship_date: string | null;
  est_delivery_date: string | null;
  notes: string | null;
  vendor_po_item_id: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorPurchaseOrder = {
  id: string;
  po_number: string;
  vendor_id: string;
  customer_order_id: string;
  ship_to_line1: string | null;
  ship_to_line2: string | null;
  ship_to_city: string | null;
  ship_to_state: string | null;
  ship_to_postal_code: string | null;
  ship_to_country: string | null;
  requested_ship_date: string | null;
  special_instructions: string | null;
  internal_notes: string | null;
  status: VendorPoStatus;
  confirm_token: string | null;
  sent_at: string | null;
  confirmed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorPurchaseOrderItem = {
  id: string;
  vendor_po_id: string;
  customer_order_item_id: string | null;
  sku: string | null;
  description: string | null;
  quantity: number;
  unit_cost: number | null;
  status: VendorPoStatus;
  created_at: string;
  updated_at: string;
};

export type Shipment = {
  id: string;
  vendor_po_id: string;
  carrier: string | null;
  tracking_number: string | null;
  est_ship_date: string | null;
  actual_ship_date: string | null;
  est_delivery_date: string | null;
  delivery_status: DeliveryStatus;
  delivered_at: string | null;
  pod_file_path: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderNote = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  body: string;
  author_id: string | null;
  created_at: string;
};

export type AuditEvent = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type EmailLog = {
  id: string;
  vendor_po_id: string | null;
  to_email: string;
  subject: string;
  resend_id: string | null;
  status: string;
  error: string | null;
  payload: Record<string, unknown>;
  sent_by: string | null;
  sent_at: string;
};

type Rel<
  Col extends string,
  Ref extends string,
> = {
  foreignKeyName: string;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};

type TableDef<T, R extends readonly unknown[] = []> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: R;
};

export type Database = {
  public: {
    Tables: {
      users: TableDef<User, [Rel<"vendor_id", "vendors">]>;
      customers: TableDef<Customer>;
      vendors: TableDef<Vendor>;
      customer_orders: TableDef<
        CustomerOrder,
        [Rel<"customer_id", "customers">]
      >;
      customer_order_items: TableDef<
        CustomerOrderItem,
        [
          Rel<"customer_order_id", "customer_orders">,
          Rel<"vendor_po_item_id", "vendor_purchase_order_items">,
        ]
      >;
      vendor_purchase_orders: TableDef<
        VendorPurchaseOrder,
        [
          Rel<"vendor_id", "vendors">,
          Rel<"customer_order_id", "customer_orders">,
        ]
      >;
      vendor_purchase_order_items: TableDef<
        VendorPurchaseOrderItem,
        [
          Rel<"vendor_po_id", "vendor_purchase_orders">,
          Rel<"customer_order_item_id", "customer_order_items">,
        ]
      >;
      shipments: TableDef<
        Shipment,
        [Rel<"vendor_po_id", "vendor_purchase_orders">]
      >;
      order_notes: TableDef<OrderNote>;
      audit_events: TableDef<AuditEvent>;
      email_logs: TableDef<
        EmailLog,
        [Rel<"vendor_po_id", "vendor_purchase_orders">]
      >;
    };
    Views: {
      order_financials: {
        Row: {
          customer_order_id: string;
          order_number: string;
          customer_id: string;
          status: CustomerOrderStatus;
          created_at: string;
          total_revenue: number;
          total_cost: number;
          gross_margin: number;
        };
        Relationships: [Rel<"customer_id", "customers">];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      customer_order_status: CustomerOrderStatus;
      vendor_po_status: VendorPoStatus;
      delivery_status: DeliveryStatus;
      entity_type: EntityType;
    };
  };
};
