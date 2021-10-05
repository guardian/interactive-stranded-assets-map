import * as d3 from 'd3'


const isMobile = window.matchMedia('(max-width: 600px)').matches;

const atomEl = d3.select('.treemap-interactive-wrapper').node();

const width = atomEl.getBoundingClientRect().width;
const height = isMobile ? window.parent.innerHeight / 5 * 3 : width  / 1.1;

const margin = {top:50, bottom:40, left:isMobile ? 40 : 180, right:35};

const padding = 3;


const treemap = data => d3.treemap()
.tile(tile)
.size([width, height])
.padding(1)
.round(true)
(d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))


const svg = d3.select('.treemap-interactive-wrapper')
.append('svg')
.attr('width', width)
.attr('height', height)

const map = svg.append('g')
const labels = svg.append('g')

const color = d3.scaleOrdinal(d3.schemeCategory10)


d3.json('https://interactive.guim.co.uk/docsdata-test/1jBl9XnXHZ8Uw8GOh1Pkna50wqAIoGEvLlrw5VsXVLlc.json')
.then(raw => {

	const data = raw.sheets['for-viz'];

    const continents = data.map(d => d.Continent).filter( (value, index, self) => self.indexOf(value) === index)


    const dataSorted = {name:'World', 'children':[]}

    continents.forEach(d => {

        dataSorted.children.push({name: d, children:data.filter(f => f.Continent === d)})
    })


    const treemap = data => d3.treemap()
    .tile(d3.treemapBinary)
    .size([width, height])
    .padding(1)
    .round(true)
    (
        d3.hierarchy(dataSorted)
      .sum(d => +d.Scenario_1_A)
      .sort((a, b) => +b.Scenario_1_A - +a.Scenario_1_A)

    )


    const root = treemap(dataSorted);

    console.log(root.leaves())

    const leaf = svg.selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

    leaf.append("rect")
    .attr("class", d => d.data.iso + ' ' + d.data.Continent)
    .style("stroke", '#ffffff')
    .style("stroke-width", '1px')
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0);






	
})