module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { rawSchedule } = body;
    const apiKey = process.env.Schedule_API;

    if (!rawSchedule) {
      return res.status(400).json({ error: 'Ingen text skickades.' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'API-nyckeln saknas i Vercel.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768', // HÄR ÄR DEN ÖPPNA GRATISMODELLEN
        messages: [{ 
          role: 'user', 
          content: `You are a schedule organizer. Take this messy text and convert it into a clean JSON array of objects. Strict rules: 1. LANGUAGE: Same as input. 2. STRUCTURE: keys: "day", "time", "activity", "location". 3. MISSING DATA: Use "N/A". 4. OUTPUT: raw JSON array only. Text: ${rawSchedule}`
        }],
        temperature: 0.1
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || JSON.stringify(data);
      return res.status(500).json({ error: `Groq AI Fel (${response.status}): ${errorMessage}` });
    }

    let rawJson = data.choices[0].message.content;
    rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedSchedule = JSON.parse(rawJson);

    return res.status(200).json({ schedule: parsedSchedule });
  } catch (error) {
    return res.status(500).json({ error: `Vercel Krasch: ${error.message}` });
  }
};
