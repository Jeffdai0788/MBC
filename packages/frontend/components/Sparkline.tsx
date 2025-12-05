import React from "react";

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    showArea?: boolean;
}

export default function Sparkline({
    data,
    width = 120,
    height = 40,
    color = "var(--color-success)",
    showArea = true
}: SparklineProps) {
    if (!data || data.length < 2) {
        return <div style={{ width, height, background: "var(--color-paper-warm)" }} />;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Normalize points to SVG coordinates
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height * 0.8 - height * 0.1;
        return `${x},${y}`;
    }).join(" ");

    // Create area path
    const areaPath = showArea ? `
        M 0,${height}
        L ${data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height * 0.8 - height * 0.1;
        return `${x},${y}`;
    }).join(" L ")}
        L ${width},${height}
        Z
    ` : "";

    // Determine color based on trend
    const trend = data[data.length - 1] - data[0];
    const strokeColor = trend >= 0 ? "var(--color-success)" : "var(--color-error)";
    const fillColor = trend >= 0 ? "rgba(90, 122, 90, 0.1)" : "rgba(158, 90, 90, 0.1)";

    return (
        <svg width={width} height={height} className="sparkline">
            {showArea && (
                <path
                    d={areaPath}
                    fill={fillColor}
                />
            )}
            <polyline
                points={points}
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* End dot */}
            <circle
                cx={(data.length - 1) / (data.length - 1) * width}
                cy={height - ((data[data.length - 1] - min) / range) * height * 0.8 - height * 0.1}
                r="2.5"
                fill={strokeColor}
            />
        </svg>
    );
}
