import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";

// Định nghĩa kiểu dữ liệu cho chart
interface ChartData {
  time: number;
  [key: string]: number; // Chấp nhận nhiều kiểu dữ liệu như 'temp' hoặc 'soil'
}

interface ChartWithDayBoundariesProps {
  chartData: ChartData[];
  dataKey: string; // Tên dữ liệu (ví dụ: 'temp' hoặc 'soil')
  color: string; // Màu của đường vẽ
  label: string; // Nhãn hiển thị trong Tooltip & Legend
}

function getDayBoundaries(data: ChartData[]): number[] {
  const boundaries = new Set<number>();

  data.forEach(item => {
    const date = new Date(item.time);
    date.setHours(0, 0, 0, 0);
    boundaries.add(date.getTime());
  });

  return Array.from(boundaries).sort((a, b) => a - b);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

const formatTime = (time: number): string =>
  new Date(time).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const ChartWithDayBoundaries: React.FC<ChartWithDayBoundariesProps> = ({ chartData, dataKey, color, label }) => {
const dayBoundaries = getDayBoundaries(chartData);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          scale="time"
          tickFormatter={formatTime}
          interval="preserveStartEnd"
        />
        <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
        <Tooltip labelFormatter={formatTime} />
        <Legend />

        {dayBoundaries.map(dayTimestamp => (
          <ReferenceLine
            key={dayTimestamp}
            x={dayTimestamp}
            stroke="red"
            strokeDasharray="3 3"
            label={formatDate(dayTimestamp)}
          />
        ))}

        <Line type="monotone" dataKey="temp" stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ChartWithDayBoundaries;
