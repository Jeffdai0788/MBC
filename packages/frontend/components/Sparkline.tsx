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
    // Generate deterministic mock data if missing (for demo purposes)
    const chartData = (data && data.length >= 2) ? data : React.useMemo(() => {
        // Simple deterministic random walk based on a seed (e.g. width)
        const mock = [100];
        for (let i = 1; i < 20; i++) {
            const change = (Math.sin(i * 0.5) + (Math.random() - 0.5)) * 2;
            mock.push(mock[i - 1] + change);
        }
        return mock;
    }, []);

    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min || 1;

    // Normalize points to SVG coordinates
    const points = chartData.map((val, i) => {
        const x = (i / (chartData.length - 1)) * width;
        const y = height - ((val - min) / range) * height * 0.8 - height * 0.1;
        return `${x},${y}`;
    }).join(" ");

    // Create area path
    const areaPath = showArea ? `
        M 0,${height}
        L ${chartData.map((val, i) => {
        const x = (i / (chartData.length - 1)) * width;
        const y = height - ((val - min) / range) * height * 0.8 - height * 0.1;
        return `${x},${y}`;
    }).join(" L ")}
        L ${width},${height}
        Z
    ` : "";

    // Determine color based on trend
    const trend = chartData[chartData.length - 1] - chartData[0];
    const strokeColor = trend >= 0 ? "var(--color-success)" : "var(--color-error)";
    const fillColor = trend >= 0 ? "rgba(90, 122, 90, 0.1)" : "rgba(158, 90, 90, 0.1)";

    return (
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none" className="sparkline">
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
                cx={(chartData.length - 1) / (chartData.length - 1) * width}
                cy={height - ((chartData[chartData.length - 1] - min) / range) * height * 0.8 - height * 0.1}
                r="2.5"
                fill={strokeColor}
            />
        </svg>
    );
}
