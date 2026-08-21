<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Schema Organisatör</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #f4f4f9; color: #333; }
    textarea { width: 100%; height: 120px; padding: 12px; border-radius: 8px; border: 1px solid #ccc; font-size: 14px; box-sizing: border-box; }
    button { background: #10b981; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; margin-top: 10px; font-size: 16px; }
    button:hover { background: #059669; }
    .schedule-list { margin-top: 25px; display: flex; flex-direction: column; gap: 10px; }
    .card { background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #10b981; box-shadow: 0 2px 5px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; }
    .day-time { display: flex; flex-direction: column; font-size: 0.9em; color: #666; width: 120px; }
    .day { font-weight: bold; color: #111; }
    .details { font-weight: 600; text-align: right; }
    .location { font-size: 0.85em; color: #888; font-weight: normal; }
  </style>
</head>
<body>

  <h2>Klistra in ditt röriga schema</h2>
  <textarea id="input" placeholder="T.ex: Mån matte 08:00 i sal 10, sen engelska 10:00. Tisdag idrott kl 13:00..."></textarea>
  <button onclick="fixSchedule()">Snygga till schemat</button>

  <div id="output" class="schedule-list"></div>

  <script>
    async function fixSchedule() {
      const text = document.getElementById('input').value;
      const output = document.getElementById('output');
      if(!text) return;

      output.innerHTML = "<p>Sorterar och städar...</p>";

      try {
        const res = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawSchedule: text })
        });

        const data = await res.json();
        output.innerHTML = "";

        data.schedule.forEach(item => {
          output.innerHTML += `
            <div class="card">
              <div class="day-time">
                <span class="day">${item.day}</span>
                <span>${item.time}</span>
              </div>
              <div class="details">
                <div>${item.activity}</div>
                <div class="location">${item.location !== 'N/A' ? item.location : ''}</div>
              </div>
            </div>
          `;
        });
      } catch (err) {
        output.innerHTML = "<p>Något gick fel, provar igen!</p>";
      }
    }
  </script>
</body>
</html>
