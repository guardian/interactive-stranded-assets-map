import * as d3 from 'd3'
import { geoGilbert } from "d3-geo-projection"
import * as continents from 'assets/continents.json'
import ScrollyTeller from "shared/js/scrollyteller"
import { numberWithCommas } from 'shared/js/util'

const isMobile = window.matchMedia('(max-width: 600px)').matches;

const atomEl = d3.select('.dorling-interactive-wrapper').node();

const tooltip = d3.select('.stranded-assets-tooltips')

const width = atomEl.getBoundingClientRect().width;
const height = window.innerHeight;

const margin = {top:25, right:5, bottom:25, left:isMobile ? 0 : 320}

const projection = geoGilbert();

const extent = {
        type: "Sphere",

         coordinates: [
            [-180, -90],
            [180, -90],      
            [180, 90],
            [-180, 90]
        ]
}

if(isMobile)
{
    projection
    .fitWidth(width, extent)
}
else
{
    projection
    .fitExtent([[margin.left, 0], [width, height]], extent);
}   



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
    triggerTopMobile: .5,
    transparentUntilActive: true
    });

let data ;

let currentBlob = 1;


d3.json('https://interactive.guim.co.uk/docsdata-test/1jBl9XnXHZ8Uw8GOh1Pkna50wqAIoGEvLlrw5VsXVLlc.json')
.then(raw => {

	data = raw.sheets['for-viz'];

    data.sort((a,b) => {return a.Scenario_11_LostGDP - b.Scenario_11_LostGDP})

    let xScale = d3.scaleLinear()
    .domain([0, data.length-1])
    .range([margin.left + 40, width-margin.right])

    let yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => +d.Scenario_11_LostGDP))
    .range([height - margin.bottom, margin.top])


    let yAxis = axis.append("g")
    .attr("class", "yaxis")
    .call(
        d3.axisLeft(yScale)
        .ticks(5)
        .tickSizeInner(-width + margin.left)
    )
    .style('transform', `translate(${margin.left}px,0)`)

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
    .attr('class', d => d.Continent + ' ' + d.Area.replace(' ', '.'))
    .style("stroke-width", "2px")
    .attr("r", 0)
    .on('mousemove', (e,d) => {manageMove(e); manageTooltip(d)})
    .on('mouseover', e => {

            d3.select(e.target)
            .classed('over', true)

        
        })
        .on('mouseout', e => {
            tooltip.classed('over', false)

            d3.select(e.target)
            .classed('over', false)
        })

    labels.selectAll('blah')
    .data(continents.default.filter(f => f.CONTINENT != 'Antarctica'))
    .enter()
    .append('text')
    .attr('class', 'continent-label-bg')
    .attr('y', d => projection([d.xcoord,d.ycoord])[1] + 'px')
    .attr('x', d => (projection([d.xcoord,d.ycoord])[0] - 40) + 'px')
    .text(d => d.CONTINENT)
    .call(wrap, 50)

    labels.selectAll('blah')
    .data(continents.default.filter(f => f.CONTINENT != 'Antarctica'))
    .enter()
    .append('text')
    .attr('class', 'continent-label')
    .attr('y', d => projection([d.xcoord,d.ycoord])[1] + 'px')
    .attr('x', d => (projection([d.xcoord,d.ycoord])[0] - 40) + 'px')
    .text(d => d.CONTINENT)
    .call(wrap, 50)

    scrolly.addTrigger({num:1, do: () => {

        currentBlob = 1;

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

        
        if(!isMobile)
        {
            let countries = labels.selectAll("blah")
            .data(data.filter(f => f.iso === 'USA' || f.iso === 'Opec'))
            .enter().append("text")
            .attr('y', d => d.y + 'px')
            .attr('x', d => d.x + 'px')
            .text(d => d.iso)
            .attr('text-anchor', 'middle')
            .attr('class', 'label-country')
        }

        

        if(!isMobile)setTimeout(d => makeAnnotation('Russia', "Russia would have $3.8trn in fossil fuel assets if climate action wasn't taken", 'right'), 500);

    

    }})

     scrolly.addTrigger({num:2, do: () => {

        console.log('2')

        currentBlob = 2;

        radius
        .domain([0, d3.max(data, d => +d.Scenario_1_A)])

        clearAnnotations()

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_1_A))

    }})

    scrolly.addTrigger({num:3, do: () => {

        console.log('3')

        currentBlob = 3;

        clearAnnotations()

        radius
        .domain([0, d3.max(data, d => +d.Scenario_1_A)])

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_12_SA))

    }})

    scrolly.addTrigger({num:4, do: () => {

        console.log('4')

        currentBlob = 4;

        radius
        .domain([0, d3.max(data, d => +d.Scenario_1_A)])

        clearAnnotations()

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr("cy", d => d.y + 'px')
        .attr('cx', d => d.x + 'px')
        .attr("r", d => radius(+d.Scenario_12_SA))

        if(!isMobile)setTimeout(d => makeAnnotation('USA', "The USA's real value of fossil fuel assets would stand at $2.1trn, after 62% of the total becomes stranded", 'right'), 500);
        
    }})

    scrolly.addTrigger({num:5, do: () => {

        console.log('5')

        currentBlob = 5;

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

    }})

    scrolly.addTrigger({num:6, do: () => {

        console.log('6')

        currentBlob = 6;

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


        if(!isMobile)setTimeout(d => makeAnnotation('China', "Over half of China's fossil fuel assets are also set to be stranded", 'left'), 500)

        
    }})

    scrolly.addTrigger({num:7, do: () => {

        console.log('7')

        currentBlob = 7;

        clearAnnotations()

        mapStatic.style('display', 'none')

        yAxis.style('display','block');

        labels.style('display', 'none')

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr('cy', d => yScale(+d.Scenario_11_LostGDP) + 'px')
        .attr('cx', (d,i) => xScale(i) + 'px')
        .attr('r', isMobile ? 2 : 3)

        bars.selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', (d,i) => `M${xScale(i)},${yScale(0)} L${xScale(i)},${yScale(0)}`)
        .transition()
        .duration(500)
        .attr('d', (d,i) => `M${xScale(i)},${yScale(0)} L${xScale(i)},${yScale(d.Scenario_11_LostGDP)}`)
        .attr('stroke', '#eaeaea')
        .attr('stroke-width', '1.5px')

        
    }})

    scrolly.addTrigger({num:8, do: () => {

        console.log('8')

        currentBlob = 8;

        clearAnnotations()

        mapStatic.style('display', 'none')

        yAxis.style('display','block');

        labels.style('display', 'none')

        map.selectAll("circle")
        .transition()
        .duration(500)
        .attr('cy', d => yScale(+d.Scenario_11_LostGDP) + 'px')
        .attr('cx', (d,i) => xScale(i) + 'px')
        .attr('r', isMobile ? 2 : 3)

        bars.selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', (d,i) => `M${xScale(i)},${yScale(0)} L${xScale(i)},${yScale(0)}`)
        .transition()
        .duration(500)
        .attr('d', (d,i) => `M${xScale(i)},${yScale(0)} L${xScale(i)},${yScale(d.Scenario_11_LostGDP)}`)
        .attr('stroke', '#eaeaea')
        .attr('stroke-width', '1.5px')

        if(!isMobile)setTimeout(d => makeAnnotation('China', "China's economy would still grow at the same time as it transitions from fossil fuels", 'top'),500)
        
    }})


    scrolly.watchScroll();


    svg.on('click', d =>console.log(d.clientX, d.clientY, projection.invert([d.clientX, d.clientY])))

})

