const { v4: uuidv4 } = require('uuid')
const finalArray = []

/**
 * Takes an array of data sorted by duplicate cluster ID and converts it into an array of
 * aggregated single unique records per cluster id.
 * Each array element must be an object and contain an index labelled `Cluster ID`
 * 
 * @param {Array} sortedData 
 * @return {Array}  An array of single aggregated cluster objects
 */
exports.condense = (sortedData) => {
    // Get array length ebfore transformation
    const sortedDataLength = sortedData.length;
    let clusterId = null;
    let clusterArray = [];
    // loop through each row to collect and process row clusters
    for (let i = 0 ; i < sortedDataLength; i++) {
        // On first iteration of loop set the cluster id
        if (clusterId === null) {
            clusterId = sortedData[i]['Cluster ID'];
        }
        
        // If the current item matches the current cluster id then store row in the current cluster array
        if (clusterId === sortedData[i]['Cluster ID']) {
            clusterArray.push(sortedData[i]);
        } else {
            // If this is a new cluster id then process the previous cluster array
            finalArray.push(processCluster(clusterArray))

            // set the new cluster id
            clusterId = sortedData[i]['Cluster ID'];
            // reset the cluster array with the current row
            clusterArray = [sortedData[i]];
        }
    }
    // process the last cluster of data as it is not accounted for in the loop
    finalArray.push(processCluster(clusterArray))
    return finalArray;
}

/**
 * Process an array of objects having the same `Cluster ID` index to convert the array fo objects into 
 * a singular object of aggregated cluster values
 * 
 * @param {Array} arr       An array of cluster objects having the same fields and `Cluster ID` index
 * @return {Object}
 */
const processCluster = (arr) => {
    // assign a data lake UUID to this aggregated object of data
    let result = { 
        uuid: uuidv4() 
    };
    // Get the full list of indexes and values from the first row in the array
    result = Object.assign(result, arr[0]);
    
    // Remove the unnecessary fields from the current aggregated object
    const unusedFields = [
        'Cluster ID',
        'ID',
        'ADDRESS_1',
        'ADDRESS_2',
        'CITY',
        'STATE',
        'ZIPCODE',
        'PHONE'
    ];

    for(let field of unusedFields) {
        delete result[field];
    }

    // Shallow copy the object to a template for comparison with the other cluster objects
    const template = Object.assign({}, result);

    // remove the first element as it has already been placed in the aggregated object
    arr.shift();
    const arrLength = arr.length;
    // loop through the remaining cluster objects and aggregate the values to the single record aggregate object
    for(let i = 0; i < arrLength; i++) {
         processProperty('FULL_NAME', template, result, arr[i]);
         processProperty('EMAIL', template, result, arr[i]);
         processProperty('NPI_NUMBER', template, result, arr[i]);
         processProperty('JDE_NUMBER', template, result, arr[i]);
         processProperty('FOX_CHS_ID', template, result, arr[i]);
         processProperty('FOX_WBY_ID', template, result, arr[i]);
         processProperty('MODIO_ID', template, result, arr[i]);
         processProperty('FSMB_ID', template, result, arr[i]);
         processProperty('DIVISION', template, result, arr[i]);
         processProperty('SOURCE', template, result, arr[i]);
    }

    return result;
}

/**
 * Given a new object in the cluster, compare it to the current aggregate object
 * and template to ensure all cluster values are represented in the final aggregated cluster object
 * 
 * @param {String} key              The target current cluster object index
 * @param {Object} template         The current template of the aggregate Object
 * @param {Object} result           The current aggregate object
 * @param {Object} arrayRow         The current cluster row object
 */
const processProperty = (key, template, result, arrayRow) => {
    // If the current field has a value but the template is empty then update the template to have the value 
    // and update the aggregate object field
    if(arrayRow[key] && !template[key]) {
        result[key] = arrayRow[key];
        template[key] = arrayRow[key];
    }
    // if the current field is truthy and does not match the current template value, then aggregate the value to the current aggregate object field
    else if(arrayRow[key] && arrayRow[key] !== template[key]) {
        result[key] += `; ${arrayRow[key]}`;
    }
}