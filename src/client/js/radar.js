//
// IMPORTS
//
// libraries
// app modules
import linkupRadar from './radar/linkupRadar'
import linkupTables from './radar/linkupTables'
import { showFilterTagForm, updateFilterList, filterBlips } from './radar/filterTags'
import { getStatsActive, getTags, setStatsActive, updateTags } from './util/localStore'
import showAlert from './util/alert'
import { login, logout } from './user/login'
import changePassword from './user/userSettings'
import {
    createUser,
    deleteUser,
    updateUsersDetails,
    updateUsersPassword,
} from './admin/userActions'
import { createRadar, updateRadar, deleteRadar, advanceRadar } from './admin/radarActions'
import { createProject, deleteProject, updateProject, importProjects } from './admin/projectActions'
import { addClassification, addScore } from './admin/scoreAndClassify'
// import { getName } from '../../common/datamodel/jrc-taxonomy'
import { getName } from '../../common/datamodel/acm-ccs'
import { searchProjects, clearProjects } from './radar/search.js'
import { fetchRendering, fetchStats } from './radar/asyncRendering'
import { RadarCoordinates } from '../../common/widgets/radar-location/radar-coords'
import { RadarLocation } from '../../common/widgets/radar-location/radar-location'
import { SimpleMetric } from '../../common/widgets/simple-metric/simple-metric'
import { SDLCPosition } from '../../common/widgets/sdlc-position/sdlc-position'
import { MTRLPerformance } from '../../common/widgets/mtrl-performance/mtrl-performance'
import { MTRLGraph } from '../../common/widgets/mtrlScoreGraph/mtrl-graph'
import { MTRLHist } from '../../common/widgets/mtrlScoreHist/mtrl-hist'

/**************************************/
/*                                    */
/*   C U S T O M    E L E M E N T S   */
/*                                    */
/**************************************/
// register custom HTML elements for this radar
customElements.define('simple-metric', SimpleMetric)
customElements.define('sdlc-position', SDLCPosition)
customElements.define('radar-coords', RadarCoordinates)
customElements.define('mtrl-performance', MTRLPerformance)
customElements.define('radar-location', RadarLocation)
customElements.define('mtrl-graph', MTRLGraph)
customElements.define('mtrl-hist', MTRLHist)

/***********************/
/*                     */
/*   D O C U M E N T   */
/*                     */
/***********************/
//
// add keyboard listener
//
document.addEventListener('keydown', (e) => {
    // ESC key closes modals
    if (e.key === 'Escape') {
        const modals = document.getElementById('modals').childNodes
        if (modals && modals.length > 0) {
            modals[modals.length - 1].remove()
        }
    }
})

/****************************************************************
 *                                                              *
 *                       M E N U    B A R                       *
 *                                                              *
 ****************************************************************/

//
// RADAR MENU BUTTONS EVENT
//
const radarButtons = document.querySelectorAll('.radar')
if (radarButtons) {
    radarButtons.forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.preventDefault()
            const slug = event.target.getAttribute('radar')
            location.assign(`/radar/${slug}`)
        })
    })
}

//
// ADMIN MENU BUTTONS EVENT
//
const adminButtons = document.querySelectorAll('.admin')
if (adminButtons) {
    adminButtons.forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.preventDefault()
            const route = event.target.getAttribute('route')
            location.assign(route)
        })
    })
}

//
// Disclaimer button
//
const disclaimerButton = document.querySelector('.disclaimer')
if (disclaimerButton) {
    disclaimerButton.addEventListener('click', (e) => {
        e.preventDefault()
        const route = e.target.getAttribute('route')
        location.assign(route)
    })
}

//
// Documentation button
//
const documentationButton = document.querySelector('.documentation')
if (documentationButton) {
    documentationButton.addEventListener('click', (e) => {
        e.preventDefault()
        const route = e.target.getAttribute('route')
        location.assign(route)
    })
}

/****************************************************************
 *                                                              *
 *           U S E R   A C C O U N T   A C T I O N S            *
 *                                                              *
 ****************************************************************/

//
// Login form
//
const loginForm = document.getElementById('login-form')
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const name = document.getElementById('name').value
        const password = document.getElementById('password').value
        login(name, password, document.referrer)
    })
}

//
// Logout
//
const logOutBtn = document.querySelector('.nav__el--logout')
if (logOutBtn) logOutBtn.addEventListener('click', logout)

