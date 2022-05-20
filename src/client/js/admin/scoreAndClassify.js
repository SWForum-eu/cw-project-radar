
import axios from 'axios'
// app modules
import showAlert from '../util/alert'

//
// add classification to a project
//
const addClassification = async (rcn, classification, secondary_classification, classifiedBy, changeSummary) => {
    try {
        const res = await axios({
            method: 'POST',
            url: `/api/v1/project/${rcn}/categorise`,
            data: {
                classification,
                secondary_classification,
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
const addScore = async (rcn, mrl, trl, scoringDate, description) => {
    try {
        const res = await axios({
            method: 'POST',
            url: `/api/v1/project/${rcn}/score`,
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
