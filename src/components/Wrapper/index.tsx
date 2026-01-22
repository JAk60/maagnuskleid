import { ReactNode } from "react";

interface WrapperProps {
    children: ReactNode;
    className?: string;
}

const Wrapper = ({ children, className = "" }: WrapperProps) => {
    return (
        <div className={`w-full max-w-7xl px-5 md:px-10 mx-auto ${className}`}>
            {children}
        </div>
    );
};

export default Wrapper;
