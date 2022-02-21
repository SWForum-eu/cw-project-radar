//
// IMPORTS
//
// libraries
const Chance = require('chance')
// modules
const AppError = require('../../utils/AppError')
const { toDegree, toRadian } = require('../../../common/util/maths')

//
// GLOBALS
//
const gradients = process.env.GRADIENTS.split(',') || [
    '#FF0000',
    '#FF8F00',
    '#FFFF00',
    '#BFFF00',
    '#00FF00',
]
// piull in the segment names
let segments = process.env.MODEL_SEGMENTS.split(',').map((e) => e.trim())
// add first segment to the end to make subsegment logic easier
segments.push(segments[0])
//
// Place the blips in the given radar and tables
//
const placeBlips = (blips, root, segIdx, ringIdx, geom) => {
    // 1) Create a random number generator
    const chance = new Chance(Math.PI)
    
    // 2) Iterate through all blips (projects) and add to ring
    blips.sort((a, b) => a.num_id - b.num_id)
    const blipCoords = []
    blips.forEach((blip) => {
        // 2.1 - add the blip to the table
        addTableEntry(blip, root, segIdx, ringIdx)
        // 2.2 - find coordinates and draw blip in radar
        const coords = findBlipCoords(blip, geom, blipCoords, chance)
        blipCoords.push(coords)
        drawBlip(blip, root, segIdx, coords, geom)
    })
}

const addTableEntry = (blip, root, segIdx, ringIdx) => {
    const ringList = root
        .select(`.segment-table.segment-${segIdx}`)
        .select(`.ring-table.ring-${ringIdx} > ul`)
    ringList
        .append('li')
        .append('div')
        .attr('id', `table-${blip.num_id}`)
        .attr('data-blip-id', `blip-${blip.num_id}`)
        .text(`${blip.num_id}. ${blip.prj_acronym}`)
}

const findBlipCoords = (blip, geom, allCoords, chance) => {
    // return pickCoords(blip, chance, geom)

    const maxIterations = 200
    let coordinates = pickCoords(blip, chance, geom)
    let iterationCounter = 0
    let foundAPlace = false

    while (iterationCounter < maxIterations) {
        if (thereIsCollision(geom.blipDia, coordinates, allCoords)) {
            coordinates = pickCoords(blip, chance, geom)
        } else {
            foundAPlace = true
            break
        }
        iterationCounter++
    }

    // if (!foundAPlace && blip.width > MIN_BLIP_WIDTH) {
    if (!foundAPlace) {
        // recurse with a smaller blip width
        geom.blipDia = geom.blipDia - 1
        return findBlipCoords(blip, geom, allCoords, chance)
    } else {
        return coordinates
    }
}

const pickCoords = (blip, chance, geom) => {
    // 1) Randomly select a radius for a blip within the blip's arc 
    //    (intersection of ring and sector)
    //    Minimum and maximum centre point must be:
    //    a. greater than arc's inner radius, AND
    //    b. less than arc's outer radius, AND
    //    c. respect the blip's diameter as wellas the boundary thickness
    var radius = chance.floating({
        min: Math.max(geom.blipDia, geom.innerR + geom.blipDia / 2),
        max: geom.outerR - geom.blipDia / 2,
    })

    // 2) Randomly pick an angle relative to the segment's start and end angle
    //    a. Establish the start and end angle in RAD
    const startA = toDegree(geom.startA)
    const endA = toDegree(geom.endA)
    //    b. "delta" controls that the blip does not clip the segment lines
    let delta = toDegree(Math.asin((geom.blipDia - 2) / radius))    
    delta = delta > (endA - startA) / 2 ? (endA - startA) / 2 : delta
    //    c. "offset" is the angular aperture of each sub-segment
    const offset = (endA - startA) / 3
    //    d. Adjust the angle apertures for the randomiser based on
    //       the blip's main and secondary classifications
    let min, max
    if (typeof blip.segment_2 == 'undefined') {
        //   d.1 no secondary classification. Adjust aperture to middle subsegment
        min = startA + offset + delta
        max = endA - offset - delta
    } else {
        //   d.2 THIS WORKS ONLY WITH THREE SEGMENTS!
        //       If the index number of the secondary classification is:
        //       - exactly one larger that the primary classification
        //       then it is the "right" neighbour
        const idx_1st = segments.indexOf(blip.segment)
        if (segments[idx_1st + 1] == blip.segment_2) {
            min = startA + 2*offset + delta
            max = endA - delta
        } else {
            // else it is the "left" neighbour
            min = startA + delta
            max = endA - 2*offset - delta
        }
    }
    // Now we have calculated the aperture values, get the random angle
    var angle = chance.floating({min: min, max: max })

    // STEP 3 - Translate polar coordinates into cartesian coordinates (while respecting
    // the inverted y axis of computer graphics)
    var x = radius * Math.cos(toRadian(angle - 90))
    var y = radius * Math.sin(toRadian(angle - 90))

    return [x, y]
}

