import { Heart } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
      <div className="px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-1 text-xs lg:text-sm text-muted-foreground flex-wrap justify-center">
            <span>Designed & Developed with</span>
            <Heart className="h-3 w-3 lg:h-4 lg:w-4 text-red-500 fill-red-500" />
            <span>by</span>
            <span className="font-semibold text-foreground">Mr. Anand Pinisetty</span>
          </div>
          <div className="text-xs text-muted-foreground">
            © {currentYear} ATA Client Management
          </div>
        </div>
      </div>
    </footer>
  );
};
