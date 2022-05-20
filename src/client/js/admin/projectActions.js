
import axios from 'axios'
// app modules
import showAlert from '../util/alert'
import {addClassification, addScore} from './scoreAndClassify'
//
// create a new project
//
const createProject = async (prjData) => {
    try {
        const {project, mtrl, classification} = prjData
        const res = await axios({
            method: 'POST',
            url: '/api/v1/project/',
            data: {
                project, mtrl, classification
            },
        })

        if (res.data.status === 'success') {
            showAlert('success', 'Project created.')
            window.setTimeout(() => {
                location.assign('/admin/project')
            }, 1500)
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
            url: `/api/v1/project/${prjData.rcn}`,
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
    axios.patch('/api/v1/project',data)
    .then((res) => {
        showAlert(res.data.status, res.data.message)
        window.setTimeout(() => {
            location.assign('/admin/project')
        }, 5000)
    })
    .catch((err) => {
        if (err.response) {
            const { data } = err.response
            showAlert(data.status, data.message)
        } else if (err.request) {
            showAlert('error', 'No response from the server.')
            window.setTimeout(() => {
                location.assign('/admin/project')
            }, 5000)
        }
    })
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
