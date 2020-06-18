const { v4: uuidv4 } = require('uuid')
const finalArray = []

exports.condense = (sortedData) => {
    const sortedDataLength = sortedData.length
    let clusterId = null
    let clusterArray = []
    for (let i = 0 ; i < sortedDataLength; i++) {
        if (clusterId === null) {
            clusterId = sortedData[i]['Cluster ID']
        }
        
        if (clusterId === sortedData[i]['Cluster ID']) {
            clusterArray.push(sortedData[i])
        }
        else {
            finalArray.push(processCluster(clusterArray))
            clusterId = sortedData[i]['Cluster ID']
            clusterArray = [sortedData[i]]
        }

    }
    return finalArray
}

const processCluster = (arr) => {
    let result = { uuid: uuidv4() }
    result = Object.assign(result, arr[0])
    
    delete result['Cluster ID']
    delete result.ID
    delete result.ADDRESS_1
    delete result.ADDRESS_2
    delete result.CITY
    delete result.STATE
    delete result.ZIPCODE
    delete result.PHONE
    const template = Object.assign({}, result)

    arr.shift()
    const arrLength = arr.length
    for(let i = 0; i < arrLength; i++) {
         processProperty('FULL_NAME', template, result, arr[i])
         processProperty('EMAIL', template, result, arr[i])
         processProperty('NPI_NUMBER', template, result, arr[i])
         processProperty('JDE_NUMBER', template, result, arr[i])
         processProperty('FOX_CHS_ID', template, result, arr[i])
         processProperty('FOX_WBY_ID', template, result, arr[i])
         processProperty('MODIO_ID', template, result, arr[i])
         processProperty('FSMB_ID', template, result, arr[i])
         processProperty('DIVISION', template, result, arr[i])
         processProperty('SOURCE', template, result, arr[i])
    }

    return result

}

const processProperty = (key, template, result, arrayRow) => {
    if(arrayRow[key] && !template[key]) {
        result[key] = arrayRow[key]
        template[key] = arrayRow[key]
    }
    else if(arrayRow[key] !== template[key]) {
        result[key] += `; ${arrayRow[key]}`
    }
}