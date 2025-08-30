import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, TrendingUp, ScatterChart as ScatterIcon, Activity } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const CHART_COLORS = [
  '#a8dadc', '#ffc1cc', '#b8f2e6', '#d4a5d4', '#ffb3ba', '#fff3cd',
  '#c7ceea', '#ffd3a5', '#fd9853', '#ee9ca7', '#ffeaa7', '#81ecec'
];

const ChartContainer = ({ data, columns, question, onChartTypeChange }) => {
  const [chartType, setChartType] = useState('auto');
  const [processedData, setProcessedData] = useState([]);
  const [suggestedChart, setSuggestedChart] = useState('bar');
  const [chartConfig, setChartConfig] = useState({});

  const analyzeDataAndSuggestChart = useCallback(() => {
    if (!data || data.length === 0) return;

    // Convert array data to objects
    const objectData = data.map(row => {
      const obj = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });

    // Analyze data types and structure
    const numericColumns = [];
    const textColumns = [];
    const dateColumns = [];

    columns.forEach(col => {
      const sampleValues = objectData.slice(0, 10).map(row => row[col]).filter(val => val != null);
      
      if (sampleValues.length === 0) return;

      const isNumeric = sampleValues.every(val => !isNaN(parseFloat(val)) && isFinite(val));
      const isDate = sampleValues.every(val => !isNaN(Date.parse(val)));
      
      if (isNumeric) {
        numericColumns.push(col);
      } else if (isDate) {
        dateColumns.push(col);
      } else {
        textColumns.push(col);
      }
    });

    // Intelligent chart type suggestion
    let suggested = 'bar';
    let config = {};

    if (question) {
      const questionLower = question.toLowerCase();
      
      if (questionLower.includes('distribution') || questionLower.includes('proportion') || questionLower.includes('percentage')) {
        suggested = 'pie';
      } else if (questionLower.includes('trend') || questionLower.includes('over time') || questionLower.includes('timeline')) {
        suggested = 'line';
      } else if (questionLower.includes('correlation') || questionLower.includes('relationship')) {
        suggested = 'scatter';
      } else if (questionLower.includes('area') || questionLower.includes('cumulative')) {
        suggested = 'area';
      }
    }

    // Data structure analysis - prioritize question keywords over data structure
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      // Time series data
      suggested = 'line';
      config = {
        xAxis: dateColumns[0],
        yAxis: numericColumns[0]
      };
    } else if (numericColumns.length >= 2) {
      // Multiple numeric columns
      suggested = 'scatter';
      config = {
        xAxis: numericColumns[0],
        yAxis: numericColumns[1]
      };
    } else if (textColumns.length === 1 && numericColumns.length === 1) {
      // Default to bar chart for categorical data
      suggested = suggested === 'pie' ? 'pie' : 'bar'; // Only use pie if explicitly suggested by question
      config = {
        xAxis: textColumns[0],
        yAxis: numericColumns[0]
      };
    } else if (textColumns.length > 0 && numericColumns.length > 0) {
      // Fallback to bar chart
      suggested = 'bar';
      config = {
        xAxis: textColumns[0],
        yAxis: numericColumns[0]
      };
    }

    setSuggestedChart(suggested);
    setChartType(suggested);
    setChartConfig(config);
    setProcessedData(objectData);
    
    if (onChartTypeChange) {
      onChartTypeChange(suggested);
    }
  }, [data, columns, question, onChartTypeChange]);

  useEffect(() => {
    if (data && data.length > 0 && columns) {
      analyzeDataAndSuggestChart();
    }
  }, [data, columns, question, analyzeDataAndSuggestChart]);

  const handleChartTypeChange = (type) => {
    setChartType(type);
    if (onChartTypeChange) {
      onChartTypeChange(type);
    }
  };

  const renderChart = () => {
    if (!processedData || processedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-white/60">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
            <p>No data available for visualization</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      width: '100%',
      height: 400,
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={chartConfig.xAxis || columns[0]} 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }} 
              />
              <Legend />
              {columns.slice(1).map((col, index) => (
                <Bar 
                  key={col} 
                  dataKey={col} 
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={chartConfig.xAxis || columns[0]} 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }} 
              />
              <Legend />
              {columns.slice(1).map((col, index) => (
                <Line 
                  key={col} 
                  type="monotone" 
                  dataKey={col} 
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = processedData.slice(0, 8).map((item, index) => ({
          name: item[chartConfig.xAxis || columns[0]],
          value: parseFloat(item[chartConfig.yAxis || columns[1]]) || 0,
          fill: CHART_COLORS[index % CHART_COLORS.length]
        }));

        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={chartConfig.xAxis || columns[0]} 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }} 
              />
              <Legend />
              {columns.slice(1).map((col, index) => (
                <Area 
                  key={col} 
                  type="monotone" 
                  dataKey={col} 
                  stackId="1"
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer {...commonProps}>
            <ScatterChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                type="number" 
                dataKey={chartConfig.xAxis || columns[0]} 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <YAxis 
                type="number" 
                dataKey={chartConfig.yAxis || columns[1]} 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }} 
              />
              <Scatter 
                dataKey={chartConfig.yAxis || columns[1]} 
                fill={CHART_COLORS[0]}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return renderChart();
    }
  };

  const chartTypes = [
    { type: 'bar', icon: BarChart3, label: 'Bar Chart' },
    { type: 'line', icon: LineIcon, label: 'Line Chart' },
    { type: 'pie', icon: PieIcon, label: 'Pie Chart' },
    { type: 'area', icon: TrendingUp, label: 'Area Chart' },
    { type: 'scatter', icon: ScatterIcon, label: 'Scatter Plot' }
  ];

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity size={24} className="text-pastel-blue" />
          <div>
            <h3 className="text-xl font-bold text-white">Data Visualization</h3>
            <p className="text-white/60 text-sm">
              Suggested: {suggestedChart.charAt(0).toUpperCase() + suggestedChart.slice(1)} Chart
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {chartTypes.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant={chartType === type ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleChartTypeChange(type)}
              icon={Icon}
              className="min-w-0 px-3"
              title={label}
            />
          ))}
        </div>
      </div>

      <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm">
        {renderChart()}
      </div>

      {chartConfig.xAxis && chartConfig.yAxis && (
        <div className="mt-4 text-sm text-white/60">
          <p>X-Axis: {chartConfig.xAxis} | Y-Axis: {chartConfig.yAxis}</p>
        </div>
      )}
    </Card>
  );
};

export default ChartContainer;
