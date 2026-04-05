// Netlify serverless function to proxy Airbnb iCal feed
const https = require('https');
const http = require('http');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=900' // Cache for 15 minutes
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // The iCal URL is stored as an environment variable on Netlify
  const icalUrl = process.env.AIRBNB_ICAL_URL;
  
  if (!icalUrl) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ blockedDates: [], source: 'none', message: 'No iCal URL configured' })
    };
  }

  try {
    const icalData = await fetchUrl(icalUrl);
    const blockedDates = parseIcal(icalData);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        blockedDates, 
        source: 'airbnb',
        lastSync: new Date().toISOString(),
        count: blockedDates.length
      })
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ blockedDates: [], source: 'error', message: error.message })
    };
  }
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'TyddynEglwys/1.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseIcal(data) {
  const blockedDates = [];
  const events = data.split('BEGIN:VEVENT');
  
  for (let i = 1; i < events.length; i++) {
    const event = events[i];
    const dtstart = event.match(/DTSTART[^:]*:(\d{4})(\d{2})(\d{2})/);
    const dtend = event.match(/DTEND[^:]*:(\d{4})(\d{2})(\d{2})/);
    
    if (dtstart && dtend) {
      const start = new Date(dtstart[1], dtstart[2] - 1, dtstart[3]);
      const end = new Date(dtend[1], dtend[2] - 1, dtend[3]);
      
      // Add each day in the range
      const current = new Date(start);
      while (current < end) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        blockedDates.push(`${y}-${m}-${d}`);
        current.setDate(current.getDate() + 1);
      }
    }
  }
  
  // Deduplicate and sort
  return [...new Set(blockedDates)].sort();
}
