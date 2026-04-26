import { treemap, hierarchy, scaleOrdinal, schemeDark2, format } from "d3";

// Text component: shows "attr: name" for each ancestor level, plus "Value: N"
function Text({ node }) {
    const x = node.x0;
    const y = node.y0;
    const width = node.x1 - node.x0;
    const height = node.y1 - node.y0;

    // Don't render text if the rectangle is too small
    if (width < 30 || height < 20) return null;

    // Walk up the tree to collect ancestor info (depth > 0)
    const ancestors = [];
    let current = node;
    while (current.depth > 0) {
        ancestors.unshift(current);
        current = current.parent;
    }

    // Build lines: "attr: name" for each level, then "Value: N"
    const lines = ancestors.map(n => `${n.data.attr}: ${n.data.name}`);
    lines.push(`Value: ${node.value}`);

    const fontSize = 11;
    const lineHeight = 14;
    const padding = 4;

    return (
        <text fontSize={fontSize} fill="white" style={{ pointerEvents: "none" }}>
            {lines.map((line, i) => (
                <tspan
                    key={i}
                    x={x + padding}
                    y={y + padding + (i + 1) * lineHeight}
                >
                    {line}
                </tspan>
            ))}
        </text>
    );
}

export function TreeMap(props) {
    const { margin, svg_width, svg_height, tree, selectedCell, setSelectedCell } = props;

    // Step 1: define innerWidth and innerHeight using the margin
    const innerWidth = svg_width - margin.left - margin.right;
    const innerHeight = svg_height - margin.top - margin.bottom;

    // Step 2: define a treemap using d3.treemap()
    const treemapLayout = treemap()
        .size([innerWidth, innerHeight])
        .paddingInner(2)
        .paddingOuter(2);

    // Step 3: define the color map using schemeDark2
    let colorDomain = [];
    if (tree && tree.children) {
        colorDomain = tree.children.map(d => d.name);
    }
    const colorScale = scaleOrdinal()
        .domain(colorDomain)
        .range(schemeDark2);

    // Step 4: build hierarchy and apply treemap layout
    let rects = [];
    if (tree) {
        const root = hierarchy(tree).sum(d => d.value);
        treemapLayout(root);
        rects = root.leaves();
    }

    return (
        <svg
            width={svg_width}
            height={svg_height}
            style={{ display: "block" }}
        >
            <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Step 4: Rectangles */}
                {rects.map((d, i) => {
                    let group = d;
                    while (group.depth > 1) group = group.parent;
                    const fill = colorScale(group.data.name);
                    const isSelected =
                        selectedCell &&
                        selectedCell.x0 === d.x0 &&
                        selectedCell.y0 === d.y0;
                    return (
                        <rect
                            key={i}
                            x={d.x0}
                            y={d.y0}
                            width={d.x1 - d.x0}
                            height={d.y1 - d.y0}
                            fill={fill}
                            stroke={isSelected ? "yellow" : "white"}
                            strokeWidth={isSelected ? 3 : 2}
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedCell(isSelected ? null : d)}
                        />
                    );
                })}

                {/* Step 5: Text labels */}
                {rects.map((d, i) => (
                    <Text key={i} node={d} />
                ))}
            </g>
        </svg>
    );
}