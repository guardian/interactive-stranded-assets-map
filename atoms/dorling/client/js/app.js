import * as d3 from 'd3'
import * as continents from 'assets/continents.json'
import ScrollyTeller from "shared/js/scrollyteller"

const isMobile = window.matchMedia('(max-width: 600px)').matches;

const atomEl = d3.select('.dorling-interactive-wrapper').node();

const width = atomEl.getBoundingClientRect().width;
const height = isMobile ? window.innerHeight : width  / 5 * 3 ;

const margin = {top:5, right:5, bottom:5, left:5}

const projection = d3.geoEqualEarth();

let extent = {
        type: "LineString",

         coordinates: [
            [-20, -60],
            [60, -60],
            [60, 90],
            [-20, 90],
        ]
}

let extentMobile = {
        type: "LineString",

         coordinates: [
            [-50, -60],
            [160, -60],      
            [160, 90],
            [-50, 90],
        ]
}

projection
.fitExtent([[0, 0], [width, isMobile ? height / 2 : height]], isMobile ? extentMobile : extent);

const path = d3.geoPath(projection);

const svg = d3.select('.dorling-interactive-wrapper')
.append('svg')
.attr('class', 'dorling-svg')
.attr('width', width)
.attr('height', height)
.style('margin-top', (window.innerHeight - height) /2 + 'px')

const axis = svg.append('g')
const bars = svg.append('g')
const map = svg.append('g')
const labels = svg.append('g')
const annotations = svg.append('g')

const radius = d3.scaleSqrt()

const scrolly = new ScrollyTeller({
    parent: document.querySelector("#scrolly-1"),
    triggerTop: .5, // percentage from the top of the screen that the trigger should fire
    triggerTopMobile: 0.75,
    transparentUntilActive: isMobile ? false : true
    });


d3.json('https://interactive.guim.co.uk/docsdata-test/1jBl9XnXHZ8Uw8GOh1Pkna50wqAIoGEvLlrw5VsXVLlc.json')
.then(raw => {

	const data = raw.sheets['for-viz'];

    data.sort((a,b) => {return a.Scenario_11_LostGDP - b.Scenario_11_LostGDP})

    let xScale = d3.scaleLinear()
    .domain([0, data.length-1])
    .range([margin.left, width-margin.right])

    let yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => +d.Scenario_11_LostGDP))
    .range([height - margin.bottom, margin.top])


    let yAxis = axis.append("g")
    .attr("class", "yaxis")
    .call(
        d3.axisLeft(yScale)
        .ticks(5)
        .tickSizeInner(-width)
    )

    axis
    .selectAll("text")
    .style("text-anchor", "start")
    .attr('x', 10)
    .attr('y', -10)

    axis
    .selectAll('line')
    .attr('stroke-width', d => d == 0 ? '4px' : '1px')

	radius
	.domain([0, d3.max(data, d => +d.Scenario_1_A)])
	.range([isMobile ? 3 : 6, isMobile ? 20 : 40])

	const simulation = d3.forceSimulation(data)
	.force("x", d3.forceX(d => projection([d.lon,d.lat])[0]))
	.force("y", d3.forceY(d => projection([d.lon,d.lat])[1]))
	.force("collide", d3.forceCollide(d => 1 + radius(d.Scenario_1_A)))
	.stop();

	for (let i = 0; i < 400; i++){
	    simulation.tick();
	}

	map.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr('class', d => d.Continent + ' ' + d.Area)
    .attr("fill", "steelblue")
    .attr("fill-opacity", 0.3)
    .attr("stroke", "steelblue")
    .attr("r", 0)
    .on('mouseover', d => console.log(d))
    

    labels.selectAll('text')
    .data(continents.default.filter(f => f.CONTINENT != 'Antarctica'))
    .enter()
    .append('text')
    .attr('y', d => projection([d.xcoord,d.ycoord])[1] + 'px')
    .attr('x', d => projection([d.xcoord,d.ycoord])[0] + 'px')
    .text(d => d.CONTINENT)
    .style('text-anchor', 'middle')

    scrolly.addTrigger({num:1, do: () => {

        radius
        .domain([0, d3.max(data, d => +d.Scenario_1_A)])

        map.selectAll("circle")
        .transition()
        .duration(Math.random() * 2000)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_1_A))
    }})

    scrolly.addTrigger({num:2, do: () => {


        yAxis.style('display','none');
        labels.style('display', 'block')
        bars.selectAll('path').remove()


        simulation
        .force("collide", d3.forceCollide(d => 1 + radius(d.Scenario_12_SA)))

        map.selectAll("circle").interrupt();

        map.selectAll("circle")
        .transition()
        .duration(Math.random() * 2000)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_12_SA))
    }})

    scrolly.addTrigger({num:3, do: () => {

        yAxis.style('display','block');

        labels.style('display', 'none')

        map.selectAll("circle")
        .transition()
        .duration(Math.random() * 2000)
        .attr('cy', d => yScale(+d.Scenario_11_LostGDP) + 'px')
        .attr('cx', (d,i) => xScale(i) + 'px')
        .attr('r', 3)

        bars.selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', (d,i) => `M${xScale(i)},${yScale(0)} L${xScale(i)},${yScale(0)}`)
        .transition()
        .duration(Math.random() * 2000)
        .attr('d', (d,i) => `M${xScale(i)},${yScale(0)} L${xScale(i)},${yScale(d.Scenario_11_LostGDP)}`)
        .attr('stroke', 'black')
        
    }})

    scrolly.watchScroll();


    svg.on('click', d =>console.log(d.clientX, d.clientY, projection.invert([d.clientX, d.clientY])))

})

