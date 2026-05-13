const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// GCR routes — only database this server talks to is GCR Supabase
const gcrRouter = require('./routes/gcr');
app.use('/api/gcr', gcrRouter);

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const dashboardRouter = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRouter);

const updateLinkRouter = require('./routes/update-link');
app.use('/api/update', updateLinkRouter);
app.use('/update',     updateLinkRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'live-gcr' }));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 3001;
if (require.main === module) {
    app.listen(PORT, () => console.log(`live-gcr API running on port ${PORT}`));
}

module.exports = app;
