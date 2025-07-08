
import React from "react";

const SpecsSection = () => {
  return (
    <section className="w-full py-6 sm:py-10 bg-white" id="specifications">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        {/* Header with badge and line */}
        <div className="flex items-center gap-4 mb-8 sm:mb-16">
          <div className="flex items-center gap-4">
            <div className="pulse-chip">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pulse-500 text-white mr-2">3</span>
              <span>RAG Technology</span>
            </div>
          </div>
          <div className="flex-1 h-[1px] bg-gray-300"></div>
        </div>
        
        {/* Main content with text mask image - responsive text sizing */}
        <div className="max-w-5xl pl-4 sm:pl-8">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-display leading-tight mb-8 sm:mb-12">
            <span className="block bg-clip-text text-transparent bg-[url('/text-mask-image.jpg')] bg-cover bg-center">
              SILO AI provides various products to solve common problems faced by businesses.
              <br /><br />
              First, we have the Intelligent Document Processor which processes any document with the help of ABBYY's document API and is powered by RAG technology.
              <br /><br />
              Second, we have DEEP Research which conducts research on Google, blogs, X (Twitter), YouTube, LinkedIn, Reddit, Wikipedia, and Quora, scraping all results to provide you with detailed articles on your research topic.
              <br /><br />
              Third, we have Chat with CSV. Companies often struggle with large CSV data, but using our app you can query your database in natural language. It's like text-to-SQL.
              <br /><br />
              Fourth, we have Invoicebhejo.com, which allows you to send invoices in PDF format to anyone. It's powered by n8n, which sends the invoice to the customer's email and saves the PDF in your drive as well as saving the details in your Google Sheet.
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
};

export default SpecsSection;
