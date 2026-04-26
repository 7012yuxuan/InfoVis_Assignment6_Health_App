// import React from "react";

import { treemap, hierarchy, scaleOrdinal, schemeDark2, format } from "d3";


export function TreeMap(props) {
    const { margin, svg_width, svg_height, tree, selectedCell, setSelectedCell } = props;

    // Step 1: define innerWidth and innerHeight using the margin
    const innerWidth = svg_width - margin.left - margin.right;
    const innerHeight = svg_height - margin.top - margin.bottom;

    // 让treemap左上对齐（无padding/margin，宽高100%）
    return (
        <div style={{ width: "100%", height: "100%", padding: 0, margin: 0, boxSizing: "border-box" }}>
            {/* 这里后续会放svg或canvas等内容 */}
        </div>
    );
}

