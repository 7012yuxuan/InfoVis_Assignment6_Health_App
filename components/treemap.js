import { treemap, hierarchy, scaleOrdinal, schemeDark2 } from "d3";

function Text({ node }) {
    const x = node.x0;
    const y = node.y0;
    const width = node.x1 - node.x0;
    const height = node.y1 - node.y0;

    if (width < 30 || height < 20) return null;

    // Build lines: for each ancestor (depth>0), show "attr: name"
    const lines = [];
    let current = node;
    const ancestors = [];
    while (current.depth > 0) {
        ancestors.unshift(current);
        current = current.parent;
    }
    ancestors.forEach(n => {
        lines.push(`${n.data.attr}: ${n.data.name}`);
    });
    lines.push(`Value: ${node.value}`);

    const fontSize = 11;
    const lineHeight = 14;

    return (
        <text
            fontSize={fontSize}
            fill="white"
            style={{ pointerEvents: "none" }}
        >
            {lines.map((line, i) => (
                <tspan key={i} x={x + 4} y={y + 4 + (i + 1) * lineHeight}>
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

    // Build hierarchy - only leaf nodes (no children) contribute value
    const root = hierarchy(tree)
        .sum(d => (d.children ? 0 : d.value || 0))
        .sort((a, b) => b.value - a.value);

    // If nothing to show
    if (!root.children || root.value === 0) {
        return (
            <svg
                viewBox={`0 0 ${svg_width} ${svg_height}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ width: "100%", height: "100%" }}
            >
                <text x={svg_width / 2} y={svg_height / 2} textAnchor="middle" fill="#999">
                    Select at least one attribute
                </text>
            </svg>
        );
    }

    // Apply treemap layout
    const treemapLayout = treemap()
        .size([innerWidth, innerHeight])
        .padding(1)
        .paddingTop(0);

    treemapLayout(root);

    // Color by depth-1 ancestor
    const firstLevelNames = root.children.map(d => d.data.name);
    const color = scaleOrdinal()
        .domain(firstLevelNames)
        .range(schemeDark2);

    function getColor(node) {
        let current = node;
        while (current.depth > 1) current = current.parent;
        return color(current.data.name);
    }

    const leaves = root.leaves();
    const depth1Nodes = root.children || [];

    return (
        <svg
            viewBox={`0 0 ${svg_width} ${svg_height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%" }}
        >
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                {/* Leaf rectangles */}
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
                            width={Math.max(0, node.x1 - node.x0)}
                            height={Math.max(0, node.y1 - node.y0)}
                            fill={getColor(node)}
                            stroke={isSelected ? "yellow" : "white"}
                            strokeWidth={isSelected ? 3 : 1}
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedCell(isSelected ? null : node)}
                        />
                    );
                })}

                {/* Text labels on leaves */}
                {leaves.map((node, i) => (
                    <Text key={i} node={node} />
                ))}

                {/* Large semi-transparent parent labels */}
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
                            fontSize={Math.min(w / 6, h / 3, 32)}
                            fill="rgba(255,255,255,0.25)"
                            fontWeight="bold"
                            style={{ pointerEvents: "none" }}
                        >
                            {`${node.data.attr}: ${node.data.name}`}
                        </text>
                    );
                })}
            </g>
        </svg>
    );
}