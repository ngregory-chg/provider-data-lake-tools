const csv = require('csv-parser');
const fs = require('fs');

exports.parseCsv = (filePath, csvObj)  => {
    return new Promise((resolve, reject) => {
        try {
            fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                row['Cluster ID'] = parseInt(row['Cluster ID'])
                csvObj.push(row);
            })
            .on('end', () => {
                global.log.info('CSV file successfully processed');
                resolve(csvObj);
            });
        } catch(err) {
            reject(err);
        }
    });
};