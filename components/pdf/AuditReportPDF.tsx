
import React from 'react';
import { AuditRecord, Client } from '../../types';

interface AuditReportPDFProps {
  auditRecord: AuditRecord;
  client: Client;
}

const getScoreColor = (score?: number) => {
    if (score === undefined) return '#6B7280'; // Gray
    if (score >= 75) return '#16A34A'; // Green
    if (score >= 50) return '#F59E0B'; // Orange/Yellow
    return '#DC2626'; // Red
};

const getUrgencyColor = (status?: string) => {
    switch (status) {
        case 'Critical': return '#FEE2E2'; // Red-100
        case 'Needs Improvement': return '#FEF3C7'; // Yellow-100
        case 'Good': return '#D1FAE5'; // Green-100
        default: return '#FFFFFF'; // White
    }
};

const getUrgencyTextColor = (status?: string) => {
    switch (status) {
        case 'Critical': return '#991B1B';
        case 'Needs Improvement': return '#92400E';
        case 'Good': return '#065F46';
        default: return '#374151';
    }
};

const parameterLabels: { [key: string]: string } = {
    'websiteStructure_pageAvailability': 'Page Availability',
    'websiteStructure_siteSpeed': 'Site Speed',
    'websiteStructure_mobileResponsiveness': 'Mobile Responsiveness',
    'productPage_highQualityProductImages': 'Product Images',
    'productPage_keyBenefitsAvailable': 'Key Benefits Display',
    'googleOrganicSEO_keywordInTitleURLMetaDescription': 'Keywords in Meta',
};

const getParameterLabel = (key: string): string => {
    return parameterLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const AuditReportPDF: React.FC<AuditReportPDFProps> = ({ auditRecord, client }) => {
    const overallScore = auditRecord.aiOverallScore || 0;
    const totalLoss = auditRecord.eCommerceAuditFindings 
        ? Object.values(auditRecord.eCommerceAuditFindings).reduce((sum, finding: any) => sum + (finding?.estimatedLossPercent || 0), 0)
        : 0;

    const allFindings = auditRecord.eCommerceAuditFindings ? Object.entries(auditRecord.eCommerceAuditFindings) : [];

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#333', padding: '30px', background: 'white', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #001d21', paddingBottom: '15px', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ color: '#001d21', margin: '0', fontSize: '28px', fontWeight: 'bold' }}>TECHINFIGO</h1>
                    <p style={{ color: '#666', margin: '0', fontSize: '10px' }}>CRM & Marketing Solutions</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ margin: '0', fontSize: '22px', fontWeight: 'bold' }}>Marketing Audit Report</h2>
                    <p style={{ margin: '5px 0 0', fontSize: '12px' }}><strong>Date:</strong> {new Date(auditRecord.dateConducted).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Client Info & Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', gap: '20px' }}>
                <div style={{ flex: '1.2', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Client Information</h3>
                    <p style={{ fontSize: '12px', margin: '2px 0' }}><strong>Name:</strong> {client.name}</p>
                    <p style={{ fontSize: '12px', margin: '2px 0' }}><strong>Company:</strong> {client.companyName || 'N/A'}</p>
                    <p style={{ fontSize: '12px', margin: '2px 0' }}><strong>Website:</strong> {client.website || 'N/A'}</p>
                    <p style={{ fontSize: '12px', margin: '2px 0' }}><strong>Email:</strong> {client.email}</p>
                </div>

                <div style={{ flex: '1', display: 'flex', gap: '15px' }}>
                    <div style={{ flex: '1', border: '1px solid #eee', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Overall Score</h3>
                        <p style={{ fontSize: '36px', fontWeight: 'bold', color: getScoreColor(overallScore), margin: '10px 0' }}>{overallScore}%</p>
                    </div>
                    <div style={{ flex: '1', border: '1px solid #eee', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Conversion Loss</h3>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#DC2626', margin: '18px 0' }}>~{totalLoss}%</p>
                    </div>
                </div>
            </div>

            {/* Findings Table */}
            <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Audit Findings</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                    <thead style={{ backgroundColor: '#f3f4f6' }}>
                        <tr>
                            <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left', width: '20%' }}>Parameter</th>
                            <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left', width: '25%' }}>Current Status</th>
                            <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left', width: '25%' }}>Ideal Benchmark</th>
                            <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left', width: '20%' }}>Suggestions</th>
                            <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', width: '10%' }}>Loss</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allFindings.length > 0 ? allFindings.map(([key, finding]: [string, any]) => (
                            <tr key={key} style={{ backgroundColor: getUrgencyColor(finding?.status) }}>
                                <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 'bold', color: getUrgencyTextColor(finding?.status) }}>
                                    {getParameterLabel(key)}
                                </td>
                                <td style={{ padding: '6px', border: '1px solid #ddd' }}>{finding?.currentSituation || 'N/A'}</td>
                                <td style={{ padding: '6px', border: '1px solid #ddd' }}>{finding?.idealBenchmark || 'N/A'}</td>
                                <td style={{ padding: '6px', border: '1px solid #ddd' }}>{finding?.suggestion || 'N/A'}</td>
                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: finding?.estimatedLossPercent && finding.estimatedLossPercent > 0 ? '#DC2626' : '#16A34A' }}>
                                    {finding?.estimatedLossPercent !== undefined ? `${finding.estimatedLossPercent}%` : '-'}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>No detailed findings available.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: '20px', left: '30px', right: '30px', textAlign: 'center', fontSize: '10px', color: '#999', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <p>Generated via TECHINFIGO CRM</p>
                <p>contact@techinfigo.com | www.techinfigo.com</p>
            </div>
        </div>
    );
};

export default AuditReportPDF;
