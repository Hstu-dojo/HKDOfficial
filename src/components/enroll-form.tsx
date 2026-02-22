"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox";
import MaxWidthWrapper from "./maxWidthWrapper"
import Link from "next/link";

const FormSchema = z.object({
  // === Basic Information (required per external form) ===
  username: z.string().min(2, { message: "Name must be at least 2 characters." }),
  usernameBn: z.string().min(2, { message: "বাংলা নাম কমপক্ষে ২ অক্ষর হতে হবে।" }),
  dob: z.string().nonempty({ message: "Date of Birth is required." }),
  nationality: z.string().min(2, { message: "Nationality must be at least 2 characters." }),
  religion: z.string().min(2, { message: "Religion must be at least 2 characters." }),
  nid: z.string().min(10, { message: "NID must be at least 10 characters." }),

  // === Contact Details ===
  address: z.string().min(5, { message: "Present address must be at least 5 characters." }),
  permanentAddress: z.string().min(5, { message: "Permanent address must be at least 5 characters." }),
  zipCode: z.string().optional(), // Not in external form
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal("")), // Optional per external form
  emergencyContact: z.string().optional(), // Emergency contact name (not in external form)
  emergencyPhone: z.string().min(10, { message: "Emergency phone must be at least 10 digits." }),
  emergencyRelation: z.string().min(2, { message: "Emergency contact relationship is required." }),

  // === Student Details ===
  occupation: z.string().min(2, { message: "Occupation must be at least 2 characters." }),
  institute: z.string().min(2, { message: "Institute name must be at least 2 characters." }),
  levelClass: z.string().min(1, { message: "Level/Class is required." }),
  rollId: z.string().min(1, { message: "Student ID/Roll number is required." }),
  faculty: z.string().optional(), // faculty_dept is optional in external form
  dept: z.string().optional(), // faculty_dept is optional in external form
  session: z.string().optional(), // Not in external form

  // === Family Information (required per external form) ===
  fatherName: z.string().min(2, { message: "Father's name must be at least 2 characters." }),
  fatherOccupation: z.string().min(2, { message: "Father's occupation is required." }),
  motherName: z.string().min(2, { message: "Mother's name must be at least 2 characters." }),
  motherOccupation: z.string().min(2, { message: "Mother's occupation is required." }),

  // === Physical Details (required per external form) ===
  age: z.number().min(1, { message: "Age must be at least 1." }).max(100, { message: "Age must be below 100." }),
  height: z.number().min(30, { message: "Height must be at least 30 cm." }),
  weight: z.number().min(1, { message: "Weight must be at least 1 kg." }),
  sex: z.enum(["Male", "Female", "Other"]),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),

  // === Physical Details (optional) ===
  bmi: z.string().optional(), // BMI - optional

  // === Activities & Motive ===
  activitiesShort: z.string().max(20, { message: "Max 20 characters." }).optional(),
  activitiesDetail: z.string().max(200, { message: "Max 200 characters." }).optional(),
  motive: z.string().min(10, { message: "Motive must be at least 10 characters." }),

  // === Venue & Agreement ===
  partnerId: z.string().optional(),
  agreement: z.boolean().refine(val => val === true, { message: "You must agree to the terms." }),
});

