import QRCodeStyling from 'qr-code-styling';
import { useEffect, useRef } from 'react';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

interface DottedQrCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  errorCorrectionLevel?: ErrorCorrectionLevel;
}

export function DottedQrCode({
  value,
  size = 160,
  fgColor = 'rgba(211, 17, 17, 0.92)',
  bgColor = 'transparent',
  errorCorrectionLevel = 'H',
}: DottedQrCodeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const centerImageSrc = '/assets/go-symbol-1.png';
  useEffect(() => {
    if (!containerRef.current) return;
    if (!value) {
      containerRef.current.innerHTML = '';
      return;
    }

    // qr-code-styling appends into the container; clear it so we don't stack SVGs.
    containerRef.current.innerHTML = '';

    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      shape: 'square',
      type: 'svg',
      data: value,
      margin: 0,
      qrOptions: { errorCorrectionLevel },
      backgroundOptions: { color: '' },
      // image: centerImageSrc,
      // imageOptions: {
      //   crossOrigin: 'anonymous',
      //   // Keep the logo small so the QR remains reliably scannable.
      //   imageSize: 0.30,
      //   margin: 1,
      //   hideBackgroundDots: true,
      //   // Makes SVG embeds render more reliably across contexts.
      //   saveAsBlob: true,
      // },
      dotsOptions: {
        // Main modules as fewer, larger "dots".
        // Using a rounded fill makes the QR look less like many tiny circles.
        gradient: {
          type: 'linear',
          rotation: 0,
          colorStops: [
            {
              offset: 0,
              color: fgColor,
            },
            {
              offset: 1,
              color: 'rgba(0, 0, 0, 1)',
            },
          ],
        },
      },
      cornersSquareOptions: {
        // Bigger “corner boxes” for the dotted style.
        color: fgColor,
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        // Avoid extra corner-dot detail so corners look larger.
        color: fgColor,
        type: 'extra-rounded',
      },
    });

    qrCode.append(containerRef.current);

    return () => {
      containerRef.current && (containerRef.current.innerHTML = '');
    };
  }, [value, size, fgColor, bgColor, errorCorrectionLevel]);

  return <div ref={containerRef} aria-label="Ticket QR Code" />;
}

