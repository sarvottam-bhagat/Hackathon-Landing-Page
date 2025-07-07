
import React, { useRef } from "react";

const HumanIntuitionSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-12 bg-gray-50" id="human-intuition" ref={sectionRef}>
      <div className="section-container opacity-0 animate-on-scroll">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <div className="pulse-chip mb-4">
              <span>Intelligent Retrieval</span>
            </div>
            <h2 className="section-title mb-6">Beyond keyword search to contextual understanding</h2>
            <p className="text-lg text-gray-700 mb-6">
              RAG AI goes beyond simple keyword matching to develop deep contextual awareness and 
              semantic understanding patterns that mirror human comprehension. This enables natural 
              information retrieval that feels like consulting with a knowledgeable expert rather than searching a database.
            </p>
            <ul className="space-y-4">
              {[
                "Learns from user queries and refines retrieval accuracy over time",
                "Anticipates information needs based on context and previous searches",
                "Adapts to domain-specific terminology without manual configuration",
                "Provides answers with nuanced understanding of query intent and context"
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <div className="mr-3 text-pulse-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HumanIntuitionSection;
