'use client'
import { MessageCircle } from "lucide-react";

export default function FloatingWhatsApp() {
  const handleWhatsAppClick = () => {
    // Replace with your WhatsApp number (include country code without + sign)
    const phoneNumber = "1234567890";
    const message = "Hello! I'm interested in your services.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleWhatsAppClick}
        className="group relative bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-pulse hover:animate-none"
        aria-label="Contact us on WhatsApp"
      >
        {/* WhatsApp Icon */}
        <MessageCircle className="w-6 h-6" />
        
        {/* Ripple Effect */}
        <div className="absolute inset-0 rounded-full bg-green-500 opacity-30 animate-ping"></div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-800 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
            Chat with us on WhatsApp
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </button>
    </div>
  );
}