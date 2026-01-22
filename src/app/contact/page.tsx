'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, ContactFormValues } from "@/lib/schemas/contactval";

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = (data: ContactFormValues) => {
    console.log("CUSTOMER MESSAGE:", data);
  };

  return (
    <main className="min-h-screen bg-[#E9DFCF] text-neutral-900">
      <section className="mx-auto max-w-225 px-8 py-32">
        <h1 className="mb-4 text-3xl font-light">Contact Us</h1>
        <p className="mb-20 max-w-md text-sm text-neutral-600">
          Have a question about your order, sizing, or anything else?  
          Send us a message and our team will get back to you.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-14">

          {/* Name */}
          <div className="grid grid-cols-2 gap-12">
            <Input
              label="FIRST NAME*"
              register={register("firstName")}
              error={errors.firstName}
            />

            <Input
              label="LAST NAME*"
              register={register("lastName")}
              error={errors.lastName}
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-12">
            <Input
              label="EMAIL*"
              register={register("email")}
              error={errors.email}
            />

            <Input
              label="PHONE (OPTIONAL)"
              register={register("phone")}
              error={errors.phone}
            />
          </div>

          {/* Message */}
          <div>
            <label className="mb-3 block text-[11px] tracking-[0.25em] text-neutral-500">
              MESSAGE*
            </label>
            <textarea
              {...register("message")}
              rows={5}
              className="w-full border-b border-neutral-400/60 bg-transparent pb-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
            {errors.message && (
              <span className="text-[11px] text-red-500">
                {errors.message.message}
              </span>
            )}
          </div>

          {/* Submit */}
          <div className="pt-10">
            <button
              type="submit"
              className="bg-neutral-800 px-12 py-3 text-sm text-white transition hover:bg-neutral-900"
            >
              Send Message
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

/* ----------------------- */
/* Input Component */
/* ----------------------- */
function Input({
  label,
  register,
  error,
}: {
  label: string;
  register: any;
  error?: any;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] tracking-[0.25em] text-neutral-500">
        {label}
      </label>

      <input
        {...register}
        className="border-b border-neutral-400/60 bg-transparent pb-2 text-sm focus:border-neutral-900 focus:outline-none"
      />

      {error && (
        <span className="text-[11px] text-red-500">
          {error.message}
        </span>
      )}
    </div>
  );
}
