'use client';

import React from 'react';

export function ContactForm() {
  return (
    <form className="max-w-xl mx-auto text-left" onSubmit={(e) => e.preventDefault()}>
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name</label>
        <input type="text" id="name" name="name" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
        <input type="email" id="email" name="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div className="mb-6">
        <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
        <textarea id="message" name="message" rows={5} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"></textarea>
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
        Send Message
      </button>
    </form>
  );
}