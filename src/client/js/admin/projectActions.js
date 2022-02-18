
import axios from 'axios'
// app modules
import showAlert from '../util/alert'
import {addClassification, addScore} from './scoreAndClassify'
//
// create a new project
//
const createProject = async (prjData) => {
    try {
        const {
            acronym,
            rcn,
            title,
            startDate,
            endDate,
            call,
            type,
            totalCost,
            url,
            fundingBodyLink,
            cwurl,
            teaser,

            mrl,
            trl,
            scoringDate,
            description,

            classification,
            classification_2nd,
            classifiedBy,

            tags
        } = prjData
        const res = await axios({
            method: 'POST',
            url: '/api/v1/project/',
            data: {
                project: {
                    acronym,
                    rcn,
                    title,
                    startDate,
                    endDate,
                    call,
                    type,
                    totalCost,
                    url,
                    fundingBodyLink,
                    cwurl,
                    teaser,
                    tags,
                },
                score: {mrl, trl, scoringDate, description},
                classifications: {classification, classification_2nd, classifiedBy}
            },
        })

        if (res.data.status === 'success') {
            showAlert('success', 'Project created.')
            window.setTimeout(() => {
                location.assign('/admin/project')
            }, 1500)

            // console.log(res.data)

            // const temp_id = res.data.doc.num_id

            // console.log('temp_id: ', temp_id)

            // addClassification(temp_id, classification, classification_2nd, classifiedBy, null)

            // addScore(temp_id, mrl, trl, scoringDate, description)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

//
// Delete a project
//
const deleteProject = async (route, referrer) => {
    try {
        const res = await axios({
            method: 'DELETE',
            url: route,
        })

        if (res.data.status === 'success') {
            showAlert('success', 'Project successfully deleted.')
            window.setTimeout(() => {
                location.assign(referrer)
            }, 1500)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

//
// UPDATE PROJECT
//
const updateProject = async (prjData) => {
    console.log(prjData)
    try {
        const {
            num_id,
            acronym,
            title,
            rcn,
            startDate,
            endDate,
            call,
            type,
            totalCost,
            url,
            fundingBodyLink,
            cwurl,
            teaser,
            tags,
        } = prjData
        const res = await axios({
            method: 'PATCH',
            url: `/api/v1/project/${prjData.num_id}`,
            data: {
                acronym,
                title,
                rcn,
                startDate,
                endDate,
                call,
                type,
                totalCost,
                url,
                fundingBodyLink,
                cwurl,
                teaser,
                tags,
            },
        })
        if (res.data.status === 'success') {
            showAlert('success', 'Project updated.')
            window.setTimeout(() => {
                location.assign(location.href)
            }, 1500)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

//
// IMPORT PROJECTS FILE
//
const importProjects = async (data) => {
    try {
        const res = await axios({
            method: 'PATCH',
            url: '/api/v1/project',
            data,
        })

        if (res.data.status === 'success') {
            showAlert('success', res.data.messages.join('<br/>'))
            window.setTimeout(() => {
                location.assign('/admin/project')
            }, 5000)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

//
// EXPORTS
//
module.exports = {
    createProject,
    deleteProject,
    updateProject,
    importProjects,
}
