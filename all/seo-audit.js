const path = require('path');
const { runOwnerSeoAudit } = require('./build/owner-seo-audit.js');

runOwnerSeoAudit({
    rootDir: path.join(__dirname, '..'),
    reportDir: path.join(__dirname, '.seo-reports')
});
