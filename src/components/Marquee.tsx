import React from 'react';

interface Message {
  text: string;
  icon?: string;
}

interface MarqueeProps {
  messages?: Message[];
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

const Marquee: React.FC<MarqueeProps> = ({ 
  messages = [], 
  speed = 'normal',
  className = '' 
}) => {
  const speedClass = {
    slow: 'animate-[scroll_40s_linear_infinite]',
    normal: 'animate-[scroll_20s_linear_infinite]',
    fast: 'animate-[scroll_10s_linear_infinite]'
  }[speed];

  const renderMessages = (keyPrefix: string) => (
    <>
      {messages.map((message, index) => (
        <div
          key={`${keyPrefix}-${index}`}
          className="flex items-center mx-8 text-white text-sm font-medium"
        >
          {message.icon && (
            <span className="mr-2 text-lg">{message.icon}</span>
          )}
          <span>{message.text}</span>
        </div>
      ))}
    </>
  );

  return (
    <div className={`relative overflow-hidden bg-gray-900 py-3 ${className}`}>
      <div className={`flex whitespace-nowrap ${speedClass}`}
           style={{
             animation: speed === 'slow' ? 'scroll 40s linear infinite' :
                       speed === 'fast' ? 'scroll 10s linear infinite' :
                       'scroll 20s linear infinite'
           }}>
        {renderMessages('set1')}
        {renderMessages('set2')}
      </div>
      
      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default Marquee;