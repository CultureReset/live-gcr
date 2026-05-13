const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// GCR routes — only database this server talks to is GCR Supabase
const gcrRouter = require('./routes/gcr');
app.use('/api/gcr', gcrRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'live-gcr' }));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 3001;
if (require.main === module) {
    app.listen(PORT, () => console.log(`live-gcr API running on port ${PORT}`));
}

module.exports = app;
