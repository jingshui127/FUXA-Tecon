const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');

db.all("SELECT rowid, name, substr(value, 1, 200) as preview FROM views", (err, rows) => {
    rows.forEach(r => {
        console.log(`\nrowid: ${r.rowid}`);
        console.log(`name: ${r.name}`);
        console.log(`preview: ${r.preview}`);
    });
    db.close();
});
