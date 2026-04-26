import { useEffect, useRef } from "react";
import { treemap, hierarchy, scaleOrdinal, schemeDark2 } from "d3";

export function TreeMap(props) {
    const { margin, svg_width, svg_height, tree, selectedCell, setSelectedCell } = props;
    const d3Selection = useRef(null);
    const hoverCellRef = useRef(null); // 用于追踪hover的cell

    useEffect(() => {
        if (!tree) return;

        // 计算inner尺寸
        const innerWidth = svg_width - margin.left - margin.right;
        const innerHeight = svg_height - margin.top - margin.bottom;

        // 判断attributes是否全为none（即只有root->一个child）
        const onlyOne = tree.children && tree.children.length === 1 && (!tree.children[0].children || tree.children[0].children.length === 0);

        // treemap布局
        const treemapLayout = treemap()
            .size([innerWidth, innerHeight])
            .paddingInner(2)
            .paddingOuter(2);

        const root = hierarchy(tree)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        treemapLayout(root);

        // 颜色分组
        let colorScale;
        if (onlyOne) {
            colorScale = () => schemeDark2[0];
        } else {
            const firstLevel = root.children || [];
            const colorDomain = firstLevel.map(d => d.data.name);
            colorScale = scaleOrdinal().domain(colorDomain).range(schemeDark2);
        }

        // 清空内容
        const g = d3Selection.current;
        g.innerHTML = "";

        // SVG结构（左对齐：不加margin.left）
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", `0 0 ${svg_width} ${svg_height}`);
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.style.width = "100%";
        svg.style.height = "100%";

        const mainGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        mainGroup.setAttribute("transform", `translate(0, ${margin.top})`);

        // 只显示一个大格的情况
        if (onlyOne) {
            const node = root.leaves()[0];
            const { x0, y0, x1, y1 } = node;
            // 大rect
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", x0);
            rect.setAttribute("y", y0);
            rect.setAttribute("width", x1 - x0);
            rect.setAttribute("height", y1 - y0);
            rect.setAttribute("fill", colorScale());
            rect.setAttribute("stroke", "black");
            rect.setAttribute("stroke-width", 2);
            // hover高亮
            rect.addEventListener("mouseenter", () => {
                rect.setAttribute("fill", "#e74c3c");
            });
            rect.addEventListener("mouseleave", () => {
                rect.setAttribute("fill", colorScale());
            });
            mainGroup.appendChild(rect);

            // label
            const bigLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            bigLabel.setAttribute("x", x0 + (x1 - x0) / 2);
            bigLabel.setAttribute("y", y0 + (y1 - y0) / 2 - 10);
            bigLabel.setAttribute("fill", "#222");
            bigLabel.setAttribute("font-size", Math.max(24, (y1 - y0) / 5));
            bigLabel.setAttribute("font-family", "Arial, sans-serif");
            bigLabel.setAttribute("font-weight", "bold");
            bigLabel.setAttribute("text-anchor", "middle");
            bigLabel.setAttribute("dominant-baseline", "middle");
            bigLabel.setAttribute("opacity", 0.25);
            bigLabel.textContent = `${node.data.attr || ''}: ${node.data.name}`;
            mainGroup.appendChild(bigLabel);

            // 百分比100%
            const percentText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            percentText.setAttribute("x", x0 + (x1 - x0) / 2);
            percentText.setAttribute("y", y0 + (y1 - y0) / 2 + 18);
            percentText.setAttribute("fill", "white");
            percentText.setAttribute("font-size", "18");
            percentText.setAttribute("font-family", "Arial, sans-serif");
            percentText.setAttribute("text-anchor", "middle");
            percentText.setAttribute("dominant-baseline", "middle");
            percentText.textContent = `Value: 100%`;
            mainGroup.appendChild(percentText);
        } else {
            // 画第一层分组大rect和大label
            const firstLevel = root.children || [];
            firstLevel.forEach((group, idx) => {
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

                // 大label
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
                // hover高亮
                rect.addEventListener("mouseenter", () => {
                    rect.setAttribute("fill", "#e74c3c");
                });
                rect.addEventListener("mouseleave", () => {
                    rect.setAttribute("fill", groupColor);
                });
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
        }

        svg.appendChild(mainGroup);
        d3Selection.current.appendChild(svg);
    }, [tree, margin, svg_width, svg_height, selectedCell, setSelectedCell]);

    // 左对齐：去掉margin.left
    return <div ref={d3Selection} style={{ width: "100%", height: "100%", paddingLeft: 0, marginLeft: 0 }} />;
}

  