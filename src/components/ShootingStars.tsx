import React from 'react';
import './ShootingStars.css';

const ShootingStars: React.FC = () => {
  return (
    <div className="shooting-stars-container">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="shooting-star"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${1 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
};

export default ShootingStars;

