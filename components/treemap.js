import { useMemo, useId } from "react";
import * as d3 from "d3";

function getCellKey(d) {
  return d
    .ancestors()
    .filter((n) => n.depth > 0)
    .map((n) => `${n.data.attr}:${n.data.name}`)
    .join(" / ");
}

function getTopGroup(d) {
  let cur = d;
  while (cur.depth > 1) cur = cur.parent;
  return cur.data.name;
}

function getLabelLines(d) {
  const chain = d
    .ancestors()
    .filter((n) => n.depth > 0)
    .reverse();

  const lines = chain.map((n) => `${n.data.attr}:${n.data.name}`);

  const valueText =
    typeof d.value === "number" ? `${d.value.toFixed(1)}%` : d.value;

  lines.push(`Value: ${valueText}`);
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
      fill="white"
      style={{
        pointerEvents: "none",
        fontFamily: "system-ui, sans-serif",
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

  const clipIdPrefix = useId().replace(/:/g, "");

  const innerWidth = svg_width - margin.left - margin.right;
  const innerHeight = svg_height - margin.top - margin.bottom;

  const { leaves, emptyMessage } = useMemo(() => {
    if (!tree || !tree.children || tree.children.length === 0) {
      return {
        leaves: [],
        emptyMessage: "Select attributes to show the treemap.",
      };
    }

    const root = d3
      .hierarchy(JSON.parse(JSON.stringify(tree)))
      .sum((d) => {
        if (!d.children || d.children.length === 0) {
          return Number(d.value) || 0;
        }
        return 0;
      })
      .sort((a, b) => b.value - a.value);

    d3
      .treemap()
      .size([innerWidth, innerHeight])
      .tile(d3.treemapSquarify)
      .paddingOuter(3)
      .paddingInner(3)
      .round(true)(root);

    return {
      leaves: root.leaves(),
      emptyMessage: null,
    };
  }, [tree, innerWidth, innerHeight]);

  const colorScale = useMemo(() => {
    const domain = tree?.children?.map((d) => d.name) || [];
    return d3.scaleOrdinal().domain(domain).range(d3.schemeDark2);
  }, [tree]);

  return (
    <svg
      width={svg_width}
      height={svg_height}
      viewBox={`0 0 ${svg_width} ${svg_height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "auto" }}
      onClick={() => setSelectedCell(null)}
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
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
            const x = d.x0;
            const y = d.y0;
            const width = Math.max(0, d.x1 - d.x0);
            const height = Math.max(0, d.y1 - d.y0);

            const key = getCellKey(d);
            const selected = selectedCell === key;

            const topGroup = getTopGroup(d);
            const fill = colorScale(topGroup);

            const clipId = `${clipIdPrefix}-clip-${i}`;
            const lines = getLabelLines(d);

            const bigCell = width * height > 12000;
            const bigLabel = lines[0];

            return (
              <g
                key={`${key}-${i}`}
                transform={`translate(${x},${y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCell(selected ? null : key);
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
                  stroke={selected ? "yellow" : "white"}
                  strokeWidth={selected ? 3 : 2}
                  style={{ cursor: "pointer" }}
                />

                {bigCell && (
                  <text
                    x={width / 2}
                    y={height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(0,0,0,0.28)"
                    fontSize={Math.min(width, height) * 0.13}
                    fontWeight={700}
                    transform={`rotate(90 ${width / 2} ${height / 2})`}
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
    </svg>
  );
}