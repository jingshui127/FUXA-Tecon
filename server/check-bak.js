const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const BAK_PATH = path.join(__dirname, '_appdata', 'project.fuxap.db.bak_20260512_175525');
const bakDb = new sqlite3.Database(BAK_PATH);

bakDb.all("SELECT name, value FROM views", (err, rows) => {
    if (rows) {
        rows.forEach(row => {
            const v = JSON.parse(row.value);
            console.log(`\nDB name: ${row.name}`);
            console.log(`JSON name: ${v.name}`);
            console.log(`items数: ${Object.keys(v.items||{}).length}`);
        });
    }
    bakDb.close();
});
