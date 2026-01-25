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
      // Data is now flat from explicit joins (account, user, program, member, onboardingRegistration)
      const acc = reg.account;
      const usr = reg.user;
      const prog = reg.program;
      const mem = reg.member; // Member data for more complete info
      const onboard = reg.onboardingRegistration; // Onboarding registration data
      
      // Parse notes JSON from onboarding registration - contains full form data
      // Field names from EnrollForm: username, fatherName, motherName, address, zipCode, phone, email, dob, age, height, weight, sex, bloodGroup, nationality, religion, nid, occupation, institute, dept, session, motive
      let formData: any = {};
      if (onboard?.notes) {
        try {
          formData = typeof onboard.notes === 'string' ? JSON.parse(onboard.notes) : onboard.notes;
        } catch (e) {
          console.error('Failed to parse onboarding notes:', e);
        }
      }

      return {
        'S/N': index + 1,
        'Registration Number': reg.registrationNumber || '-',
        'Member Number': mem?.memberNumber || '-',
        'Status': reg.status?.replace('_', ' ').toUpperCase() || '-',
        
        // Participant Info - check formData first (from onboarding), then member, then account
        'Name (English)': formData?.username || mem?.fullNameEnglish || acc?.name || usr?.userName || '-',
        'Name (Bangla)': mem?.fullNameBangla || acc?.nameBangla || '-',
        'Father\'s Name': formData?.fatherName || mem?.fatherName || acc?.fatherName || '-',
        'Father\'s Name (Bangla)': mem?.fatherNameBangla || '-',
        'Mother\'s Name': formData?.motherName || mem?.motherName || '-',
        'Mother\'s Name (Bangla)': mem?.motherNameBangla || '-',
        
        // Contact - formData first
        'Email': formData?.email || usr?.email || onboard?.email || '-',
        'Phone': formData?.phone || mem?.phoneNumber || onboard?.phoneNumber || acc?.phone || '-',
        'Emergency Contact': mem?.emergencyContact || onboard?.emergencyContact || '-',
        'Emergency Phone': mem?.emergencyPhone || onboard?.emergencyPhone || '-',
        
        // Personal Details
        'Date of Birth': formData?.dob 
          ? format(new Date(formData.dob), 'dd/MM/yyyy')
          : mem?.dateOfBirth 
            ? format(new Date(mem.dateOfBirth), 'dd/MM/yyyy') 
            : onboard?.dateOfBirth
              ? format(new Date(onboard.dateOfBirth), 'dd/MM/yyyy')
              : acc?.dob ? format(new Date(acc.dob), 'dd/MM/yyyy') : '-',
        'Age': formData?.age || acc?.age || '-',
        'Gender': formData?.sex || mem?.gender || acc?.sex || '-',
        'Blood Group': formData?.bloodGroup || mem?.bloodGroup || acc?.bloodGroup || '-',
        'Religion': formData?.religion || mem?.religion || '-',
        'Nationality': formData?.nationality || mem?.nationality || '-',
        'Height (cm)': formData?.height || acc?.height || '-',
        'Weight (kg)': formData?.weight || acc?.weight || '-',
        'Belt Rank': mem?.beltRank || '-',
        
        // Address
        'Address': formData?.address || mem?.presentAddress || acc?.address || '-',
        'Zip/Postal Code': formData?.zipCode || acc?.postalCode || '-',
        'Permanent Address': mem?.permanentAddress || '-',
        'City': acc?.city || '-',
        'State': acc?.state || '-',
        'Country': acc?.country || '-',
        
        // Identity
        'NID': formData?.nid || mem?.nid || '-',
        'Birth Certificate No': mem?.birthCertificateNo || '-',
        'Passport No': mem?.passportNo || '-',
        'Identity Type': acc?.identityType || '-',
        'Identity Number': acc?.identityNumber || '-',
        
        // Professional/Educational
        'Occupation': formData?.occupation || mem?.profession || acc?.occupation || '-',
        'Education Qualification': mem?.educationQualification || '-',
        'Institution': formData?.institute || acc?.institute || '-',
        'Department': formData?.dept || acc?.department || '-',
        'Session': formData?.session || acc?.session || '-',
        'Faculty': acc?.faculty || '-',
        
        // Motive/Bio
        'Motive': formData?.motive || '-',
        'Bio': acc?.bio || '-',
        
        // Program Info
        'Program Name': prog?.title || '-',
        'Program Type': prog?.type?.replace('_', ' ') || '-',
        'Program Date': prog?.startDate ? format(new Date(prog.startDate), 'dd/MM/yyyy') : '-',
        'Program End Date': prog?.endDate ? format(new Date(prog.endDate), 'dd/MM/yyyy') : '-',
        'Location': prog?.location || '-',
        
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
        
        // Profile Images (URLs)
        'Profile Photo URL': mem?.picture || acc?.image || '-',
        'Signature URL': acc?.signatureImage || '-',
        'ID Image URL': acc?.identityImage || '-',
        'Payment Proof URL': reg.paymentProofUrl || '-',
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths to match the columns in excelData
    const colWidths = [
      { wch: 5 },   // S/N
      { wch: 18 },  // Registration Number
      { wch: 15 },  // Member Number
      { wch: 18 },  // Status
      { wch: 25 },  // Name (English)
      { wch: 25 },  // Name (Bangla)
      { wch: 25 },  // Father's Name
      { wch: 25 },  // Father's Name (Bangla)
      { wch: 25 },  // Mother's Name
      { wch: 25 },  // Mother's Name (Bangla)
      { wch: 30 },  // Email
      { wch: 15 },  // Phone
      { wch: 25 },  // Emergency Contact
      { wch: 15 },  // Emergency Phone
      { wch: 12 },  // DOB
      { wch: 6 },   // Age
      { wch: 10 },  // Gender
      { wch: 12 },  // Blood Group
      { wch: 15 },  // Religion
      { wch: 15 },  // Nationality
      { wch: 12 },  // Height
      { wch: 12 },  // Weight
      { wch: 12 },  // Belt Rank
      { wch: 40 },  // Address
      { wch: 15 },  // Zip/Postal Code
      { wch: 40 },  // Permanent Address
      { wch: 15 },  // City
      { wch: 15 },  // State
      { wch: 15 },  // Country
      { wch: 20 },  // NID
      { wch: 20 },  // Birth Certificate No
      { wch: 20 },  // Passport No
      { wch: 15 },  // Identity Type
      { wch: 20 },  // Identity Number
      { wch: 20 },  // Occupation
      { wch: 25 },  // Education Qualification
      { wch: 30 },  // Institution
      { wch: 20 },  // Department
      { wch: 15 },  // Session
      { wch: 20 },  // Faculty
      { wch: 40 },  // Motive
      { wch: 18 },  // Registered At
      { wch: 18 },  // Verified At
      { wch: 30 },  // Rejection Reason
      { wch: 30 },  // Notes
      { wch: 50 },  // Profile Photo URL
      { wch: 50 },  // Signature URL
      { wch: 50 },  // ID Image URL
      { wch: 50 },  // Payment Proof URL
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
