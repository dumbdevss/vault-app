import React from 'react';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title = "Coming Soon", 
  description = "Are you Ready to get something new from us. Then subscribe the news letter to get latest updates?" 
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center">
      <div className="w-full space-y-8">
        {/* Coming Soon Image */}
        <div className="flex justify-center">
          <img 
            src="/coming_soon.png" 
            alt="Coming Soon" 
            className="w-48 h-48 object-contain"
          />
        </div>
        
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        
        {/* Description */}
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
        
        {/* Newsletter Subscription */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            We'll notify you when this feature is ready!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
