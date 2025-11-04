import React, { useEffect, useRef } from 'react';
// FIX: Update Chart.js import for v3+. `import Chart from 'chart.js'` is for v2.
// For v3+, we need to import the Chart class as a named export.
// 'chart.js/auto' also registers all components, fixing runtime errors.
import { Chart } from 'chart.js/auto';

interface ChartProps {
    data: any;
    options?: any;
}

export const MonthlyDeliveriesChart: React.FC<ChartProps> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: 'bar',
                    data: data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                     color: '#9ca3af'
                                }
                            },
                            x: {
                                ticks: {
                                     color: '#9ca3af'
                                }
                            }
                        }
                    }
                });
            }
        }
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    return <div style={{ height: '300px' }}><canvas ref={chartRef} /></div>;
};


export const DeliveryStatusChart: React.FC<ChartProps> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: 'pie',
                    data: data,
                     options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    color: '#d1d5db'
                                }
                            },
                        },
                    }
                });
            }
        }
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    return <div style={{ height: '300px' }}><canvas ref={chartRef} /></div>;
};
