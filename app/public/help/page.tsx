'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, MessageCircle, Book, Phone, Mail, ChevronRight, ExternalLink, Search, CheckCircle, AlertCircle, Clock, TrendingUp, X } from 'lucide-react';

const faqs = [
    {
        question: 'How do I report an issue?',
        answer: 'Click the "Report Issue" button in the navigation bar, upload a photo of the issue, allow location detection or enter the address manually, and submit. Our AI will automatically categorize the issue for you.',
    },
    {
        question: 'How long does it take to resolve an issue?',
        answer: 'Resolution time varies based on the issue type and priority. Urgent issues like water leaks are typically addressed within 24-48 hours. General issues may take 3-7 business days.',
    },
    {
        question: 'Can I track my report status?',
        answer: 'Yes! Go to "My Reports" in the navigation menu to see all your submitted reports and their current status. You\'ll also receive notifications when the status changes.',
    },
    {
        question: 'What happens after I submit a report?',
        answer: 'Your report is reviewed by a civic officer who assigns it to an available technician in your area. The technician visits the location, resolves the issue, and uploads proof of completion.',
    },
    {
        question: 'Can I edit or delete my report?',
        answer: 'You can add additional information to pending reports. Once a report is assigned to a technician, it cannot be deleted. Contact support for special cases.',
    },
    {
        question: 'Is my personal information safe?',
        answer: 'Yes, we take privacy seriously. Your Aadhaar details are encrypted and only used for verification. Your reports are anonymous to technicians unless you choose to share contact information.',
    },
];

