/* eslint-disable no-console */
//
// IMPORTS
//
require('dotenv').config()
// libraries
const csv = require('@fast-csv/parse')
const fs = require('fs')
const mongoose = require('mongoose')
// app modules
const projectController = require('../controllers/projectController')
const { MTRLScore } = require('./../models/mtrlScoreModel')

process.on('unhandledRejection', error => {
    // Will print "unhandledRejection err is not defined"
    console.log('unhandledRejection', error.message)
    throw error
})

//
// parsing formats
//
const csvParseOptions = {
    delimiter: '	',
    quote: null,
    headers: true
}

// DB URL
const DB_URL =
    'mongodb+srv://radarAdmin:FiftyHorses@cw-project-radar-whzkf.mongodb.net/cw-project-radar?authSource=admin&replicaSet=cw-project-radar-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true'
// connect to DB
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})
// test connect so that we know all is in order
var db = mongoose.connection
db.on('error', function() {
    console.log('Failed to connect to database')
    process.exit(1)
})
db.once('open', async function() {
    console.log('Connected to database')
    await runScript()
})

//
// the actual script
//
const runScript = async () => {
    const autumn2018Data = await importScores('__data__/radar_autumn_2018.tsv', '2018-08-31')
    const spring2019Data = await importScores('__data__/radar_spring_2019.tsv', '2019-03-31')
    const autumn2019Data = await importScores('__data__/radar_autumn_2019.tsv', '2019-08-31')

    const data = filterData(autumn2018Data.concat(spring2019Data.concat(autumn2019Data)))

    await addScores(data)

    console.log('\n--> Done importing, disconnecting DB.')
    await mongoose.disconnect()

    console.log('--> Shutting down.')
    process.exit(0)
}

// import projects from CSV into an object array
const importScores = (path, date) => {
    return new Promise((resolve, reject) => {
        console.log('\n==> IMPORTING scores')
        const data = []
        const aPath = path
        const aDate = Date.parse(date)
        console.log(`Opening file ${aPath}`)
        console.log(`Scoring date set to ${aDate}`)

        fs.createReadStream(aPath)
            .pipe(csv.parse(csvParseOptions))

            .on('error', error => {
                console.error(error)
                reject()
            })

            .on('data', row => {
                const obj = cleanseData(row)
                // add to data stack
                data.push({
                    id: obj.id,
                    name: obj.name,
                    trl: obj.TRL,
                    mrl: obj.MRL,
                    date: aDate
                })
            })

            .on('end', rowCount => {
                console.log(`Parsed ${rowCount} rows`)
                resolve(data)
            })
    })
}

const cleanseData = obj => {
    let result = {}

    // cleanse data: empty values to undefined
    Object.keys(obj).forEach(function(key) {
        if (obj[key] !== '') {
            result[key] = obj[key] // remove empty entries
        }
    })

    return result
}

const filterData = all => {
    console.log('\n==> FILTERING scores')
    const result = []

    let added = 0
    let skipped = 0
    all.map(entry => {
        if (entry.trl && entry.mrl) {
            added++
            result.push(entry)
        } else {
            skipped++
        }
    })
    console.log(`${added + skipped} total, ${added} accepted and ${skipped} skipped (no scores).`)
    return result
}

const addScores = async data => {
    console.log('\n==> ADDING scores')
    let added = 0
    let failed = 0
    let skipped = 0
    await Promise.all(
        data.map(async obj => {
            const prj = await projectController.getByCWId(obj.id)
            if (!prj) {
                console.log(`No project found for cw_id ${obj.id}`)
                failed++
                return
            }
            // add classification
            const score = new MTRLScore({
                scoringDate: obj.date,
                trl: obj.trl,
                mrl: obj.mrl
            })
            await projectController.addMTRLScore(prj._id, score)
            added++
        })
    )
    console.log(
        `${added +
            failed +
            skipped} scores (${added} added, ${failed} failed, ${skipped} skipped.)\n`
    )
}
