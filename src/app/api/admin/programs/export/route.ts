import { NextRequest, NextResponse } from 'next/server';
import { getProgramRegistrationsForExport } from '@/actions/program-actions';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId') || undefined;
    const statusFilter = searchParams.get('status') || undefined;

    const result = await getProgramRegistrationsForExport(programId, statusFilter);
    
    if (!result.success || !result.data) {
      return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }

    const registrations = result.data;

    // Prepare data for Excel
    const excelData = registrations.map((reg: any, index: number) => {
      const account = reg.user?.account;
      const user = reg.user;
      const program = reg.program;

      return {
        'S/N': index + 1,
        'Registration Number': reg.registrationNumber || '-',
        'Status': reg.status?.replace('_', ' ').toUpperCase() || '-',
        
        // Participant Info
        'Name (English)': account?.name || user?.userName || '-',
        'Name (Bangla)': account?.nameBangla || '-',
        'Email': user?.email || '-',
        'Phone': account?.phone || '-',
        'Father\'s Name': account?.fatherName || '-',
        
        // Personal Details
        'Date of Birth': account?.dob ? format(new Date(account.dob), 'dd/MM/yyyy') : '-',
        'Age': account?.age || '-',
        'Gender': account?.sex || '-',
        'Blood Group': account?.bloodGroup || '-',
        'Occupation': account?.occupation || '-',
        
        // Address
        'Address': account?.address || '-',
        'City': account?.city || '-',
        'State': account?.state || '-',
        'Country': account?.country || '-',
        'Postal Code': account?.postalCode || '-',
        
        // Identity
        'Identity Type': account?.identityType || '-',
        'Identity Number': account?.identityNumber || '-',
        
        // Institution
        'Institution': account?.institute || '-',
        
        // Program Info
        'Program Name': program?.title || '-',
        'Program Type': program?.type?.replace('_', ' ') || '-',
        'Program Date': program?.startDate ? format(new Date(program.startDate), 'dd/MM/yyyy') : '-',
        'Location': program?.location || '-',
        
        // Payment Info
        'Fee Amount': reg.feeAmount || '-',
        'Currency': reg.currency || 'BDT',
        'Payment Method': reg.paymentMethod || '-',
        'Transaction ID': reg.transactionId || '-',
        'Payment Submitted': reg.paymentSubmittedAt ? format(new Date(reg.paymentSubmittedAt), 'dd/MM/yyyy HH:mm') : '-',
        
        // Registration Timeline
        'Registered At': reg.createdAt ? format(new Date(reg.createdAt), 'dd/MM/yyyy HH:mm') : '-',
        'Verified At': reg.verifiedAt ? format(new Date(reg.verifiedAt), 'dd/MM/yyyy HH:mm') : '-',
        'Rejection Reason': reg.rejectionReason || '-',
        'Notes': reg.notes || '-',
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 5 },   // S/N
      { wch: 18 },  // Registration Number
      { wch: 18 },  // Status
      { wch: 25 },  // Name (English)
      { wch: 25 },  // Name (Bangla)
      { wch: 30 },  // Email
      { wch: 15 },  // Phone
      { wch: 25 },  // Father's Name
      { wch: 12 },  // DOB
      { wch: 6 },   // Age
      { wch: 10 },  // Gender
      { wch: 12 },  // Blood Group
      { wch: 15 },  // Occupation
      { wch: 40 },  // Address
      { wch: 15 },  // City
      { wch: 15 },  // State
      { wch: 15 },  // Country
      { wch: 12 },  // Postal Code
      { wch: 15 },  // Identity Type
      { wch: 20 },  // Identity Number
      { wch: 30 },  // Institution
      { wch: 30 },  // Program Name
      { wch: 18 },  // Program Type
      { wch: 12 },  // Program Date
      { wch: 30 },  // Location
      { wch: 12 },  // Fee Amount
      { wch: 10 },  // Currency
      { wch: 15 },  // Payment Method
      { wch: 25 },  // Transaction ID
      { wch: 18 },  // Payment Submitted
      { wch: 18 },  // Registered At
      { wch: 18 },  // Verified At
      { wch: 30 },  // Rejection Reason
      { wch: 30 },  // Notes
    ];
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    const sheetName = statusFilter 
      ? `${statusFilter.replace('_', ' ')} Registrations` 
      : 'All Registrations';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // Excel limit is 31 chars

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create filename
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const filename = `program-registrations-${statusFilter || 'all'}-${timestamp}.xlsx`;

    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
