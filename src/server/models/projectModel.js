//
// IMPORTS
//
// libraries
const mongoose = require('mongoose')
const validator = require('validator')
const beautifyUnique = require('mongoose-beautiful-unique-validation')
// modules
const AppError = require('./../utils/AppError')
const nextSeq = require('./sequenceModel')
// const { getAllTags } = require('./../../common/datamodel/jrc-taxonomy')
const { getAllTags } = require('./../../common/datamodel/acm-ccs')


const isValidTerm = (value) => {
    const allTags = getAllTags()
    value.forEach((term) => {
        if (!allTags.includes(term)) throw new AppError(`${term} is an invalid tag.`, 400)
    })
}

const isDecimal = (value) => {
    return validator.isDecimal(value + '', {
        decimal_digits: '0,2',
        locale: 'en-GB',
    })
}

const projectSchema = new mongoose.Schema(
    {
        num_id: {
            // A project has an externally visible, unique, numerical id.
            type: Number,
            unique: 'A project with the id {{VALUE}} already exists.',
        },
        acronym: {
            // an EC project's short name
            type: String,
            required: true,
        },
        rcn: {
            // the unique RCN number assigned by the EC when funds awarded.
            type: Number,
            required: true,
            unique: 'A project with the same RCN {{VALUE}} already exists',
        },
        title: {
            // the full title of the EC project
            type: String,
            required: true,
        },
        teaser: {
            // a short teaser text describing the project
            type: String,
            required: true,
        },
        startDate: {
            // the project's start date
            type: Date,
            required: true,
        },
        endDate: {
            // the project's end date
            type: Date,
            required: true,
        },
        createDate: {
            type: Date
        },
        call: String,   // the EC funding call
        type: String,   // project type (mostly IA, RIA, RA, or CSA)
        totalCost: {
            // the project's total budget (EC contrib plus partner's own contribs)
            type: Number,
            validate: [isDecimal, 'At most 2 decimals allowed.'],
        },
        url: {
            // project home page
            type: String,
            validate: validator.isURL,
        },
        // the link to more info from the funding body
        fundingBodyLink: {
            type: String,
            validate: validator.isURL,
        },
        // // URL to the CW ProjectHub
        // cwurl: {
        //     type: String,
        //     validate: [validator.isURL, 'Invalid URL.'],
        // }, 
        // check if the project will have this feature or not

        //same for tags
        tags: {
            type: [String],
            validate: {
                validator: isValidTerm,
                message: (props) => `${props.value} is not a valid ACM taxonomy term tag!`,
            },
        },
        // # classifications for this project
        hasClassifications: {
            type: Boolean,
            default: false,
        },
        // # scores for this project
        hasScores: {
            type: Boolean,
            default: false,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

//
// SCHEMA MIDDLEWARE
//
// ensure that num_id gets a unique number.
projectSchema.pre('save', async function (next) {
    if (this.isNew) {
        this.num_id = await nextSeq('project')
        this.createDate = Date()
    }

    next()
})

//
// INDEXES
//
projectSchema.index({ num_id: 1 }) // index on the project's CW id
projectSchema.index({ acronym: 1 }) // index on the project's CW id
projectSchema.index({ rcn: 1 }) // index on the project's RCN
projectSchema.index({ acronym: 'text', title: 'text', teaser: 'text' }) // text indexes for textual search

//
// MODEL
//
projectSchema.plugin(beautifyUnique)
const Project = mongoose.model('Project', projectSchema)

//
// EXPORTS
//
module.exports = { Project, projectSchema }
