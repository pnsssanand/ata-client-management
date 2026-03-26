import { Heart, Code2 } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
      <div className="px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-1.5 text-xs lg:text-sm text-muted-foreground flex-wrap justify-center">
            <Code2 className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary" />
            <span className="font-medium">Software designed and developed by</span>
            <span className="font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded">Mr. Anand Pinisetty</span>
          </div>
          <div className="text-xs text-muted-foreground">
            © {currentYear} ATA Client Management. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
