import * as d3 from 'd3'
import * as continents from 'assets/continents.json'
import ScrollyTeller from "shared/js/scrollyteller"

const isMobile = window.matchMedia('(max-width: 600px)').matches;

const atomEl = d3.select('.dorling-interactive-wrapper').node();

const tooltip = d3.select('.stranded-assets-tooltip')

const width = atomEl.getBoundingClientRect().width;
const height = isMobile ? window.innerHeight : width  / 5 * 3 ;

const margin = {top:5, right:5, bottom:5, left:35}

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
const mapStatic = svg.append('g')
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

let data ;


d3.json('https://interactive.guim.co.uk/docsdata-test/1jBl9XnXHZ8Uw8GOh1Pkna50wqAIoGEvLlrw5VsXVLlc.json')
.then(raw => {

	data = raw.sheets['for-viz'];

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
	.range([isMobile ? 3 : 6, isMobile ? 20 : 60])

	const simulation = d3.forceSimulation(data)
	.force("x", d3.forceX(d => projection([d.lon,d.lat])[0]))
	.force("y", d3.forceY(d => projection([d.lon,d.lat])[1]))
	.force("collide", d3.forceCollide(d => 2 + radius(d.Scenario_1_A)))
	.stop();

	for (let i = 0; i < 40; i++){
	    simulation.tick();
	}

	let greyCircles = mapStatic.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr('class', d => d.Continent)
    .style('fill-opacity', .5)
    .style("stroke-width", "2px")
    .style("stroke-dasharray", "4.5")
    .style("stroke-linecap", "round")
    .attr("r", 0)

    let circles = map.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr('class', d => d.Continent + ' ' + d.Area)
    .style("stroke-width", "2px")
    .attr("r", 0)
    .on('mousemove', e => manageMove(e, '0'))
    .on('mouseout', e => tooltip.classed('over', false))
    

    labels.selectAll('text')
    .data(continents.default.filter(f => f.CONTINENT != 'Antarctica'))
    .enter()
    .append('text')
    .attr('y', d => projection([d.xcoord,d.ycoord])[1] + 'px')
    .attr('x', d => projection([d.xcoord,d.ycoord])[0] + 'px')
    .text(d => d.CONTINENT)
    .style('text-anchor', 'middle')

    scrolly.addTrigger({num:1, do: () => {

        console.log('1', d3.max(data, d => +d.Scenario_1_A))

        clearAnnotations()

        radius
        .domain([0, d3.max(data, d => +d.Scenario_1_A)])

        mapStatic.selectAll("circle")
        .transition()
        .duration(500)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_1_A))

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_1_A))

        circles
        .on('mousemove', e => manageMove(e, '1'))
    

    }})

     scrolly.addTrigger({num:2, do: () => {

        console.log('2', d3.max(data, d => +d.Scenario_1_A))

        //annotation
        //Russia would have $3.8trn in fossil fuel assets if climate action wasn't taken

        radius
        .domain([0, d3.max(data, d => +d.Scenario_1_A)])

        clearAnnotations()

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_1_A))

        setTimeout(d => makeAnnotation('Russia', "Russia would have $3.8trn in fossil fuel assets if climate action wasn't taken", 'right'), 500);

        circles
        .on('mousemove', e => manageMove(e, '1'))

        
    

    }})

    scrolly.addTrigger({num:3, do: () => {

        console.log('3', d3.max(data, d => +d.Scenario_1_A))

        clearAnnotations()

        radius
        .domain([0, d3.max(data, d => +d.Scenario_1_A)])

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_12_SA))

        circles
        .on('mousemove', e => manageMove(e, '2'))
    }})

    scrolly.addTrigger({num:4, do: () => {

        console.log('4', d3.max(data, d => +d.Scenario_1_A))

        radius
        .domain([0, d3.max(data, d => +d.Scenario_1_A)])

        clearAnnotations()

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_12_SA))

        setTimeout(d => makeAnnotation('USA', "The USA's real value of fossil fuel assets would stand at $2.1trn, after 62% of the total becomes stranded", 'right'), 500);

        circles
        .on('mousemove', e => manageMove(e, '2'))

        
    }})

    scrolly.addTrigger({num:5, do: () => {

        console.log('5')

        clearAnnotations()

        mapStatic.style('display', 'block')

        yAxis.style('display','none');
        labels.style('display', 'block')
        bars.selectAll('path').remove()


        simulation
        .force("collide", d3.forceCollide(d => 1 + radius(d.Scenario_1_A)))

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_11_SA))

        circles
        .on('mousemove', e => manageMove(e, '3'))
    }})

    scrolly.addTrigger({num:6, do: () => {

        console.log('6')

        mapStatic.style('display', 'block')

        clearAnnotations()

        yAxis.style('display','none');
        labels.style('display', 'block')
        bars.selectAll('path').remove()


        simulation
        .force("collide", d3.forceCollide(d => 1 + radius(d.Scenario_1_A)))

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_11_SA))


        setTimeout(d => makeAnnotation('China', "Over half of China's fossil fuel assets are also set to be stranded", 'right'), 500)

        circles
        .on('mousemove', e => manageMove(e, '3'))

        
    }})

    scrolly.addTrigger({num:7, do: () => {

        console.log('7')

        clearAnnotations()

        mapStatic.style('display', 'none')

        yAxis.style('display','block');

        labels.style('display', 'none')

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr('cy', d => yScale(+d.Scenario_11_LostGDP) + 'px')
        .attr('cx', (d,i) => xScale(i) + 'px')
        .attr('r', 3)

        bars.selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', (d,i) => `M${xScale(i)},${yScale(0)} L${xScale(i)},${yScale(0)}`)
        .transition()
        .duration(500)
        .attr('d', (d,i) => `M${xScale(i)},${yScale(0)} L${xScale(i)},${yScale(d.Scenario_11_LostGDP)}`)
        .attr('stroke', 'black')

        circles
        .on('mousemove', e => manageMove(e, '4'))
        
    }})

    scrolly.addTrigger({num:8, do: () => {

        console.log('8')

        clearAnnotations()

        mapStatic.style('display', 'none')

        yAxis.style('display','block');

        labels.style('display', 'none')

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr('cy', d => yScale(+d.Scenario_11_LostGDP) + 'px')
        .attr('cx', (d,i) => xScale(i) + 'px')
        .attr('r', 3)

        bars.selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', (d,i) => `M${xScale(i)},${yScale(0)} L${xScale(i)},${yScale(0)}`)
        .transition()
        .duration(500)
        .attr('d', (d,i) => `M${xScale(i)},${yScale(0)} L${xScale(i)},${yScale(d.Scenario_11_LostGDP)}`)
        .attr('stroke', 'black')

        setTimeout(d => makeAnnotation('China', "China's economy would still grow at the same time as it transitions from fossil fuels", 'top'),500)

        circles
        .on('mousemove', e => manageMove(e, '4'))

        
        
    }})


    scrolly.watchScroll();


    svg.on('click', d =>console.log(d.clientX, d.clientY, projection.invert([d.clientX, d.clientY])))

})


