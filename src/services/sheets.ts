import { Crop, Pest, Disease, FarmingTip } from '../types';
import {
  cropsToRows,
  rowsToCrops,
  pestsToRows,
  rowsToPests,
  diseasesToRows,
  rowsToDiseases,
  tipsToRows,
  rowsToTips
} from '../utils/sheetMapper';

const STORAGE_KEY_SPREADSHEET_ID = 'agri_google_sheet_id';

export function getStoredSpreadsheetId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID);
  } catch {
    return null;
  }
}

export function saveStoredSpreadsheetId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_SPREADSHEET_ID);
    }
  } catch {
    // ignore
  }
}

/**
 * Creates a brand new Google Spreadsheet titled "AgroVya Database" with 4 formatted sheets:
 * Crops, Pests, Diseases, and FarmingTips, populated with initial seed data.
 */
export async function createAgroVyaSpreadsheet(
  accessToken: string,
  initialData: { crops: Crop[]; pests: Pest[]; diseases: Disease[]; tips: FarmingTip[] }
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create spreadsheet with 4 sheets
  const createPayload = {
    properties: {
      title: `AgroVya Agriculture Database (${new Date().toLocaleDateString()})`
    },
    sheets: [
      { properties: { title: 'Crops', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Pests', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Diseases', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'FarmingTips', gridProperties: { frozenRowCount: 1 } } }
    ]
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createPayload)
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create Google Spreadsheet: ${errorText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate initial data rows
  const cropRows = cropsToRows(initialData.crops);
  const pestRows = pestsToRows(initialData.pests);
  const diseaseRows = diseasesToRows(initialData.diseases);
  const tipRows = tipsToRows(initialData.tips);

  const batchUpdateValuesPayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      { range: 'Crops!A1', values: cropRows },
      { range: 'Pests!A1', values: pestRows },
      { range: 'Diseases!A1', values: diseaseRows },
      { range: 'FarmingTips!A1', values: tipRows }
    ]
  };

  const populateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchUpdateValuesPayload)
    }
  );

  if (!populateRes.ok) {
    console.warn('Batch update values partially failed, spreadsheet was created.');
  }

  saveStoredSpreadsheetId(spreadsheetId);
  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Fetches all agricultural records from the connected Google Sheet
 */
export async function fetchAllSheetData(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  crops: Crop[];
  pests: Pest[];
  diseases: Disease[];
  tips: FarmingTip[];
}> {
  // Query ranges across the 4 sheets (A1:T500 preserves Category, Subcategory, 3 Stage Photos, and Updated At)
  const ranges = ['Crops!A1:T500', 'Pests!A1:J500', 'Diseases!A1:J500', 'FarmingTips!A1:I500'];
  const queryParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryParams}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to load Google Sheet data (${res.status}): ${errorBody}`);
  }

  const result = await res.json();
  const valueRanges = result.valueRanges || [];

  const cropRows = valueRanges[0]?.values || [];
  const pestRows = valueRanges[1]?.values || [];
  const diseaseRows = valueRanges[2]?.values || [];
  const tipRows = valueRanges[3]?.values || [];

  const crops = rowsToCrops(cropRows);
  const pests = rowsToPests(pestRows);
  const diseases = rowsToDiseases(diseaseRows);
  const tips = rowsToTips(tipRows);

  return { crops, pests, diseases, tips };
}

/**
 * Sync entire current app dataset into Google Sheets (Overwrites/refreshes sheets with latest edits)
 */
export async function pushFullDataToSheet(
  accessToken: string,
  spreadsheetId: string,
  data: { crops: Crop[]; pests: Pest[]; diseases: Disease[]; tips: FarmingTip[] }
): Promise<void> {
  const cropRows = cropsToRows(data.crops);
  const pestRows = pestsToRows(data.pests);
  const diseaseRows = diseasesToRows(data.diseases);
  const tipRows = tipsToRows(data.tips);

  // Clear existing ranges first
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ranges: ['Crops!A1:Z500', 'Pests!A1:Z500', 'Diseases!A1:Z500', 'FarmingTips!A1:Z500']
    })
  });

  // Write new data
  const batchUpdateValuesPayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      { range: 'Crops!A1', values: cropRows },
      { range: 'Pests!A1', values: pestRows },
      { range: 'Diseases!A1', values: diseaseRows },
      { range: 'FarmingTips!A1', values: tipRows }
    ]
  };

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchUpdateValuesPayload)
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update Google Sheet: ${err}`);
  }
}
