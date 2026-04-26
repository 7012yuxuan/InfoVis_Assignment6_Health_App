import { useEffect, useRef } from "react";
import { treemap, hierarchy, scaleOrdinal, schemeDark2 } from "d3";

export function TreeMap(props) {
    const { margin, svg_width, svg_height, tree, selectedCell, setSelectedCell } = props;
    const d3Selection = useRef(null);

    useEffect(() => {
        if (!tree) return;

        // Calculate inner dimensions
        const innerWidth = svg_width - margin.left - margin.right;
        const innerHeight = svg_height - margin.top - margin.bottom;

        // Create treemap layout
        const treemapLayout = treemap()
            .size([innerWidth, innerHeight])
            .paddingTop(0)
            .paddingRight(2)
            .paddingBottom(2)
            .paddingLeft(2);

        // Process data: convert to hierarchy and calculate layout
        const root = hierarchy(tree)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        treemapLayout(root);

        // Get leaf nodes for visualization
        const leaves = root.leaves();

        // Create color scale based on top-level attribute
        const topLevelNames = leaves
            .map(d => d.data.children ? d.parent.data.name : d.data.name)
            .filter((v, i, a) => a.indexOf(v) === i);

        const colorScale = scaleOrdinal()
            .domain(topLevelNames)
            .range(schemeDark2);

        // Clear previous content
        const g = d3Selection.current;
        g.innerHTML = "";

        // Create main group with transform
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", `0 0 ${svg_width} ${svg_height}`);
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.style.width = "100%";
        svg.style.height = "100%";

        const mainGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        mainGroup.setAttribute("transform", `translate(${margin.left}, ${margin.top})`);

        // Draw rectangles
        leaves.forEach((leaf, i) => {
            const g_rect = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g_rect.setAttribute("class", "cell");
            g_rect.setAttribute("transform", `translate(${leaf.x0}, ${leaf.y0})`);

            // Get the top-level parent for coloring
            let colorNode = leaf;
            while (colorNode.parent && colorNode.parent.parent) {
                colorNode = colorNode.parent;
            }

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("width", leaf.x1 - leaf.x0);
            rect.setAttribute("height", leaf.y1 - leaf.y0);
            rect.setAttribute("fill", colorScale(colorNode.data.name));
            rect.setAttribute("stroke", "white");
            rect.setAttribute("stroke-width", 2);

            // Add click handler for selection
            rect.style.cursor = "pointer";
            rect.addEventListener("click", () => {
                setSelectedCell(leaf.data);
            });

            // Highlight selected cell
            if (selectedCell && selectedCell.name === leaf.data.name) {
                rect.setAttribute("stroke", "black");
                rect.setAttribute("stroke-width", 3);
            }

            g_rect.appendChild(rect);

            // Add text labels
            const texts = [];

            // Add attribute name and value
            if (leaf.data.attr && leaf.data.name) {
                texts.push(`${leaf.data.attr}: ${leaf.data.name}`);
            }

            // Add patient count
            if (leaf.data.value) {
                texts.push(`Value: ${leaf.data.value}`);
            }

            // Create text elements
            texts.forEach((text, idx) => {
                const textElem = document.createElementNS("http://www.w3.org/2000/svg", "text");
                textElem.setAttribute("x", 5);
                textElem.setAttribute("y", 15 + idx * 14);
                textElem.setAttribute("fill", "white");
                textElem.setAttribute("font-size", "11");
                textElem.setAttribute("font-family", "Arial, sans-serif");
                textElem.setAttribute("pointer-events", "none");
                textElem.textContent = text;
                g_rect.appendChild(textElem);
            });

            mainGroup.appendChild(g_rect);
        });

        svg.appendChild(mainGroup);
        d3Selection.current.appendChild(svg);

    }, [tree, margin, svg_width, svg_height, selectedCell, setSelectedCell]);

    return <div ref={d3Selection} style={{ width: "100%", height: "100%" }} />;
}

  