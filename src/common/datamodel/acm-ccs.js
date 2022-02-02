const hardware = 
{
    tag: 'hardware',
    name: 'Hardware',
    description: '',
    terms:
    [
        {
            tag: 'printedCircuit',
            name: 'Printed circuit boards',
            description: ''
        },
        {
            tag: 'communicationInterfaceStorage',
            name: 'Communication hardware, interfaces and storage',
            description: ''
        },
        {
            tag: 'integratedCircuit',
            name: 'Integrated circuits',
            description: ''
        },
        {
            tag: 'veryLargeIntegration',
            name: 'Very large scale integration design',
            description: ''
        },
        {
            tag: 'powerEnergy',
            name: 'Power and Energy',
            description: ''
        },
        {
            tag: 'electronicDesignAutomation',
            name: 'Electronic Design Automation',
            description: ''
        },
        {
            tag: 'hardwareValidation',
            name: 'Hardware Validation',
            description: ''
        },
        {
            tag: 'hardwareTest',
            name: 'Hardware Test',
            description: ''
        },
        {
            tag: 'robustness',
            name: 'Robustness',
            description: ''
        },
        {
            tag: 'emergingTech',
            name: 'Emerging Technologies',
            description: ''
        }
    ]
}




const acmCCS = 
{
    tag: 'acmTaxonomy',
    name: 'ACM Computing Classification System',
    description: '',
    hardware
}



// functions

const getAllTags = () =>
{
    let result = []

    result = result.concat(getTags(hardware))

    return result
}

const getTags = (node) =>
{
    let tags = []

    tags.push(node.tag)

    if(node.terms && node.terms.length > 0)
    {
        node.terms.forEach((n) => 
        {
            tags = tags.concat(n.tag)
        })
    }

    return tags
}


const getTagsR = (node) => 
{
    let tags = []

    tags.push(node.tag)

    if(node.terms && node.terms.length > 0)
    {
        node.terms.forEach((n) => 
        {
            tags = tags.concat(getTagsR(n))
        })
    }

    return tags
}


const getName = (tag) =>
{
    if(hardware.tag === tag)
        return hardware.name

    for(let i = 0; i<hardware.terms.length; i++)
    {
        const term = hardware.terms[i]
        if(term.tag === tag)
            return term.name
    }
}


module.exports = 
{
    acmCCS,
    getTagsR,
    getAllTags,
    getTags,
    getName
}