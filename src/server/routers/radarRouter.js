//
// IMPORTS
//
// libraries
const express = require('express')
// app modules
// const AppError = require('./../utils/AppError')
const radarHandler = require('./../handlers/radarHandler')
// const authController = require('./../controllers/authController')

const router = express.Router()

//
// ROUTES
//
router
    .route('/')
    // .get(authController.isLoggedIn, radarController.getAllRadars)
    .get(radarHandler.getAllRadars)
    .post(radarHandler.createRadar)
router
    .route('/:slug')
    .get(radarHandler.getRadarBySlug)
    .patch(radarHandler.updateRadar)
    .delete(radarHandler.deleteRadar)

router.get('/:slug/populate/:date?', radarHandler.populateRadar)
router.get('/:slug/render', radarHandler.renderRadar)
router.get('/:slug/publish', radarHandler.publishRadar)
router.get('/:slug/reset', radarHandler.resetRadar)
router.get('/:slug/archive', radarHandler.archiveRadar)
router.get('/:slug/republish', radarHandler.republishRadar)

router.get('/editions', radarHandler.getEditions)

// router
//     .route('/:id')
//     .get(getRadar)
//     .patch(protect, restrictTo('admin'), updateRadar)

// router
//     .route('/')
//     .get(getAllRadars)

// router.route('/list').get(getRadarList)

// router
//     .route('/:id')
//     .get(getRadar)
//     .patch(protect, restrictTo('admin'), updateRadar)
//     .delete(protect, restrictTo('admin'), deleteRadar)

//
// EXPORTS
//
module.exports = router