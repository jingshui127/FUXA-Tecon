const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('_appdata/project.fuxap.db');
db.all("SELECT name FROM views", (err, rows) => {
    if (rows) {
        console.log('所有视图:');
        rows.forEach(r => console.log(' -', r.name));
    }
    db.close();
});
