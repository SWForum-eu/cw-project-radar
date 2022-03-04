//
// IMPORTS
//
// libraries
const mongoose = require('mongoose')
// app modules

//
// SCHEMAS
//
const radarRenderingSchema = new mongoose.Schema(
    {
        radar: {
            type: mongoose.Schema.ObjectId,
            ref: 'Radar',
            required: [true, 'A RadarData document must be lined to exactly one Radar instance'],
        },
        rendering: {
            type: Map, // map of SVG and tabular segment tables
            of: String,
            required: [true, 'Rendering data must be present when publishing a radar'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

//
// MODELS
//
// the finished rendering of a radar
const RadarRendering = mongoose.model('RadarRendering', radarRenderingSchema)

//
// EXPORTS
//
module.exports = { RadarRendering }
