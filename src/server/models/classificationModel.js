//
// IMPORTS
//
// libraries
const mongoose = require('mongoose')

//
// MODULE VARS
//
// use env config for validation
// TODO find a better way for domain-specific verification etc.
const segments = process.env.MODEL_SEGMENTS.split(',').map(e => e.trim())

//
// SCHEMA
//
const classificationSchema = new mongoose.Schema(
    {
        // the classification of the proect.
        // Validated against allowed values configured through .env
        classification: {
            type: String,
            required: true,
            validate: c => segments.includes(c)
        },
        secondary_classification: {
            type: String,
            validator: c => segments.includes(c) && c != this.classification
        },
        // which project was classified?
        project: {
            type: mongoose.Schema.ObjectId,
            ref: 'Project',
            required: ['A classification must belong to a project', true]
        },
        // track the date of this classification change
        classifiedOn: {
            type: Date,
            required: true,
            default: Date.now()
        },
        // who initiated the (updated) classification
        classifiedBy: {
            type: String,
            required: true,
            default: 'SWForum',
            enum: {
                values: ['SWForum', 'Project']
            }
        },
        // what is the reason for this classification (or the update)
        changeSummary: {
            type: String,
            required: false,
            default: 'New Classification'
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

const Classification = mongoose.model('Classification', classificationSchema)

//
// EXPORTS
//
module.exports = { Classification, classificationSchema }
