import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { enrollmentApplications, courses, user, account } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { hasPermission } from '@/lib/rbac/permissions';
import { getRBACContext } from '@/lib/rbac/middleware';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canRead = await hasPermission(context.userId, 'ENROLLMENT', 'READ');
    if (!canRead) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || undefined;
    const courseIdFilter = searchParams.get('courseId') || undefined;

    const conditions = [];
    
    if (statusFilter) {
      conditions.push(eq(enrollmentApplications.status, statusFilter as any));
    }
    
    if (courseIdFilter) {
      conditions.push(eq(enrollmentApplications.courseId, courseIdFilter));
    }

    // Fetch applications with user and account data
    const applications = await db
      .select({
        // Application fields - explicitly select all needed fields including studentInfo
        application: {
          id: enrollmentApplications.id,
          applicationNumber: enrollmentApplications.applicationNumber,
          userId: enrollmentApplications.userId,
          courseId: enrollmentApplications.courseId,
          studentInfo: enrollmentApplications.studentInfo,
          admissionFeeAmount: enrollmentApplications.admissionFeeAmount,
          currency: enrollmentApplications.currency,
          paymentMethod: enrollmentApplications.paymentMethod,
          transactionId: enrollmentApplications.transactionId,
          paymentProofUrl: enrollmentApplications.paymentProofUrl,
          paymentSubmittedAt: enrollmentApplications.paymentSubmittedAt,
          status: enrollmentApplications.status,
          paymentVerifiedBy: enrollmentApplications.paymentVerifiedBy,
          paymentVerifiedAt: enrollmentApplications.paymentVerifiedAt,
          paymentVerificationNotes: enrollmentApplications.paymentVerificationNotes,
          reviewedBy: enrollmentApplications.reviewedBy,
          reviewedAt: enrollmentApplications.reviewedAt,
          reviewNotes: enrollmentApplications.reviewNotes,
          rejectionReason: enrollmentApplications.rejectionReason,
          memberId: enrollmentApplications.memberId,
          createdAt: enrollmentApplications.createdAt,
          updatedAt: enrollmentApplications.updatedAt,
        },
        course: {
          id: courses.id,
          name: courses.name,
          monthlyFee: courses.monthlyFee,
          admissionFee: courses.admissionFee,
        },
        applicant: {
          id: user.id,
          email: user.email,
          userName: user.userName,
        },
        profile: {
          name: account.name,
          nameBangla: account.nameBangla,
          fatherName: account.fatherName,
          phone: account.phone,
          address: account.address,
          city: account.city,
          state: account.state,
          country: account.country,
          postalCode: account.postalCode,
          dob: account.dob,
          age: account.age,
          sex: account.sex,
          bloodGroup: account.bloodGroup,
          height: account.height,
          weight: account.weight,
          occupation: account.occupation,
          institute: account.institute,
          faculty: account.faculty,
          department: account.department,
          session: account.session,
          identityType: account.identityType,
          identityNumber: account.identityNumber,
          image: account.image,
          signatureImage: account.signatureImage,
          identityImage: account.identityImage,
          bio: account.bio,
        }
      })
      .from(enrollmentApplications)
      .leftJoin(courses, eq(enrollmentApplications.courseId, courses.id))
      .leftJoin(user, eq(enrollmentApplications.userId, user.id))
      .leftJoin(account, eq(user.id, account.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(enrollmentApplications.createdAt));

    // Prepare data for Excel
    const excelData = applications.map((app, index) => {
      const studentInfo = app.application.studentInfo as any;
      const profile = app.profile;
      
      return {
        'S/N': index + 1,
        'Application Number': app.application.applicationNumber || '-',
        'Status': app.application.status?.replace('_', ' ').toUpperCase() || '-',
        
        // Student Info from Application Form
        'Name (English)': studentInfo?.fullNameEnglish || profile?.name || '-',
        'Name (Bangla)': studentInfo?.fullNameBangla || profile?.nameBangla || '-',
        'Father\'s Name': studentInfo?.fatherName || profile?.fatherName || '-',
        'Father\'s Name (Bangla)': studentInfo?.fatherNameBangla || '-',
        'Mother\'s Name': studentInfo?.motherName || '-',
        'Mother\'s Name (Bangla)': studentInfo?.motherNameBangla || '-',
        
        // Contact
        'Email': studentInfo?.email || app.applicant?.email || '-',
        'Phone': studentInfo?.phoneNumber || profile?.phone || '-',
        'Emergency Contact Name': studentInfo?.emergencyContactName || '-',
        'Emergency Contact Phone': studentInfo?.emergencyContactPhone || '-',
        'Emergency Contact Relation': studentInfo?.emergencyContactRelation || '-',
        
        // Personal Details
        'Date of Birth': studentInfo?.dateOfBirth 
          ? format(new Date(studentInfo.dateOfBirth), 'dd/MM/yyyy') 
          : profile?.dob ? format(new Date(profile.dob), 'dd/MM/yyyy') : '-',
        'Gender': studentInfo?.gender || profile?.sex || '-',
        'Blood Group': studentInfo?.bloodGroup || profile?.bloodGroup || '-',
        'Religion': studentInfo?.religion || '-',
        'Nationality': studentInfo?.nationality || '-',
        
        // Address
        'Present Address': studentInfo?.presentAddress || profile?.address || '-',
        'Permanent Address': studentInfo?.permanentAddress || '-',
        'City': profile?.city || '-',
        'State': profile?.state || '-',
        'Country': profile?.country || '-',
        'Postal Code': profile?.postalCode || '-',
        
        // Identity
        'NID': studentInfo?.nid || '-',
        'Birth Certificate No': studentInfo?.birthCertificateNo || '-',
        'Passport No': studentInfo?.passportNo || '-',
        'Identity Type': profile?.identityType || '-',
        'Identity Number': profile?.identityNumber || '-',
        
        // Professional
        'Profession': studentInfo?.profession || profile?.occupation || '-',
        'Education Qualification': studentInfo?.educationQualification || '-',
        'Institution': profile?.institute || '-',
        'Faculty': profile?.faculty || '-',
        'Department': profile?.department || '-',
        'Session': profile?.session || '-',
        
        // Physical
        'Height (cm)': profile?.height || '-',
        'Weight (kg)': profile?.weight || '-',
        'Bio': profile?.bio || '-',
        
        // Health & Experience
        'Has Medical Condition': studentInfo?.hasMedicalCondition ? 'Yes' : 'No',
        'Medical Condition Details': studentInfo?.medicalConditionDetails || '-',
        'Previous Martial Arts Experience': studentInfo?.previousMartialArtsExperience || '-',
        'How Did You Hear About Us': studentInfo?.howDidYouHear || '-',
        
        // Course Info
        'Course Name': app.course?.name || '-',
        'Admission Fee': app.application.admissionFeeAmount ? (app.application.admissionFeeAmount / 100) : '-',
        'Currency': app.application.currency || 'BDT',
        
        // Payment Info
        'Payment Method': app.application.paymentMethod || '-',
        'Transaction ID': app.application.transactionId || '-',
        'Payment Submitted': app.application.paymentSubmittedAt 
          ? format(new Date(app.application.paymentSubmittedAt), 'dd/MM/yyyy HH:mm') 
          : '-',
        'Payment Verified': app.application.paymentVerifiedAt 
          ? format(new Date(app.application.paymentVerifiedAt), 'dd/MM/yyyy HH:mm') 
          : '-',
        
        // Timeline
        'Applied At': app.application.createdAt 
          ? format(new Date(app.application.createdAt), 'dd/MM/yyyy HH:mm') 
          : '-',
        'Reviewed At': app.application.reviewedAt 
          ? format(new Date(app.application.reviewedAt), 'dd/MM/yyyy HH:mm') 
          : '-',
        'Rejection Reason': app.application.rejectionReason || '-',
        'Review Notes': app.application.reviewNotes || '-',
        
        // Agreements
        'Agreed to Terms': studentInfo?.agreeToTerms ? 'Yes' : 'No',
        'Agreed to Waiver': studentInfo?.agreeToWaiver ? 'Yes' : 'No',
        
        // Profile Images (URLs) - check studentInfo first, then profile
        'Profile Photo URL': studentInfo?.profilePhotoUrl || profile?.image || '-',
        'Signature URL': studentInfo?.signatureUrl || profile?.signatureImage || '-',
        'ID Image URL': profile?.identityImage || '-',
        'Payment Proof URL': app.application.paymentProofUrl || '-',
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 5 },   // S/N
      { wch: 18 },  // Application Number
      { wch: 20 },  // Status
      { wch: 25 },  // Name (English)
      { wch: 25 },  // Name (Bangla)
      { wch: 25 },  // Father's Name
      { wch: 25 },  // Father's Name (Bangla)
      { wch: 25 },  // Mother's Name
      { wch: 25 },  // Mother's Name (Bangla)
      { wch: 30 },  // Email
      { wch: 15 },  // Phone
      { wch: 25 },  // Emergency Contact Name
      { wch: 15 },  // Emergency Contact Phone
      { wch: 15 },  // Emergency Contact Relation
      { wch: 12 },  // DOB
      { wch: 10 },  // Gender
      { wch: 10 },  // Blood Group
      { wch: 15 },  // Religion
      { wch: 15 },  // Nationality
      { wch: 40 },  // Present Address
      { wch: 40 },  // Permanent Address
      { wch: 15 },  // City
      { wch: 15 },  // State
      { wch: 15 },  // Country
      { wch: 12 },  // Postal Code
      { wch: 20 },  // NID
      { wch: 20 },  // Birth Certificate
      { wch: 20 },  // Passport
      { wch: 15 },  // Identity Type
      { wch: 20 },  // Identity Number
      { wch: 20 },  // Profession
      { wch: 25 },  // Education
      { wch: 30 },  // Institution
      { wch: 20 },  // Faculty
      { wch: 20 },  // Department
      { wch: 15 },  // Session
      { wch: 12 },  // Height
      { wch: 12 },  // Weight
      { wch: 30 },  // Bio
      { wch: 18 },  // Has Medical Condition
      { wch: 30 },  // Medical Details
      { wch: 30 },  // Previous Experience
      { wch: 25 },  // How Did You Hear
      { wch: 25 },  // Course Name
      { wch: 12 },  // Admission Fee
      { wch: 10 },  // Currency
      { wch: 15 },  // Payment Method
      { wch: 25 },  // Transaction ID
      { wch: 18 },  // Payment Submitted
      { wch: 18 },  // Payment Verified
      { wch: 18 },  // Applied At
      { wch: 18 },  // Reviewed At
      { wch: 30 },  // Rejection Reason
      { wch: 30 },  // Review Notes
      { wch: 15 },  // Agreed to Terms
      { wch: 15 },  // Agreed to Waiver
      { wch: 50 },  // Profile Photo URL
      { wch: 50 },  // Signature URL
      { wch: 50 },  // ID Image URL
      { wch: 50 },  // Payment Proof URL
    ];
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    const sheetName = statusFilter 
      ? `${statusFilter.replace('_', ' ')} Applications` 
      : 'All Applications';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create filename
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const filename = `enrollment-applications-${statusFilter || 'all'}-${timestamp}.xlsx`;

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
