"use client";

import React, { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import Footer from '../../components/Footer';

function ContactPageContent() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-16 px-4">
        <div className="w-full max-w-2xl bg-white/90 rounded-2xl shadow-2xl p-8 md:p-12 animate-fade-in-up">
          <h1 className="text-4xl font-extrabold mb-4 text-rose-700 text-center">Contact Aba Traders</h1>
          <p className="text-lg text-gray-700 mb-8 text-center">Have a question, suggestion, or want to get in touch? Fill out the form below or email us at <a href="mailto:contact@abatraders.com" className="text-blue-600 underline">contact@abatraders.com</a>.</p>
          {submitted ? (
            <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center font-semibold">Thank you for reaching out! We'll get back to you soon.</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" id="name" name="name" required value={form.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition" placeholder="Your Name" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" id="email" name="email" required value={form.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition" placeholder="you@email.com" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea id="message" name="message" required rows={5} value={form.message} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition" placeholder="Type your message here..." />
              </div>
              <button type="submit" className="w-full bg-rose-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-700 transition text-lg shadow-md">Send Message</button>
            </form>
          )}
          <div className="mt-12 text-gray-600 text-center">
            <h2 className="text-xl font-semibold mb-2 text-rose-700">Contact Information</h2>
            <p>Email: <a href="mailto:contact@abatraders.com" className="text-blue-600 underline">contact@abatraders.com</a></p>
            <p>Address: Aba, Abia State, Nigeria</p>
          </div>
        </div>
      </main>
      <Footer footerCategories={[
        { title: 'Markets', link: '/markets' },
        { title: 'Businesses', link: '/businesses' },
        { title: 'Products', link: '/products' },
        { title: 'Services', link: '/services' },
      ]} />
    </div>
  );
}

export default ContactPageContent; 