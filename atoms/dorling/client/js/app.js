import * as d3 from 'd3'

const isMobile = window.matchMedia('(max-width: 600px)').matches;

const atomEl = d3.select('.dorling-interactive-wrapper').node();

const width = atomEl.getBoundingClientRect().width;
const height = isMobile ? window.parent.innerHeight / 5 * 3 : width  / 1.1;

const margin = {top:50, bottom:40, left:isMobile ? 40 : 180, right:35};

const padding = 3;

const projection = d3.geoMercator()
//.rotate([-10, 0, 0])
.fitSize([width, height], { type: "Sphere" });

const path = d3.geoPath(projection);

const svg = d3.select('.dorling-interactive-wrapper')
.append('svg')
.attr('width', width)
.attr('height', height)


d3.json('https://interactive.guim.co.uk/docsdata-test/1jBl9XnXHZ8Uw8GOh1Pkna50wqAIoGEvLlrw5VsXVLlc.json')
.then(raw => {

	const data = raw.sheets['for-viz']

	const radius = d3.scaleSqrt()
	.domain([0, d3.max(data, d => d.Scenario_11_SA)])
	.range([0, Math.sqrt(width * height) / 10])

	const simulation = d3.forceSimulation(data)
	.force("x", d3.forceX(d => projection([d.lon,d.lat])[0]))
	.force("y", d3.forceY(d => projection([d.lon,d.lat])[1]))
	.force("collide", d3.forceCollide(d => 1 + radius(d.Scenario_11_SA)))
	.stop();

	for (let i = 0; i < 200; i++){
	    simulation.tick();
	}

	console.log(data)

	svg.selectAll("circle")
      .data(data)
    .enter().append("circle")
      .attr("r", d => radius(d.Scenario_11_SA))
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr('class', d => d.iso)
      .attr("fill", "steelblue")
      .attr("fill-opacity", 0.3)
      .attr("stroke", "steelblue");


	//
})