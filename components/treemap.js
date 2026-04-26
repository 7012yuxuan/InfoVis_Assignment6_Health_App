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
            .paddingInner(2)
            .paddingOuter(2);

        // Process data: convert to hierarchy and calculate layout
        const root = hierarchy(tree)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        treemapLayout(root);

        // 颜色分组：只按第一层children分色
        const firstLevel = root.children || [];
        const colorDomain = firstLevel.map(d => d.data.name);
        const colorScale = scaleOrdinal().domain(colorDomain).range(schemeDark2);

        // 清空内容
        const g = d3Selection.current;
        g.innerHTML = "";

        // SVG结构
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", `0 0 ${svg_width} ${svg_height}`);
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.style.width = "100%";
        svg.style.height = "100%";

        const mainGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        mainGroup.setAttribute("transform", `translate(${margin.left}, ${margin.top})`);

        // 画第一层分组大rect和大label
        firstLevel.forEach((group, idx) => {
            // group: d3.hierarchy node
            const { x0, y0, x1, y1 } = group;
            // 大rect边框
            const groupRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            groupRect.setAttribute("x", x0);
            groupRect.setAttribute("y", y0);
            groupRect.setAttribute("width", x1 - x0);
            groupRect.setAttribute("height", y1 - y0);
            groupRect.setAttribute("fill", colorScale(group.data.name));
            groupRect.setAttribute("stroke", "black");
            groupRect.setAttribute("stroke-width", 2);
            mainGroup.appendChild(groupRect);

            // 大label（如 gender: Female）
            const bigLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            bigLabel.setAttribute("x", x0 + (x1 - x0) / 2);
            bigLabel.setAttribute("y", y0 + (y1 - y0) / 2);
            bigLabel.setAttribute("fill", "#222");
            bigLabel.setAttribute("font-size", Math.max(24, (y1 - y0) / 5));
            bigLabel.setAttribute("font-family", "Arial, sans-serif");
            bigLabel.setAttribute("font-weight", "bold");
            bigLabel.setAttribute("text-anchor", "middle");
            bigLabel.setAttribute("dominant-baseline", "middle");
            bigLabel.setAttribute("opacity", 0.25);
            bigLabel.textContent = `${group.data.attr || ''}: ${group.data.name}`;
            mainGroup.appendChild(bigLabel);
        });

        // 画所有叶子节点（小rect和小label）
        root.leaves().forEach((leaf, i) => {
            const { x0, y0, x1, y1 } = leaf;
            // 找到所属第一层分组
            let group = leaf;
            while (group.depth > 1) group = group.parent;
            const groupColor = colorScale(group.data.name);

            // 小rect
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", x0);
            rect.setAttribute("y", y0);
            rect.setAttribute("width", x1 - x0);
            rect.setAttribute("height", y1 - y0);
            rect.setAttribute("fill", groupColor);
            rect.setAttribute("stroke", "white");
            rect.setAttribute("stroke-width", 2);
            rect.style.cursor = "pointer";
            rect.addEventListener("click", () => setSelectedCell(leaf.data));
            if (selectedCell && selectedCell.name === leaf.data.name) {
                rect.setAttribute("stroke", "black");
                rect.setAttribute("stroke-width", 3);
            }
            mainGroup.appendChild(rect);

            // 小label（属性:值 和 百分比）
            const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            // 属性和值
            if (leaf.data.attr && leaf.data.name) {
                const t1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
                t1.setAttribute("x", x0 + 4);
                t1.setAttribute("y", y0 + 16);
                t1.setAttribute("fill", "white");
                t1.setAttribute("font-size", "13");
                t1.setAttribute("font-family", "Arial, sans-serif");
                t1.setAttribute("pointer-events", "none");
                t1.textContent = `${leaf.data.attr}: ${leaf.data.name}`;
                textGroup.appendChild(t1);
            }
            // 百分比
            if (leaf.data.value && leaf.parent && leaf.parent.value) {
                const percent = ((leaf.data.value / leaf.parent.value) * 100).toFixed(1) + "%";
                const t2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
                t2.setAttribute("x", x0 + 4);
                t2.setAttribute("y", y0 + 32);
                t2.setAttribute("fill", "white");
                t2.setAttribute("font-size", "12");
                t2.setAttribute("font-family", "Arial, sans-serif");
                t2.setAttribute("pointer-events", "none");
                t2.textContent = `Value: ${percent}`;
                textGroup.appendChild(t2);
            }
            mainGroup.appendChild(textGroup);
        });

        svg.appendChild(mainGroup);
        d3Selection.current.appendChild(svg);
    }, [tree, margin, svg_width, svg_height, selectedCell, setSelectedCell]);

    return <div ref={d3Selection} style={{ width: "100%", height: "100%" }} />;
}

  