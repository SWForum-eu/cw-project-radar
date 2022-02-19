//
// IMPORTS
//
// libraries
const d3 = require('d3')
const { JSDOM } = require('jsdom')
// app modules
const { calcAngles, equiSpatialRadii } = require('../../../common/util/maths')
const placeBlips = require('./blipPlacer')
const { RadarRendering } = require('../../models/radarDataModel')

//
// GLOBALS
//
const size = 2000

//
// Render the given data into some proper SVG and tables
//
exports.renderRadar = (data) => {
    // create the DOM hook for d3 to work properly
    const fakeDom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    let body = d3.select(fakeDom.window.document).select('body')

    // build the SVG container
    const svgContainer = body.append('div').attr('class', 'svg')
    const tablesContainer = body.append('div').attr('class', 'tables')
    // plot the radar
    plotRadar(body, data)

    // add to the radar, update state, and save
    const rendering = new RadarRendering({})
    rendering.rendering = new Map()
    rendering.rendering.set('svg', svgContainer.html())
    rendering.rendering.set('tables', tablesContainer.html())

    return rendering
}

// plots the entire radar
const plotRadar = (root, data) => {
    // 1) calculate some base values
    // 56 = width of segment name, 2 = thickness of ring stroke
    const radius = (size - 2) / 2 - 56
    const numSegs = data.size
    const numRings = data.values().next().value.size
    const angles = calcAngles(numSegs)
    const radii = equiSpatialRadii(numSegs, numRings, radius)

    plotSegments(root, data, angles, radii)
}

// plot each segment
const plotSegments = (root, data, angles, radii) => {
    const viewBox = `-${size / 2} -${size / 2} ${size} ${size}`
    const svg = root.select('.svg').append('svg').attr('viewBox', viewBox)

    // calc the blip diameter as half the difference between inner and outer
    // radii of the last ring (minus 2 for a blip stroke of 1)
    const blipDia = (radii.slice(-2).reduce((p, c) => c - p) - 2) / 2
    // loop through the segments
    let segIdx = 0
    for (const [seg, rings] of data.entries()) {
        // add a segment table to the tables
        root.select('.tables').append('div').attr('class', `segment-table segment-${segIdx}`)

        // add the segment group to the SVG
        const segGroup = svg
            .append('g')
            .attr('label', seg)
            .attr('class', `segment segment-${segIdx}`)
        let ringIdx = 0
        let lastPath
        // plot all the rings
        for (const [ring, blips] of rings.entries()) {
            lastPath = plotRing(root, ring, blips, segIdx, ringIdx++, angles, radii, blipDia)
        }
        // plot the segment name
        plotSegmentName(segGroup, seg, lastPath, segIdx)
        // plot the lines
        plotLines(segGroup, angles[segIdx], angles[segIdx + 1], radii[radii.length - 1])
        segIdx++
    }
}

const plotSegmentName = (group, name, lastPath, idx) => {
    // inject an ID into the ring with the given ring index
    lastPath.attr('id', 'segment-label-' + idx)
    // now add the text path to the segment group
    group
        .append('text')
        .attr('dy', -20) // a y offset to not set directly on the arc
        .append('textPath') //append a textPath to the text element
        .attr('href', '#segment-label-' + idx) //place the ID of the path here
        .style('text-anchor', 'middle') //place the text halfway on the arc
        .attr('startOffset', '25%') // centered along the path
        .text(name)
        .style('font-size', '24px')
        .style('font-weight', 'bold')
}

const plotRing = (root, ringName, blips, segIdx, ringIdx, angles, radii, blipDia) => {
    // 1) Draw the arc
    const arc = d3
        .arc()
        .innerRadius(radii[ringIdx])
        .outerRadius(radii[ringIdx + 1])
        .startAngle(angles[segIdx])
        .endAngle(angles[segIdx + 1])

    // 2) select the graph's segment group, and
    //    the corresponding table element
    const segTableDiv = root.select(`.segment-table.segment-${segIdx}`)
    const segGroup = root.select(`g.segment.segment-${segIdx}`)

    // 3) Append the arc to the segment group
    const lastPath = segGroup.append('path')
    lastPath.attr('d', arc).attr('class', 'ring ring-' + ringIdx)

    // 4) Add the ring name to the table entry
    const ringDiv = segTableDiv.append('div').attr('class', `ring-table ring-${ringIdx}`)
    ringDiv.append('div').attr('class', 'rtHeader').append('h3').text(ringName)
    ringDiv.append('ul')

    // 3) Add the blips
    placeBlips(blips, root, segIdx, ringIdx, {
        startA: angles[segIdx],
        endA: angles[segIdx + 1],
        innerR: radii[ringIdx],
        outerR: radii[ringIdx + 1],
        blipDia,
    })

    // 4) Add a separator line to the third ring
    // HACK
    // TODO find a way to parametrise this
    if (ringIdx === 2) {
        segGroup
            .append('path')
            .attr(
                'd',
                d3
                    .arc()
                    .innerRadius(radii[ringIdx + 1])
                    .outerRadius(radii[ringIdx + 1])
                    .startAngle(angles[segIdx])
                    .endAngle(angles[segIdx + 1])
            )
            .attr('class', 'ring divider')
    }
    return lastPath
}

const plotLines = (group, startA, endA, radius) => {
    // 1.) "Left" and "Right" lines
    // lines always start at (0, 0). 
    // SVG coordinate system is mirrored on x axis hence we need to rotate by 90 degree, i.e. PI/2
    // to get the correct coordinates
    // "Left" line endpoints
    const endLeftX = radius * Math.cos(startA - Math.PI / 2)
    const endLeftY = radius * Math.sin(startA - Math.PI / 2)
    // "Right" line endpoints
    const endRightX = radius * Math.cos(endA - Math.PI / 2)
    const endRightY = radius * Math.sin(endA - Math.PI / 2)

    // 2.) Intermetiate lines
    // We know we need to divide the segment at hand into three equal pies.
    // We also have the start angle, and end angle, in RAD.
    // The angle (in RAD) for each pie is: offs = (endA - startA) / 3 (three equal pies)
    // hence the offset for the intermediate left separator line is: startA + offs - Math.PI / 2
    // the offset for the intermediate right separator line is: endA - offs - Math.PI / 2
    const offs = (endA - startA) / 3
    // "Intermediate left" line end points 
    const endIntLeftX = radius * Math.cos(startA + offs - Math.PI / 2)
    const endIntLeftY = radius * Math.sin(startA + offs - Math.PI / 2)
    // "Intermediate right" line end points 
    const endIntRightX = radius * Math.cos(endA - offs - Math.PI / 2)
    const endIntRightY = radius * Math.sin(endA - offs - Math.PI / 2)


    // drawing "left" line
    group.append('line').attr('x1', 0).attr('y1', 0).attr('x2', endLeftX).attr('y2', endLeftY)
    // drawing "intermediate left" line
    group.append('line').attr('x1', 0).attr('y1', 0).attr('x2', endIntLeftX).attr('y2', endIntLeftY)
         .attr('class', 'sub')
    // drawing "intermediate right" line
    group.append('line').attr('x1', 0).attr('y1', 0).attr('x2', endIntRightX).attr('y2', endIntRightY)
         .attr('class', 'sub')
    // draw "right" line
    group.append('line').attr('x1', 0).attr('y1', 0).attr('x2', endRightX).attr('y2', endRightY)
}
