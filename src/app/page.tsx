import Link from "next/link";
import { ContactForm } from "./ContactForm";

export default function HomePage() {
  return (
    <div className="font-sans text-white bg-gradient-to-br from-[#0d021f] via-[#1b0538] to-[#2e0a5c] min-h-screen">
      <main>
        {/* Hero Section */}
        <section className="relative text-center py-28 bg-gradient-to-r from-[#2e0a5c]/80 via-[#3d1270]/60 to-[#4c1a85]/80 backdrop-blur-lg border-b border-purple-700/20 shadow-lg">
          <div className="container mx-auto px-6">
            <h1 className="text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-lg">
              Course Crafter
            </h1>
            <p className="text-xl max-w-2xl mx-auto mb-10 text-purple-200/80 leading-relaxed">
              Transform your ideas into structured, professional courses — powered by AI. Build engaging learning experiences instantly.
            </p>
            <Link
              href="/create"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-10 rounded-full hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-[#1b0538]/80 border-t border-purple-700/20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-12 text-purple-300">Our Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
              <div className="p-6 rounded-2xl bg-[#2e0a5c]/60 border border-purple-700/30 hover:scale-105 transition-all shadow-lg">
                <h3 className="text-2xl font-semibold mb-3 text-purple-200">AI-Powered Syllabus</h3>
                <p className="text-purple-100/80">
                  Automatically generate structured course outlines and lesson plans.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-[#2e0a5c]/60 border border-purple-700/30 hover:scale-105 transition-all shadow-lg">
                <h3 className="text-2xl font-semibold mb-3 text-purple-200">Smart Content Creation</h3>
                <p className="text-purple-100/80">
                  Create quizzes, summaries, and explanations tailored to learners.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-[#2e0a5c]/60 border border-purple-700/30 hover:scale-105 transition-all shadow-lg">
                <h3 className="text-2xl font-semibold mb-3 text-purple-200">Seamless Publishing</h3>
                <p className="text-purple-100/80">
                  Export your course to any platform in one click.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-gradient-to-r from-[#1b0538] via-[#2e0a5c] to-[#3d1270]">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-12 text-purple-300">Testimonials</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { text: "Course Crafter saved me weeks of work designing modules.", name: "Alex P." },
                { text: "Easy, intuitive, and fast. AI-generated quizzes are amazing.", name: "Priya K." },
                { text: "Finally a tool that bridges content creation with professional publishing.", name: "John D." },
              ].map((t, i) => (
                <div key={i} className="p-6 bg-[#3d1270]/70 rounded-2xl shadow-lg hover:shadow-xl transition">
                  <p className="text-purple-100 mb-4">"{t.text}"</p>
                  <span className="font-semibold text-purple-200">– {t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24 bg-[#1b0538]/80 border-t border-purple-700/20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-12 text-purple-300">Meet Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {["Anushka", "Abhishek", "Hemant", "Akash"].map((name) => (
                <div key={name} className="p-6 bg-[#2e0a5c]/60 rounded-2xl shadow-lg hover:scale-105 transition">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-700 flex items-center justify-center text-xl font-bold text-white">
                    {name[0]}
                  </div>
                  <h3 className="text-xl font-semibold mb-1 text-purple-200">{name}</h3>
                  <p className="text-purple-100/80">Course Expert</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 bg-gradient-to-b from-transparent to-[#2e0a5c]/50 border-t border-purple-700/20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6 text-purple-300">Contact Us</h2>
            <p className="max-w-2xl mx-auto text-lg text-purple-100 mb-10">
              Have a question, suggestion, or collaboration idea? Let’s build the future of learning together.
            </p>
            <div className="max-w-2xl mx-auto">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0d021f] border-t border-purple-700/20 py-10 mt-10">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold text-purple-300 mb-3">Course Crafter</h3>
            <p className="text-purple-100/80">
              Empowering educators and learners with AI-driven tools to design impactful courses.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-purple-300 mb-3">Resources</h3>
            <ul className="space-y-2 text-purple-100/80">
              <li><Link href="/create" className="hover:text-purple-400 transition">Create a Course</Link></li>
              <li><Link href="/features" className="hover:text-purple-400 transition">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-purple-400 transition">Pricing</Link></li>
              <li><Link href="/faq" className="hover:text-purple-400 transition">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold text-purple-300 mb-3">Connect With Us</h3>
            <ul className="space-y-2 text-purple-100/80">
              <li>Email: <a href="mailto:support@coursecrafter.ai" className="hover:text-purple-400">support@coursecrafter.ai</a></li>
              <li>Twitter: <a href="#" className="hover:text-purple-400">@CourseCrafterAI</a></li>
              <li>LinkedIn: <a href="#" className="hover:text-purple-400">Course Crafter</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 text-center text-purple-400/70 text-sm border-t border-purple-600/20 pt-6">
          © {new Date().getFullYear()} Course Crafter. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
 