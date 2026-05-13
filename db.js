// Stub — live-gcr only uses GCR Supabase
// Old CyberCheck routes that import this will hit GCR db and gracefully 404
const getGcrDb = require('./gcr-db');
module.exports = getGcrDb();
