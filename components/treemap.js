import { useMemo, useId, useState } from "react";
import * as d3 from "d3";

function getCellKey(d) {
  return d
    .ancestors()
    .filter((n) => n.depth > 0)
    .map((n) => `${n.data.attr ?? "stroke"}:${n.data.name}`)
    .join(" / ");
}

function getTopGroup(d) {
  let cur = d;
  while (cur.depth > 1) cur = cur.parent;
  return cur.data.name;
}

function getLabelLines(d, totalValue) {
  const chain = d
    .ancestors()
    .filter((n) => n.depth > 0)
    .reverse();

  const lines = chain.map((n) =>
    n.data.attr ? `${n.data.attr}:${n.data.name}` : `${n.data.name}`
  );

  const pct = totalValue > 0 ? (d.value / totalValue) * 100 : 0;
  lines.push(`Value: ${pct.toFixed(1)}%`);

  return lines;
}

function Text({ lines, width, height }) {
  if (width < 35 || height < 22) return null;

  const fontSize = Math.max(9, Math.min(13, Math.min(width, height) / 10));
  const lineHeight = fontSize * 1.25;

  return (
    <text
      x={5}
      y={fontSize + 5}
      fontSize={fontSize}
      fill="black"
      style={{
        pointerEvents: "none",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 500,
      }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={5} dy={i === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function TreeMap(props) {
  const {
    margin,
    svg_width,
    svg_height,
    tree,
    selectedCell,
    setSelectedCell,
  } = props;

  const [hoveredCell, setHoveredCell] = useState(null);
  const clipIdPrefix = useId().replace(/:/g, "");

  const innerWidth = svg_width - margin.left - margin.right;
  const innerHeight = svg_height - margin.top - margin.bottom - 40;

  const colorScale = useMemo(() => {
    const domain = tree?.children?.map((d) => d.name) || ["root"];
    return d3.scaleOrdinal().domain(domain).range(d3.schemeDark2);
  }, [tree]);

  const legendItems = useMemo(() => {
    if (!tree) return [];

    if (!tree.children || tree.children.length <= 1) {
      const onlyChild = tree.children?.[0];

      return [
        {
          label: "undefined: root",
          color: onlyChild ? colorScale(onlyChild.name) : colorScale("root"),
        },
      ];
    }

    return tree.children.map((d) => ({
      label: d.attr ? `${d.attr}: ${d.name}` : `${d.name}`,
      color: colorScale(d.name),
    }));
  }, [tree, colorScale]);

  const { leaves, totalValue, emptyMessage } = useMemo(() => {
    if (!tree) {
      return {
        leaves: [],
        totalValue: 0,
        emptyMessage: "Select attributes to show the treemap.",
      };
    }

    const root = d3
      .hierarchy(JSON.parse(JSON.stringify(tree)))
      .sum((d) => (!d.children ? Number(d.value) || 0 : 0))
      .sort((a, b) => b.value - a.value);

    const attributeDepth = Math.max(1, root.height);
    const gap = Math.min(10, 2 + attributeDepth * 2);

    d3
      .treemap()
      .size([innerWidth, innerHeight])
      .tile(d3.treemapSquarify)
      .paddingOuter(gap)
      .paddingInner(gap)
      .round(true)(root);

    return {
      leaves: root.leaves(),
      totalValue: root.value || 0,
      emptyMessage: null,
    };
  }, [tree, innerWidth, innerHeight]);

  return (
    <svg
      width={svg_width}
      height={svg_height}
      viewBox={`0 0 ${svg_width} ${svg_height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "auto" }}
      onClick={() => setSelectedCell?.(null)}
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
        {legendItems.length > 0 && (
          <g transform="translate(0, 0)">
            {legendItems.map((item, i) => (
              <g key={item.label} transform={`translate(${i * 200}, 0)`}>
                <rect width={24} height={24} fill={item.color} />
                <text
                  x={34}
                  y={18}
                  fontSize={18}
                  fill="black"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {item.label}
                </text>
              </g>
            ))}
          </g>
        )}

        <g transform="translate(0, 40)">
          {emptyMessage ? (
            <text
              x={innerWidth / 2}
              y={innerHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#666"
              fontSize={14}
            >
              {emptyMessage}
            </text>
          ) : (
            leaves.map((d, i) => {
              const width = Math.max(0, d.x1 - d.x0);
              const height = Math.max(0, d.y1 - d.y0);

              const key = getCellKey(d);
              const topGroup = getTopGroup(d);

              const originalFill = colorScale(topGroup);
              const fill = hoveredCell === key ? "red" : originalFill;

              const clipId = `${clipIdPrefix}-clip-${i}`;
              const lines = getLabelLines(d, totalValue);

              const bigCell = width * height > 12000;
              const narrowCell = height > width * 1.2;
              const bigLabel = lines[0];

              return (
                <g
                  key={`${key}-${i}`}
                  transform={`translate(${d.x0},${d.y0})`}
                  onMouseEnter={() => setHoveredCell(key)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCell?.(key);
                  }}
                >
                  <defs>
                    <clipPath id={clipId}>
                      <rect width={width} height={height} />
                    </clipPath>
                  </defs>

                  <rect
                    width={width}
                    height={height}
                    fill={fill}
                    stroke="black"
                    strokeWidth={1}
                    style={{ cursor: "pointer" }}
                  />

                  {bigCell && (
                    <text
                      x={width / 2}
                      y={height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(0,0,0,0.4)"
                      fontSize={Math.min(width, height) * 0.13}
                      fontWeight={700}
                      transform={
                        narrowCell
                          ? `rotate(90 ${width / 2} ${height / 2})`
                          : undefined
                      }
                      style={{ pointerEvents: "none" }}
                    >
                      {bigLabel}
                    </text>
                  )}

                  <g clipPath={`url(#${clipId})`}>
                    <Text lines={lines} width={width} height={height} />
                  </g>
                </g>
              );
            })
          )}
        </g>
      </g>
    </svg>
  );
}