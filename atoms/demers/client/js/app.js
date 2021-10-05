import * as d3 from 'd3'
import * as continents from 'assets/continents.json'
import { forceCollide } from 'shared/js/ForceCollide.js'

const isMobile = window.matchMedia('(max-width: 600px)').matches;

const atomEl = d3.select('.demers-interactive-wrapper').node();

const width = atomEl.getBoundingClientRect().width;
const height = isMobile ? window.parent.innerHeight / 5 * 3 : width  / 1.1;

const margin = {top:50, bottom:40, left:isMobile ? 40 : 180, right:35};

const padding = 3;

const projection = d3.geoEqualEarth()
.rotate([-10, 0, 0])
.fitSize([width, height], { type: "Sphere" });

const path = d3.geoPath(projection);

const svg = d3.select('.demers-interactive-wrapper')
.append('svg')
.attr('width', width)
.attr('height', height)

const map = svg.append('g')
const labels = svg.append('g')


d3.json('https://interactive.guim.co.uk/docsdata-test/1jBl9XnXHZ8Uw8GOh1Pkna50wqAIoGEvLlrw5VsXVLlc.json')
.then(raw => {

	const data = raw.sheets['for-viz']

	const radius = d3.scaleSqrt()
	.domain([0, d3.max(data, d => +d.Scenario_11_SA)])
	.range([0, Math.sqrt(width * height) / 10])

	console.log(d3.max(data, d => d.Scenario_11_SA))

	const simulation = d3
    .forceSimulation(data)
    .force("x",d3.forceX((d) => d.x))
    .force("y",d3.forceY((d) => d.y))
    .force("collide", forceCollide(data, 3));

     const node = svg
    .append("g")
    .attr("fill", "#e04a28")
    .attr("fill-opacity", 0.9)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d) => d.x - d.width / 2)
    .attr("y", (d) => d.y - d.height / 2)
    .attr("width", (d) => d.width)
    .attr("height", (d) => d.height);


  simulation.on("tick", () => {
    node
      .attr("x", (d) => d.x - d.width / 2)
      .attr("y", (d) => d.y - d.height / 2);
    labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
  });

  invalidation.then(() => simulation.stop());

	/*for (let i = 0; i < 200; i++){
	    simulation.tick();
	}

	map.selectAll("rect")
    .data(data)
    .enter().append("rect")
    .attr("width", d => radius(d.Scenario_11_SA) * 2)
    .attr("height", d => radius(d.Scenario_11_SA) * 2)
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr('class', d => d.Continent + ' ' + d.iso)
    .attr("fill", "steelblue")
    .attr("fill-opacity", 0.3)
    .attr("stroke", "steelblue");

    labels.selectAll('text')
    .data(continents.default.filter(f => f.CONTINENT != 'Antarctica'))
    .enter()
    .append('text')
    .attr('y', d => projection([d.xcoord,d.ycoord])[1] + 'px')
    .attr('x', d => projection([d.xcoord,d.ycoord])[0] + 'px')
    .text(d => d.CONTINENT)*/

})
