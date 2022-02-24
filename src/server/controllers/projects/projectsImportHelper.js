//
// IMPORTS
//
// libraries
const csv = require('@fast-csv/parse')
const moment = require('moment')
const parseCurrency = require('parsecurrency')
const streamifier = require('streamifier')
// app modules
const { Project } = require('./../../models/projectModel')
const { logger } = require('../../utils/logger')

//
// Cnfigure TSV parsing
//
const csvParseOptions = {
    delimiter: '	',
    quote: '"',
    escape: '\\',
    renameHeaders: true,
    strictColumnHandling: true,
    headers: [
        'acronym',
        'rcn',
        'call',
        'type',
        'startDate',
        'endDate',
        'totalCost',
        'title',
        'teaser',
        'url',
        'fundingBodyLink',
        'hubUrl',
    ],
}

//
// parse TSV buffers into plain JS objects
//
exports.parseCSV = async (buffer, name) => {
    // 1) Create return data structures
    const data = []
    let status = 'success'
    let message = ''
    // 2) Adjust delimiter to comma if file ends with csv
    const opts = {...csvParseOptions}
    if (name.endsWith("csv")) opts.delimiter = ','
    // 3) Create stream buffer and start parsing data
    return new Promise((resolve, reject) => {
        streamifier.createReadStream(buffer).pipe(csv.parse(opts))

            // 3.1 error handling while stream buffering. N/A with memory backed buffers!?
            .on('error', (error) => {
                status = 'error'
                if (error.message.includes('Parse Error')) message = 'Could not parse input file. Not a CSV format?'
                else if (error.message.includes('column header mismatch')) message = 'Column mismatch in the input file.'
                else {
                    logger.warn('FUUUUUUUUCK', error)
                    message = 'Unknown error, please contact the administrator.'
                }
                reject({ status, data, message })
            })

            // 3.2 In each data row, sanitise empty cells into undefned before storing
            .on('data', (row) => {
                // sanitise empty values to undefined
                let obj = {}
                Object.keys(row).forEach(function (key) {
                    if (row[key] !== '') {
                        obj[key] = row[key] // remove empty entries
                    }
                })
                data.push(obj)
            })

            // 3.3 Handle invalid data rows
            .on('data-invalid', () => {
                status = 'warning'
            })

            // 3.3 Add a final message to the import process
            .on('end', (rowCount) => {
                message = `Parsed ${rowCount} rows, accepting ${data.length} entries.`
                resolve({ status, data, message })
            })
    })
}

//
// Instantiate projects from imported JS objects
//
exports.createProjects = async (data, prevStatus) => {
        let numFailed = 0
        let numSuccess = 0
        let status = prevStatus
        let message = ''
        for (const prj of data) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await Project.create({
                    acronym: prj.acronym,
                    rcn: prj.rcn,
                    title: prj.title,
                    teaser: prj.teaser,
                    startDate: moment(prj.startDate, 'MMM YYYY'),
                    endDate: moment(prj.endDate, 'MMM YYYY').endOf('month'),
                    call: prj.call?prj.call:undefined,
                    type: prj.type?prj.type:undefined,
                    totalCost: prj.totalCost?parseCurrency(prj.totalCost).value:undefined,
                    url: prj.url?prj.url:undefined,
                    fundingBodyLink: prj.fundingBodyLink?prj.fundingBodyLink:undefined,
                    hub_url: prj.hubUrl?prj.hubUrl:undefined
                })
                numSuccess++
            } catch (err) {
                numFailed++
                status = 'warning'
            }
        }
        if (status == 'success') message = `${numSuccess} projects successfully imported.`
        else message = `${numSuccess} projects successfully imported, but ${numFailed} had errors and were not imported.`
        return {status, data: [], message}
}
