"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section className="w-full bg-black py-16 px-6 md:px-10 flex flex-col items-center text-center">
      {/* Heading */}
      <h2
        className="text-base font-black uppercase tracking-widest text-white mb-6"
      >
        BE THE FIRST TO KNOW
      </h2>


      {submitted ? (
        <p className="text-sm text-gray-300">Thank you for subscribing!</p>
      ) : (
        <>
          {/* Input + Button */}
          <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col md:flex-row gap-3 md:gap-0">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              name="email"
              autoComplete="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address here"
              className="flex-1 bg-transparent border border-white/30 md:border-r-0 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:border-white transition-colors"
            />
            <button
              type="submit"
              className="bg-white text-black text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-gray-200 transition-colors whitespace-nowrap w-full md:w-auto"
            >
              SUBSCRIBE
            </button>
          </form>
        </>
      )}
            <p className="text-sm text-white/80 mb-6">
            <br></br>
        10% off your first order. Subscribe to stay tuned.
      </p>
    </section>
  );
}
