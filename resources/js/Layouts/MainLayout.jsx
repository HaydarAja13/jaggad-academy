import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import CartSync from '../Components/CartSync';
import { useContent } from '../Contexts/ContentContext';

export default function MainLayout({ children, hideNavbar = false, hideFooter = false, previewMode = false }) {
    const { content } = useContent();
    const whatsappNumber = (content?.contact?.phone || '').replace(/[^0-9]/g, '');
    const showWhatsappButton = whatsappNumber && !route().current('contact') && !route().current('consultations.*');

    return (
        <div className="guest-theme min-h-screen bg-[var(--color-bg)] flex flex-col">
            {!previewMode && <CartSync />}
            {!hideNavbar && <Navbar previewMode={previewMode} />}
            <main className="flex-grow w-full">
                {children}
            </main>
            {!hideFooter && <Footer />}
            
            {/* WhatsApp Chat Button */}
            {!previewMode && showWhatsappButton && (
                <div className="fixed bottom-6 right-6 z-50">
                    <a 
                        href={`https://wa.me/${whatsappNumber}`} 
                        target="_blank" 
                        rel="noreferrer"
                        aria-label="Hubungi JAGGAD Academy melalui WhatsApp"
                        className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform hover:shadow-red-600/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-700 motion-reduce:transition-none motion-reduce:hover:scale-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
                    </a>
                </div>
            )}
        </div>
    );
}
