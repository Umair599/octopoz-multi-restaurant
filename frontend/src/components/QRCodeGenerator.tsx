import React from 'react';
import QRCode from 'react-qr-code';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  size = 256
}) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div style={{ height: "auto", margin: "0 auto", maxWidth: size, width: "100%" }}>
        <QRCode
          size={256}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          value={value}
          viewBox={`0 0 256 256`}
        />
      </div>
      <p className="text-sm text-gray-600 text-center max-w-sm">
        Scan this QR code with your phone to view the menu and place orders directly from your table
      </p>
    </div>
  );
};

export default QRCodeGenerator;
