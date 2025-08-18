/* ============================================================
 * Shopee/Lazada/Facebook metrics — Shopee-accurate version
 * - นับคำสั่งซื้อแบบ DISTINCT โดยใช้ "รหัสการสั่งซื้อ" (ค่าเริ่มต้น)
 * - ตัดคำสั่งซื้อสถานะ "ยกเลิก"
 * - คอมมิชชั่น:
 *   • โหมด net        → ค่าคอมมิชชั่นสุทธิ(฿)  (fallback: คำสั่งซื้อโดยรวม → สินค้าโดยรวม)
 *   • โหมด orderTotal → คอมมิชชั่นคำสั่งซื้อโดยรวม(฿) (fallback: net → item)
 *   • โหมด itemTotal  → คอมมิชชั่นสินค้าโดยรวม(฿)
 * - ป้องกันการนับซ้ำ: รวมคอมมิชชั่น “ต่อออเดอร์” ด้วยตัวรวม per-order แล้วค่อยตัดสินใจตามโหมด
 *   (ดังนั้นโหมด net/orderTotal จะไม่ถูกบวกลูปซ้ำกรณี 1 ออเดอร์มีหลายแถวสินค้า)
 * ============================================================ */

export interface ShopeeOrder {
  'เลขที่คำสั่งซื้อ': string;
  'รหัสการสั่งซื้อ'?: string;
  'รหัสสินค้า': string;
  'ชื่อสินค้า': string;
  'ราคาสินค้า(฿)': string;
  'คอมมิชชั่นสินค้า(%)': string;
  'คอมมิชชั่นสินค้าโดยรวม(฿)': string;
  'คอมมิชชั่นคำสั่งซื้อโดยรวม(฿)'?: string;
  'ค่าคอมมิชชั่นสุทธิ(฿)'?: string;
  'วันที่สั่งซื้อ'?: string;
  'เวลาที่สั่งซื้อ'?: string;
  'สถานะ'?: string;
  'สถานะการสั่งซื้อ'?: string;
  'วิธีการชำระ'?: string;
  'ผู้ให้บริการโลจิสติกส์'?: string;
  'ยอดขายสินค้าโดยรวม(฿)'?: string;
  'ช่องทาง'?: string;
  'Sub_id1'?: string;
  'Sub_id2'?: string;
  'Sub_id3'?: string;
  'Sub_id4'?: string;
  'Sub_id5'?: string;
  sub_id?: string;
}

export interface LazadaOrder {
  'Check Out ID': string;
  'Order Number'?: string;
  'Order Time'?: string;
  'Conversion Time'?: string;
  'SKU'?: string;
  'Item Name'?: string;
  'Sales Channel'?: string;
  'Order Amount'?: string;
  'Shipping Fee'?: string;
  'Voucher Amount'?: string;
  'Buyer Paid Amount'?: string;
  'Shipping Provider'?: string;
  'Order Status'?: string;
  'Payment Method'?: string;
  'Customer Name'?: string;
  'Customer Phone Number'?: string;
  'Shipping Address'?: string;
  'Billing Address'?: string;
  'Payout'?: string;
  'Aff Sub ID'?: string;
  'Sub ID 1'?: string;
  'Sub ID 2'?: string;
  'Sub ID 3'?: string;
  'Sub ID 4'?: string;
  'Sub ID'?: string;
  'Validity'?: string;
}

export interface FacebookAd {
  'Campaign name'?: string;
  'Ad set name'?: string;
  'Ad name'?: string;
  'Amount spent (THB)'?: string;
  'Impressions'?: string;
  'Link clicks'?: string;
  'Landing page views'?: string;
  'Reach'?: string;
  'Frequency'?: string;
  'CPM (cost per 1,000 impressions)'?: string;
  'CPC (cost per link click)'?: string;
  'CTR (link click-through rate)'?: string;
  'Date'?: string;
  'Day'?: string;
  'Sub ID'?: string;
}

export interface CalculatedMetrics {
  totalAdsSpent: number;
  totalComSP: number;
  totalComLZD: number;
  totalCom: number;
  totalOrdersSP: number;
  totalOrdersLZD: number;
  totalAmountSP: number;
  totalAmountLZD: number;
  profit: number;
  roi: number;
  cpoSP: number;
  cpoLZD: number;
  cpcLink: number;
  apcLZD: number;
  validOrdersLZD: number;
  invalidOrdersLZD: number;
  totalLinkClicks: number;
  totalReach: number;
  totalRevenue: number;
  totalProfit: number;
  revenueChange: number;
  profitChange: number;
  roiChange: number;
  ordersChange: number;
  filteredShopeeOrders?: ShopeeOrder[];
  filteredLazadaOrders?: LazadaOrder[];
  filteredFacebookAds?: FacebookAd[];
}

