import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Delivery, Truck } from '../types';
import Modal from './Modal';
import { PlusIcon, PrinterIcon, CompanyLogoIcon } from './icons';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


const Deliveries: React.FC = () => {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState<Delivery | null>(null);
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
    const [newDelivery, setNewDelivery] = useState<Partial<Delivery>>({
        sacks_delivered: 0,
        amount_paid: 0,
        driver_fee: 0,
        extra_purchase_cost: 0,
    });
    const [newTruck, setNewTruck] = useState<Partial<Truck>>({});
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [perSackPrice, setPerSackPrice] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const debouncedSearchTerm = useDebounce(searchTerm, 500);


    const fetchDeliveries = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from('deliveries')
            .select('*, trucks(*)');

        if (debouncedSearchTerm) {
            query = query.ilike('receiver_name', `%${debouncedSearchTerm}%`);
        }
        if (dateRange.start) {
            query = query.gte('delivery_date', dateRange.start);
        }
        if (dateRange.end) {
            query = query.lte('delivery_date', dateRange.end);
        }

        const { data, error } = await query.order('delivery_date', { ascending: false });

        if (error) {
            console.error('Error fetching deliveries:', error);
        } else {
            setDeliveries(data as Delivery[]);
        }
        setLoading(false);
    }, [debouncedSearchTerm, dateRange]);

    useEffect(() => {
        fetchDeliveries();
    }, [fetchDeliveries]);
    
    // Automatically calculate total amount
    useEffect(() => {
        const sacks = newDelivery.sacks_delivered || 0;
        const driverFee = newDelivery.driver_fee || 0;
        const extraCost = newDelivery.extra_purchase_cost || 0;
        
        const sacksTotal = sacks * perSackPrice;
        const totalAmount = sacksTotal + driverFee + extraCost;

        setNewDelivery(prev => ({ ...prev, total_amount: totalAmount }));
    }, [newDelivery.sacks_delivered, perSackPrice, newDelivery.driver_fee, newDelivery.extra_purchase_cost]);


    const handleAddDelivery = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Insert Truck
        const { data: truckData, error: truckError } = await supabase
            .from('trucks')
            .insert(newTruck)
            .select()
            .single();

        if (truckError) {
            alert('Error creating truck: ' + truckError.message);
            return;
        }

        // 2. Insert Delivery
        const deliveryPayload = {
            ...newDelivery,
            truck_id: truckData.id,
            status: (newDelivery.amount_paid || 0) >= (newDelivery.total_amount || 0) ? 'paid' : (newDelivery.amount_paid ?? 0) > 0 ? 'partial' : 'due'
        };

        const { data: deliveryData, error: deliveryError } = await supabase
            .from('deliveries')
            .insert(deliveryPayload)
            .select()
            .single();

        if (deliveryError) {
            alert('Error creating delivery: ' + deliveryError.message);
        } else {
            const fullDeliveryDataForInvoice: Delivery = {
                ...(deliveryData as Delivery),
                trucks: truckData as Truck,
            };
            setInvoiceData(fullDeliveryDataForInvoice);
            setIsInvoiceModalOpen(true);

            setIsModalOpen(false);
            setNewDelivery({sacks_delivered: 0, amount_paid: 0, driver_fee: 0, extra_purchase_cost: 0});
            setNewTruck({});
            setPerSackPrice(0);
            fetchDeliveries();
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDelivery) return;

        const newAmountPaid = (selectedDelivery.amount_paid || 0) + paymentAmount;
        const newStatus = newAmountPaid >= selectedDelivery.total_amount ? 'paid' : 'partial';

        const { error } = await supabase
            .from('deliveries')
            .update({ amount_paid: newAmountPaid, status: newStatus })
            .eq('id', selectedDelivery.id);
        
        if (error) {
            alert('Error adding payment: ' + error.message);
        } else {
            await supabase.from('payments').insert({ delivery_id: selectedDelivery.id, payment_amount: paymentAmount });
            setIsPaymentModalOpen(false);
            setSelectedDelivery(null);
            setPaymentAmount(0);
            fetchDeliveries();
        }
    };
    
    const formatCurrency = (amount: number | undefined) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(amount || 0);
    
    const clearFilters = () => {
        setSearchTerm('');
        setDateRange({ start: '', end: '' });
    }

    const getPerSackPriceForInvoice = (invoiceData: Delivery) => {
        const sacksTotal = invoiceData.total_amount - (invoiceData.driver_fee || 0) - (invoiceData.extra_purchase_cost || 0);
        if (invoiceData.sacks_delivered > 0) {
            return sacksTotal / invoiceData.sacks_delivered;
        }
        return 0;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-white">Deliveries</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition no-print"
                >
                    <PlusIcon className="h-5 w-5" /> New Delivery
                </button>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center">
                 <input
                    type="search"
                    placeholder="Search by receiver name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 p-2 bg-gray-700 rounded-md placeholder-gray-400"
                />
                <div className="flex gap-4 items-center">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        className="p-2 bg-gray-700 rounded-md"
                    />
                    <span className="text-gray-400">to</span>
                     <input
                        type="date"
                        value={dateRange.end}
                        onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        className="p-2 bg-gray-700 rounded-md"
                    />
                </div>
                 <button onClick={clearFilters} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition">Clear</button>
            </div>

            {loading ? <p>Loading deliveries...</p> : (
                <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Receiver</th>
                                    <th className="p-4">Driver</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Paid</th>
                                    <th className="p-4">Due</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveries.map(d => (
                                    <tr key={d.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                        <td className="p-4">{d.delivery_date}</td>
                                        <td className="p-4">{d.receiver_name}</td>
                                        <td className="p-4">{d.trucks?.driver_name}</td>
                                        <td className="p-4">{formatCurrency(d.total_amount)}</td>
                                        <td className="p-4">{formatCurrency(d.amount_paid)}</td>
                                        <td className="p-4">{formatCurrency(d.total_amount - d.amount_paid)}</td>
                                        <td className="p-4">
                                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                d.status === 'paid' ? 'bg-green-500/20 text-green-400' : 
                                                d.status === 'due' ? 'bg-red-500/20 text-red-400' : 
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {d.status !== 'paid' && (
                                                <button onClick={() => { setSelectedDelivery(d); setIsPaymentModalOpen(true); }} className="text-blue-400 hover:underline no-print">Add Payment</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Delivery" size="xl">
                <form onSubmit={handleAddDelivery} className="space-y-6 text-gray-300">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Column 1: Receiver Details */}
                        <fieldset className="border border-gray-700 p-4 rounded-lg h-fit">
                            <legend className="px-2 font-bold text-lg text-white">Receiver Details</legend>
                            <div className="space-y-4">
                                <input type="text" placeholder="Receiver Name" required onChange={e => setNewDelivery({...newDelivery, receiver_name: e.target.value})} className="w-full p-2 bg-gray-700 rounded"/>
                                <input type="text" placeholder="Receiver Phone" onChange={e => setNewDelivery({...newDelivery, receiver_phone: e.target.value})} className="w-full p-2 bg-gray-700 rounded"/>
                                <textarea placeholder="Receiver Address" onChange={e => setNewDelivery({...newDelivery, receiver_address: e.target.value})} className="w-full p-2 bg-gray-700 rounded h-24"/>
                            </div>
                        </fieldset>

                        {/* Column 2: Truck Details */}
                        <fieldset className="border border-gray-700 p-4 rounded-lg h-fit">
                            <legend className="px-2 font-bold text-lg text-white">Truck Details</legend>
                            <div className="space-y-4">
                                <input type="text" placeholder="Driver Name" required onChange={e => setNewTruck({...newTruck, driver_name: e.target.value})} className="w-full p-2 bg-gray-700 rounded"/>
                                <input type="text" placeholder="Truck Name" onChange={e => setNewTruck({...newTruck, truck_name: e.target.value})} className="w-full p-2 bg-gray-700 rounded"/>
                                <input type="text" placeholder="License Number" onChange={e => setNewTruck({...newTruck, license_number: e.target.value})} className="w-full p-2 bg-gray-700 rounded"/>
                                <input type="text" placeholder="Contact Number" onChange={e => setNewTruck({...newTruck, contact_number: e.target.value})} className="w-full p-2 bg-gray-700 rounded"/>
                            </div>
                        </fieldset>
                        
                        {/* Column 3: Delivery & Costs */}
                        <fieldset className="border border-gray-700 p-4 rounded-lg">
                            <legend className="px-2 font-bold text-lg text-white">Delivery & Costs</legend>
                            <div className="space-y-4">
                                <input type="date" placeholder="Delivery Date" required defaultValue={new Date().toISOString().slice(0, 10)} onChange={e => setNewDelivery({...newDelivery, delivery_date: e.target.value})} className="w-full p-2 bg-gray-700 rounded"/>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" placeholder="Sacks Delivered" required onChange={e => setNewDelivery({...newDelivery, sacks_delivered: Number(e.target.value)})} className="w-full p-2 bg-gray-700 rounded"/>
                                    <input type="number" step="0.01" placeholder="Per Sack Price" required onChange={e => setPerSackPrice(Number(e.target.value))} className="w-full p-2 bg-gray-700 rounded"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" step="0.01" placeholder="Driver Fee" defaultValue="0" onChange={e => setNewDelivery({...newDelivery, driver_fee: Number(e.target.value)})} className="w-full p-2 bg-gray-700 rounded"/>
                                    <input type="number" step="0.01" placeholder="Extra Purchase Cost" defaultValue="0" onChange={e => setNewDelivery({...newDelivery, extra_purchase_cost: Number(e.target.value)})} className="w-full p-2 bg-gray-700 rounded"/>
                                </div>
                                <textarea placeholder="Extra Purchase Details (Purpose)" onChange={e => setNewDelivery({...newDelivery, extra_purchase_details: e.target.value})} className="w-full p-2 bg-gray-700 rounded h-24"/>
                                <input type="number" step="0.01" placeholder="Amount Paid" defaultValue="0" onChange={e => setNewDelivery({...newDelivery, amount_paid: Number(e.target.value)})} className="w-full p-2 bg-gray-700 rounded"/>
                            </div>
                        </fieldset>
                    </div>

                    <div className="bg-gray-700/50 p-3 rounded-md text-right">
                        <span className="text-gray-400">Total Amount: </span>
                        <span className="text-2xl font-bold text-white">{formatCurrency(newDelivery.total_amount)}</span>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">Save Delivery</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Add Payment">
                <form onSubmit={handleAddPayment} className="space-y-4">
                    <p>Adding payment for delivery to <span className="font-bold">{selectedDelivery?.receiver_name}</span>.</p>
                    <p>Amount Due: <span className="font-semibold text-yellow-400">{formatCurrency(selectedDelivery ? selectedDelivery.total_amount - selectedDelivery.amount_paid : 0)}</span></p>
                    <div>
                        <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-300">Payment Amount</label>
                        <input
                            id="paymentAmount"
                            type="number"
                            step="0.01"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(Number(e.target.value))}
                            className="mt-1 block w-full p-2 bg-gray-700 rounded-md border-gray-600"
                            required
                        />
                    </div>
                     <div className="mt-4 flex justify-end">
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">Confirm Payment</button>
                    </div>
                </form>
            </Modal>

            {invoiceData && (
                 <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Delivery Invoice">
                    <div>
                        <div id="printable-area" className="bg-white text-black p-8 font-sans">
                            {/* Header with Logo */}
                            <div className="flex justify-between items-start mb-8 border-b pb-4">
                                <div className="flex items-center gap-4">
                                    <CompanyLogoIcon className="h-16 w-16 text-blue-600" />
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-800">Alankar Agro</h1>
                                        <p className="text-gray-500 text-sm">Bogura, Bangladesh</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-3xl font-semibold uppercase text-gray-600">Invoice</h2>
                                    <p className="text-gray-500"><span className="font-bold text-gray-600">Invoice #:</span> {invoiceData.id}</p>
                                    <p className="text-gray-500"><span className="font-bold text-gray-600">Date:</span> {invoiceData.delivery_date}</p>
                                </div>
                            </div>

                            {/* Billed To */}
                            <div className="mb-8">
                                <h3 className="font-bold text-gray-600 mb-1 uppercase text-sm">Billed To</h3>
                                <p className="text-gray-800 font-semibold">{invoiceData.receiver_name}</p>
                                <p className="text-gray-500">{invoiceData.receiver_address}</p>
                                <p className="text-gray-500">{invoiceData.receiver_phone}</p>
                            </div>

                            {/* Invoice Table */}
                            <table className="w-full text-left mb-8">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3 font-bold text-gray-600 uppercase tracking-wider text-sm">Description</th>
                                        <th className="p-3 font-bold text-gray-600 uppercase tracking-wider text-sm text-right">Quantity</th>
                                        <th className="p-3 font-bold text-gray-600 uppercase tracking-wider text-sm text-right">Unit Price</th>
                                        <th className="p-3 font-bold text-gray-600 uppercase tracking-wider text-sm text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="p-3">Sacks Delivered (Driver: {invoiceData.trucks?.driver_name})</td>
                                        <td className="p-3 text-right">{invoiceData.sacks_delivered}</td>
                                        <td className="p-3 text-right">{formatCurrency(getPerSackPriceForInvoice(invoiceData))}</td>
                                        <td className="p-3 text-right">{formatCurrency(invoiceData.sacks_delivered * getPerSackPriceForInvoice(invoiceData))}</td>
                                    </tr>
                                    {invoiceData.driver_fee && invoiceData.driver_fee > 0 && (
                                    <tr>
                                        <td className="p-3">Driver Fee</td>
                                        <td className="p-3 text-right">1</td>
                                        <td className="p-3 text-right">{formatCurrency(invoiceData.driver_fee)}</td>
                                        <td className="p-3 text-right">{formatCurrency(invoiceData.driver_fee)}</td>
                                    </tr>
                                    )}
                                    {invoiceData.extra_purchase_cost && invoiceData.extra_purchase_cost > 0 && (
                                    <tr>
                                        <td className="p-3">Extra Purchase: {invoiceData.extra_purchase_details}</td>
                                        <td className="p-3 text-right">1</td>
                                        <td className="p-3 text-right">{formatCurrency(invoiceData.extra_purchase_cost)}</td>
                                        <td className="p-3 text-right">{formatCurrency(invoiceData.extra_purchase_cost)}</td>
                                    </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-full max-w-sm">
                                    <div className="flex justify-between text-gray-600 mb-2">
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(invoiceData.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 mb-2">
                                        <span>Amount Paid:</span>
                                        <span>{formatCurrency(invoiceData.amount_paid)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-xl text-gray-800 border-t-2 pt-2 mt-2">
                                        <span>Amount Due:</span>
                                        <span>{formatCurrency(invoiceData.total_amount - invoiceData.amount_paid)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center text-gray-500 text-xs mt-12 border-t pt-4">
                                <p>Thank you for your business!</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4 no-print">
                             <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition">
                                <PrinterIcon className="h-5 w-5" /> Print
                            </button>
                             <button onClick={() => setIsInvoiceModalOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition">
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Deliveries;