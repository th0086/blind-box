import Image from 'next/image';

export function BlindBox() {
  return (
    <div className="bb-blind-box">
      <Image src="/blind_box.png" alt="Blind box" width={320} height={320} priority className="bb-blind-box-img" />
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}