//
// Change password
//
const passwordForm = document.getElementById('password-form')
if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        document.querySelector('.btn--update-password').textContent = 'Updating...'

        const current = document.getElementById('current').value
        const newPass = document.getElementById('newPass').value
        const newConfirm = document.getElementById('newConfirm').value
        await changePassword(current, newPass, newConfirm)

        document.querySelector('.btn--update-password').textContent = 'Change password'
        document.getElementById('current').textContent = ''
        document.getElementById('newPass').textContent = ''
        document.getElementById('newConfirm').textContent = ''
    })
}

/****************************************************************
 *                                                              *
 *                  R A D A R    D I S P L A Y                  *
 *                                                              *
 ****************************************************************/

//
// Interactive search form
//
const searchField = document.getElementById('search_term')
if (searchField) {
    searchField.addEventListener('keyup', () => searchProjects(searchField.value))
}
// clear button
const clearBtn = document.getElementById('search_clear')
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (searchField) searchField.value = ''
        clearProjects()
    })
}
// stats panel checkbox
const statsCheckbox = document.getElementById('active')
if (statsCheckbox) {
    const node = document.querySelector('#stats > .stats_panel')
    getStatsActive().then((isActive) => {
        if (isActive) {
            statsCheckbox.checked = true
            node.style.display = 'flex'
        } else {
            statsCheckbox.checked = false
            node.style.display = 'none'
        }
    })
    statsCheckbox.addEventListener('click', (e) => {
        // react to event
        node.style.display = e.target.checked ? 'flex' : 'none'
        // and update local storage
        setStatsActive(e.target.checked)
        // trigger updating the stats
        fetchStats(e.target.checked)
    })
}

//
// Display the radar
//
const radarSection = document.getElementById('radar')
if (radarSection) {
    // 1) Fetch the radar and local storage data
    let tasks = []
    tasks.push(fetchRendering(window.location.href))
    tasks.push(getTags())
    tasks.push(getStatsActive())
    Promise.all(tasks)
        .then((results) => {
            // 2) Add rendering and tables as hidden element to the UI
            if (results[0]) {
                // svg
                const temp = document.createElement('div')
                temp.innerHTML = results[0].data.rendering.rendering.svg
                temp.firstChild.style.display = 'none'
                document.getElementById('rendering').appendChild(temp.firstChild)
                // tables
                document.getElementById('tables').innerHTML =
                    results[0].data.rendering.rendering.tables
            }

            // set up a new batch of parallel tasks and fire away
            if (results[1]) {
                tasks = [
                    tasks[2], // push down the stats task for the next .then()
                    filterBlips(results[1], updateFilterList(results[1], getName)),
                    linkupRadar(), // make radar and tables interactive
                    linkupTables(),
                ]
                return Promise.all(tasks)
            }
        })
        .then((results) => {
            // 3) fetch and display the statistics
            fetchStats(results[0])

            // 4) Show radar, while loadStats executes (or not)
            const loadWait = document.getElementById('loadwait')
            loadWait.remove()
            const svg = document.querySelector('#rendering svg')
            svg.style.display = 'block'
        })
        .catch((err) => {
            showAlert('error', err)
        })
}

//
// Show JRC tag filter modal form
//
const jrcTagFormButton = document.querySelector('#acmtagsfilter button')
if (jrcTagFormButton) {
    // wire up the button to show the filter tags meny
    jrcTagFormButton.addEventListener('click', (event) => {
        event.preventDefault()
        // show modal
        showFilterTagForm()
    })
}

//
// Radio buttons for any or all matching
//
const anyAllRadios = document.querySelectorAll('div.ops input')
if (anyAllRadios) {
    anyAllRadios.forEach((radio) => {
        radio.addEventListener('click', async (event) => {
            const filter = await getTags()
            filter.union = event.target.value
            await updateTags(filter)
            await filterBlips(filter)
            fetchStats(await getStatsActive())
        })
    })
}
/*********************************************************/
/*********************************************************/
/*********************************************************/
/*********************************************************/
/*********************************************************/

//
// Create user
//
const newUserForm = document.getElementById('new-user-form')
if (newUserForm) {
    newUserForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        document.getElementById('btn--create-user').textContent = 'Updating...'

        const name = document.getElementById('name').value
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        const confirm = document.getElementById('confirm').value
        const role = document.getElementById('role').value
        await createUser(name, email, password, confirm, role, location.href)

        document.getElementById('btn--create-user').textContent = 'Create user'
        document.getElementById('name').textContent = ''
        document.getElementById('email').textContent = ''
        document.getElementById('password').textContent = ''
        document.getElementById('confirm').textContent = ''
    })
}

//
// DELETE USER LINKS
//
const deleteUserLinks = document.querySelectorAll('.delete-user')
if (deleteUserLinks) {
    deleteUserLinks.forEach((link) => {
        link.addEventListener('click', async (event) => {
            event.preventDefault()
            await deleteUser(event.path[1].getAttribute('route'), location.href)
        })
    })
}

