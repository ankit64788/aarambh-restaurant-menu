// script.js
async function loadMenuCSV(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} - ${resp.statusText}`);
    const text = await resp.text();
    return text;
  } catch (e) {
    throw new Error(`Failed to load menu CSV: ${e.message}`);
  }
}

function splitCSVLine(line) {
  const res = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      res.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  res.push(cur);
  return res.map(v => v.trim());
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = splitCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? '';
    });
    return obj;
  });
  return rows;
}

function renderMenu(rows) {
  const container = document.getElementById('menu');
  container.innerHTML = ''; // clear

  // Build category map
  const byCat = {};
  rows.forEach(r => {
    const cat = (r.Category ?? '').trim();
    const item = (r.Item ?? '').trim();
    const price = (r.Price ?? '').trim();
    if (!cat || !item) return;
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push({ item, price });
  });

  const cats = Object.keys(byCat).sort();
  if (cats.length === 0) {
    container.textContent = 'No menu data available.';
    return;
  }

  cats.forEach(cat => {
    const details = document.createElement('details');
    details.className = 'details';

    const summary = document.createElement('summary');
    summary.textContent = cat;
    details.appendChild(summary);

    const panel = document.createElement('div');
    panel.className = 'panel';
    const ul = document.createElement('ul');
    ul.className = 'menu-items';
    byCat[cat].forEach(it => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'item-name';
      name.textContent = it.item;
      const price = document.createElement('span');
      price.className = 'price';
      price.textContent = `Rs ${it.price}`;
      li.appendChild(name);
      li.appendChild(price);
      ul.appendChild(li);
    });

    panel.appendChild(ul);
    details.appendChild(panel);
    container.appendChild(details);

    // animate height on open/close
    panel.style.maxHeight = '0px';
    details.addEventListener('toggle', () => {
      if (details.open) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      } else {
        panel.style.maxHeight = '0px';
      }
    });
  });
}

async function init() {
  const status = document.getElementById('status');
  try {
    status.textContent = 'Loading menu...';
    const csvText = await loadMenuCSV('./restaurant_menu.csv');
    const rows = parseCSV(csvText);
    renderMenu(rows);
    status.textContent = '';
  } catch (e) {
    status.textContent = e.message;
  }
}

document.addEventListener('DOMContentLoaded', init);
