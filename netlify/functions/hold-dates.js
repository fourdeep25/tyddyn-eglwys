// Netlify serverless function to temporarily hold dates for 6 hours after enquiry
// Uses Netlify Blobs for persistence

const { getStore } = require('@netlify/blobs');

const HOLD_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const store = getStore({ name: 'date-holds', siteID: context.site.id, token: context.token });

  if (event.httpMethod === 'POST') {
    // Add a new hold
    try {
      const { checkIn, checkOut, guestName } = JSON.parse(event.body);
      if (!checkIn || !checkOut) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing dates' }) };
      }

      // Generate all dates in the range
      const dates = [];
      const start = new Date(checkIn + 'T00:00:00');
      const end = new Date(checkOut + 'T00:00:00');
      const d = new Date(start);
      while (d < end) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${day}`);
        d.setDate(d.getDate() + 1);
      }

      const hold = {
        checkIn,
        checkOut,
        dates,
        guestName: guestName || 'Unknown',
        createdAt: Date.now(),
        expiresAt: Date.now() + HOLD_DURATION_MS,
      };

      // Store with a unique key
      const holdKey = `hold_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await store.setJSON(holdKey, hold);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, holdKey, expiresAt: hold.expiresAt, heldDates: dates })
      };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (event.httpMethod === 'GET') {
    // Return all currently active holds (not expired)
    try {
      const { blobs } = await store.list();
      const now = Date.now();
      const activeDates = [];

      for (const blob of blobs) {
        try {
          const hold = await store.get(blob.key, { type: 'json' });
          if (hold && hold.expiresAt > now) {
            activeDates.push(...hold.dates);
          } else if (hold) {
            // Clean up expired hold
            await store.delete(blob.key).catch(() => {});
          }
        } catch (e) {
          // Skip corrupted entries
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ heldDates: [...new Set(activeDates)].sort() })
      };
    } catch (err) {
      return { statusCode: 200, headers, body: JSON.stringify({ heldDates: [] }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};
