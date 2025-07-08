import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Prevent background scrolling when menu is open
    document.body.style.overflow = !isMenuOpen ? 'hidden' : '';
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Close mobile menu if open
    if (isMenuOpen) {
      setIsMenuOpen(false);
      document.body.style.overflow = '';
    }
  };

  const productItems = [
    { name: "IDP", url: "http://localhost:8081/" },
    { name: "Deep Research", url: "https://deep-research-jina-ai.vercel.app/" },
    { name: "Chat With CSV", url: "https://text-to-sql-od3d.onrender.com/" },
    { name: "InvoiceBhejo.com", url: "https://invoicebhejo-com.vercel.app/" }
  ];

  const handleProductClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsProductDropdownOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-2 sm:py-3 md:py-4 transition-all duration-300",
        isScrolled 
          ? "bg-white/80 backdrop-blur-md shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <a 
          href="#" 
          className="flex items-center space-x-2"
          onClick={(e) => {
            e.preventDefault();
            scrollToTop();
          }}
          aria-label="Pulse Robot"
        >
          <img 
            src="/logo.svg" 
            alt="Pulse Robot Logo" 
            className="h-7 sm:h-8" 
          />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          <a 
            href="#" 
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              scrollToTop();
            }}
          >
            Home
          </a>
          <div className="relative">
            <button 
              className="nav-link flex items-center space-x-1"
              onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
            >
              <span>Product</span>
              <ChevronDown size={16} className={cn(
                "transition-transform duration-200",
                isProductDropdownOpen && "rotate-180"
              )} />
            </button>
            {isProductDropdownOpen && (
              <div 
                className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                {productItems.map((item, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                    onClick={() => handleProductClick(item.url)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <a href="#features" className="nav-link">About</a>
          <a href="#details" className="nav-link">Contact</a>
          <a 
            href="https://docs.abbyy.com/introduction" 
            className="nav-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
        </nav>

        {/* Mobile menu button - increased touch target */}
        <button 
          className="md:hidden text-gray-700 p-3 focus:outline-none" 
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation - improved for better touch experience */}
      <div className={cn(
        "fixed inset-0 z-40 bg-white flex flex-col pt-16 px-6 md:hidden transition-all duration-300 ease-in-out",
        isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
      )}>
        <nav className="flex flex-col space-y-8 items-center mt-8">
          <a 
            href="#" 
            className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100" 
            onClick={(e) => {
              e.preventDefault();
              scrollToTop();
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
          >
            Home
          </a>
          <div className="w-full">
            <button 
              className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100 flex items-center justify-center space-x-2"
              onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
            >
              <span>Product</span>
              <ChevronDown size={20} className={cn(
                "transition-transform duration-200",
                isProductDropdownOpen && "rotate-180"
              )} />
            </button>
            {isProductDropdownOpen && (
              <div className="mt-2 space-y-2 bg-gray-50 rounded-lg p-2">
                {productItems.map((item, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 text-lg text-gray-700 hover:bg-white hover:text-gray-900 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      handleProductClick(item.url);
                      setIsMenuOpen(false);
                      document.body.style.overflow = '';
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <a 
            href="#features" 
            className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100" 
            onClick={() => {
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
          >
            About
          </a>
          <a 
            href="#details" 
            className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100" 
            onClick={() => {
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
          >
            Contact
          </a>
          <a 
            href="https://docs.abbyy.com/introduction" 
            className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              setIsMenuOpen(false);
              document.body.style.overflow = '';
            }}
          >
            Docs
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
