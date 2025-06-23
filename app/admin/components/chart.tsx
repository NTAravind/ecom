"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { fcurrency } from "@/utils/utils"

interface WeeklyOrderData {
  week: string
  orders: number
  revenue: number
}

interface ChartComponentsProps {
  data: WeeklyOrderData[]
  type: "line" | "bar"
}

export default function ChartComponents({ data, type }: ChartComponentsProps) {
  if (type === "line") {
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'orders' ? `${value} orders` : fcurrency(value),
                name === 'orders' ? 'Orders' : 'Revenue'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="orders" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [fcurrency(value), 'Revenue']}
          />
          <Bar dataKey="revenue" fill="#16a34a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}