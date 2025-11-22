import React from "react";



type Point = { x: string | number; y: number };



export default function SparklineChart({ points }: { points?: Point[] }) {

  const pts = points ?? [];

  if (pts.length === 0) {

    return <div className="h-12 flex items-center justify-center text-sm text-gray-400">No data</div>;

  }



  const values = pts.map((p) => p.y);

  const max = Math.max(...values, 1);

  const min = Math.min(...values, 0);

  const width = 100;

  const height = 30;

  const stepX = width / Math.max(1, pts.length - 1);

  const yFor = (v: number) => height - ((v - min) / (max - min || 1)) * height;



  const polyPoints = pts.map((p, i) => `${i * stepX},${yFor(p.y)}`).join(" ");

  const areaPoints = `${polyPoints} ${width},${height} 0,${height}`;



  return (

    <svg className="w-full h-12" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>

      <polyline fill="rgba(99,102,241,0.12)" stroke="none" points={areaPoints} />

      <polyline

        fill="none"

        stroke="#4f46e5"

        strokeWidth={1.5}

        strokeLinecap="round"

        strokeLinejoin="round"

        points={polyPoints}

      />

    </svg>

  );

}
