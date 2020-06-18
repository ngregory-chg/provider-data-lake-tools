const fs = require('fs');

/**
 * Retrieve an environment variable or return a default value
 * 
 * @param {*} environmentVariable 	The name of the environment variable attempting to be retrieved
 * @param {*} defaultValue 			The name of the default value if the environment variable is undefined
 */
exports.getEnvironmentVariable = (environmentVariable, defaultValue = null) => {
	const variable = process.env[environmentVariable];
	return typeof(variable) === 'undefined' ? defaultValue : variable;
};

/**
 * Retrieve the pertinent arguments from when the application was invoked in the CLI.
 * Also handles argument validation
 * 
 * @return {Object} An object containing the special arguments pertinent to this app
 */
exports.handleArgs = () => {
    const args = require('yargs').argv;
    const sourceCsv = args.csvFile;
    const isAppend = args.append || false;

    if(!sourceCsv || !fs.existsSync(sourceCsv)) {
        throw Error('A valid \'csvFile\' argument is required and valid file path is required');
    }

    return {
        sourceCsv,
        isAppend
    };
};

/**
 * Format a number into a string with commas
 * Code from https://blog.abelotech.com/posts/number-currency-formatting-javascript/
 * 
 * @param {Number} num      The number to format
 * @return {String}         The number turned into a string with commas
 */
exports.formatNumber = num => {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

exports.correctDateString = dateString => {
    if(dateString) {
        const dateParts = dateString.split('/');
        dateString = `${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`;
    }
    return dateString;
};

exports.asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index]);
    }
};

// mergesort algorithm for rapid sorting of unsorted arrays by integer value
// based on: https://medium.com/javascript-in-plain-english/javascript-merge-sort-3205891ac060
exports.mergeSort = (unsortedArray, compareFunc) => {
    // No need to sort the array if the array only has one element or empty
    if (unsortedArray.length <= 1) {
      return unsortedArray;
    }
    // In order to divide the array in half, we need to figure out the middle
    const middle = Math.floor(unsortedArray.length / 2);
    // This is where we will be dividing the array into left and right
    const left = unsortedArray.slice(0, middle);
    const right = unsortedArray.slice(middle);
    // Using recursion to combine the left and right
    return merge(
      this.mergeSort(left, compareFunc), this.mergeSort(right, compareFunc), compareFunc
    );
};
// Merge the two arrays: left and right
const merge = (left, right, compareFunc) => {
	let resultArray = [], leftIndex = 0, rightIndex = 0;
	if(!compareFunc || typeof compareFunc !== 'function') {
		compareFunc = (left, leftIndex, right, rightIndex) => {
			return left[leftIndex] < right[rightIndex];
		};
	}
    // We will concatenate values into the resultArray in order
    while (leftIndex < left.length && rightIndex < right.length) {
      if (compareFunc(left, leftIndex, right, rightIndex)) {
        resultArray.push(left[leftIndex]);
        leftIndex++; // move left array cursor
      } else {
        resultArray.push(right[rightIndex]);
        rightIndex++; // move right array cursor
      }
    }
    // We need to concat here because there will be one element remaining
    // from either left OR the right
    return resultArray
            .concat(left.slice(leftIndex))
            .concat(right.slice(rightIndex));
};
  