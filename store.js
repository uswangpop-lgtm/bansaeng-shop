// ===== STORE.JS — ฐานข้อมูลกลาง (localStorage) =====
// ใช้ localStorage เป็น database กลาง ทุกหน้าอ่าน/เขียนที่นี่
// ใน production จะเปลี่ยนเป็น Firebase / Supabase (ฟรี)

const KEYS = {
  PRODUCTS: 'bsg_products',
  ORDERS: 'bsg_orders',
  SETTINGS: 'bsg_settings',
};

// ===== สินค้าตัวอย่าง =====
const DEFAULT_PRODUCTS = [
  { id:'P001', name:'ข้าวกล้องอินทรีย์', category:'ข้าว-ธัญพืช', price:85, cost:55, stock:50, minStock:10, unit:'กก.', image:'🌾', barcode:'8850001001', active:true },
  { id:'P002', name:'น้ำพริกปลาทู', category:'น้ำพริก-เครื่องแกง', price:45, cost:25, stock:30, minStock:5, unit:'กระปุก', image:'🌶️', barcode:'8850001002', active:true },
  { id:'P003', name:'กล้วยฉาบ (ต้นตำรับ)', category:'ขนม-ของฝาก', price:60, cost:35, stock:25, minStock:8, unit:'ถุง', image:'🍌', barcode:'8850001003', active:true },
  { id:'P004', name:'น้ำผึ้งธรรมชาติ', category:'ของป่า', price:180, cost:100, stock:15, minStock:5, unit:'ขวด', image:'🍯', barcode:'8850001004', active:true },
  { id:'P005', name:'ขนมทองม้วน', category:'ขนม-ของฝาก', price:50, cost:28, stock:40, minStock:10, unit:'กล่อง', image:'🧁', barcode:'8850001005', active:true },
  { id:'P006', name:'ปลาส้มแผ่น', category:'อาหารแปรรูป', price:75, cost:45, stock:20, minStock:5, unit:'แพ็ค', image:'🐟', barcode:'8850001006', active:true },
  { id:'P007', name:'ผักอินทรีย์คละ', category:'ผัก-ผลไม้', price:35, cost:18, stock:60, minStock:15, unit:'กก.', image:'🥬', barcode:'8850001007', active:true },
  { id:'P008', name:'แยมมะม่วง', category:'แปรรูปผลไม้', price:95, cost:55, stock:18, minStock:5, unit:'ขวด', image:'🥭', barcode:'8850001008', active:true },
  { id:'P009', name:'สบู่สมุนไพร', category:'สมุนไพร-ความงาม', price:40, cost:20, stock:35, minStock:10, unit:'ก้อน', image:'🌿', barcode:'8850001009', active:true },
  { id:'P010', name:'ชาสมุนไพรรวม', category:'เครื่องดื่ม', price:120, cost:70, stock:22, minStock:8, unit:'กล่อง', image:'🍵', barcode:'8850001010', active:true },
  { id:'P011', name:'หมูแดดเดียว', category:'อาหารแปรรูป', price:130, cost:80, stock:12, minStock:5, unit:'แพ็ค', image:'🥩', barcode:'8850001011', active:true },
  { id:'P012', name:'น้ำมันมะพร้าว', category:'น้ำมัน-เครื่องปรุง', price:160, cost:95, stock:8, minStock:5, unit:'ขวด', image:'🥥', barcode:'8850001012', active:true },
];

const DEFAULT_SETTINGS = {
  shopName: 'วิสาหกิจชุมชนบ้านกันแสง',
  phone: '08X-XXX-XXXX',
  address: 'บ้านกันแสง อ.กันทรารมย์ จ.ศรีสะเกษ',
  promptpay: '0812345678',
  taxId: '',
  lowStockAlert: 10,
};

// ===== INIT =====
function initStore() {
  if (!localStorage.getItem(KEYS.PRODUCTS)) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem(KEYS.ORDERS)) {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
}

// ===== PRODUCTS =====
function getProducts(activeOnly = false) {
  const p = JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]');
  return activeOnly ? p.filter(x => x.active) : p;
}
function saveProducts(products) {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent('stockUpdated'));
}
function getProduct(id) {
  return getProducts().find(p => p.id === id);
}
function updateProduct(updated) {
  const all = getProducts();
  const idx = all.findIndex(p => p.id === updated.id);
  if (idx >= 0) { all[idx] = updated; saveProducts(all); return true; }
  return false;
}
function addProduct(product) {
  const all = getProducts();
  product.id = 'P' + String(Date.now()).slice(-6);
  all.push(product);
  saveProducts(all);
  return product;
}
function deleteProduct(id) {
  const all = getProducts().map(p => p.id === id ? {...p, active: false} : p);
  saveProducts(all);
}

// ===== STOCK =====
function deductStock(items) {
  // items = [{id, qty}]
  const all = getProducts();
  const errors = [];
  for (const item of items) {
    const p = all.find(x => x.id === item.id);
    if (!p) { errors.push(`ไม่พบสินค้า ${item.id}`); continue; }
    if (p.stock < item.qty) { errors.push(`${p.name} สต็อกไม่พอ (เหลือ ${p.stock})`); continue; }
    p.stock -= item.qty;
  }
  if (errors.length) return { ok: false, errors };
  saveProducts(all);
  return { ok: true };
}
function addStock(id, qty) {
  const all = getProducts();
  const p = all.find(x => x.id === id);
  if (!p) return false;
  p.stock += qty;
  saveProducts(all);
  return true;
}
function getLowStock() {
  return getProducts(true).filter(p => p.stock <= p.minStock);
}

// ===== ORDERS =====
function getOrders() {
  return JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]');
}
function saveOrders(orders) {
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent('ordersUpdated'));
}
function addOrder(order) {
  const orders = getOrders();
  order.id = 'ORD' + Date.now();
  order.createdAt = new Date().toISOString();
  order.status = order.status || 'pending';
  orders.unshift(order);
  saveOrders(orders);
  return order;
}
function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const o = orders.find(x => x.id === orderId);
  if (o) { o.status = status; o.updatedAt = new Date().toISOString(); saveOrders(orders); }
}

// ===== SETTINGS =====
function getSettings() {
  return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{}');
}
function saveSettings(s) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(s));
}

// ===== CATEGORIES =====
function getCategories() {
  const cats = [...new Set(getProducts().map(p => p.category))];
  return cats;
}

// ===== STATS =====
function getTodayStats() {
  const today = new Date().toDateString();
  const orders = getOrders().filter(o =>
    new Date(o.createdAt).toDateString() === today && o.status !== 'cancelled'
  );
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const profit = orders.reduce((s, o) => s + (o.profit || 0), 0);
  return { orders: orders.length, revenue, profit };
}

function getMonthStats() {
  const now = new Date();
  const orders = getOrders().filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && o.status !== 'cancelled';
  });
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const profit = orders.reduce((s, o) => s + (o.profit || 0), 0);
  return { orders: orders.length, revenue, profit };
}

// ===== FORMAT =====
function formatMoney(n) { return '฿' + Number(n).toLocaleString('th-TH', {minimumFractionDigits: 0}); }
function formatDate(iso) {
  return new Date(iso).toLocaleString('th-TH', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
}

// Init on load
initStore();
