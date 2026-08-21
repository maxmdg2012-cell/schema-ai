module.exports = async function handler(req, res) {
  // Tillåt att din Neocities-sida pratar med Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Hantera preflight-anrop från webbläsaren
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Säkerställ att vi kan läsa datan från Neocities
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { rawSchedule } = body;
    const apiKey = process.env.Schedule_API;

    if (!rawSchedule) {
      return res.status(400).json({ error: 'Ingen schematext skickades' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'API-nyckel saknas i Vercel' });
    }

    const promptText = `You are a schedule organizer. Take this messy text and convert it into a clean JSON array of objects.

Strict rules:
1. LANGUAGE: Automatically detect the language of the input text. Write the output (day names, activities, locations) in that EXACT same language (e.g. Swedish if the input is Swedish).
2. STRUCTURE: Each object must strictly have these keys: "day", "time", "activity", "location".
3. MISSING DATA: If a field is missing, use "N/A".
4. OUTPUT: Respond ONLY with a valid raw JSON array, without markdown blocks or conversational text.

Text:
${rawSchedule}`;

    // Skicka till Groq API med deras snabbaste och mest stabila modell
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Den stabila och supersnabba modellen
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.1
      })
    });

    const data = await response.json();

    // Om Groq strular, fånga felet och skicka tillbaka exakt varför
    if (!response.ok) {
      console.error("Groq API error:", data);
      return res.status(response.status).json({ 
        error: 'Error from AI provider', 
        details: data 
      });
    }

    // Rensa upp svaret ifall AI:n lägger till markdown-kodblock (```json ... ```)
    let rawJson = data.choices[0].message.content;
    rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedSchedule = JSON.parse(rawJson);

    // Skicka tillbaka det snygga schemat till din Neocities-sida
    return res.status(200).json({ schedule: parsedSchedule });
  } catch (error) {
    console.error("Backend error:", error);
    return res.status(500).json({ error: 'Något gick fel på servern', details: error.message });
  }
};