//
// EDIT USER LINKS
//
const editUserLinks = document.querySelectorAll('.edit-user')
if (editUserLinks) {
    editUserLinks.forEach((link) => {
        link.addEventListener('click', async (event) => {
            event.preventDefault()
            location.assign(event.path[1].getAttribute('route'))
        })
    })
}

//
// UPDATE USER'S DETAILS BUTTON
//
const updateUserDetailsForm = document.getElementById('edit-user-form')
if (updateUserDetailsForm) {
    updateUserDetailsForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const name = document.getElementById('name').value
        const email = document.getElementById('email').value
        const role = document.getElementById('role').value
        const id = document.getElementById('userid').value
        await updateUsersDetails(name, email, role, id)
    })
}

//
// UPDATE USER'S PASSWORD BUTTON
//
const setUserPasswordForm = document.getElementById('set-password-form')
if (setUserPasswordForm) {
    setUserPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const userid = document.getElementById('userid').value
        const password = document.getElementById('newPass').value
        const confirm = document.getElementById('newConfirm').value
        await updateUsersPassword(userid, password, confirm)
    })
}

//
// CREATE RADAR FORM
//
const createRadarForm = document.getElementById('new-radar-form')
if (createRadarForm) {
    createRadarForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const edition = document.getElementById('edition').value
        const year = document.getElementById('year').value
        const summary = document.getElementById('summary').value

        await createRadar(edition, year, summary)
    })
}

//
// EDIT RADAR BUTTONS
//
const editRadarLinks = document.querySelectorAll('.edit-radar')
if (editRadarLinks) {
    editRadarLinks.forEach((link) => {
        link.addEventListener('click', async (event) => {
            event.preventDefault()
            location.assign(event.path[1].getAttribute('route'))
        })
    })
}

//
// DELETE RADAR BUTTONS
//
const deleteRadarLinks = document.querySelectorAll('.delete-radar')
if (deleteRadarLinks) {
    deleteRadarLinks.forEach((link) => {
        link.addEventListener('click', async (event) => {
            event.preventDefault()
            await deleteRadar(event.path[1].getAttribute('route'), location.href)
        })
    })
}

//
// EDIT INDIVIDUAL RADAR
//
const updateRadarForm = document.getElementById('edit-radar-form')
if (updateRadarForm) {
    updateRadarForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const id = document.getElementById('radarid').value
        const summary = document.getElementById('summary').value
        await updateRadar(id, summary)
    })
}

//
// ADMINISTER RADAR BUTTONS
//
const administerRadarForms = document.querySelectorAll('.administer-radar-form')
if (administerRadarForms) {
    administerRadarForms.forEach((form) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault()
            const cutoff = document.getElementById('cutoff').value
            const route = event.target.getAttribute('route')
            advanceRadar(route, cutoff, location.href)
        })
    })
}

//
// CREATE NEW PROJECT FORM
//
const newProjectForm = document.getElementById('new-project-form')
if (newProjectForm) {
    newProjectForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const values = {
            // the Project
            project: {
                acronym: document.getElementById('acronym').value,
                rcn: document.getElementById('rcn').value,
                title: document.getElementById('title').value,
                startDate: document.getElementById('startdate').value,
                endDate: document.getElementById('enddate').value,
                call: document.getElementById('fundingcall').value,
                type: document.getElementById('projecttype').value,
                totalCost: document.getElementById('totalCost').value,
                url: document.getElementById('url').value,
                fundingBodyLink: document.getElementById('fundingbodylink').value,

                cwurl: document.getElementById('swprojecthublink').value,
                teaser: document.getElementById('teaser').value,
                tags: []

            },
            // MTRL score (if any)
            mtrl: {
                mrl: document.getElementById('mrl').value,
                trl: document.getElementById('trl').value,
                scoringDate: document.getElementById('scoringDate').value,
                description: document.getElementById('scoreDescription').value,
            },
            // classification (if any)
            classification: {
                classification: document.getElementById('classification').value,
                secondary_classification: document.getElementById('classification_2nd').value,
                classifiedBy: 'SWForum', // for now this is hardcoded when using the web UI
                changeSummary: document.getElementById('changeSummary').value
            }

        }
        // add the taxonomy tax to the project tags
        document.querySelectorAll('.term:checked,.dimension-header:checked').forEach((c) => {
            values.project.tags.push(c.value)
        })


        await createProject(values)
    })
}

