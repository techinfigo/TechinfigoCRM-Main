
import React from 'react';
import { useState, useMemo } from 'react';
import { IndianRupee, Percent, Info, TrendingUp, CircleDollarSign, CreditCard, Wallet, Users, LineChart, Target, AlertTriangle, Briefcase, BarChart, PieChart, Goal } from 'lucide-react';
import { Button } from '../common/Button';

// --- TYPE DEFINITIONS ---
interface InputValues {
    productPrice: number;
    productCost: number;
    costPerLead: number;
    cpa: number;
    adSpend: number;
    agencyFees: number;
    agencyCommission: number;
}

// --- SUB-COMPONENTS ---

const InputField: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    prefix: React.ReactNode;
    tooltip: string;
}> = ({ label, value, onChange, prefix, tooltip }) => (
    <div className="relative">
        <label className="flex items-center text-sm font-medium text-text-muted dark:text-slate-300 mb-1.5">
            {label}
            <div className="ml-1.5 group relative">
                <Info size={14} className="cursor-help text-slate-400" />
                <div className="absolute bottom-full mb-2 w-56 bg-premium-accent text-premium-accent-text text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 transform -translate-x-1/2 left-1/2 shadow-lg">
                    {tooltip}
                </div>
            </div>
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted dark:text-slate-400">
                {prefix}
            </div>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-2.5 bg-bg-muted dark:bg-slate-800 border border-border-base dark:border-slate-700 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-base dark:focus:ring-offset-bg-muted focus:ring-premium-accent transition-all duration-200"
            />
        </div>
    </div>
);

const OutputCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
}> = ({ title, value, icon, colorClass }) => (
    <div className="relative bg-bg-base dark:bg-bg-muted p-4 rounded-xl shadow-lg border border-border-base dark:border-border-muted transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="absolute top-4 right-4 text-text-muted">{icon}</div>
        <p className="text-sm font-medium text-text-muted dark:text-slate-400">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${colorClass}`}>{value}</p>
    </div>
);

// --- MAIN COMPONENT ---
export const ProfitRevenueEstimator: React.FC = () => {
    const [inputs, setInputs] = useState<InputValues>({
        productPrice: 5000,
        productCost: 1500,
        costPerLead: 250,
        cpa: 1000,
        adSpend: 100000,
        agencyFees: 25000,
        agencyCommission: 5,
    });

    const handleInputChange = (field: keyof InputValues) => (value: number) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const calculated = useMemo(() => {
        const { productPrice, productCost, costPerLead, cpa, adSpend, agencyFees, agencyCommission } = inputs;
        const totalSales = cpa > 0 ? adSpend / cpa : 0;
        const totalRevenue = totalSales * productPrice;
        const totalProductCost = totalSales * productCost;
        const totalLeads = costPerLead > 0 ? adSpend / costPerLead : 0;
        const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;
        const roas = adSpend > 0 ? totalRevenue / adSpend : 0;
        const requiredLeadsPerSale = totalSales > 0 ? totalLeads / totalSales : 0;
        const hiddenCost = totalRevenue * 0.30;
        const netProfit = totalRevenue - (totalProductCost + adSpend + hiddenCost + agencyFees + (totalRevenue * (agencyCommission / 100)));
        const agencyEarnings = agencyFees + (totalRevenue * (agencyCommission / 100));
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const earningsPerSale = totalSales > 0 ? netProfit / totalSales : 0;
        return { totalSales, totalRevenue, totalProductCost, totalLeads, conversionRate, roas, requiredLeadsPerSale, hiddenCost, netProfit, agencyEarnings, profitMargin, earningsPerSale };
    }, [inputs]);
    
    const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const profitColor = 'text-status-positive';
    const costColor = 'text-status-warning';
    const performanceColor = 'text-status-neutral';
    const earningsColor = 'text-premium-accent dark:text-secondary-accent';

    const metrics = [
        { title: "Net Profit", value: formatCurrency(calculated.netProfit), icon: <CircleDollarSign size={20} />, colorClass: profitColor },
        { title: "Total Revenue", value: formatCurrency(calculated.totalRevenue), icon: <TrendingUp size={20} />, colorClass: performanceColor },
        { title: "Agency Earnings", value: formatCurrency(calculated.agencyEarnings), icon: <Briefcase size={20} />, colorClass: earningsColor },
        { title: "ROAS", value: `${calculated.roas.toFixed(2)}x`, icon: <Target size={20} />, colorClass: performanceColor },
        { title: "Total Sales", value: `${calculated.totalSales.toFixed(0)} units`, icon: <Users size={20} />, colorClass: performanceColor },
        { title: "Profit Margin", value: `${calculated.profitMargin.toFixed(2)}%`, icon: <PieChart size={20} />, colorClass: profitColor },
        { title: "Earnings per Sale", value: formatCurrency(calculated.earningsPerSale), icon: <BarChart size={20} />, colorClass: profitColor },
        { title: "Total Leads", value: calculated.totalLeads.toFixed(0), icon: <LineChart size={20} />, colorClass: performanceColor },
        { title: "Total Product Cost", value: formatCurrency(calculated.totalProductCost), icon: <CreditCard size={20} />, colorClass: costColor },
        { title: "Conversion Rate", value: `${calculated.conversionRate.toFixed(2)}%`, icon: <Goal size={20} />, colorClass: performanceColor },
        { title: "Hidden Cost (30%)", value: formatCurrency(calculated.hiddenCost), icon: <AlertTriangle size={20} />, colorClass: costColor },
        { title: "Leads per Sale", value: calculated.requiredLeadsPerSale.toFixed(1), icon: <Wallet size={20} />, colorClass: costColor },
    ];

    return (
        <div className="max-w-screen-xl mx-auto space-y-12 p-4">
            {/* Output Section */}
            <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metrics.map(metric => (
                        <OutputCard key={metric.title} {...metric} />
                    ))}
                </div>
            </section>

            {/* Input Section */}
            <section>
                 <h2 className="text-2xl font-bold text-center mb-6 text-text-heading dark:text-text-heading">Enter Your Business Inputs</h2>
                <div className="bg-bg-base dark:bg-bg-base p-6 rounded-2xl border border-border-muted shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                        <InputField label="Product Price" value={inputs.productPrice} onChange={handleInputChange('productPrice')} prefix={<IndianRupee size={16} />} tooltip="The selling price of one unit of your product." />
                        <InputField label="Product Cost" value={inputs.productCost} onChange={handleInputChange('productCost')} prefix={<IndianRupee size={16} />} tooltip="The cost to produce or acquire one unit of your product." />
                        <InputField label="Cost Per Lead (CPL)" value={inputs.costPerLead} onChange={handleInputChange('costPerLead')} prefix={<IndianRupee size={16} />} tooltip="How much you spend on average to generate one lead." />
                        <InputField label="Cost Per Acquisition (CPA)" value={inputs.cpa} onChange={handleInputChange('cpa')} prefix={<IndianRupee size={16} />} tooltip="How much you spend on average to acquire one customer." />
                        <InputField label="Ad Spending Budget" value={inputs.adSpend} onChange={handleInputChange('adSpend')} prefix={<IndianRupee size={16} />} tooltip="Total amount spent on advertising for a given period." />
                        <InputField label="Agency Fees (Retainer)" value={inputs.agencyFees} onChange={handleInputChange('agencyFees')} prefix={<IndianRupee size={16} />} tooltip="Fixed fees paid to the marketing agency." />
                        <InputField label="Agency Commission Rate" value={inputs.agencyCommission} onChange={handleInputChange('agencyCommission')} prefix={<Percent size={16} />} tooltip="Percentage of revenue paid as commission to the agency." />
                    </div>
                </div>
            </section>

             {/* CTA Section */}
            <section className="text-center">
                <Button size="lg" className="bg-secondary-accent hover:bg-secondary-accent-hover text-secondary-accent-text font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                    Calculate Insights
                </Button>
            </section>
        </div>
    );
};