//
// IMPORTS
//
// libraries
// modules
const AppError = require('../utils/AppError')
const { Classification } = require('../models/classificationModel')
const { MTRLScore } = require('../models/mtrlScoreModel')
const { Project } = require('../models/projectModel')
const importHelper = require('./projects/projectsImportHelper')

//
// get by num ID
//
// IMPORTANT - this function returns a Javascript object, NOT a mongoose model!
//
exports.getByNumId = async (num_id, addScores, addClassifications) => {
    // 1) Build the aggregation by matchng the project
    const query = Project.aggregate().match({ num_id: { $eq: Number(num_id) } })

    // 2) add score(s) if requested
    if (addScores) {
        // build the generic lookup for either case ('all' or 'newest')
        const lookup = {
            from: 'mtrlscores',
            let: { prjID: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$project', '$$prjID'] } } },
                { $sort: { scoringDate: -1, _id: -1 } },
            ],
            as: 'scores',
        }
        // if newest only, limit the sub-pipeline to the first element
        if (addScores === 'newest') {
            lookup.pipeline.push({
                $limit: 1,
            })
        }
        // add the lookup to the aggregation
        query.lookup(lookup)
    }

    // 3) add classification(s) if requested
    if (addClassifications) {
        // build the generic lookup for either case ('all' or 'newest')
        const lookup = {
            from: 'classifications',
            let: { prjID: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$project', '$$prjID'] } } },
                { $sort: { classifiedOn: -1, _id: -1 } },
            ],
            as: 'classifications',
        }
        // if newest only, limit the sub-pipeline to the first element
        if (addClassifications === 'newest') {
            lookup.pipeline.push({
                $limit: 1,
            })
        }
        // add the lookup to the aggregation
        query.lookup(lookup)
    }

    // 4) FInally, wait for the result
    const result = await query.exec()

    // 5) Return the first result, if any
    if (result && result.length > 0) return result[0]

    // 6) Otherwise, return undefined to trigger AppError
    return undefined
}

//
// get by RCN
//
exports.getByRCN = async (rcn) => {
    return await Project.findOne({ rcn })
}

//
// Add a MTRL score to a project
//
exports.addCategory = async (num_id, data) => {
    // 1) Get the corresponding project
    const project = await this.getByNumId(num_id)
    if (!project) throw new AppError(`No project found with id ${num_id}`, 404)

    // 2) Create new classification object
    await Classification.create({
        classification: data.classification,
        secondary_classification: data.classification_2nd,
        project: project._id,
        classifiedOn: data.classifiedOn,
        classifiedBy: data.classifiedBy,
        changeSummary: data.changeSummary,
    })

    // 3) Flag that this project is classified
    await Project.updateOne({ _id: project._id }, { hasClassifications: true })

    return project
}

//
// Add a MTRL score to a project
//
exports.addMTRLScore = async (num_id, data) => {
    // 1) Get the corresponding project
    const project = await this.getByNumId(num_id)
    if (!project) throw new AppError(`No project found with id ${num_id}`, 404)

    // 2) Create new score object
    await MTRLScore.create({
        project: project._id,
        scoringDate: data.scoringDate,
        mrl: data.mrl,
        trl: data.trl,
        description: data.description,
    })

    // 3) Flag that this project has at least one score
    await Project.updateOne({ _id: project._id }, { hasScores: true })

    return project
}

exports.importProjects = (buffer, name) => {
    return new Promise((resolve, reject) => {
        // 1) Read the buffer into an array of objects
        importHelper.parseCSV(buffer, name).then((result) => {
            // 2) Now instantiate the projects. 
            // At this point, status MAY be warning, indicating that not all rows were imported. Keep that for later.
            return importHelper.createProjects(result.data, result.status) // creates a new result
        }).then((result) => {
            // 3) Call went through (though possibly with errors)
            resolve(result)
        }).catch((result) => {
            // 4) reject the result as some unrecoverable error, i.e. no projects importet.
            reject(result)
        })
    })
}

exports.getMatchingProjects = async (filter) => {
    let queryResult

    // base query
    let query = Project.find().select({ num_id: 1, _id: 0 })

    // if empty filter, all projecs match
    if (!filter.tags || filter.tags.length === 0) {
        queryResult = await query
    } else {
        // check operator
        if (filter.union === 'all') {
            query = query.where('tags').all(filter.tags)
        } else {
            query = query.where('tags').in(filter.tags)
        }
        queryResult = await query
    }

    // reduce the returned objects to a number array
    return queryResult.map((prj) => prj.num_id)
}

exports.findProjects = async (criteria) => {
    const terms = criteria.terms || ''
    const caseSensitive = criteria.case || false

    let query = Project.find({
        $text: {
            $search: terms,
            $language: 'en',
            $caseSensitive: caseSensitive,
        },
    }).select('num_id rcn acronym title -_id')

    let queryResult = await query

    return queryResult
}
