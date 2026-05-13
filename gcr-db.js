const { createClient } = require('@supabase/supabase-js');

const GCR_URL = 'https://adpnhipmdefutkzzltbs.supabase.co';
const GCR_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkcG5oaXBtZGVmdXRrenpsdGJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2MDA3NCwiZXhwIjoyMDkwNDM2MDc0fQ.qxMRoAuU22Kd6NyVXZsK4iSFFi-_20BUuN5yQfr7oUY';

let _client = null;

function getGcrDb() {
    if (!_client) _client = createClient(GCR_URL, GCR_KEY);
    return _client;
}

module.exports = getGcrDb;
