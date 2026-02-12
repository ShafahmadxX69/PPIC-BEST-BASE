
import { DashboardData, ProductionLineItem, InvoiceMetadata } from '../types';

const BRANDS = ['Nike Plus', 'Adidas Tech', 'Puma Speed', 'Under Armour', 'Reebok Classic', 'Asics Pro'];
const CUSTOMERS = ['Global Sports Corp', 'Elite Athletics', 'Metro Retail', 'Continental Distribution'];
const PARTS = ['SOLE-V4', 'UPPER-MESH-01', 'LACE-TIGHT', 'HEEL-GRIP-X', 'FOAM-LITE-S2'];

export const generateDummyData = (): DashboardData => {
  const items: ProductionLineItem[] = [];
  const invoices: InvoiceMetadata[] = [];
  
  // Create 6 dummy invoices
  const today = new Date();
  for (let i = 0; i < 6; i++) {
    const exportDate = new Date(today);
    exportDate.setDate(today.getDate() + (i * 5));
    const d = exportDate.getDate();
    const m = exportDate.getMonth() + 1;
    const y = exportDate.getFullYear();
    
    invoices.push({
      brand: BRANDS[i % BRANDS.length],
      exportDate: `${d < 10 ? '0' + d : d}/${m < 10 ? '0' + m : m}/${y}`,
      totalQty: 2000 + Math.floor(Math.random() * 3000),
      containerInfo: `20ft Container #${1000 + i}`,
      invoiceTitle: `INV-2024-00${i + 1}`,
    });
  }

  // Create 20 dummy line items
  let totalPoQty = 0;
  let totalStockIn = 0;
  let totalRemaining = 0;
  let totalRework = 0;
  let totalInventory = 0;

  for (let i = 0; i < 20; i++) {
    const poQty = 1000 + Math.floor(Math.random() * 2000);
    const stockIn = Math.floor(poQty * (0.6 + Math.random() * 0.45)); // 60% to 105% completion
    const rework = Math.floor(stockIn * (Math.random() * 0.05)); // 0% to 5% rework
    const invQty = Math.floor(stockIn * 0.4); // 40% stays in inventory
    const rem = Math.max(0, poQty - stockIn);
    
    totalPoQty += poQty;
    totalStockIn += stockIn;
    totalRemaining += rem;
    totalRework += rework;
    totalInventory += invQty;

    const invoiceQtys = invoices.map((_, idx) => {
        // Distribute some stock to random invoices
        return i % 3 === idx % 3 ? Math.floor(stockIn / 3) : 0;
    });

    items.push({
      poNo: `PO-88${100 + i}`,
      woNo: `WO-99${500 + i}`,
      partNo: PARTS[i % PARTS.length],
      customer: BRANDS[i % BRANDS.length],
      itemType: i % 2 === 0 ? 'FOOTWEAR' : 'APPAREL',
      size: 'US 10',
      color: i % 2 === 0 ? 'MIDNIGHT BLUE' : 'CHALK WHITE',
      poQty,
      stockIn,
      remaining: rem,
      usedForShipment: stockIn - invQty,
      readyForShipment: invQty,
      reworkQty: rework,
      finishedGoodsInventory: invQty,
      invoiceQtys,
    });
  }

  return {
    invoices,
    items,
    summary: {
      totalPoQty,
      totalStockIn,
      totalRemaining,
      totalRework,
      totalInventory
    }
  };
};
