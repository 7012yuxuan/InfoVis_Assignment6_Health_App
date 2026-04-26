// import React from "react";

import { treemap, hierarchy, scaleOrdinal, schemeDark2, format } from "d3";


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
    // 这里假设第一层children的name作为分组
    let colorDomain = [];
    if (tree && tree.children) {
        colorDomain = tree.children.map(d => d.name);
    }
    const colorScale = scaleOrdinal()
        .domain(colorDomain)
        .range(schemeDark2);

    // Step 4: plot the rectangles
    let rects = [];
    if (tree) {
        // 1. 构建hierarchy
        const root = hierarchy(tree).sum(d => d.value);
        // 2. 应用treemap布局
        treemapLayout(root);
        // 3. 获取所有叶子节点
        rects = root.leaves();
    }

    return (
        <svg
            width={svg_width}
            height={svg_height}
            style={{ display: "block" }}
        >
            <g transform={`translate(${margin.left},${margin.top})`}>
                {rects.map((d, i) => {
                    // 找到所属第一层分组
                    let group = d;
                    while (group.depth > 1) group = group.parent;
                    const fill = colorScale(group.data.name);
                    return (
                        <rect
                            key={i}
                            x={d.x0}
                            y={d.y0}
                            width={d.x1 - d.x0}
                            height={d.y1 - d.y0}
                            fill={fill}
                            stroke="white"
                            strokeWidth={2}
                        />
                    );
                })}
            </g>
        </svg>
    );
}