const manageTooltip = (data) => {

    console.log('namage tooltip', currentBlob)


    tooltip.select('#tooltip-0').html(data.Area)

    switch(currentBlob){
        case 1:

        tooltip.select('#tooltip-1').style('display', 'block')
        tooltip.select('#tooltip-2').style('display', 'none')
        tooltip.select('#tooltip-3').style('display', 'none')
        tooltip.select('#tooltip-1 .stranded-tooltip-figure').html('$' + numberWithCommas(+data.Scenario_1_A) + 'bn')
        tooltip.select('#tooltip-1 .stranded-tooltip-subheader').html('Estimated in business-as-usual scenario')

        break;

        case 2:

        tooltip.select('#tooltip-1').style('display', 'block')
        tooltip.select('#tooltip-2').style('display', 'none')
        tooltip.select('#tooltip-3').style('display', 'none')
        tooltip.select('#tooltip-1 .stranded-tooltip-figure').html('$' + numberWithCommas(+data.Scenario_1_A) + 'bn')
        tooltip.select('#tooltip-1 .stranded-tooltip-subheader').html('Estimated in business-as-usual scenario')

        break;

        case 3:

        tooltip.select('#tooltip-1').style('display', 'none')
        tooltip.select('#tooltip-2').style('display', 'block')
        tooltip.select('#tooltip-3').style('display', 'block')
        tooltip.select('#tooltip-2 .stranded-tooltip-figure').html('$' + numberWithCommas(+data.Scenario_12_SA) + 'bn')
        tooltip.select('#tooltip-2 .stranded-tooltip-note').html('$' + numberWithCommas(+data.Scenario_12_AssetShareLost) + "% of World's total")
        tooltip.select('#tooltip-3 .stranded-tooltip-figure').html(`${+data.Scenario_12_LostGDP > 0 ? '+' : ''}${numberWithCommas(+data.Scenario_12_LostGDP)}%`)
        tooltip.select('#tooltip-2 .stranded-tooltip-subheader').html('In net zero scenario with Opec sell-off')

        break;

        case 4:

        tooltip.select('#tooltip-1').style('display', 'none')
        tooltip.select('#tooltip-2').style('display', 'block')
        tooltip.select('#tooltip-3').style('display', 'block')
        tooltip.select('#tooltip-2 .stranded-tooltip-figure').html('$' + numberWithCommas(+data.Scenario_12_SA) + 'bn')
        tooltip.select('#tooltip-2 .stranded-tooltip-note').html('$' + numberWithCommas(+data.Scenario_12_AssetShareLost) + "% of World's total")
        tooltip.select('#tooltip-3 .stranded-tooltip-figure').html(`${+data.Scenario_12_LostGDP > 0 ? '+' : ''}${numberWithCommas(+data.Scenario_12_LostGDP)}%`)
        tooltip.select('#tooltip-2 .stranded-tooltip-subheader').html('In net zero scenario with Opec sell-off')

        break;

        case 5:

        tooltip.select('#tooltip-1').style('display', 'none')
        tooltip.select('#tooltip-2').style('display', 'block')
        tooltip.select('#tooltip-3').style('display', 'block')
        tooltip.select('#tooltip-2 .stranded-tooltip-figure').html('$' + numberWithCommas(+data.Scenario_11_SA) + 'bn')
        tooltip.select('#tooltip-2 .stranded-tooltip-note').html('$' + numberWithCommas(+data.Scenario_11_AssetShareLost) + "% of World's total")
        tooltip.select('#tooltip-3 .stranded-tooltip-figure').html(`${+data.Scenario_11_LostGDP > 0 ? '+' : ''}${numberWithCommas(+data.Scenario_11_LostGDP)}%`)
        tooltip.select('#tooltip-2 .stranded-tooltip-subheader').html('In net zero scenario with Opec quota')


        break;

        case 6:

        tooltip.select('#tooltip-1').style('display', 'none')
        tooltip.select('#tooltip-2').style('display', 'block')
        tooltip.select('#tooltip-3').style('display', 'block')
        tooltip.select('#tooltip-2 .stranded-tooltip-figure').html('$' + numberWithCommas(+data.Scenario_11_SA) + 'bn')
        tooltip.select('#tooltip-2 .stranded-tooltip-note').html('$' + numberWithCommas(+data.Scenario_11_AssetShareLost) + "% of World's total")
        tooltip.select('#tooltip-3 .stranded-tooltip-figure').html(`${+data.Scenario_11_LostGDP > 0 ? '+' : ''}${numberWithCommas(+data.Scenario_11_LostGDP)}%`)
        tooltip.select('#tooltip-2 .stranded-tooltip-subheader').html('In net zero scenario with Opec quota')

        break;

        case 7:

        tooltip.select('#tooltip-1').style('display', 'none')
        tooltip.select('#tooltip-2').style('display', 'block')
        tooltip.select('#tooltip-3').style('display', 'block')
        tooltip.select('#tooltip-2 .stranded-tooltip-figure').html('$' + numberWithCommas(+data.Scenario_11_SA) + 'bn')
        tooltip.select('#tooltip-2 .stranded-tooltip-note').html('$' + numberWithCommas(+data.Scenario_11_AssetShareLost) + "% of World's total")
        tooltip.select('#tooltip-3 .stranded-tooltip-figure').html(`${+data.Scenario_11_LostGDP > 0 ? '+' : ''}${numberWithCommas(+data.Scenario_11_LostGDP)}%`)
        tooltip.select('#tooltip-2 .stranded-tooltip-subheader').html('In net zero scenario with Opec quota')

        break;

        case 8:

        tooltip.select('#tooltip-1').style('display', 'none')
        tooltip.select('#tooltip-2').style('display', 'block')
        tooltip.select('#tooltip-3').style('display', 'block')
        tooltip.select('#tooltip-2 .stranded-tooltip-figure').html('$' + numberWithCommas(+data.Scenario_11_SA) + 'bn')
        tooltip.select('#tooltip-2 .stranded-tooltip-note').html('$' + numberWithCommas(+data.Scenario_11_AssetShareLost) + "% of World's total")
        tooltip.select('#tooltip-3 .stranded-tooltip-figure').html(`${+data.Scenario_11_LostGDP > 0 ? '+' : ''}${numberWithCommas(+data.Scenario_11_LostGDP)}%`)
        tooltip.select('#tooltip-2 .stranded-tooltip-subheader').html('In net zero scenario with Opec quota')

        break;
    }
}


const manageMove = (event) => {

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

const makeAnnotation = (country_name, text, align = 'left', textWidth = 130, offsetX = 20, offsetY = 15) => {

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


