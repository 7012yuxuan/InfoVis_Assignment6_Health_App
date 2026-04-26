import { treemap, hierarchy, scaleOrdinal, schemeDark2 } from "d3";
 
function Text({ node }) {
    const x = node.x0;
    const y = node.y0;
    const width = node.x1 - node.x0;
    const height = node.y1 - node.y0;
 
    // Build lines of text from the node's ancestors + value
    const lines = [];
    let current = node;
    const parts = [];
    while (current.depth > 0) {
        parts.unshift(current.data.name);
        current = current.parent;
    }
    parts.forEach(part => lines.push(part));
    lines.push(`Value: ${node.value}`);
 
    const fontSize = 11;
    const lineHeight = 14;
    const totalTextHeight = lines.length * lineHeight;
 
    if (width < 20 || height < 20) return null;
 
    return (
        <text
            x={x + 4}
            y={y + 4}
            fontSize={fontSize}
            fill="white"
            dominantBaseline="hanging"
            style={{ pointerEvents: "none" }}
        >
            {lines.map((line, i) => (
                <tspan key={i} x={x + 4} dy={i === 0 ? 0 : lineHeight}>
                    {line}
                </tspan>
            ))}
        </text>
    );
}
 
export function TreeMap(props) {
    const { margin, svg_width, svg_height, tree, selectedCell, setSelectedCell } = props;
 
    const innerWidth = svg_width - margin.left - margin.right;
    const innerHeight = svg_height - margin.top - margin.bottom;
 
    // Build treemap layout
    const treemapLayout = treemap()
        .size([innerWidth, innerHeight])
        .padding(2)
        .paddingTop(0);
 
    const root = hierarchy(tree)
        .sum(d => d.value || 0)
        .sort((a, b) => b.value - a.value);
 
    treemapLayout(root);
 
    // Color by first-level children (depth=1 ancestors)
    const firstLevelNames = root.children ? root.children.map(d => d.data.name) : [];
    const color = scaleOrdinal()
        .domain(firstLevelNames)
        .range(schemeDark2);
 
    // Get color for a leaf based on its depth-1 ancestor
    function getColor(node) {
        let current = node;
        while (current.depth > 1) current = current.parent;
        return color(current.data.name);
    }
 
    const leaves = root.leaves();
 
    // Also get depth-1 nodes for large labels
    const depth1Nodes = root.children || [];
 
    return (
        <svg
            viewBox={`0 0 ${svg_width} ${svg_height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%" }}
        >
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                {/* Render leaf rectangles */}
                {leaves.map((node, i) => {
                    const isSelected =
                        selectedCell &&
                        selectedCell.x0 === node.x0 &&
                        selectedCell.y0 === node.y0;
                    return (
                        <rect
                            key={i}
                            x={node.x0}
                            y={node.y0}
                            width={node.x1 - node.x0}
                            height={node.y1 - node.y0}
                            fill={getColor(node)}
                            stroke={isSelected ? "yellow" : "white"}
                            strokeWidth={isSelected ? 3 : 1}
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedCell(isSelected ? null : node)}
                        />
                    );
                })}
 
                {/* Render text labels on leaves */}
                {leaves.map((node, i) => (
                    <Text key={i} node={node} />
                ))}
 
                {/* Render large parent labels at depth=1 */}
                {depth1Nodes.map((node, i) => {
                    const w = node.x1 - node.x0;
                    const h = node.y1 - node.y0;
                    return (
                        <text
                            key={i}
                            x={node.x0 + w / 2}
                            y={node.y0 + h / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={Math.min(w / 8, 28)}
                            fill="rgba(255,255,255,0.3)"
                            fontWeight="bold"
                            style={{ pointerEvents: "none" }}
                        >
                            {node.data.name}
                        </text>
                    );
                })}
 
                {/* Border around whole treemap */}
                <rect
                    x={0}
                    y={0}
                    width={innerWidth}
                    height={innerHeight}
                    fill="none"
                    stroke="#333"
                    strokeWidth={1}
                />
            </g>
        </svg>
    );
}
 