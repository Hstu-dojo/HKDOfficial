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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox";
import MaxWidthWrapper from "./maxWidthWrapper"
import Link from "next/link";

const FormSchema = z.object({
  // === Basic Information ===
  username: z.string().min(2, { message: "Name must be at least 2 characters." }),
  sex: z.enum(["Male", "Female", "Other"], { required_error: "Sex is required." }),
  nid: z.string().min(3, { message: "ID number is required." }),
  occupation: z.string().min(2, { message: "Occupation is required." }),
  institute: z.string().min(2, { message: "Institute is required." }),
  faculty: z.string().optional(),
  address: z.string().min(5, { message: "Present address must be at least 5 characters." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  dob: z.string().nonempty({ message: "Date of Birth is required." }),

  // === Venue & Agreement ===
  partnerId: z.string().min(1, { message: "Please select a training venue." }),
  agreement: z.boolean().refine(val => val === true, { message: "You must agree to the terms." }),
});

import { submitOnboarding } from "@/actions/onboarding-actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function EnrollForm({ className, initialData, isEditMode = false }: { className?: string, initialData?: any, isEditMode?: boolean }) {
  const router = useRouter();
  const [partners, setPartners] = useState<Array<{ id: string; name: string; location: string | null }>>([]);
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialData || {
      username: "",
      sex: undefined,
      nid: "",
      occupation: "",
      institute: "",
      faculty: "",
      address: "",
      phone: "",
      dob: "",
      partnerId: "",
      agreement: false,
    },
  });

  // Fetch active partners/venues for the dropdown
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
      <Card className={cn("relative bottom-36 w-full", className)}>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
            >
              {/* Basic details */}
              <div className="space-y-4">
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your phone number"
                          {...field}
                        />
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
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
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
                {/* Training Venue Selection */}
                <FormField
                  control={form.control}
                  name="partnerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Venue *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={isEditMode && !!initialData?.partnerId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your training venue" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partners.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.name}{partner.location ? ` — ${partner.location}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {isEditMode && initialData?.partnerId
                          ? "Venue cannot be changed here. Use \"Request Branch Change\" from your dashboard."
                          : "Select the partner venue where you will train."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
        {/* <CardFooter></CardFooter> */}
      </Card>
    </MaxWidthWrapper>
  );
}