import { submitOnboarding } from "@/actions/onboarding-actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function EnrollForm({ className, initialData, isEditMode = false }: { className?: string, initialData?: any, isEditMode?: boolean }) {
  const router = useRouter();
  const [partners, setPartners] = useState<Array<{ id: string; name: string; location: string }>>([]);
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialData || {
      username: "",
      usernameBn: "",
      fatherName: "",
      fatherOccupation: "",
      motherName: "",
      motherOccupation: "",
      address: "",
      permanentAddress: "",
      zipCode: "",
      phone: "",
      email: "",
      emergencyContact: "",
      emergencyPhone: "",
      emergencyRelation: "",
      dob: "",
      age: 0,
      height: 0,
      weight: 0,
      sex: undefined,
      bloodGroup: undefined,
      nationality: "",
      religion: "",
      nid: "",
      occupation: "",
      institute: "",
      faculty: "",
      dept: "",
      levelClass: "",
      rollId: "",
      session: "",
      bmi: "",
      activitiesShort: "",
      activitiesDetail: "",
      motive: "",
      partnerId: undefined,
      agreement: false,
    },
  });

  // Fetch partners on mount
  useEffect(() => {
    async function fetchPartners() {
      try {
        const response = await fetch('/api/partners');
        if (response.ok) {
          const data = await response.json();
          setPartners(data);
        }
      } catch (error) {
        console.error('Failed to fetch partners:', error);
      }
    }
    fetchPartners();
  }, []);

  // Reset form values when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      toast({
        title: "Submitting...",
        description: "Please wait while we process your registration.",
      });
      
      const result = await submitOnboarding(data);
      
      if (result.success) {
          toast({
              title: "Success!",
              description: result.message,
          });
          // Refresh to get updated server data, then redirect
          router.refresh();
          // Redirect based on mode
          if (isEditMode) {
            router.push("/onboarding"); // Go back to status view after edit
          } else {
            router.push("/dashboard"); // New registrations go to dashboard
          }
      } else {
          toast({
              title: "Submission Failed",
              description: result.message,
              variant: "destructive",
          });
      }
    } catch (error) {
       toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
       });
    }
  }

  return (
    <MaxWidthWrapper>
      <Card className={cn("w-full", className)}>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2"
            >
              {/* ========== LEFT COLUMN ========== */}
              <div className="space-y-4">
                {/* — Personal Info — */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your public display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="usernameBn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>নাম (বাংলায়)</FormLabel>
                      <FormControl>
                        <Input placeholder="আপনার পূর্ণ নাম বাংলায় লিখুন" {...field} />
                      </FormControl>
                      <FormDescription>
                        Full name in Bangla.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* — Family — */}
                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father&apos;s Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your father's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fatherOccupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father&apos;s Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your father's occupation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother&apos;s Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your mother's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motherOccupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother&apos;s Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your mother's occupation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* — Address — */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Present Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter your present address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="permanentAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permanent Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter your permanent address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your zip code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* — Contact — */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* — Physical — */}
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter your age"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter your height"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter your weight"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bmi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BMI (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 21.5" {...field} />
                      </FormControl>
                      <FormDescription>
                        Body Mass Index — auto-calculated if height/weight provided.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* — Activities & Motive — */}
                <div className="rounded-md border p-4 space-y-4">
                  <h4 className="text-sm font-medium">Activities & Motive</h4>
                  <FormField
                    control={form.control}
                    name="activitiesShort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activities — Short (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Football, Reading" maxLength={20} {...field} />
                        </FormControl>
                        <FormDescription>
                          Max 20 characters — brief summary.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="activitiesDetail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activities — Detailed (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your activities, hobbies, and interests..." maxLength={200} {...field} />
                        </FormControl>
                        <FormDescription>
                          Max 200 characters.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motive for Training</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Why do you want to learn karate? Describe your motivation and goals..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ========== RIGHT COLUMN ========== */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Blood Group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your nationality" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="religion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religion</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your religion" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NID / Birth Cert. / Passport No.</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your ID number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* — Academic / Work — */}
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your occupation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="institute"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institute</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your institute" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="faculty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faculty / Section (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Science, Arts" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Physics, CSE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="levelClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level / Class</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., HSC, Class 10, Year 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rollId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID / Roll No.</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your student ID or roll number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="session"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2021-22" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* — Emergency Contact — */}
                <div className="rounded-md border p-4 space-y-4">
                  <h4 className="text-sm font-medium">Emergency Contact</h4>
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency contact phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyRelation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Father, Mother, Spouse" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* — Venue — */}
                <FormField
                  control={form.control}
                  name="partnerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Venue</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select training venue" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partners.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.name} - {partner.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select your preferred training location
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* — Agreement & Submit — */}
                <FormField
                  control={form.control}
                  name="agreement"
                  render={({ field }) => (
                    <FormItem className="shadow flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          User agreement to terms and conditions.
                        </FormLabel>
                        <FormDescription>
                          I agree to the{" "}
                          <Link href="/blog/rules">terms and conditions</Link>{" "}
                          page.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <div className="flex w-full justify-end">
                  <Button type="submit" className="ml-auto">
                    Register
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </MaxWidthWrapper>
  );
}
