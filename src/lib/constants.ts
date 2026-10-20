export const ORDER_STATUSES: Record<string, string> = {
  awaiting_payment_verification: "Awaiting Payment Verification",
  payment_confirmed: "Payment Confirmed",
  ordered_from_supplier: "Ordered from Supplier",
  processing: "Processing",
  in_transit: "In Transit",
  arrived_for_checking: "Arrived for Checking",
  ready_for_delivery: "Ready for Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund_processing: "Refund Processing",
  refunded: "Refunded",
};

export const PAYMENT_STATUSES: Record<string, string> = {
  awaiting_proof: "Awaiting Proof of Payment",
  awaiting_verification: "Proof Received – Verifying",
  verified: "Payment Verified",
  rejected: "Proof Rejected",
  refund_processing: "Refund Processing",
  refunded: "Refunded",
};

export const FULFILMENT_STEPS: Record<string, string> = {
  order_placed: "1. Order Placed",
  payment_verified: "2. Payment Verified",
  placed_with_supplier: "3. Placed with Supplier",
  supplier_dispatched: "4. Supplier Dispatched",
  in_transit: "5. In Transit",
  arrived_for_checking: "6. Arrived for Checking",
  checked: "7. Item Checked",
  delivered: "8. Delivered",
  cancelled: "Cancelled",
};

export const REQUEST_STATUSES: Record<string, string> = {
  new: "New Request",
  researching: "Researching",
  quote_sent: "Quote Sent",
  awaiting_payment: "Awaiting Payment",
  ordered: "Ordered",
  completed: "Completed",
  unavailable: "Unavailable",
};

export const STOCK_STATUSES: Record<string, string> = {
  supplier: "Sourced to order",
  local: "In stock locally",
  low: "Limited availability",
  unavailable: "Currently unavailable",
};

export const CATEGORIES = ["Bags", "Jewellery", "Shoes", "Clothing", "Hair Accessories", "Beauty", "Accessories", "Lifestyle"];

/** Typical supplier delivery windows used to pre-fill ETAs on bulk imports. */
export const SUPPLIER_PRESETS = [
  { name: "SHEIN", deliveryMin: 10, deliveryMax: 18 },
  { name: "Temu", deliveryMin: 12, deliveryMax: 21 },
  { name: "Mr Price", deliveryMin: 5, deliveryMax: 9 },
  { name: "PEP", deliveryMin: 3, deliveryMax: 6 },
  { name: "Takealot", deliveryMin: 4, deliveryMax: 8 },
  { name: "Other supplier", deliveryMin: 10, deliveryMax: 20 },
];
export const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"];
export const DELIVERY_BUCKETS = [
  { value: "fast", label: "Up to 7 days", max: 7 },
  { value: "mid", label: "Up to 14 days", max: 14 },
  { value: "any", label: "Up to 21+ days", max: 999 },
];