//
// DELETE PROJECT LINKS
//
const deleteProjectLinks = document.querySelectorAll('.delete-project')
if (deleteProjectLinks) {
    deleteProjectLinks.forEach((link) => {
        link.addEventListener('click', async (event) => {
            event.preventDefault()
            await deleteProject(event.path[1].getAttribute('route'), location.href)
        })
    })
}

//
// EDIT PROJECT BUTTONS
//
const editProjectLinks = document.querySelectorAll('.edit-project')
if (editProjectLinks) {
    editProjectLinks.forEach((link) => {
        link.addEventListener('click', async (event) => {
            event.preventDefault()
            location.assign(event.target.parentNode.getAttribute('route'))
        })
    })
}

//
// EDIT PROJECT FORM
//
const editProjectForm = document.getElementById('edit-project-form')
if (editProjectForm) {
    editProjectForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const values = {
            id: document.getElementById('projectid').value,
            num_id: document.getElementById('project_numid').value,
            acronym: document.getElementById('acronym').value,
            rcn: document.getElementById('rcn').value,
            title: document.getElementById('title').value,
            startDate: document.getElementById('startdate').value,
            endDate: document.getElementById('enddate').value,
            call: document.getElementById('fundingcall').value,
            type: document.getElementById('projecttype').value,
            totalCost: document.getElementById('totalCost').value,
            url: document.getElementById('url').value,
            fundingBodyLink: document.getElementById('fundingbodylink').value,
            cwurl: document.getElementById('swprojecthublink').value,
            teaser: document.getElementById('teaser').value,
        }
        await updateProject(values)
    })
}

//
// Upload a file and import the projects
//
const uploadImportForm = document.getElementById('import-projects-form')
if (uploadImportForm) {
    uploadImportForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const form = new FormData()
        form.append('importfile', document.getElementById('importfile').files[0])
        importProjects(form)
    })
}

//
// Add a category to a project
//
const addCategoryForm = document.getElementById('add-category-form')
if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const num_id = document.getElementById('rcn').value
        const classification = document.getElementById('classification').value
        const secondary_classification = document.getElementById('classification_2nd').value
        const classifiedBy = 'SWForum' // for now this is hardcoded when using the web UI
        const changeSummary = document.getElementById('changeSummary').value
        addClassification(num_id, classification, secondary_classification, classifiedBy, changeSummary)
    })
}

//
// Add a MTRL score to a project
//
const addScoreForm = document.getElementById('add-score-form')
if (addScoreForm) {
    addScoreForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const rcn = document.getElementById('rcn').value
        const mrl = document.getElementById('mrl').value
        const trl = document.getElementById('trl').value
        const scoringDate = document.getElementById('scoringdate').value
        const description = document.getElementById('scoreDescription').value
        addScore(rcn, mrl, trl, scoringDate, description)
    })
}

//
// Taxonomy tag checkboxes
//
// when selecting a dimension header, unselect al the dimension's terms
const dimensionHeaders = document.querySelectorAll('.dimension-header')
if (dimensionHeaders) {
    dimensionHeaders.forEach((box) => {
        box.addEventListener('click', (event) => {
            const termBoxes = box.parentNode.parentNode.querySelectorAll('.term')
            termBoxes.forEach((tB) => (tB.checked = false))
        })
    })
}
// when selecting a dimension's term, unselect the dimension header
const dimensionTerms = document.querySelectorAll('.term')
if (dimensionTerms) {
    dimensionTerms.forEach((termBox) => {
        termBox.addEventListener('click', (event) => {
            const parentBox = termBox.parentNode.parentNode.parentNode.parentNode.querySelector(
                '.dimension-header'
            )
            parentBox.checked = false
        })
    })
}

//
// Taxonomy tags submit
//
const taxonomySubmit = document.getElementById('edit-tags-form')
if (taxonomySubmit) {
    taxonomySubmit.addEventListener('submit', async (event) => {
        event.preventDefault()
        const values = {
            num_id: document.getElementById('project_numid').value,
            tags: [],
        }
        document.querySelectorAll('.term:checked,.dimension-header:checked').forEach((c) => {
            values.tags.push(c.value)
        })
        await updateProject(values)
    })
}

//
// Radar description expander
//
const rdExpander = document.querySelector('#overview #summary-flicker')
if (rdExpander) {
    rdExpander.addEventListener('click', (event) => {
        event.target.classList.toggle('open')
        event.target.parentNode.parentNode.classList.toggle('open')
    })
}

// show alerts sent by the server
const alertMsg = document.querySelector('body').dataset.alertmsg
const alertType = document.querySelector('body').dataset.alerttype
if (alertMsg && alertType) showAlert(alertType, alertMsg, 2000)
