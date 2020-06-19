// add environment variables to process
require('dotenv').config();

// setup root path
global.rootPath = __dirname;

// set up logging
global.log = require('./src/utils/logging').init();

const csvService = require('./src/services/csvParser');
const csvCondenser = require('./src/services/csvClusterCondenser')
const { handleArgs, mergeSort } = require('./src/utils/util');
const terminal = require('./src/utils/terminal');

// Set process flags and function for app stability
process.on('SIGINT', () => {
	global.log.warn('Received SIGINT');
	terminate().then(() => process.exit(1));
});
process.on('unhandledRejection', (reason, p) => {
	global.log.error('Unhandled rejection', { at: p, reason });
    terminate().then(() => process.exit(1));
});
process.on('uncaughtException', err => {
    global.log.error(`Uncaught exception: ${err.stack}`);
    terminate().then(() => process.exit(1));
});

/**
 * Function ends special services that must be explicitly colsed when the process terminates
 */
const terminate = async() => {
    terminal.endTimer();
};

// get CLI arguments for csv file(s)
// application startup
let args = {};
try {
    args = handleArgs();
} catch(err) {
    global.log.error(err);
    return terminate().then(() => process.exit(1));
}
// reorder csv
const csvObj = []
/**
 * The merge sort function 
 * Sorts by `Cluster ID` field
 */
const mergeSortCompare = (left, leftIndex, right, rightIndex) => {
    const leftCompare = typeof left[leftIndex] === 'undefined' ? undefined : left[leftIndex]['Cluster ID'];
    const rightCompare = typeof right[rightIndex] === 'undefined' ? undefined : right[rightIndex]['Cluster ID'];
    return leftCompare < rightCompare;
};

// parse the csv and covert into a JS array of objects
csvService.parseCsv(args.sourceCsv, csvObj).then(data => {
    // sor the data by `Cluster ID` ascending
    const sortedData = mergeSort(data, mergeSortCompare);
    // Aggregate the cluster data into a set of unique records
    const condensedData = csvCondenser.condense(sortedData);

    // output the new aggregated data into a csv
    console.log(condensedData)
}).catch(err => {
    stopProcessWithError(err);
});

const stopProcessWithError = err => {
    global.log.error(err);
    terminate().then(() => process.exit(1));
};


