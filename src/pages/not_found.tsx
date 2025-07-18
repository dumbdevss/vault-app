import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotFoundIllustration = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="200"
        height="200"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
    >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="12" cy="12" r="3"></circle>
        <line x1="12" y1="0" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="24"></line>
        <line x1="0" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="24" y2="12"></line>
        <path d="M12 15c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"></path>
        <path d="M12 9c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"></path>
        <path d="M15 12c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3zm-4 0c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1z"></path>
        <path d="M9 12c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3zm4 0c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z"></path>
    </svg>
);

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-foreground">
            <div className="text-center flex flex-col items-center space-y-4">
                <NotFoundIllustration />
                <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
                <p className="text-muted-foreground">
                    Oops! The page you're looking for doesn't exist.
                </p>
                <Button asChild>
                    <Link to="/">Go Back Home</Link>
                </Button>
            </div>
        </div>
    );
};

export default NotFoundPage;
