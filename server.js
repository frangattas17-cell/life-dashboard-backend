/**
 * Life Dashboard Pro — Backend Server
 * Universidad ORT Uruguay · Negocios Digitales 2026
 *
 * API REST para gestión financiera personal con asesor IA integrado.
 * Tecnologías: Node.js, Express, Anthropic Claude API
 *
 * Ejecutar: node server.js
 * Puerto:   3000  (o variable de entorno PORT)
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Base de datos en memoria (MVP) ───────────────────────────
const DB = {
  assets: [
    { id: 'a1', name: 'BROU Corriente', type: 'bank',    value: 45000, cur: 'UYU', inst: 'BROU',    color: '#7c6fff' },
    { id: 'a2', name: 'Efectivo',       type: 'cash',    value: 8500,  cur: 'UYU', inst: '',        color: '#4ade80' },
    { id: 'a3', name: 'Ahorro USD',     type: 'savings', value: 12000, cur: 'USD', inst: '',        color: '#60a5fa' },
    { id: 'a4', name: 'BTC',            type: 'crypto',  value: 3200,  cur: 'USD', inst: 'Binance', color: '#fbbf24' }
  ],
  fixedExpenses: [
    { id: 'f1', name: 'Alquiler',          cat: 'Vivienda',      amt: 18000, day: 1,  notes: '' },
    { id: 'f2', name: 'UTE + OSE',         cat: 'Servicios',     amt: 2800,  day: 10, notes: '' },
    { id: 'f3', name: 'Antel',             cat: 'Servicios',     amt: 1200,  day: 15, notes: '' },
    { id: 'f4', name: 'Seguro auto',       cat: 'Seguros',       amt: 2500,  day: 5,  notes: '' },
    { id: 'f5', name: 'Netflix + Spotify', cat: 'Suscripciones', amt: 700,   day: 20, notes: '' }
  ],
  transactions: (() => {
    const n = new Date(), m = n.getMonth(), y = n.getFullYear();
    const fd = (o) => { const d = new Date(y, m, n.getDate() + o); return d.toISOString().split('T')[0]; };
    return [
      { id: 't1', type: 'income',  amt: 35000, cat: 'Sueldo',          desc: 'Sueldo mensual', date: fd(-15), acct: 'a1' },
      { id: 't2', type: 'expense', amt: 8500,  cat: 'Alimentación',    desc: 'Supermercado',   date: fd(-10), acct: 'a1' },
      { id: 't3', type: 'expense', amt: 2200,  cat: 'Transporte',      desc: 'STM mensual',    date: fd(-8),  acct: 'a1' },
      { id: 't4', type: 'expense', amt: 3500,  cat: 'Entretenimiento', desc: 'Salidas',         date: fd(-5),  acct: 'a1' },
      { id: 't5', type: 'income',  amt: 5000,  cat: 'Freelance',       desc: 'Proyecto web',   date: fd(-2),  acct: 'a1' }
    ];
  })()
};

function uid() { return Math.random().toString(36).substr(2, 8); }

function getMonthTotals() {
  const n = new Date(), cm = n.getMonth(), cy = n.getFullYear();
  const monthly = DB.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === cm && d.getFullYear() === cy;
  });
  const inc  = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amt, 0);
  const varE = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amt, 0);
  const fixE = DB.fixedExpenses.reduce((s, f) => s + f.amt, 0);
  const pat  = DB.assets.reduce((s, a) => s + a.value, 0);
  return { inc, varE, fixE, totE: varE + fixE, pat, bal: inc - (varE + fixE) };
}

function buildFinancialContext() {
  const T = getMonthTotals();
  const n = new Date(), cm = n.getMonth(), cy = n.getFullYear();
  const catMap = {};
  DB.transactions
    .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d.getMonth() === cm && d.getFullYear() === cy; })
    .forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + t.amt; });

  return `Datos financieros del usuario:
- Patrimonio total: $${Math.round(T.pat).toLocaleString('es-UY')}
- Activos: ${DB.assets.map(a => `${a.name} (${a.type}): $${Math.round(a.value).toLocaleString('es-UY')} ${a.cur}`).join(', ')}
- Gastos fijos mensuales: $${Math.round(T.fixE).toLocaleString('es-UY')} — ${DB.fixedExpenses.map(f => `${f.name}: $${f.amt}`).join(', ')}
- Ingresos este mes: $${Math.round(T.inc).toLocaleString('es-UY')}
- Gastos variables este mes: $${Math.round(T.varE).toLocaleString('es-UY')} — ${Object.entries(catMap).map(([k, v]) => `${k}: $${v}`).join(', ')}
- Balance del mes: $${Math.round(T.bal).toLocaleString('es-UY')} (${T.bal >= 0 ? 'Superávit' : 'Déficit'})
- Tasa de ahorro: ${T.inc > 0 ? Math.round((T.bal / T.inc) * 100) : 0}%
Sos un asesor financiero experto y amigable. Respondé en español, de forma clara y concisa, con consejos prácticos basados en estos datos.`;
}

// ─── API: ACTIVOS ─────────────────────────────────────────────
app.get('/api/assets', (req, res) => {
  const total = DB.assets.reduce((s, a) => s + a.value, 0);
  res.json({ assets: DB.assets, total });
});

app.post('/api/assets', (req, res) => {
  const { name, type, value, cur, inst, color } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  const asset = { id: uid(), name, type: type || 'other', value: parseFloat(value) || 0, cur: cur || 'UYU', inst: inst || '', color: color || '#7c6fff' };
  DB.assets.push(asset);
  console.log(`[ASSET+] ${asset.name} — $${asset.value} ${asset.cur}`);
  res.status(201).json(asset);
});

app.delete('/api/assets/:id', (req, res) => {
  const idx = DB.assets.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Activo no encontrado' });
  const [removed] = DB.assets.splice(idx, 1);
  res.json({ deleted: removed.id });
});

// ─── API: GASTOS FIJOS ────────────────────────────────────────
app.get('/api/fixed-expenses', (req, res) => {
  const total = DB.fixedExpenses.reduce((s, f) => s + f.amt, 0);
  res.json({ fixedExpenses: DB.fixedExpenses, total });
});

app.post('/api/fixed-expenses', (req, res) => {
  const { name, cat, amt, day, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  const expense = { id: uid(), name, cat: cat || 'Otro', amt: parseFloat(amt) || 0, day: parseInt(day) || 0, notes: notes || '' };
  DB.fixedExpenses.push(expense);
  console.log(`[GASTO+] ${expense.name} — $${expense.amt}/mes`);
  res.status(201).json(expense);
});

app.delete('/api/fixed-expenses/:id', (req, res) => {
  const idx = DB.fixedExpenses.findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Gasto no encontrado' });
  const [removed] = DB.fixedExpenses.splice(idx, 1);
  res.json({ deleted: removed.id });
});

// ─── API: TRANSACCIONES ───────────────────────────────────────
app.get('/api/transactions', (req, res) => {
  let txs = [...DB.transactions];
  if (req.query.type)  txs = txs.filter(t => t.type === req.query.type);
  if (req.query.cat)   txs = txs.filter(t => t.cat  === req.query.cat);
  if (req.query.month) {
    const [y, m] = req.query.month.split('-').map(Number);
    txs = txs.filter(t => { const d = new Date(t.date); return d.getFullYear() === y && d.getMonth() === m - 1; });
  }
  txs.sort((a, b) => b.date.localeCompare(a.date));
  res.json({ transactions: txs, count: txs.length });
});

app.post('/api/transactions', (req, res) => {
  const { type, amt, cat, desc, date, acct } = req.body;
  if (!amt || !type) return res.status(400).json({ error: 'tipo y monto son requeridos' });

  const tx = {
    id:   uid(),
    type: type,
    amt:  parseFloat(amt),
    cat:  cat  || 'Otro',
    desc: desc || 'Sin descripción',
    date: date || new Date().toISOString().split('T')[0],
    acct: acct || ''
  };
  DB.transactions.push(tx);

  // Lógica de negocio: actualizar saldo del activo
  const asset = DB.assets.find(a => a.id === tx.acct);
  if (asset) {
    asset.value += tx.type === 'income' ? tx.amt : -tx.amt;
    console.log(`[TX] ${tx.type === 'income' ? '+' : '-'}$${tx.amt} en "${asset.name}" → saldo: $${asset.value}`);
  }

  // Alerta automática: saldo negativo
  if (asset && asset.value < 0) {
    console.warn(`⚠️  ALERTA: ${asset.name} tiene saldo negativo ($${asset.value})`);
    return res.status(201).json({ ...tx, alert: `⚠️ ${asset.name} quedó con saldo negativo` });
  }

  res.status(201).json(tx);
});

app.delete('/api/transactions/:id', (req, res) => {
  const idx = DB.transactions.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Transacción no encontrada' });
  const [tx] = DB.transactions.splice(idx, 1);
  const asset = DB.assets.find(a => a.id === tx.acct);
  if (asset) asset.value += tx.type === 'income' ? -tx.amt : tx.amt;
  res.json({ deleted: tx.id });
});

// ─── API: REPORTE ─────────────────────────────────────────────
app.get('/api/report', (req, res) => {
  const T = getMonthTotals();
  const n = new Date();
  const catMap = {};
  DB.transactions
    .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); })
    .forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + t.amt; });
  DB.fixedExpenses.forEach(f => { catMap[f.cat] = (catMap[f.cat] || 0) + f.amt; });

  const savingsPerMonth = Math.max(0, T.bal);
  const projection = [0, 1, 2, 3].map(i => ({
    month:     new Date(n.getFullYear(), n.getMonth() + i, 1).toLocaleDateString('es-UY', { month: 'short', year: '2-digit' }),
    patrimony: Math.round(T.pat + savingsPerMonth * i)
  }));

  const alerts = [];
  if (T.bal < 0)            alerts.push({ type: 'danger',  msg: 'Déficit este mes: tus gastos superan tus ingresos.' });
  if (T.fixE > T.inc * 0.7) alerts.push({ type: 'warning', msg: 'Tus gastos fijos superan el 70% de tus ingresos.' });
  if (T.inc === 0)           alerts.push({ type: 'info',    msg: 'No hay ingresos registrados este mes.' });
  const savingsRate = T.inc > 0 ? (T.bal / T.inc) * 100 : 0;
  if (savingsRate > 20)      alerts.push({ type: 'success', msg: `Excelente: ahorrás el ${Math.round(savingsRate)}% de tus ingresos.` });

  res.json({
    period:      n.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' }),
    summary:     T,
    savingsRate: Math.round(savingsRate),
    byCategory:  catMap,
    topExpense:  Object.entries(catMap).sort((a, b) => b[1] - a[1])[0] || null,
    projection,
    alerts,
    assetsCount: DB.assets.length,
    txCount:     DB.transactions.length
  });
});

// ─── API: ASESOR IA ───────────────────────────────────────────
app.post('/api/ai/chat', (req, res) => {
  const { question, history } = req.body;
  if (!question) return res.status(400).json({ error: 'La pregunta es requerida' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada. Agregala como variable de entorno en Replit → Secrets.' });
  }

  const messages = [
    { role: 'user',      content: buildFinancialContext() },
    { role: 'assistant', content: 'Entendido, tengo acceso a todos tus datos financieros. ¿En qué te puedo ayudar?' }
  ];
  if (Array.isArray(history)) {
    history.forEach(m => messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
  }
  messages.push({ role: 'user', content: question });

  const body = JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages });
  const options = {
    hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => { data += chunk; });
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('[IA raw]', JSON.stringify(parsed).substring(0, 300));
        if (parsed.error) {
          return res.json({ reply: 'Error API: ' + parsed.error.message, debug: parsed.error });
        }
        const reply  = parsed.content?.find(b => b.type === 'text')?.text || 'Sin respuesta.';
        console.log(`[IA] "${question.substring(0, 60)}"`);
        res.json({ reply, tokens: parsed.usage });
      } catch (e) {
        res.status(500).json({ error: 'Error al procesar respuesta de Claude', raw: data.substring(0, 200) });
      }
    });
  });
  apiReq.on('error', (e) => res.status(500).json({ error: e.message }));
  apiReq.write(body);
  apiReq.end();
});

app.post('/api/ai/analyze', (req, res) => {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada' });

  const prompt = buildFinancialContext() +
    '\n\nGenerá un análisis financiero breve (máximo 5 puntos) con: 1) Estado general, 2) Principal riesgo, 3) Oportunidad de ahorro, 4) Recomendación inmediata. Formato: lista con bullets. Sin saludos.';

  const body = JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: prompt }] });
  const options = {
    hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => { data += chunk; });
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const analysis = parsed.content?.find(b => b.type === 'text')?.text || '';
        res.json({ analysis, summary: getMonthTotals() });
      } catch (e) {
        res.status(500).json({ error: 'Error al procesar análisis' });
      }
    });
  });
  apiReq.on('error', (e) => res.status(500).json({ error: e.message }));
  apiReq.write(body);
  apiReq.end();
});

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok', version: '1.0.0', uptime: Math.round(process.uptime()),
    db: { assets: DB.assets.length, transactions: DB.transactions.length, fixedExpenses: DB.fixedExpenses.length }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ◆ Life Dashboard Pro — Backend');
  console.log('  ─────────────────────────────────────');
  console.log(`  URL:    http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('  Endpoints:');
  console.log('  GET/POST/DELETE  /api/assets');
  console.log('  GET/POST/DELETE  /api/transactions');
  console.log('  GET/POST/DELETE  /api/fixed-expenses');
  console.log('  GET              /api/report');
  console.log('  POST             /api/ai/chat');
  console.log('  POST             /api/ai/analyze');
  console.log('');
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('  ⚠️  ANTHROPIC_API_KEY no configurada (IA desactivada)');
  } else {
    console.log('  ✓  Asesor IA activo');
  }
  console.log('');
});