const guides = [
    {
        title: 'Getting Started Guide',
        desc: 'Learn the basics of using FixCity',
        icon: Book,
        content: (
            <div className="space-y-4">
                <p className="text-slate-600">Welcome to FixCity! We empower citizens to report and track civic issues directly. Here&apos;s how to get started:</p>
                <ol className="list-decimal list-inside space-y-3 text-slate-600 ml-2">
                    <li><strong className="text-slate-800">Login Securely:</strong> Use your Aadhaar number and OTP to access the dashboard.</li>
                    <li><strong className="text-slate-800">Report an Issue:</strong> Click the &quot;Report New Issue&quot; button. Upload a photo, and our AI will help categorize it. Verify the location and submit.</li>
                    <li><strong className="text-slate-800">Track Progress:</strong> Visit &quot;My Reports&quot; to see real-time updates on your submissions.</li>
                    <li><strong className="text-slate-800">Verify Resolution:</strong> Once resolved, you&apos;ll see proof of work uploaded by the technician.</li>
                </ol>
            </div>
        )
    },
    {
        title: 'Reporting Best Practices',
        desc: 'Tips for effective issue reporting',
        icon: MessageCircle,
        content: (
            <div className="space-y-6">
                <p className="text-slate-600">Help us solve issues faster by following these reporting tips:</p>
                <div className="grid gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="flex items-center gap-2 text-slate-800 font-bold mb-2">
                            <span className="text-green-600">✓</span> Clear Photos
                        </h4>
                        <p className="text-sm text-slate-500">Take photos during the day if possible. Ensure the problem is clearly visible and not obstructed.</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="flex items-center gap-2 text-slate-800 font-bold mb-2">
                            <span className="text-green-600">✓</span> Accurate Location
                        </h4>
                        <p className="text-sm text-slate-500">Use the &quot;Detect Location&quot; feature for GPS accuracy. If adding manually, include nearby landmarks.</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="flex items-center gap-2 text-slate-800 font-bold mb-2">
                            <span className="text-green-600">✓</span> Specific Description
                        </h4>
                        <p className="text-sm text-slate-500">Describe the severity (e.g., &quot;Deep pothole causing traffic&quot; vs &quot;Small crack&quot;).</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: 'Understanding Status Updates',
        desc: 'What each status means for your report',
        icon: HelpCircle,
        content: (
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="text-amber-700 font-bold text-sm">Pending Review</h4>
                        <p className="text-slate-600 text-sm">We&apos;ve received your report. A civic officer will review it shortly to assign a technician.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="text-blue-700 font-bold text-sm">In Progress</h4>
                        <p className="text-slate-600 text-sm">A technician has been assigned and is working on resolving the issue on-site.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                        <h4 className="text-green-700 font-bold text-sm">Resolved</h4>
                        <p className="text-slate-600 text-sm">The issue has been fixed! You can view the resolution notes and proof in the report details.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                        <h4 className="text-red-700 font-bold text-sm">Rejected</h4>
                        <p className="text-slate-600 text-sm">The report was invalid, duplicate, or out of our jurisdiction. Check the comments for details.</p>
                    </div>
                </div>
            </div>
        )
    },
];

export default function HelpPage() {
    const [selectedGuide, setSelectedGuide] = useState<typeof guides[0] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredGuides = guides.filter(guide =>
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="px-4 sm:px-6 py-8 mx-auto w-full max-w-[1024px]">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">How can we help?</h1>
                <p className="text-slate-500 max-w-xl mx-auto mb-8">
                    Find answers to common questions or get in touch with our support team
                </p>

                {/* Search */}
                <div className="max-w-xl mx-auto relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        className="w-full h-12 rounded-xl pl-12 pr-4 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white border border-slate-200 shadow-sm"
                        placeholder="Search for help..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Quick Links */}
            {(searchQuery === '' || filteredGuides.length > 0) && (
                <div className="grid md:grid-cols-3 gap-4 mb-12">
                    {filteredGuides.map((guide) => {
                        const Icon = guide.icon;
                        return (
                            <div
                                key={guide.title}
                                onClick={() => setSelectedGuide(guide)}
                                className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 cursor-pointer group hover:shadow-md hover:border-blue-200 transition-all"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-slate-800 font-bold mb-1 group-hover:text-blue-600 transition-colors">{guide.title}</h3>
                                    <p className="text-slate-500 text-sm">{guide.desc}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Guide Details Modal */}
            {selectedGuide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedGuide(null)}
                    />
                    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8">
                        <button
                            onClick={() => setSelectedGuide(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <selectedGuide.icon className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">{selectedGuide.title}</h2>
                        </div>

                        <div className="prose max-w-none">
                            {selectedGuide.content}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedGuide(null)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAQ Section */}
            {(searchQuery === '' || filteredFaqs.length > 0) && (
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {filteredFaqs.map((faq, index) => (
                            <details
                                key={index}
                                className="bg-white rounded-xl border border-slate-100 shadow-sm group"
                            >
                                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                                    <h3 className="text-slate-800 font-medium pr-4">{faq.question}</h3>
                                    <ChevronRight className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-90" />
                                </summary>
                                <div className="px-5 pb-5 pt-0 border-t border-slate-100">
                                    <p className="text-slate-600 text-sm leading-relaxed pt-4">{faq.answer}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            )}

            {/* Contact Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Still need help?</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center p-6 rounded-xl bg-slate-50 hover:bg-blue-50 transition-all border border-slate-100">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h3 className="text-slate-800 font-bold mb-2">Email Support</h3>
                        <p className="text-slate-500 text-sm mb-4">We&apos;ll respond within 24 hours</p>
                        <a href="mailto:support@fixcity.gov.in" className="text-blue-600 font-medium text-sm hover:underline">support@fixcity.gov.in</a>
                    </div>

                    <div className="text-center p-6 rounded-xl bg-slate-50 hover:bg-blue-50 transition-all border border-slate-100">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Phone className="w-6 h-6" />
                        </div>
                        <h3 className="text-slate-800 font-bold mb-2">Helpline</h3>
                        <p className="text-slate-500 text-sm mb-4">Available Mon-Sat, 9AM-6PM</p>
                        <a href="tel:1800-123-4567" className="text-blue-600 font-medium text-sm hover:underline">1800-123-4567</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
