const arrToCsv = require('objects-to-csv');
 
/**
 * convert an array of objects into a csv and save it to a filePath
 * 
 * @param {Array} dataArr       An array of key-value objects
 * @param {string} filePath     The file and path to save the csv
 */
exports.arrToCsv = async (dataArr, filePath = './test.csv') => {
    const csv = new arrToCsv(dataArr);
    return await csv.toDisk(filePath);
};