const manageMove = (event, text) => {

    console.log(event)


    tooltip.classed('over', true)

    let left = event.clientX + -atomEl.getBoundingClientRect().left;
    let top = event.clientY + -atomEl.getBoundingClientRect().top;


    let tWidth = tooltip.node().getBoundingClientRect().width;
    let tHeight = tooltip.node().getBoundingClientRect().height;

    let posX = left - (tWidth /2);
    let posY = top + 15;

    if(posX + tWidth > width) posX = width - tWidth;
    if(posX < 0) posX = 0;

    tooltip.style('left',  posX + 'px')
    tooltip.style('top', posY + 'px')

}

const clearAnnotations = () => {

    annotations.selectAll('text')
    .remove()

    annotations.selectAll('path')
    .remove()

}

const makeAnnotation = (country_name, text, align = 'left', textWidth = 130, offsetX = 30, offsetY = 15) => {

    let node = map.select('.' + country_name)
    let r = +node.attr('r')
    let cx = +node.attr('cx').split('px')[0]
    let cy = +node.attr('cy').split('px')[0]
    let posX = align == 'left' ? cx - r : cx + r;
    let posY = cy;


    if(align === 'left')
    {
        let annBg = annotations
        .append("text")
        .attr("class", "annotationBg")
        .attr("x", d => posX - offsetX - textWidth - 5)
        .attr("y", d => posY)
        .text(text)
        .call(wrap, textWidth, 'textBg');

        let ann = annotations
        .append("text")
        .attr("class", "annotation")
        .attr("x", posX - offsetX - textWidth - 5 )
        .attr("y", posY)
        .text(text)
        .call(wrap, textWidth);


        let line = d3.line()([[posX , posY], [ posX, posY], [posX - offsetX, posY]])

        annotations
        .append('path')
        .attr('d', line)
        .attr('stroke', '#333333')
        .attr('stroke-width', 1.5)
    }
    else if(align === 'top'){

        let annBg = annotations
        .append("text")
        .attr("class", "annotationBg")
        .attr("x", posX - textWidth / 2)
        .attr("y",posY - offsetY)
        .text(text)
        .call(wrap, textWidth, 'textBg');

        let ann = annotations
        .append("text")
        .attr("class", "annotation")
        .attr("x", posX - textWidth / 2)
        .attr("y",posY - offsetY)
        .text(text)
        .call(wrap, textWidth);

        let annHeight = d3.select('.annotation').node().getBoundingClientRect().height;

        d3.selectAll(".annotationBg")
        .style('transform', `translate(0,-${annHeight + 10}px)`)

        d3.selectAll('.annotation')
        .style('transform', `translate(0,-${annHeight + 10}px)`)

        let line = d3.line()([[posX - r, posY], [ posX - r, posY], [posX - r, posY - 20]])

        annotations
        .append('path')
        .attr('d', line)
        .attr('stroke', '#333333')
        .attr('stroke-width', 1.5)

    }
    else
    {
        let annBg = annotations
        .append("text")
        .attr("class", "annotationBg")
        .attr("x",posX + offsetX + 5)
        .attr("y",posY - offsetY)
        .text(text)
        .call(wrap, textWidth, 'textBg');

        let ann = annotations
        .append("text")
        .attr("class", "annotation")
        .attr("x",posX + offsetX + 5 )
        .attr("y",posY - offsetY)
        .text(text)
        .call(wrap, textWidth);

        let line = d3.line()([[posX, posY], [ posX, posY], [posX + offsetX , posY]])

        annotations
        .append('path')
        .attr('d', line)
        .attr('stroke', '#333333')
        .attr('stroke-width', 1.5)
    }


}

const wrap = (text, width, className = '') => {

    text.each(function () {

        let text = d3.select(this);
        let words = text.text().split(/\s+/).reverse();

        let word;
        let line = [];
        let lineNumber = 0;
        let lineHeight = 1.1; // ems
        let x = text.attr("x");
        let y = text.attr("y");
        let dy = 0;

        let tspan = text.text(null)
        .append("tspan")
        .attr('class', className)
        .attr("x", x)
        .attr("y", y)
        .attr("dy", dy + "em");

        while (word = words.pop()) {

            line.push(word);

            tspan.text(line.join(" "));

            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                .attr('class', className)
                .attr("x", x)
                .attr("y", y)
                .attr("dy", ++lineNumber * lineHeight + dy + "em")
                .text(word);
            }
        }
    });
}