const thereIsCollision = (blipWidth, coords, allCoords) => {
    return allCoords.some(
        (currCoords) =>
            Math.abs(currCoords[0] - coords[0]) < blipWidth &&
            Math.abs(currCoords[1] - coords[1]) < blipWidth
    )
}

const drawBlip = (blip, root, segIdx, coords, geom) => {
    var x = coords[0]
    var y = coords[1]

    // 1) A blip is a <g>roup of a <circle> and a <text> element
    let blipGroup = root
        .select(`g.segment.segment-${segIdx}`)
        .append('g')
        .attr('class', 'blip')
        .attr('id', `blip-${blip.num_id}`)
        .attr('transform', `translate(${x}, ${y})`)
        .attr('data-tooltip', `${blip.num_id}. ${blip.prj_acronym}`)
        .attr('data-num-id', blip.num_id)
        .attr('data-segment', blip.segment)
        .attr('data-segment2', blip.segment_2)
        .attr('data-ring', blip.ring)
        .attr('data-table-id', `table-${blip.num_id}`)
        .attr(
            'data-performance',
            JSON.stringify({
                mrl: blip.mrl,
                trl: blip.trl,
                score: blip.score,
                performance: blip.performance,
                min: blip.min,
                max: blip.max,
            })
        )
        .attr('data-jrc-tags', blip.tags.join(' '))

    // 2) Add the <circle> to the blip group
    const colour = arcColour(blip)
    // // the circle
    // blipGroup
    //     .append('circle')
    //     .attr('r', geom.blipDia /2)
    //     .attr('fill', 'white')
    //     .attr('stroke-width', colour === '#000000' ? 2 : 4)
    //     .attr('stroke', colour)

    // // as a square
    // blipGroup
    //     .append('rect')
    //     .attr('x', -1*geom.blipDia/2)
    //     .attr('y', -1*geom.blipDia/2)
    //     .attr('width', geom.blipDia)
    //     .attr('height', geom.blipDia)
    //     .attr('fill', 'white')
    //     .attr('stroke', colour)
    //     .attr('stroke-width', colour === '#000000' ? 2 : 4)
    
    // as an equilateral triangle
    const factor = 520/600
    let x1 = 0
    let y1 = -1*geom.blipDia/2
    let points = `${x1},${y1} `
    x1 = geom.blipDia/2
    y1 = factor*geom.blipDia-geom.blipDia/2
    points += `${x1},${y1} `
    x1 = -1*geom.blipDia/2
    points += `${x1},${y1}`
    blipGroup
        .append('polygon')
        .attr('points', points)
        .attr('fill', 'white')
        .attr('stroke', colour)
        .attr('stroke-width', colour === '#000000' ? 2 : 4)

    // // as an isosceles triangle
    // let x2 = 0
    // let y2 = -1*geom.blipDia/2
    // let points1 = `${x2},${y2} `
    // x2 = geom.blipDia/2
    // y2 = geom.blipDia/2
    // points1 += `${x2},${y2} `
    // x2 = -1*geom.blipDia/2
    // y2 = geom.blipDia/2
    // points1 += `${x2},${y2}`
    // blipGroup
    //     .append('polygon')
    //     .attr('points', points1)
    //     .attr('fill', 'white')
    //     .attr('stroke', colour)
    //     .attr('stroke-width', colour === '#000000' ? 2 : 4)

    // 3) Add the <text> to the blip group
    blipGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('dominant-baseline', 'central')
        .style('font-weight', '700')
        .style('pointer-events', 'none')
        .text(blip.num_id)
}

const arcColour = (blip) => {
    // 0) If there is no score, return black
    if (!blip.score) return '#000000'

    // 1) Gradients array must have odd number of elements
    if (gradients.length % 2 != 1) {
        throw new AppError('gradients configuration must have an odd number of gradients!', 500)
    }

    // 2) Return the performance gradient colour relative to min, max, and number of gradients defined
    // chunk size is the number range for each gradient entry
    var chunkSize = (blip.max - blip.min) / gradients.length
    // now calculate the index
    var idx =
        chunkSize === 0 // no discernible differentiation possible!!!
            ? Math.floor(gradients.length / 2) // --> Use middle gradient
            : Math.floor((blip.performance - blip.min) / chunkSize) // otherwise calculate the gradient
    // need to ensure we are not above gradient length
    idx = idx === gradients.length ? gradients.length - 1 : idx

    return gradients[idx]
}

//
// EXPORTS
//
module.exports = placeBlips
