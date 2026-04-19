import {useEffect, useRef} from 'react'; 
import * as d3 from 'd3';
import { getNodes } from '../utils/getNodes';
import { getLinks } from '../utils/getLinks';   
import {drag} from '../utils/drag';


export function Graph(props) {
        const { margin, svg_width, svg_height, data } = props;

        const nodes = getNodes({rawData: data});
        const links = getLinks({rawData: data});
    
        const width = svg_width - margin.left - margin.right;
        const height = svg_height - margin.top - margin.bottom;

        const lineWidth = d3.scaleLinear().range([2, 6]).domain([d3.min(links, d => d.value), d3.max(links, d => d.value)]);
        const radius = d3.scaleLinear().range([10, 50])
                .domain([d3.min(nodes, d => d.value), d3.max(nodes, d => d.value)]);
        const color = d3.scaleOrdinal().range(d3.schemeCategory10).domain(nodes.map( d => d.name));
        
        const d3Selection = useRef();
        useEffect( ()=>{
            let g = d3.select(d3Selection.current);
            g.selectAll("*").remove();

            const simulation =  d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.name).distance(d => 20/d.value))
                .force("charge", d3.forceManyBody())
                .force("centrer", d3.forceCenter(width/2, height/2))
                .force("y", d3.forceY([height/2]).strength(0.02))
                .force("collide", d3.forceCollide().radius(d => radius(d.value)+20))
                .tick(3000);

            const link = g.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke-width", d => lineWidth(d.value));

            const node = g.append("g")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .selectAll("circle")
                .data(nodes)
                .enter();

            const point = node.append("circle")
                .attr("r", d => radius(d.value))
                .attr("fill", d => color(d.name))
                .call(drag(simulation));

            const legendRowHeight = 22;
            const swatch = 12;
            const legend = g.append("g")
                .attr("class", "legend")
                .attr("transform", "translate(10, 10)");

            const legendRows = legend.selectAll("g")
                .data(nodes)
                .join("g")
                .attr("transform", (d, i) => `translate(0, ${i * legendRowHeight})`);

            legendRows.append("rect")
                .attr("width", swatch)
                .attr("height", swatch)
                .attr("fill", d => color(d.name));

            legendRows.append("text")
                .attr("x", swatch + 6)
                .attr("y", swatch / 2)
                .attr("dy", "0.35em")
                .style("fill", "black")
                .style("font-size", "12px")
                .text(d => d.name);

            const tooltip = g.append("g")
                .attr("class", "graph-node-tooltip")
                .style("visibility", "hidden")
                .style("pointer-events", "none");

            const tooltipRect = tooltip.append("rect")
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("fill", "rgba(255, 255, 255, 0.95)")
                .attr("stroke", "#888");

            const tooltipText = tooltip.append("text")
                .attr("dominant-baseline", "middle")
                .style("font-size", "12px")
                .style("fill", "#000");

            let tooltipNode = null;

            function layoutTooltip(d) {
                tooltip.style("visibility", "visible");
                tooltipText.text(d.name);
                const bbox = tooltipText.node().getBBox();
                const padX = 8;
                const padY = 5;
                tooltipRect
                    .attr("x", bbox.x - padX)
                    .attr("y", bbox.y - padY)
                    .attr("width", bbox.width + 2 * padX)
                    .attr("height", bbox.height + 2 * padY);
                const r = radius(d.value);
                tooltip.attr(
                    "transform",
                    `translate(${d.x + r + 8}, ${d.y})`
                );
            }

            function showNodeTooltip(event, d) {
                tooltipNode = d;
                layoutTooltip(d);
            }

            function hideNodeTooltip() {
                tooltipNode = null;
                tooltip.style("visibility", "hidden");
            }

            point
                .on("mouseover", showNodeTooltip)
                .on("mouseout", hideNodeTooltip);

            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                point
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);

                if (tooltipNode) {
                    layoutTooltip(tooltipNode);
                }
            });

        }, [width, height])


        return <svg 
            viewBox={`0 0 ${svg_width} ${svg_height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%" }}
            > 
                <g ref={d3Selection} transform={`translate(${margin.left}, ${margin.top})`}>
                </g>
            </svg>
    };