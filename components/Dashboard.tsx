import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Delivery } from '../types';
import { ChartIcon, CurrencyDollarIcon, TruckIcon } from './icons';
import { MonthlyDeliveriesChart, DeliveryStatusChart } from './Charts';

const DashboardCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-gray-700 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        todayDeliveries: 0,
        totalDue: 0,
        monthDeliveries: 0
    });
    const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
    const [chartData, setChartData] = useState<{ monthly: any, status: any }>({ monthly: null, status: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            const today = new Date().toISOString().slice(0, 10);
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
            
            // Fetch all deliveries for calculations
            const { data: allDeliveries, error: allDeliveriesError } = await supabase
                .from('deliveries')
                .select('*, trucks(*)');

            if (allDeliveriesError) {
                console.error(allDeliveriesError);
                setLoading(false);
                return;
            }

            // Calculate stats
            const todayCount = allDeliveries.filter(d => d.delivery_date === today).length;
            const monthCount = allDeliveries.filter(d => new Date(d.delivery_date) >= new Date(firstDayOfMonth)).length;
            const totalDue = allDeliveries
                .filter(d => d.status === 'due' || d.status === 'partial')
                .reduce((acc, d) => acc + (d.total_amount - d.amount_paid), 0);
            
            setStats({
                todayDeliveries: todayCount,
                totalDue: totalDue,
                monthDeliveries: monthCount
            });

            // Set recent deliveries
            const sortedDeliveries = [...allDeliveries].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
            setRecentDeliveries(sortedDeliveries.slice(0, 5) as Delivery[]);

            // Process data for charts
            processChartData(allDeliveries);

            setLoading(false);
        };

        const processChartData = (deliveries: Delivery[]) => {
            // Monthly deliveries chart data (last 6 months)
            const monthlyTotals: { [key: string]: number } = {};
            const monthLabels: string[] = [];
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);

            for (let i = 0; i < 6; i++) {
                const date = new Date(sixMonthsAgo);
                date.setMonth(date.getMonth() + i);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthName = date.toLocaleString('default', { month: 'short' });
                monthlyTotals[monthKey] = 0;
                monthLabels.push(monthName);
            }
            
            deliveries.forEach(d => {
                const deliveryDate = new Date(d.delivery_date);
                if (deliveryDate >= sixMonthsAgo) {
                    const monthKey = `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}`;
                    if(monthlyTotals[monthKey] !== undefined) {
                        monthlyTotals[monthKey] += d.total_amount;
                    }
                }
            });
            
            const monthlyChart = {
                labels: monthLabels,
                datasets: [{
                    label: 'Total Amount',
                    data: Object.values(monthlyTotals),
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                }]
            };

            // Delivery status chart data
            const statusCounts = { paid: 0, due: 0, partial: 0 };
            deliveries.forEach(d => {
                statusCounts[d.status]++;
            });

            const statusChart = {
                labels: ['Paid', 'Due', 'Partial'],
                datasets: [{
                    data: [statusCounts.paid, statusCounts.due, statusCounts.partial],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(239, 68, 68, 0.7)',
                        'rgba(245, 158, 11, 0.7)',
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(245, 158, 11, 1)',
                    ],
                    borderWidth: 1,
                }]
            };

            setChartData({ monthly: monthlyChart, status: statusChart });
        };


        fetchDashboardData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(amount);
    }

    if (loading) return <div className="text-center p-8">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-white">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard title="Today's Deliveries" value={stats.todayDeliveries} icon={<TruckIcon className="h-6 w-6 text-blue-400" />} />
                <DashboardCard title="Total Amount Due" value={formatCurrency(stats.totalDue)} icon={<CurrencyDollarIcon className="h-6 w-6 text-green-400" />} />
                <DashboardCard title="Deliveries This Month" value={stats.monthDeliveries} icon={<ChartIcon className="h-6 w-6 text-yellow-400" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-gray-800 p-6 rounded-lg">
                     <h2 className="text-2xl font-semibold text-white mb-4">Monthly Deliveries</h2>
                     {chartData.monthly && <MonthlyDeliveriesChart data={chartData.monthly} />}
                </div>
                 <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
                     <h2 className="text-2xl font-semibold text-white mb-4">Delivery Status</h2>
                     {chartData.status && <DeliveryStatusChart data={chartData.status} />}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold text-white mb-4">Recent Deliveries</h2>
                <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    <th className="p-4">Receiver</th>
                                    <th className="p-4">Driver</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentDeliveries.map(d => (
                                    <tr key={d.id} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4">{d.receiver_name}</td>
                                        <td className="p-4">{d.trucks?.driver_name}</td>
                                        <td className="p-4">{formatCurrency(d.total_amount)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                d.status === 'paid' ? 'bg-green-500/20 text-green-400' : 
                                                d.status === 'due' ? 'bg-red-500/20 text-red-400' : 
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;