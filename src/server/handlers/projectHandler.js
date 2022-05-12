//
// IMPORTS
//
// libraries
const multer = require('multer')
// app modules
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const handlerFactory = require('./handlerFactory')
// const logger = require('./../utils/logger')
const { Project } = require('../models/projectModel')
const { Classification } = require('../models/classificationModel')
const { MTRLScore } = require('../models/mtrlScoreModel')
const projectController = require('../controllers/projectController')
const v = require('../utils/validator')

//
// CONFIGURE MULTER FOR FILE UPLOADS
//
// store all uploads in memory
const multerStorage = multer.memoryStorage()

// multer middleware to store multipart import-file data in the request object
const upload = multer({
    storage: multerStorage,
})

exports.importFile = upload.single('importfile')
// actually imports the projects
exports.importProjects = catchAsync(async (req, res, next) => {

    // 1) Check if there is a file in the req object
    if (!req.file) {
        res.status(400).json({
            status: 'error',
            message: 'No input file provided.'
        })
        return
    } 

    // 2) Let the project controller import the files
    projectController.importProjects(req.file.buffer, req.file.originalname)
    .then((result) => {
        // // 3) If all ok return a success / 200 OK response
        res.status(201).json({
            status: result.status,
            message: result.message
        })
        return
    }).catch((err) => {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
        return
    })
})

exports.getProject = handlerFactory.getOne(Project)
exports.getAllProjects = handlerFactory.getAll(Project)

exports.createProject = catchAsync(async (req, res, next) => {
    // create the project
    const prj = handlerFactory.filterFields(req.body.project, [])
    const project = await Project.create(prj)

    // add the MTRL score (if any)
    if (req.body.mtrl) {
        const data = req.body.mtrl
        await MTRLScore.create({
            project: project._id,
            scoringDate: data.scoringDate,
            mrl: data.mrl,
            trl: data.trl,
            description: data.description,
        })
        // update the project
        await Project.updateOne({ _id: project._id }, { hasScores: true })
    }

    // add classification (if any)
    if (req.body.classification) {
        const data = req.body.classification
        await Classification.create({
            project: project._id,
            classification: data.classification,
            secondary_classification: data.classification_2nd,
            classifiedOn: data.classifiedOn,
            classifiedBy: data.classifiedBy,
            changeSummary: data.changeSummary,
        })
        // update the project
        await Project.updateOne({ _id: project._id }, { hasClassifications: true })
    }

    res.status(200).json({
        status: 'success',
        data: "none",
    })

})

exports.deleteProject = catchAsync(async (req, res, next) => {
    // delete all associated scores
    await MTRLScore.deleteMany({project: req.params.id})
    // delete all its classifications
    await Classification.deleteMany({project: req.params.id})
    //finally delete the project itself
    await Project.findByIdAndDelete(req.params.id)

    // return project if found
    res.status(200).json({
        status: 'success',
    })
    
})

exports.updateProject = catchAsync(async (req, res, next) => {
    // 1) The id must be a valid CW id, not an ObjectID!
    const rcn = req.body.project.rcn
    if (!rcn || isNaN(rcn)) {
        throw new AppError('Missing or non-number rcn in request.', 400)
    }

    // 2) Filter out disallowed fields from the request body
    const doc = handlerFactory.filterFields(req.body.project, [
        'rcn',
        'classification',
        'mtrlScores',
    ])

    // 3) go straight to Project Model to update
    const project = await Project.findOneAndUpdate({ rcn: rcn }, doc, {
        new: true,
        runValidators: true,
    })
    if (!project) {
        return next(new AppError('No project found with that RCN: ' + rcn , 404))
    }

    // return project if found
    res.status(200).json({
        status: 'success',
        data: doc,
    })
})

exports.getByNumId = catchAsync(async (req, res, next) => {
    // numid  checking
    if (!req.params.num_id || isNaN(req.params.num_id)) {
        throw new AppError('Missing or non-number num_id in request.', 400)
    }
    // scores param checking
    let addScores
    let addClassifications
    if (req.query.scores && !v.validScoresParam(req.query.scores)) {
        throw new AppError("Invalid 'scores' query parameter values. Check documentation.")
    }
    addScores = req.query.scores
    // classification checking
    if (req.query.class && !v.validScoresParam(req.query.class)) {
        throw new AppError("Invalid 'class' query parameter values. Check documentation.")
    }
    addClassifications = req.query.class

    // fetch or find project
    const project = await projectController.getByNumId(
        req.params.num_id,
        addScores,
        addClassifications
    )

    if (!project) {
        throw new AppError(`No project found with id ${req.params.numid}`, 404)
    }

    // return project if found
    res.status(200).json({
        status: 'success',
        data: project,
    })
})

exports.getByRCN = catchAsync(async (req, res, next) => {
    // input checking
    if (!req.params.rcn || isNaN(req.params.rcn)) {
        throw new AppError('Missing or non-number rcn in request.', 400)
    }

    // fetch/find project
    const project = await projectController.getByRCN(req.params.rcn)
    if (!project) {
        throw new AppError(`No project found with rcn ${req.params.rcn}`, 404)
    }

    // return project if found
    res.status(200).json({
        status: 'success',
        data: project,
    })
})
//
// Add a classification to a project
//
exports.addCategory = catchAsync(async (req, res, next) => {
    // 1) fetch data
    const { numid } = req.params
    const categoryData = req.body

    // 2) add score and save the proejct
    const classification = await projectController.addCategory(numid, categoryData)

    // 3) Assemble successful response
    res.status(201).json({
        status: 'success',
        data: classification,
    })
})

//
// Add an MTRL score to a project
//
exports.addMTRLScore = catchAsync(async (req, res, next) => {
    // 1) fetch data
    const { numid } = req.params
    const scoreData = req.body

    // 2) add score and save the proejct
    const score = await projectController.addMTRLScore(numid, scoreData)

    // 3) Assemble successful response
    res.status(201).json({
        status: 'success',
        data: score,
    })
})

//
// Search for projects that match the given filter tags
//
exports.getMatchingProjects = catchAsync(async (req, res, next) => {
    const result = await projectController.getMatchingProjects(req.body.filter)
    res.status(200).json({
        status: 'success',
        data: result,
    })
})

//
// Search for projects using the given search criteria
//
exports.findProjects = catchAsync(async (req, res, next) => {
    const result = await projectController.findProjects(req.body)
    res.status(200).json({
        status: 'success',
        results: result.length,
        data: result,
    })
})
