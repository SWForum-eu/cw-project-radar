//
// IMPORTS
//
// libraries
const express = require('express')
// app modules
const handler = require('../handlers/projectHandler')
const authC = require('./../controllers/authController')
const sanitiser = require('../utils/sanitiseJSON')

const router = express.Router()

//
// ROUTES
//

/*********************/
/*                   */
/*   PUBLIC ROUTES   */
/*                   */
/*********************/
// get project by Numerical ID
router.get('/prj_id/:num_id', handler.getByNumId)
router.get('/rcn/:rcn', handler.getByRCN)
router.post('/match', handler.getMatchingProjects)
router.post('/search', sanitiser.scrubEmpty, handler.findProjects)

/*****************************/
/*                           */
/*   LOGGED IN USER ROUTES   */
/*                           */
/*****************************/

/*******************************/
/*                             */
/*   ADMIN RESTRICTED ROUTES   */
/*                             */
/*******************************/
router.use('/', authC.restrictTo('admin', 'manager'))
router.use('/:id', authC.restrictTo('admin', 'manager'))

router
    .route('/')
    .get(handler.getAllProjects)
    .post(sanitiser.scrubEmpty, handler.createProject)
    .patch(handler.importFile, handler.importProjects)
router
    .route('/:id')
    .get(handler.getProject)
    .patch(sanitiser.scrubEmpty, handler.updateProject)
    .delete(handler.deleteProject)
// This is BY CW ID!!
router.post(
    '/:numid/categorise',
    authC.restrictTo('admin', 'manager'),
    sanitiser.scrubEmpty,
    handler.addCategory
)
// This is BY CW ID!!
router.post(
    '/:numid/score',
    authC.restrictTo('admin', 'manager'),
    sanitiser.scrubEmpty,
    handler.addMTRLScore
)

//
// EXPORTS
//
module.exports = router
