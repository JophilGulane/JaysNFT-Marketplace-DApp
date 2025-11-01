import React, { useEffect } from 'react';

type ParticleBackgroundProps = {
  id?: string;
};

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ id = 'tsparticles' }) => {
  useEffect(() => {
    if (!(window as any).tsParticles) {
      return;
    }
    
    (window as any).tsParticles.load({
      id,
      options: {
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: 'grab',
            },
            resize: {
              enable: true,
            }
          },
          modes: {
            grab: {
              distance: 140,
              links: {
                opacity: 0.7,
                color: '#ffffff',
              },
            },
          },
        },
        particles: {
          color: {
            value: '#ffffff',
          },
          links: {
            color: '#ffffff',
            distance: 150,
            enable: true,
            opacity: 0.2,
            width: 1,
          },
          move: {
            direction: 'none',
            enable: true,
            outModes: {
              default: 'bounce',
            },
            random: false,
            speed: 1,
            straight: false,
          },
          number: {
            density: {
              enable: true,
            },
            value: 80,
          },
          opacity: {
            value: 0.5,
          },
          shape: {
            type: 'circle',
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
        background: {
          color: 'transparent'
        }
      },
    });
    
    return () => {
      // Cleanup on unmount
      if ((window as any).tsParticles) {
        try {
          const containers = (window as any).tsParticles.dom(id);
          if (containers && containers.length > 0) {
            containers.forEach((container: any) => {
              if (container && container.destroy) {
                container.destroy();
              }
            });
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [id]);

  return <div id={id} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" />;
};

export default ParticleBackground;
