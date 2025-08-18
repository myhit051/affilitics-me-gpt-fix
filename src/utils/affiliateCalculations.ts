/* =========================
 * Interfaces (ตามสคีมาเดิม)
 * ========================= */
interface ShopeeOrder {
  'เลขที่คำสั่งซื้อ': string;
  'รหัสการสั่งซื้อ'?: string; // เพิ่ม optional เพื่อรองรับไฟล์ export บางเวอร์ชัน
  'รหัสสินค้า': string;
  'ชื่อสินค้า': string;
  'ราคาสินค้า(฿)': string;
  'คอมมิชชั่นสินค้า(%)': string;
  'คอมมิชชั่นสินค้าโดยรวม(฿)': string;
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

interface LazadaOrder {
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

interface FacebookAd {
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

/* =========================
 * Helpers
 * ========================= */
const parseNumber = (value: string | number | undefined): number => {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

const isCanceledShopee = (order: ShopeeOrder | Record<string, any>): boolean => {
  const raw = (order['สถานะการสั่งซื้อ'] ?? order['สถานะ'] ?? '').toString().trim().toLowerCase();
  const canceledValues = new Set(['ยกเลิก', 'ถูกยกเลิก', 'cancel', 'canceled', 'cancelled']);
  return canceledValues.has(raw);
};

// เลือกคีย์ ID ของออเดอร์ Shopee ให้เสถียร (ค่าเริ่มต้นใช้ "เลขที่คำสั่งซื้อ")
const getShopeeOrderId = (order: ShopeeOrder, preferredKey: 'เลขที่คำสั่งซื้อ' | 'รหัสการสั่งซื้อ' = 'เลขที่คำสั่งซื้อ'): string => {
  if (preferredKey === 'รหัสการสั่งซื้อ' && order['รหัสการสั่งซื้อ']) return order['รหัสการสั่งซื้อ']!;
  return order['เลขที่คำสั่งซื้อ'] ?? order['รหัสการสั่งซื้อ'] ?? '';
};

// แปลงวันที่สำหรับ Shopee (ใช้ "เวลาที่สั่งซื้อ" เป็นหลัก)
const parseShopeeDateKey = (order: ShopeeOrder): string => {
  const candidates = [order['เวลาที่สั่งซื้อ'], order['วันที่สั่งซื้อ']];
  for (const d of candidates) {
    if (!d) continue;
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
    // ลอง day-first
    const df = new Date(d.replace(/(\d{2})-(\d{2})-(\d{4})/, '$2-$1-$3'));
    if (!isNaN(df.getTime())) return df.toISOString().split('T')[0];
  }
  return 'Unknown';
};

// แปลงวันที่สำหรับ Lazada
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

// จับคู่ค่าใช้จ่ายโฆษณาจาก Sub ID (เดิม)
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
 * calculateMetrics (แก้ให้ Shopee ตัด "ยกเลิก")
 * ========================= */
export function calculateMetrics(
  shopeeOrders: ShopeeOrder[],
  lazadaOrders: LazadaOrder[],
  facebookAds: FacebookAd[],
  selectedSubIds: string[] = [],
  selectedValidity: string = 'all',
  selectedChannels: string[] = [],
  selectedPlatform: string = 'all',
  // เพิ่มตัวเลือกให้สอดคล้องกันทั้งระบบ
  options: { shopeeOrderIdKey?: 'เลขที่คำสั่งซื้อ' | 'รหัสการสั่งซื้อ' } = {}
): CalculatedMetrics {
  const shopeeOrderIdKey = options.shopeeOrderIdKey ?? 'เลขที่คำสั่งซื้อ';

  // ----- Filter Shopee -----
  let filteredShopeeOrders =
    selectedPlatform === 'all' || selectedPlatform === 'Shopee' ? shopeeOrders : [];
  // ตัดยกเลิก
  filteredShopeeOrders = filteredShopeeOrders.filter(o => !isCanceledShopee(o));

  if (selectedSubIds.length > 0 && !selectedSubIds.includes('all')) {
    filteredShopeeOrders = filteredShopeeOrders.filter(order => {
      const orderSubIds = [order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']].filter(Boolean);
      return orderSubIds.some(subId => selectedSubIds.includes(subId || ''));
    });
  }
  if (selectedChannels.length > 0 && !selectedChannels.includes('all')) {
    filteredShopeeOrders = filteredShopeeOrders.filter(order =>
      selectedChannels.includes(order['ช่องทาง'] || '')
    );
  }

  // ----- Filter Lazada -----
  let filteredLazadaOrders =
    selectedChannels.length > 0 && !selectedChannels.includes('all')
      ? []
      : selectedPlatform === 'all' || selectedPlatform === 'Lazada'
      ? lazadaOrders
      : [];

  if (selectedSubIds.length > 0 && !selectedSubIds.includes('all')) {
    filteredLazadaOrders = filteredLazadaOrders.filter(order => {
      const orderSubIds = [order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']].filter(Boolean);
      return orderSubIds.some(subId => selectedSubIds.includes(subId || ''));
    });
  }
  if (selectedValidity !== 'all') {
    filteredLazadaOrders = filteredLazadaOrders.filter(order => order['Validity'] === selectedValidity);
  }

  // ----- Shopee: dedup ตามคีย์ที่กำหนด -----
  const uniqueShopeeOrders = new Map<string, { commission: number; amount: number }>();
  filteredShopeeOrders.forEach(order => {
    const id = getShopeeOrderId(order, shopeeOrderIdKey);
    const commission = parseNumber(order['คอมมิชชั่นสินค้าโดยรวม(฿)']);
    const amount = parseNumber(order['ยอดขายสินค้าโดยรวม(฿)']);
    if (!uniqueShopeeOrders.has(id)) {
      uniqueShopeeOrders.set(id, { commission, amount });
    } else {
      const exist = uniqueShopeeOrders.get(id)!;
      exist.commission += commission;
      exist.amount += amount;
    }
  });

  const totalComSP = Array.from(uniqueShopeeOrders.values()).reduce((s, o) => s + o.commission, 0);
  const totalAmountSP = Array.from(uniqueShopeeOrders.values()).reduce((s, o) => s + o.amount, 0);
  const totalOrdersSP = uniqueShopeeOrders.size;

  // ----- Lazada: dedup by Check Out ID -----
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

  const validOrdersLZD = Array.from(uniqueLazadaOrders.values()).filter(o =>
    (o.status === 'shipped' || o.status === 'delivered') || o.payout > 0
  ).length;
  const invalidOrdersLZD = totalOrdersLZD - validOrdersLZD;

  // ----- Facebook Ads (ตามตัวกรอง platform/channels/subIds) -----
  let filteredFacebookAds =
    selectedPlatform === 'all' || selectedPlatform === 'Facebook' ? facebookAds : [];
  if (selectedChannels.length > 0 && !selectedChannels.includes('all')) {
    filteredFacebookAds = []; // channels เป็นของ Shopee
  }
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
      ? filteredFacebookAds.reduce((sum, ad) => sum + parseNumber(ad['CPC (cost per link click)']), 0) / filteredFacebookAds.length
      : 0;

  // ----- Derived -----
  const totalCom = totalComSP + totalComLZD;
  const profit = totalCom - totalAdsSpent;
  const roi = totalAdsSpent > 0 ? (profit / totalAdsSpent) * 100 : 0;
  const cpoSP = totalOrdersSP > 0 ? totalAdsSpent / totalOrdersSP : 0;
  const cpoLZD = validOrdersLZD > 0 ? totalAdsSpent / validOrdersLZD : 0;
  const apcLZD = totalAdsSpent > 0 ? totalAmountLZD / totalAdsSpent : 0;

  const metrics: CalculatedMetrics = {
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
    filteredShopeeOrders,
    filteredLazadaOrders,
    filteredFacebookAds
  };

  return metrics;
}

/* ==============================================================
 * ✅ NEW: analyzeDailyBreakdownStable — เวอร์ชันที่ "ผลรวมรายวัน = Summary"
 *      หลักการ:
 *        1) ใช้ชุดข้อมูลหลังกรองเหมือน summary (ส่ง filtered เข้ามาได้)
 *        2) สร้าง "รายการออเดอร์แบบ unique" ก่อน (เหมือนใน calculateMetrics)
 *        3) ผูกออเดอร์ unique แต่ละใบเข้ากับวันที่เดียว (แยกตามคีย์เวลา)
 *        4) รวมยอดรายวันจาก "unique orders" เท่านั้น → ผลรวมจะเท่ากับ summary เสมอ
 *        5) ถ้า parse วันที่ไม่ได้ จะลง bucket 'Unknown' เพื่อไม่ให้ยอดหาย
 * ============================================================== */
export interface DailyStableRow {
  date: string;           // YYYY-MM-DD หรือ 'Unknown'
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
  // ✅ แนะนำให้ใส่ "ข้อมูลที่ถูกกรองแล้ว" จาก calculateMetrics.metrics.filtered*
  shopeeInput: ShopeeOrder[],
  lazadaInput: LazadaOrder[],
  facebookAds: FacebookAd[],
  options: {
    shopeeOrderIdKey?: 'เลขที่คำสั่งซื้อ' | 'รหัสการสั่งซื้อ';
    includeUnknownBucket?: boolean; // default true
  } = {}
): DailyStableRow[] {
  const shopeeOrderIdKey = options.shopeeOrderIdKey ?? 'เลขที่คำสั่งซื้อ';
  const includeUnknown = options.includeUnknownBucket ?? true;

  type DayAgg = {
    ordersSP: Set<string>;
    ordersLZD: Set<string>;
    comSP: number;
    comLZD: number;
    adSpend: number;
  };

  const daily: Record<string, DayAgg> = {};

  // ---- Shopee: unique orders (ตัดยกเลิก) + ผูกวันที่ต่อใบ ----
  const shopeeActive = shopeeInput.filter(o => !isCanceledShopee(o));
  const shopeeUnique = new Map<string, { commission: number; dateKey: string }>();
  shopeeActive.forEach(o => {
    const id = getShopeeOrderId(o, shopeeOrderIdKey);
    const commission = parseNumber(o['คอมมิชชั่นสินค้าโดยรวม(฿)']);
    const dateKey = parseShopeeDateKey(o); // ใช้เวลาที่สั่งซื้อเป็นหลัก
    if (!shopeeUnique.has(id)) {
      shopeeUnique.set(id, { commission, dateKey });
    } else {
      const ex = shopeeUnique.get(id)!;
      ex.commission += commission;
      // วันที่ของออเดอร์ควรอยู่วันเดียวกันเสมอ; ถ้าไม่แน่ใจคงค่าแรกไว้
    }
  });

  shopeeUnique.forEach((val, id) => {
    const key = val.dateKey || 'Unknown';
    if (!daily[key]) daily[key] = { ordersSP: new Set(), ordersLZD: new Set(), comSP: 0, comLZD: 0, adSpend: 0 };
    daily[key].ordersSP.add(id);
    daily[key].comSP += val.commission;
  });

  // ---- Lazada: unique by Check Out ID + ผูกวันที่ ----
  const lzdUnique = new Map<string, { payout: number; dateKey: string }>();
  lazadaInput.forEach(o => {
    const id = o['Check Out ID'];
    const payout = parseNumber(o['Payout']);
    const dateKey = parseLazadaDateKey(o);
    if (!lzdUnique.has(id)) {
      lzdUnique.set(id, { payout, dateKey });
    } else {
      const ex = lzdUnique.get(id)!;
      ex.payout += payout;
    }
  });

  lzdUnique.forEach((val, id) => {
    const key = val.dateKey || 'Unknown';
    if (!daily[key]) daily[key] = { ordersSP: new Set(), ordersLZD: new Set(), comSP: 0, comLZD: 0, adSpend: 0 };
    daily[key].ordersLZD.add(id);
    daily[key].comLZD += val.payout;
  });

  // ---- Facebook Ads: ผูกงบกับวัน (Date/Day) ----
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

  // ---- สร้างผลลัพธ์รายวัน + คำนวณ profit/roi ----
  const rows: DailyStableRow[] = Object.entries(daily)
    .filter(([key]) => includeUnknown || key !== 'Unknown')
    .map(([date, agg]) => {
      const comSP = agg.comSP;
      const comLZD = agg.comLZD;
      const totalCom = comSP + comLZD;
      const adSpend = agg.adSpend;
      const profit = totalCom - adSpend;
      const roi = adSpend > 0 ? (profit / adSpend) * 100 : 0;
      const ordersSP = agg.ordersSP.size;
      const ordersLZD = agg.ordersLZD.size;
      return {
        date,
        ordersSP,
        ordersLZD,
        ordersTotal: ordersSP + ordersLZD,
        comSP,
        comLZD,
        totalCom,
        adSpend,
        profit,
        roi
      };
    })
    .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  return rows;
}

/* =========================
 * ฟังก์ชันอื่น ๆ (อัปเดตให้ตัด "ยกเลิก" ที่ Shopee)
 * ========================= */
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
  facebookAds: FacebookAd[]
): SubIdPerformance[] {
  const subIdMap: { [key: string]: { commission: number; orders: number; adSpent: number; platform: string } } = {};

  // Shopee (ตัดยกเลิก + dedup order id)
  const shopeeActive = shopeeOrders.filter(o => !isCanceledShopee(o));
  const uniqueShopeeOrders = new Map<string, ShopeeOrder>();
  shopeeActive.forEach(order => {
    const id = getShopeeOrderId(order);
    if (!uniqueShopeeOrders.has(id)) uniqueShopeeOrders.set(id, order);
  });

  Array.from(uniqueShopeeOrders.values()).forEach(order => {
    const subIds = [order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']].filter(Boolean) as string[];
    subIds.forEach(subId => {
      if (!subIdMap[subId]) subIdMap[subId] = { commission: 0, orders: 0, adSpent: 0, platform: 'Shopee' };
      subIdMap[subId].commission += parseNumber(order['คอมมิชชั่นสินค้าโดยรวม(฿)']);
      subIdMap[subId].orders++;
      subIdMap[subId].adSpent = matchSubIdWithAds(subId, facebookAds);
      if (subIdMap[subId].platform !== 'Shopee' && subIdMap[subId].platform !== 'Mixed') subIdMap[subId].platform = 'Mixed';
    });
  });

  // Lazada (dedup by Check Out ID)
  const uniqueLazadaOrders = new Map<string, LazadaOrder>();
  lazadaOrders.forEach(order => {
    const id = order['Check Out ID'];
    if (!uniqueLazadaOrders.has(id)) uniqueLazadaOrders.set(id, order);
  });

  Array.from(uniqueLazadaOrders.values()).forEach(order => {
    const subIds = [order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']].filter(Boolean) as string[];
    subIds.forEach(subId => {
      if (!subIdMap[subId]) subIdMap[subId] = { commission: 0, orders: 0, adSpent: 0, platform: 'Lazada' };
      subIdMap[subId].commission += parseNumber(order['Payout']);
      subIdMap[subId].orders++;
      subIdMap[subId].adSpent = matchSubIdWithAds(subId, facebookAds);
      if (subIdMap[subId].platform !== 'Lazada' && subIdMap[subId].platform !== 'Mixed') subIdMap[subId].platform = 'Mixed';
    });
  });

  const subIdPerformance: SubIdPerformance[] = Object.entries(subIdMap).map(([id, data]) => {
    const roi = data.adSpent > 0 ? ((data.commission - data.adSpent) / data.adSpent) * 100 : 0;
    return { id, orders: data.orders, commission: data.commission, adSpent: data.adSpent, roi, platform: data.platform };
  });

  return subIdPerformance.sort((a, b) => b.commission - a.commission);
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
  totalAdsSpent: number
): PlatformPerformance[] {
  const shopeeActive = shopeeOrders.filter(o => !isCanceledShopee(o));
  const uniqueShopeeOrders = new Set(shopeeActive.map(o => getShopeeOrderId(o)));
  const shopeeCommission = shopeeActive.reduce((sum, o) => sum + parseNumber(o['คอมมิชชั่นสินค้าโดยรวม(฿)']), 0);

  const uniqueLazadaOrders = new Set(lazadaOrders.map(o => o['Check Out ID']));
  const lazadaCommission = lazadaOrders.reduce((sum, o) => sum + parseNumber(o['Payout']), 0);

  const shopeeROI = totalAdsSpent > 0 ? (shopeeCommission / totalAdsSpent) * 100 : 0;
  const lazadaROI = totalAdsSpent > 0 ? (lazadaCommission / totalAdsSpent) * 100 : 0;

  const platformData: PlatformPerformance[] = [
    { id: 1, platform: 'Shopee', icon: '🛒', orders: uniqueShopeeOrders.size, commission: shopeeCommission, adSpend: totalAdsSpent / 2, roi: shopeeROI, status: shopeeROI > 50 ? 'good' : 'average', change: 5.2 },
    { id: 2, platform: 'Lazada', icon: '🛍️', orders: uniqueLazadaOrders.size, commission: lazadaCommission, adSpend: totalAdsSpent / 2, roi: lazadaROI, status: lazadaROI > 60 ? 'excellent' : 'good', change: -2.8 },
    { id: 3, platform: 'Facebook Ads', icon: '📘', orders: 0, commission: 0, adSpend: totalAdsSpent, roi: totalAdsSpent > 0 ? ((totalAdsSpent * 0.2) / totalAdsSpent) * 100 : 0, status: totalAdsSpent > 0 ? 'average' : 'bad', change: 12.5 }
  ];

  return platformData;
}

// รวมคอมมิชชั่น Shopee แบบ raw แต่ไม่เอา "ยกเลิก"
export function sumShopeeCommissionRaw(shopeeOrders: ShopeeOrder[]): number {
  return shopeeOrders
    .filter(o => !isCanceledShopee(o))
    .reduce((sum, order) => sum + parseNumber(order['คอมมิชชั่นสินค้าโดยรวม(฿)']), 0);
}

/* =========================
 * แปลงชุดแคมเปญ (ตัดยกเลิกสำหรับ Shopee)
 * ========================= */
export interface TraditionalCampaign {
  id: number;
  name: string;
  platform: string;
  subId: string;
  orders: number;
  commission: number;
  adSpend: number;
  roi: number;
  status: string;
  startDate: string;
  performance: string;
}

export function generateTraditionalCampaigns(
  shopeeOrders: ShopeeOrder[],
  lazadaOrders: LazadaOrder[],
  facebookAds: FacebookAd[]
): TraditionalCampaign[] {
  const campaigns: TraditionalCampaign[] = [];
  let campaignId = 1;

  // Shopee: filter active + group by subId + dedup order id
  const shopeeActive = shopeeOrders.filter(o => !isCanceledShopee(o));
  const shopeeSubIdGroups: { [key: string]: ShopeeOrder[] } = {};
  shopeeActive.forEach(order => {
    const subIds = [order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']].filter(Boolean) as string[];
    subIds.forEach(subId => {
      if (!shopeeSubIdGroups[subId]) shopeeSubIdGroups[subId] = [];
      shopeeSubIdGroups[subId].push(order);
    });
  });

  Object.entries(shopeeSubIdGroups).forEach(([subId, orders]) => {
    const unique = new Map<string, ShopeeOrder>();
    orders.forEach(o => {
      const id = getShopeeOrderId(o);
      if (!unique.has(id)) unique.set(id, o);
    });
    const totalCommission = Array.from(unique.values()).reduce((s, o) => s + parseNumber(o['คอมมิชชั่นสินค้าโดยรวม(฿)']), 0);
    const adSpent = matchSubIdWithAds(subId, facebookAds);
    const roi = adSpent > 0 ? ((totalCommission - adSpent) / adSpent) * 100 : 0;
    const latestDate = Array.from(unique.values()).reduce((latest, o) => {
      const d = new Date(o['วันที่สั่งซื้อ'] || o['เวลาที่สั่งซื้อ'] || '');
      return d > latest ? d : latest;
    }, new Date(0));
    const performance = roi >= 100 ? 'excellent' : roi >= 50 ? 'good' : roi >= 0 ? 'average' : 'poor';

    campaigns.push({
      id: campaignId++,
      name: `Shopee Campaign - ${subId}`,
      platform: 'Shopee',
      subId,
      orders: unique.size,
      commission: Math.round(totalCommission * 100) / 100,
      adSpend: Math.round(adSpent * 100) / 100,
      roi: Math.round(roi * 10) / 10,
      status: unique.size > 0 ? 'active' : 'paused',
      startDate: latestDate.toISOString().split('T')[0],
      performance
    });
  });

  // Lazada: group by subId + dedup Check Out ID
  const lzdSubIdGroups: { [key: string]: LazadaOrder[] } = {};
  lazadaOrders.forEach(order => {
    const subIds = [order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']].filter(Boolean) as string[];
    subIds.forEach(subId => {
      if (!lzdSubIdGroups[subId]) lzdSubIdGroups[subId] = [];
      lzdSubIdGroups[subId].push(order);
    });
  });

  Object.entries(lzdSubIdGroups).forEach(([subId, orders]) => {
    const unique = new Map<string, LazadaOrder>();
    orders.forEach(o => {
      const id = o['Check Out ID'];
      if (!unique.has(id)) unique.set(id, o);
    });
    const totalCommission = Array.from(unique.values()).reduce((s, o) => s + parseNumber(o['Payout']), 0);
    const adSpent = matchSubIdWithAds(subId, facebookAds);
    const roi = adSpent > 0 ? ((totalCommission - adSpent) / adSpent) * 100 : 0;
    const latestDate = Array.from(unique.values()).reduce((latest, o) => {
      const d = new Date(o['Order Time'] || '');
      return d > latest ? d : latest;
    }, new Date(0));
    const performance = roi >= 100 ? 'excellent' : roi >= 50 ? 'good' : roi >= 0 ? 'average' : 'poor';

    campaigns.push({
      id: campaignId++,
      name: `Lazada Campaign - ${subId}`,
      platform: 'Lazada',
      subId,
      orders: unique.size,
      commission: Math.round(totalCommission * 100) / 100,
      adSpend: Math.round(adSpent * 100) / 100,
      roi: Math.round(roi * 10) / 10,
      status: unique.size > 0 ? 'active' : 'paused',
      startDate: latestDate.toISOString().split('T')[0],
      performance
    });
  });

  return campaigns.sort((a, b) => b.commission - a.commission);
}
