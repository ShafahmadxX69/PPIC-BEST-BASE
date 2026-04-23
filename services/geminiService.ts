
import { GoogleGenAI } from "@google/genai";
import { DashboardData } from "../types";

export async function getAiInsights(data: DashboardData): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    return "AI Insights are currently unavailable. Please ensure the GEMINI_API_KEY is configured in the application settings.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Aggregate data for chart context
  const brands: Record<string, { in: number, po: number, rework: number, remaining: number }> = {};
  data.items.forEach(item => {
    const b = item.customer || 'Other';
    if (!brands[b]) brands[b] = { in: 0, po: 0, rework: 0, remaining: 0 };
    brands[b].in += item.stockIn;
    brands[b].po += item.poQty;
    brands[b].rework += item.reworkQty;
    brands[b].remaining += item.remaining;
  });

  const exportVolumes: Record<string, number> = {};
  data.invoices.forEach(inv => {
    exportVolumes[inv.brand] = (exportVolumes[inv.brand] || 0) + inv.totalQty;
  });

  const chartContext = `
    Global Production Stats:
    - Overall Production Completion: ${((data.summary.totalStockIn / (data.summary.totalPoQty || 1)) * 100).toFixed(1)}%
    
    1. Export Volume By Brand:
    ${Object.entries(exportVolumes).map(([b, v]) => `- ${b}: ${v} units`).join('\n')}
    
    2. Shipment History Context:
    - Latest Invoices: ${data.invoices.slice(0, 3).map(i => `${i.invoiceTitle} (${i.exportDate})`).join(', ')}
    
    3. Production By Brand (Status):
    ${Object.entries(brands).slice(0, 8).map(([b, s]) => `- ${b}: In=${s.in}, Remaining=${s.remaining}, Rework=${s.rework}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a Production Data Analyst. Provide a brief explanation for each of the following dashboard charts/metrics. Focus strictly on these 4 sections:
      1. Export Volume By Brand: Explain who the top shipping customers are.
      2. Shipment QTY History: Summarize recent shipment trends based on the invoice dates provided.
      3. Production By Brand: Explain which brands are contributing most to the "Stock In" volume.
      4. Production Completion: Analyze the ratio of Stock In vs PO Qty (affected by remaining and rework). Identify which brands are nearly finished and which are lagging.
      
      Keep the tone professional and the format clear using headers for each chart. \n\n ${chartContext}`,
    });

    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI advisor. Please try again later.";
  }
}
