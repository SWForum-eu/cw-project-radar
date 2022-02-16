//
// IMPORTS
//
// libraries
import axios from 'axios'
// app modules
import showAlert from '../util/alert'

//
// add classification to a project
//
const addClassification = async (num_id, classification, classification_2nd, classifiedBy, changeSummary) => {
    try {
        const res = await axios({
            method: 'POST',
            url: `/api/v1/project/${num_id}/categorise`,
            data: {
                classification,
                classification_2nd,
                classifiedBy,
                changeSummary,
            },
        })

        if (res.data.status === 'success') {
            showAlert('success', 'Classification added')
            window.setTimeout(() => {
                location.assign(location.href)
            }, 1500)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

//
// add classification to a project
//
const addScore = async (num_id, mrl, trl, scoringDate, description) => {
    try {
        const res = await axios({
            method: 'POST',
            url: `/api/v1/project/${num_id}/score`,
            data: {
                mrl,
                trl,
                scoringDate,
                description,
            },
        })

        if (res.data.status === 'success') {
            showAlert('success', 'Score added')
            window.setTimeout(() => {
                location.assign(location.href)
            }, 1500)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

//
// EXPORTS
//
module.exports = {
    addClassification,
    addScore,
}