/* ----------------- Helpers ----------------- */

const parseNumber = (value: string | number | undefined): number => {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

const isCanceledShopee = (order: ShopeeOrder | Record<string, any>): boolean => {
  const raw = (order['สถานะการสั่งซื้อ'] ?? order['สถานะ'] ?? '')
    .toString()
    .trim()
    .toLowerCase();
  const canceledValues = new Set(['ยกเลิก', 'ถูกยกเลิก', 'cancel', 'canceled', 'cancelled']);
  return canceledValues.has(raw);
};

// ใช้ "รหัสการสั่งซื้อ" เป็นค่าเริ่มต้น (ตรงกับหน้า Shopee)
const getShopeeOrderId = (
  order: ShopeeOrder,
  preferredKey: 'เลขที่คำสั่งซื้อ' | 'รหัสการสั่งซื้อ' = 'รหัสการสั่งซื้อ'
): string => {
  if (preferredKey === 'รหัสการสั่งซื้อ' && order['รหัสการสั่งซื้อ']) return order['รหัสการสั่งซื้อ']!;
  return order['รหัสการสั่งซื้อ'] ?? order['เลขที่คำสั่งซื้อ'] ?? '';
};

// YYYY-MM-DD (ใช้ "เวลาที่สั่งซื้อ" เป็นหลัก)
const parseShopeeDateKey = (order: ShopeeOrder): string => {
  const candidates = [order['เวลาที่สั่งซื้อ'], order['วันที่สั่งซื้อ']];
  for (const d of candidates) {
    if (!d) continue;
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
    const df = new Date(d.replace(/(\d{2})-(\d{2})-(\d{4})/, '$2-$1-$3'));
    if (!isNaN(df.getTime())) return df.toISOString().split('T')[0];
  }
  return 'Unknown';
};

const parseLazadaDateKey = (order: LazadaOrder): string => {
  const candidates = [order['Order Time'], order['Conversion Time']];
  for (const d of candidates) {
    if (!d) continue;
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
    const df = new Date(d.replace(/(\d{2})-(\d{2})-(\d{4})/, '$2-$1-$3'));
    if (!isNaN(df.getTime())) return df.toISOString().split('T')[0];
  }
  return 'Unknown';
};

/* ---------------- Commission mode ---------------- */

export type CommissionMode = 'net' | 'orderTotal' | 'itemTotal';

/** รวมคอมมิชชั่น “ต่อออเดอร์” อย่างปลอดภัยจากกลุ่มแถวของออเดอร์เดียวกัน */
type ShopeeOrderAgg = {
  orderId: string;
  dateKey: string;
  itemTotalSum: number;     // sum(คอมมิชชั่นสินค้าโดยรวม) ของแถวที่ถูกกรอง
  orderTotalCandidates: number[]; // ค่าที่มาจาก "คอมมิชชั่นคำสั่งซื้อโดยรวม(฿)" (อาจซ้ำหลายแถว)
  netCandidates: number[];        // ค่าที่มาจาก "ค่าคอมมิชชั่นสุทธิ(฿)" (อาจซ้ำหลายแถว)
  amountItemSum: number;    // sum ยอดขายสินค้าโดยรวม ต่อแถว (สอดคล้องกรองสินค้า)
};

function aggregateShopeeByOrder(
  rows: ShopeeOrder[],
  idKey: 'เลขที่คำสั่งซื้อ' | 'รหัสการสั่งซื้อ'
): Map<string, ShopeeOrderAgg> {
  const map = new Map<string, ShopeeOrderAgg>();
  for (const r of rows) {
    const id = getShopeeOrderId(r, idKey);
    if (!id) continue;
    const agg =
      map.get(id) ||
      {
        orderId: id,
        dateKey: parseShopeeDateKey(r),
        itemTotalSum: 0,
        orderTotalCandidates: [],
        netCandidates: [],
        amountItemSum: 0
      };
    agg.itemTotalSum += parseNumber(r['คอมมิชชั่นสินค้าโดยรวม(฿)']);
    const ot = parseNumber(r['คอมมิชชั่นคำสั่งซื้อโดยรวม(฿)']);
    const nt = parseNumber(r['ค่าคอมมิชชั่นสุทธิ(฿)']);
    if (ot > 0) agg.orderTotalCandidates.push(ot);
    if (nt > 0) agg.netCandidates.push(nt);
    agg.amountItemSum += parseNumber(r['ยอดขายสินค้าโดยรวม(฿)']);
    map.set(id, agg);
  }
  return map;
}

function pickCommissionFromAgg(agg: ShopeeOrderAgg, mode: CommissionMode): number {
  if (mode === 'itemTotal') return agg.itemTotalSum;
  if (mode === 'orderTotal') {
    const best = Math.max(0, ...agg.orderTotalCandidates);
    return best > 0 ? best : (Math.max(0, ...agg.netCandidates) || agg.itemTotalSum);
  }
  // net
  const bestNet = Math.max(0, ...agg.netCandidates);
  if (bestNet > 0) return bestNet;
  const bestOrder = Math.max(0, ...agg.orderTotalCandidates);
  return bestOrder > 0 ? bestOrder : agg.itemTotalSum;
}

/* ---------------- calculateMetrics ---------------- */

export function calculateMetrics(
  shopeeOrders: ShopeeOrder[],
  lazadaOrders: LazadaOrder[],
  facebookAds: FacebookAd[],
  selectedSubIds: string[] = [],
  selectedValidity: string = 'all',
  selectedChannels: string[] = [],
  selectedPlatform: string = 'all',
  options: {
    shopeeOrderIdKey?: 'เลขที่คำสั่งซื้อ' | 'รหัสการสั่งซื้อ';
    dateFrom?: string; // YYYY-MM-DD (รวม)
    dateTo?: string;   // YYYY-MM-DD (รวม)
    commissionMode?: CommissionMode;     // default: 'net'
    selectedSkus?: string[];             // ถ้ามี จะบังคับเป็น itemTotal
    productNameIncludes?: string[];      // ถ้ามี จะบังคับเป็น itemTotal
  } = {}
): CalculatedMetrics {
  const shopeeOrderIdKey = options.shopeeOrderIdKey ?? 'รหัสการสั่งซื้อ';

  // ---- Filter Shopee ----
  let filteredShopeeOrders =
    selectedPlatform === 'all' || selectedPlatform === 'Shopee' ? shopeeOrders : [];

  const byDate = (o: ShopeeOrder) => {
    if (!options.dateFrom && !options.dateTo) return true;
    const k = parseShopeeDateKey(o);
    if (options.dateFrom && k < options.dateFrom) return false;
    if (options.dateTo && k > options.dateTo) return false;
    return true;
  };

  filteredShopeeOrders = filteredShopeeOrders.filter(byDate).filter(o => !isCanceledShopee(o));

  if (options.selectedSkus?.length) {
    const skuSet = new Set(options.selectedSkus.filter(Boolean));
    filteredShopeeOrders = filteredShopeeOrders.filter(o => skuSet.has(o['รหัสสินค้า']));
  }
  if (options.productNameIncludes?.length) {
    const kws = options.productNameIncludes.map(s => s.toLowerCase()).filter(Boolean);
    if (kws.length) {
      filteredShopeeOrders = filteredShopeeOrders.filter(o => {
        const name = (o['ชื่อสินค้า'] || '').toLowerCase();
        return kws.some(k => name.includes(k));
      });
    }
  }

  if (selectedSubIds.length > 0 && !selectedSubIds.includes('all')) {
    filteredShopeeOrders = filteredShopeeOrders.filter(order => {
      const orderSubIds = [
        order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']
      ].filter(Boolean);
      return orderSubIds.some(subId => selectedSubIds.includes(subId || ''));
    });
  }
  if (selectedChannels.length > 0 && !selectedChannels.includes('all')) {
    filteredShopeeOrders = filteredShopeeOrders.filter(order =>
      selectedChannels.includes(order['ช่องทาง'] || '')
    );
  }

  // ถ้ามีตัวกรองสินค้า → บังคับ itemTotal (ไม่ให้บวมจากทั้งออเดอร์)
  const commissionMode: CommissionMode =
    (options.selectedSkus?.length || options.productNameIncludes?.length)
      ? 'itemTotal'
      : (options.commissionMode ?? 'net');

  // รวมต่อออเดอร์
  const shopeeAgg = aggregateShopeeByOrder(filteredShopeeOrders, shopeeOrderIdKey);

  const totalComSP = Array.from(shopeeAgg.values()).reduce(
    (s, a) => s + pickCommissionFromAgg(a, commissionMode),
    0
  );
  const totalAmountSP = Array.from(shopeeAgg.values()).reduce((s, a) => s + a.amountItemSum, 0);
  const totalOrdersSP = shopeeAgg.size;

  // ---- Lazada ----
  let filteredLazadaOrders =
    selectedChannels.length > 0 && !selectedChannels.includes('all')
      ? []
      : selectedPlatform === 'all' || selectedPlatform === 'Lazada'
      ? lazadaOrders
      : [];

  if (selectedSubIds.length > 0 && !selectedSubIds.includes('all')) {
    filteredLazadaOrders = filteredLazadaOrders.filter(order => {
      const orderSubIds = [
        order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']
      ].filter(Boolean);
      return orderSubIds.some(subId => selectedSubIds.includes(subId || ''));
    });
  }
  if (selectedValidity !== 'all') {
    filteredLazadaOrders = filteredLazadaOrders.filter(order => order['Validity'] === selectedValidity);
  }

  const uniqueLazadaOrders = new Map<string, { payout: number; amount: number; status?: string }>();
  filteredLazadaOrders.forEach(order => {
    const id = order['Check Out ID'];
    const payout = parseNumber(order['Payout']);
    const amount = parseNumber(order['Order Amount']);
    if (!uniqueLazadaOrders.has(id)) {
      uniqueLazadaOrders.set(id, { payout, amount, status: order['Order Status'] });
    } else {
      const exist = uniqueLazadaOrders.get(id)!;
      exist.payout += payout;
      exist.amount += amount;
    }
  });

  const totalComLZD = Array.from(uniqueLazadaOrders.values()).reduce((s, o) => s + o.payout, 0);
  const totalAmountLZD = Array.from(uniqueLazadaOrders.values()).reduce((s, o) => s + o.amount, 0);
  const totalOrdersLZD = uniqueLazadaOrders.size;
  const validOrdersLZD = Array.from(uniqueLazadaOrders.values()).filter(
    o => o.status === 'shipped' || o.status === 'delivered' || o.payout > 0
  ).length;
  const invalidOrdersLZD = totalOrdersLZD - validOrdersLZD;

  // ---- Facebook Ads ----
  let filteredFacebookAds =
    selectedPlatform === 'all' || selectedPlatform === 'Facebook' ? facebookAds : [];
  if (selectedChannels.length > 0 && !selectedChannels.includes('all')) filteredFacebookAds = [];
  if (selectedSubIds.length > 0 && !selectedSubIds.includes('all')) {
    filteredFacebookAds = filteredFacebookAds.filter(ad => {
      const s = `${ad['Campaign name'] || ''} ${ad['Ad set name'] || ''} ${ad['Ad name'] || ''}`.toLowerCase();
      return selectedSubIds.some(x => x && typeof x === 'string' && s.includes(x.toLowerCase()));
    });
  }

  const totalAdsSpent = filteredFacebookAds.reduce((s, ad) => s + parseNumber(ad['Amount spent (THB)']), 0);
  const totalLinkClicks = filteredFacebookAds.reduce((s, ad) => s + parseNumber(ad['Link clicks']), 0);
  const totalReach = filteredFacebookAds.reduce((s, ad) => s + parseNumber(ad['Reach']), 0);
  const avgCpcLink =
    filteredFacebookAds.length > 0
      ? filteredFacebookAds.reduce((sum, ad) => sum + parseNumber(ad['CPC (cost per link click)']), 0) /
        filteredFacebookAds.length
      : 0;

  // ---- Derived ----
  const totalCom = totalComSP + totalComLZD;
  const profit = totalCom - totalAdsSpent;
  const roi = totalAdsSpent > 0 ? (profit / totalAdsSpent) * 100 : 0;
  const cpoSP = totalOrdersSP > 0 ? totalAdsSpent / totalOrdersSP : 0;
  const cpoLZD = validOrdersLZD > 0 ? totalAdsSpent / validOrdersLZD : 0;
  const apcLZD = totalAdsSpent > 0 ? totalAmountLZD / totalAdsSpent : 0;

  return {
    totalAdsSpent,
    totalComSP,
    totalComLZD,
    totalCom,
    totalOrdersSP,
    totalOrdersLZD,
    totalAmountSP,
    totalAmountLZD,
    profit,
    roi,
    cpoSP,
    cpoLZD,
    cpcLink: avgCpcLink,
    apcLZD,
    validOrdersLZD,
    invalidOrdersLZD,
    totalLinkClicks,
    totalReach,
    totalRevenue: totalCom,
    totalProfit: profit,
    revenueChange: 0,
    profitChange: 0,
    roiChange: 0,
    ordersChange: 0,
    filteredShopeeOrders: filteredShopeeOrders,
    filteredLazadaOrders,
    filteredFacebookAds
  };
}

/* ---------------- Daily breakdown (ผลรวมรายวัน = Summary) ---------------- */

export interface DailyStableRow {
  date: string; // YYYY-MM-DD หรือ 'Unknown'
  ordersSP: number;
  ordersLZD: number;
  ordersTotal: number;
  comSP: number;
  comLZD: number;
  totalCom: number;
  adSpend: number;
  profit: number;
  roi: number;
}

export function analyzeDailyBreakdownStable(
  shopeeInput: ShopeeOrder[],
  lazadaInput: LazadaOrder[],
  facebookAds: FacebookAd[],
  options: {
    shopeeOrderIdKey?: 'เลขที่คำสั่งซื้อ' | 'รหัสการสั่งซื้อ';
    includeUnknownBucket?: boolean;
    commissionMode?: CommissionMode; // default: 'net'
  } = {}
): DailyStableRow[] {
  const shopeeOrderIdKey = options.shopeeOrderIdKey ?? 'รหัสการสั่งซื้อ';
  const includeUnknown = options.includeUnknownBucket ?? true;
  const mode: CommissionMode = options.commissionMode ?? 'net';

  type DayAgg = { ordersSP: Set<string>; ordersLZD: Set<string>; comSP: number; comLZD: number; adSpend: number; };
  const daily: Record<string, DayAgg> = {};

  // Shopee — ต่อออเดอร์
  const active = shopeeInput.filter(o => !isCanceledShopee(o));
  const aggByOrder = aggregateShopeeByOrder(active, shopeeOrderIdKey);
  aggByOrder.forEach((agg, orderId) => {
    const key = agg.dateKey || 'Unknown';
    if (!daily[key]) daily[key] = { ordersSP: new Set(), ordersLZD: new Set(), comSP: 0, comLZD: 0, adSpend: 0 };
    daily[key].ordersSP.add(orderId);
    daily[key].comSP += pickCommissionFromAgg(agg, mode);
  });

  // Lazada — ต่อออเดอร์
  const lzdUnique = new Map<string, { payout: number; dateKey: string }>();
  lazadaInput.forEach(o => {
    const id = o['Check Out ID'];
    const payout = parseNumber(o['Payout']);
    const dateKey = parseLazadaDateKey(o);
    if (!lzdUnique.has(id)) lzdUnique.set(id, { payout, dateKey });
    else lzdUnique.get(id)!.payout += payout;
  });
  lzdUnique.forEach((val, id) => {
    const key = val.dateKey || 'Unknown';
    if (!daily[key]) daily[key] = { ordersSP: new Set(), ordersLZD: new Set(), comSP: 0, comLZD: 0, adSpend: 0 };
    daily[key].ordersLZD.add(id);
    daily[key].comLZD += val.payout;
  });

  // Ads — ผูกกับวัน
  facebookAds.forEach(ad => {
    const dateStr = ad['Day'] || ad['Date'] || '';
    let key = 'Unknown';
    if (dateStr) {
      const dt = new Date(dateStr);
      if (!isNaN(dt.getTime())) key = dt.toISOString().split('T')[0];
    }
    if (!daily[key]) daily[key] = { ordersSP: new Set(), ordersLZD: new Set(), comSP: 0, comLZD: 0, adSpend: 0 };
    daily[key].adSpend += parseNumber(ad['Amount spent (THB)']);
  });

  // สรุปผล
  const rows: DailyStableRow[] = Object.entries(daily)
    .filter(([key]) => includeUnknown || key !== 'Unknown')
    .map(([date, agg]) => {
      const totalCom = agg.comSP + agg.comLZD;
      const profit = totalCom - agg.adSpend;
      const roi = agg.adSpend > 0 ? (profit / agg.adSpend) * 100 : 0;
      return {
        date,
        ordersSP: agg.ordersSP.size,
        ordersLZD: agg.ordersLZD.size,
        ordersTotal: agg.ordersSP.size + agg.ordersLZD.size,
        comSP: agg.comSP,
        comLZD: agg.comLZD,
        totalCom,
        adSpend: agg.adSpend,
        profit,
        roi
      };
    })
    .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  return rows;
}

/* ---------------- Extra analytics ---------------- */

interface SubIdPerformance {
  id: string;
  orders: number;
  commission: number;
  adSpent: number;
  roi: number;
  platform: string;
}

export function analyzeSubIdPerformance(
  shopeeOrders: ShopeeOrder[],
  lazadaOrders: LazadaOrder[],
  facebookAds: FacebookAd[],
  commissionMode: CommissionMode = 'net'
): SubIdPerformance[] {
  const subIdMap: Record<string, { commission: number; orders: number; adSpent: number; platform: string }> = {};

  // Shopee (ตัดยกเลิก + ต่อออเดอร์)
  const shopeeActive = shopeeOrders.filter(o => !isCanceledShopee(o));
  const byOrder = aggregateShopeeByOrder(shopeeActive, 'รหัสการสั่งซื้อ');
  byOrder.forEach((agg, orderId) => {
    const commission = pickCommissionFromAgg(agg, commissionMode);
    // หยิบ sub id จากแถวแรกที่เจอของออเดอร์นั้น
    const rows = shopeeActive.filter(o => getShopeeOrderId(o, 'รหัสการสั่งซื้อ') === orderId);
    const subIds = new Set<string>();
    rows.forEach(o => [o['Sub_id1'], o['Sub_id2'], o['Sub_id3'], o['Sub_id4'], o['Sub_id5']].forEach(x => x && subIds.add(x)));
    if (subIds.size === 0) subIds.add('(none)');
    subIds.forEach(subId => {
      if (!subIdMap[subId]) subIdMap[subId] = { commission: 0, orders: 0, adSpent: 0, platform: 'Shopee' };
      subIdMap[subId].commission += commission;
      subIdMap[subId].orders += 1;
      // จับคู่ค่าโฆษณาอย่างหยาบจากชื่อ campaign/ad
      subIdMap[subId].adSpent = matchSubIdWithAds(subId, facebookAds);
      if (subIdMap[subId].platform !== 'Shopee' && subIdMap[subId].platform !== 'Mixed') subIdMap[subId].platform = 'Mixed';
    });
  });

  // Lazada (dedup by Check Out ID)
  const uniqueLazada = new Map<string, LazadaOrder>();
  lazadaOrders.forEach(o => { if (!uniqueLazada.has(o['Check Out ID'])) uniqueLazada.set(o['Check Out ID'], o); });
  Array.from(uniqueLazada.values()).forEach(order => {
    const subIds = [order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']].filter(Boolean) as string[];
    const payout = parseNumber(order['Payout']);
    if (subIds.length === 0) subIds.push('(none)');
    subIds.forEach(subId => {
      if (!subIdMap[subId]) subIdMap[subId] = { commission: 0, orders: 0, adSpent: 0, platform: 'Lazada' };
      subIdMap[subId].commission += payout;
      subIdMap[subId].orders += 1;
      subIdMap[subId].adSpent = matchSubIdWithAds(subId, facebookAds);
      if (subIdMap[subId].platform !== 'Lazada' && subIdMap[subId].platform !== 'Mixed') subIdMap[subId].platform = 'Mixed';
    });
  });

  return Object.entries(subIdMap)
    .map(([id, data]) => {
      const roi = data.adSpent > 0 ? ((data.commission - data.adSpent) / data.adSpent) * 100 : 0;
      return { id, orders: data.orders, commission: data.commission, adSpent: data.adSpent, roi, platform: data.platform };
    })
    .sort((a, b) => b.commission - a.commission);
}

interface PlatformPerformance {
  id: number;
  platform: string;
  icon: string;
  orders: number;
  commission: number;
  adSpend: number;
  roi: number;
  status: string;
  change: number;
}

export function analyzePlatformPerformance(
  shopeeOrders: ShopeeOrder[],
  lazadaOrders: LazadaOrder[],
  totalAdsSpent: number,
  commissionMode: CommissionMode = 'net'
): PlatformPerformance[] {
  const shopeeActive = shopeeOrders.filter(o => !isCanceledShopee(o));
  const shpAgg = aggregateShopeeByOrder(shopeeActive, 'รหัสการสั่งซื้อ');
  const shopeeCommission = Array.from(shpAgg.values()).reduce((s, a) => s + pickCommissionFromAgg(a, commissionMode), 0);
  const uniqueShopeeOrders = shpAgg.size;

  const uniqueLazadaOrders = new Map<string, LazadaOrder>();
  lazadaOrders.forEach(o => { if (!uniqueLazadaOrders.has(o['Check Out ID'])) uniqueLazadaOrders.set(o['Check Out ID'], o); });
  const lazadaCommission = Array.from(uniqueLazadaOrders.values()).reduce((sum, o) => sum + parseNumber(o['Payout']), 0);

  const shopeeROI = totalAdsSpent > 0 ? (shopeeCommission / totalAdsSpent) * 100 : 0;
  const lazadaROI = totalAdsSpent > 0 ? (lazadaCommission / totalAdsSpent) * 100 : 0;

  return [
    {
      id: 1, platform: 'Shopee', icon: '🛒',
      orders: uniqueShopeeOrders,
      commission: shopeeCommission,
      adSpend: totalAdsSpent / 2,
      roi: shopeeROI,
      status: shopeeROI > 50 ? 'good' : 'average',
      change: 5.2
    },
    {
      id: 2, platform: 'Lazada', icon: '🛍️',
      orders: uniqueLazadaOrders.size,
      commission: lazadaCommission,
      adSpend: totalAdsSpent / 2,
      roi: lazadaROI,
      status: lazadaROI > 60 ? 'excellent' : 'good',
      change: -2.8
    },
    {
      id: 3, platform: 'Facebook Ads', icon: '📘',
      orders: 0,
      commission: 0,
      adSpend: totalAdsSpent,
      roi: totalAdsSpent > 0 ? ((totalAdsSpent * 0.2) / totalAdsSpent) * 100 : 0,
      status: totalAdsSpent > 0 ? 'average' : 'bad',
      change: 12.5
    }
  ];
}

// รวมคอมมิชชั่น Shopee แบบ raw (ตัดยกเลิก) — ปลอดภัยต่อหลายแถว/ออเดอร์
export function sumShopeeCommissionRaw(
  shopeeOrders: ShopeeOrder[],
  mode: CommissionMode = 'net'
): number {
  const active = shopeeOrders.filter(o => !isCanceledShopee(o));
  const agg = aggregateShopeeByOrder(active, 'รหัสการสั่งซื้อ');
  return Array.from(agg.values()).reduce((s, a) => s + pickCommissionFromAgg(a, mode), 0);
}

/* -------- Compatibility shim (ถ้าโค้ดเก่าเรียกใช้) -------- */

export interface DailyMetrics {
  date: string;
  totalCom: number;
  adSpend: number;
  profit: number;
  roi: number;
}

export function analyzeDailyPerformance(
  shopeeOrders: ShopeeOrder[],
  lazadaOrders: LazadaOrder[],
  facebookAds: FacebookAd[],
  commissionMode: CommissionMode = 'net'
): DailyMetrics[] {
  const rows = analyzeDailyBreakdownStable(shopeeOrders, lazadaOrders, facebookAds, {
    shopeeOrderIdKey: 'รหัสการสั่งซื้อ',
    includeUnknownBucket: true,
    commissionMode
  });
  return rows.map(r => ({
    date: r.date,
    totalCom: r.totalCom,
    adSpend: r.adSpend,
    profit: r.profit,
    roi: r.roi
  }));
}

/* ---------------- Small helper for ads mapping ---------------- */

function matchSubIdWithAds(subId: string, facebookAds: FacebookAd[]): number {
  if (!subId) return 0;
  return facebookAds.reduce((total, ad) => {
    const campaignName = ad['Campaign name'] || '';
    const adSetName = ad['Ad set name'] || '';
    const adName = ad['Ad name'] || '';
    const allNames = `${campaignName} ${adSetName} ${adName}`.toLowerCase();
    if (subId && typeof subId === 'string' && allNames.includes(subId.toLowerCase())) {
      return total + parseNumber(ad['Amount spent (THB)']);
    }
    return total;
  }, 0);
}

/* =========================
 * TraditionalCampaign + generateTraditionalCampaigns
 * ========================= */

export interface TraditionalCampaign {
  id: number;
  name: string;
  platform: 'Shopee' | 'Lazada';
  subId: string;
  orders: number;
  commission: number;
  adSpend: number;
  roi: number;              // (%)
  status: 'active' | 'paused';
  startDate: string;        // YYYY-MM-DD
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

/**
 * สร้างรายการแคมเปญตาม Sub ID แยก Shopee / Lazada
 * - Shopee: ตัด "ยกเลิก", รวมคอมมิชชั่น "ต่อออเดอร์" ด้วย CommissionMode (net/orderTotal/itemTotal)
 * - Lazada: dedup ตาม Check Out ID แล้วรวม Payout
 * - Ad spend: จับคู่แบบหยาบจากชื่อแคมเปญ/แอดที่มี subId อยู่ในข้อความ (matchSubIdWithAds)
 */
export function generateTraditionalCampaigns(
  shopeeOrders: ShopeeOrder[],
  lazadaOrders: LazadaOrder[],
  facebookAds: FacebookAd[],
  commissionMode: CommissionMode = 'net'
): TraditionalCampaign[] {
  const campaigns: TraditionalCampaign[] = [];
  let campaignId = 1;

  /* ---------- Shopee ---------- */
  const shopeeActive = shopeeOrders.filter(o => !isCanceledShopee(o));
  // รวมต่อออเดอร์ (ใช้อะไรที่เรามีอยู่แล้ว)
  const shpAgg = aggregateShopeeByOrder(shopeeActive, 'รหัสการสั่งซื้อ');

  // map: orderId -> subIds[]
  const orderSubIds = new Map<string, Set<string>>();
  const orderDate   = new Map<string, string>(); // YYYY-MM-DD
  for (const row of shopeeActive) {
    const id = getShopeeOrderId(row, 'รหัสการสั่งซื้อ');
    if (!id) continue;
    const set = orderSubIds.get(id) ?? new Set<string>();
    [row['Sub_id1'], row['Sub_id2'], row['Sub_id3'], row['Sub_id4'], row['Sub_id5']]
      .filter(Boolean)
      .forEach(s => set.add(s as string));
    orderSubIds.set(id, set);
    // เก็บวันที่ล่าสุดของออเดอร์
    const dk = parseShopeeDateKey(row);
    const prev = orderDate.get(id);
    if (!prev || dk > prev) orderDate.set(id, dk);
  }

  // สรุปเป็นราย subId
  const shpBySub: Record<string, { orders: number; commission: number; latest: string }> = {};
  shpAgg.forEach((agg, orderId) => {
    const commission = pickCommissionFromAgg(agg, commissionMode);
    const subIds = orderSubIds.get(orderId);
    const latest = orderDate.get(orderId) || 'Unknown';
    const targetSubs = subIds && subIds.size > 0 ? Array.from(subIds) : ['(none)'];
    targetSubs.forEach(sub => {
      if (!shpBySub[sub]) shpBySub[sub] = { orders: 0, commission: 0, latest: '0000-00-00' };
      shpBySub[sub].orders += 1;
      shpBySub[sub].commission += commission;
      if (latest > shpBySub[sub].latest) shpBySub[sub].latest = latest;
    });
  });

  Object.entries(shpBySub).forEach(([subId, data]) => {
    const adSpent = matchSubIdWithAds(subId, facebookAds);
    const roi = adSpent > 0 ? ((data.commission - adSpent) / adSpent) * 100 : 0;
    const performance: TraditionalCampaign['performance'] =
      roi >= 100 ? 'excellent' : roi >= 50 ? 'good' : roi >= 0 ? 'average' : 'poor';

    campaigns.push({
      id: campaignId++,
      name: `Shopee Campaign - ${subId}`,
      platform: 'Shopee',
      subId,
      orders: data.orders,
      commission: Math.round(data.commission * 100) / 100,
      adSpend: Math.round(adSpent * 100) / 100,
      roi: Math.round(roi * 10) / 10,
      status: data.orders > 0 ? 'active' : 'paused',
      startDate: (data.latest && data.latest !== 'Unknown') ? data.latest : '0000-00-00',
      performance
    });
  });

  /* ---------- Lazada ---------- */
  const lzdUnique = new Map<string, LazadaOrder>();
  lazadaOrders.forEach(o => {
    const id = o['Check Out ID'];
    if (id && !lzdUnique.has(id)) lzdUnique.set(id, o);
  });

  const lzdBySub: Record<string, { orders: number; commission: number; latest: string }> = {};
  Array.from(lzdUnique.values()).forEach(order => {
    const subIds = [
      order['Aff Sub ID'],
      order['Sub ID 1'],
      order['Sub ID 2'],
      order['Sub ID 3'],
      order['Sub ID 4']
    ].filter(Boolean) as string[];

    const payout = parseNumber(order['Payout']);
    // วันใช้ Order Time/Conversion Time ที่ parse แล้ว max
    const dk = (() => {
      const keys = [order['Order Time'], order['Conversion Time']].filter(Boolean) as string[];
      const dates = keys
        .map(k => {
          const d = new Date(k);
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
          const df = new Date(k.replace(/(\d{2})-(\d{2})-(\d{4})/, '$2-$1-$3'));
          return !isNaN(df.getTime()) ? df.toISOString().split('T')[0] : '0000-00-00';
        })
        .sort();
      return dates.length ? dates[dates.length - 1] : '0000-00-00';
    })();

    const targets = subIds.length ? subIds : ['(none)'];
    targets.forEach(sub => {
      if (!lzdBySub[sub]) lzdBySub[sub] = { orders: 0, commission: 0, latest: '0000-00-00' };
      lzdBySub[sub].orders += 1;
      lzdBySub[sub].commission += payout;
      if (dk > lzdBySub[sub].latest) lzdBySub[sub].latest = dk;
    });
  });

  Object.entries(lzdBySub).forEach(([subId, data]) => {
    const adSpent = matchSubIdWithAds(subId, facebookAds);
    const roi = adSpent > 0 ? ((data.commission - adSpent) / adSpent) * 100 : 0;
    const performance: TraditionalCampaign['performance'] =
      roi >= 100 ? 'excellent' : roi >= 50 ? 'good' : roi >= 0 ? 'average' : 'poor';

    campaigns.push({
      id: campaignId++,
      name: `Lazada Campaign - ${subId}`,
      platform: 'Lazada',
      subId,
      orders: data.orders,
      commission: Math.round(data.commission * 100) / 100,
      adSpend: Math.round(adSpent * 100) / 100,
      roi: Math.round(roi * 10) / 10,
      status: data.orders > 0 ? 'active' : 'paused',
      startDate: data.latest,
      performance
    });
  });

  // เรียงตามคอมมิชชั่นมาก→น้อย
  return campaigns.sort((a, b) => b.commission - a.commission);
}


