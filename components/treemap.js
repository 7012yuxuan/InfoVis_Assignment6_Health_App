import { useMemo, useId } from "react";
import * as d3 from "d3";

function cellKey(d) {
    return d
        .ancestors()
        .filter((n) => n.depth > 0)
        .map((n) => n.data.name)
        .join(" / ");
}

function pathLabelLines(d, fmt) {
    const chain = d
        .ancestors()
        .filter((n) => n.depth > 0)
        .reverse();
    const lines = chain.map((n) => {
        const { attr, name } = n.data;
        return attr != null ? `${attr}: ${name}` : String(name);
    });
    lines.push(`Value: ${fmt(d.value)}`);
    return lines;
}

function Text({ lines, cellWidth, cellHeight, narrow }) {
    const fontSize = Math.max(
        7,
        Math.min(11, Math.min(cellWidth, cellHeight) / 14)
    );
    const lineHeight = fontSize * 1.2;

    const textProps = {
        fill: "#fff",
        fontSize,
        paintOrder: "stroke",
        stroke: "rgba(0,0,0,0.45)",
        strokeWidth: fontSize * 0.08,
        style: { fontFamily: "system-ui, sans-serif" },
    };

    if (narrow) {
        return (
            <text
                textAnchor="start"
                transform={`translate(${cellWidth - 8}, ${8}) rotate(90)`}
                {...textProps}
            >
                {lines.map((line, i) => (
                    <tspan key={i} x={0} dy={i === 0 ? 0 : lineHeight}>
                        {line}
                    </tspan>
                ))}
            </text>
        );
    }

    return (
        <text x={6} y={fontSize + 4} textAnchor="start" {...textProps}>
            {lines.map((line, i) => (
                <tspan key={i} x={6} dy={i === 0 ? 0 : lineHeight}>
                    {line}
                </tspan>
            ))}
        </text>
    );
}

export function TreeMap(props) {
    const { margin, svg_width, svg_height, tree, selectedCell, setSelectedCell } =
        props;

    const clipIdPrefix = useId().replace(/:/g, "");

    // Step 1: define innerWidth and innerHeight using the margin
    const innerWidth = svg_width - margin.left - margin.right;
    const innerHeight = svg_height - margin.top - margin.bottom;

    const fmt = useMemo(() => d3.format(","), []);

    const { leaves, emptyMessage } = useMemo(() => {
        if (!tree?.children?.length) {
            return {
                leaves: [],
                emptyMessage: "Select at least one attribute to show the treemap.",
            };
        }

        const root = d3
            .hierarchy(JSON.parse(JSON.stringify(tree)))
            .sum((d) =>
                !d.children || d.children.length === 0 ? d.value || 0 : 0
            )
            .sort((a, b) => b.value - a.value);

        
        // Step 2: define a treemap using d3.treemap()
        d3.treemap()
            .tile(d3.treemapSquarify)
            .size([innerWidth, innerHeight])
            .paddingOuter(4)
            .paddingInner(2)
            .round(true)(root);

        return { leaves: root.leaves(), emptyMessage: null };
    }, [tree, innerWidth, innerHeight]);

    // Step 3: define the color map using schemeDark2
    const color = useMemo(() => d3.scaleOrdinal(d3.schemeDark2), []);

    // Step 4: build hierarchy and apply treemap layout
    return (
        <div
            style={{
                width: "100%",
                maxWidth: "100%",
                height: svg_height,
            }}
        >
            <svg
                viewBox={`0 0 ${svg_width} ${svg_height}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ width: "100%", height: "100%" }}
            >
                <g transform={`translate(${margin.left},${margin.top})`}>
                    {emptyMessage ? (
                        <text
                            x={innerWidth / 2}
                            y={innerHeight / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{ fontSize: 14, fill: "#666" }}
                        >
                            {emptyMessage}
                        </text>
                    ) : (
                        leaves.map((d, i) => {
                            const w = Math.max(0, d.x1 - d.x0);
                            const h = Math.max(0, d.y1 - d.y0);
                            const clipId = `${clipIdPrefix}-c${i}`;
                            const key = cellKey(d);
                            const fill = color(
                                d.parent ? d.parent.data.name : d.data.name
                            );
                            const selected = selectedCell === key;
                            const lines = pathLabelLines(d, fmt);
                            const narrow = w < 46 && h > w * 1.5;
                            const big = w * h > 9000;
                            const firstLine = lines[0] ?? "";

                            return (
                                <g
                                    key={`${key}-${i}`}
                                    transform={`translate(${d.x0},${d.y0})`}
                                >
                                    <defs>
                                        <clipPath id={clipId}>
                                            <rect width={w} height={h} />
                                        </clipPath>
                                    </defs>
                                    <rect
                                        width={w}
                                        height={h}
                                        fill={fill}
                                        stroke={selected ? "#f6e05e" : "#fff"}
                                        strokeWidth={selected ? 3 : 1}
                                        style={{ cursor: "pointer" }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCell((cur) =>
                                                cur === key ? null : key
                                            );
                                        }}
                                    />
                                    {big && (
                                        <text
                                            x={w / 2}
                                            y={h * 0.55}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fill="rgba(255,255,255,0.22)"
                                            fontSize={Math.min(w, h) * 0.14}
                                            style={{
                                                pointerEvents: "none",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {firstLine}
                                        </text>
                                    )}
                                    {w >= 20 && h >= 12 ? (
                                        <g
                                            pointerEvents="none"
                                            style={{
                                                clipPath: `url(#${clipId})`,
                                            }}
                                        >
                                            <Text
                                                lines={lines}
                                                cellWidth={w}
                                                cellHeight={h}
                                                narrow={narrow}
                                            />
                                        </g>
                                    ) : null}
                                </g>
                            );
                        })
                    )}
                </g>
            </svg>
        </div>
    );
}
