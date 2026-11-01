// A payment QR that can die. The reference woven into it is only good for one
// sitting and the encoder that draws it belongs to somebody else, so the tile
// keeps the countdown, the regenerate action and the second-provider fallback
// in one place instead of each checkout re-inventing them.
import { useEffect, useState } from "react";
import { Clock, RefreshCw, TriangleAlert } from "lucide-react";
import { qrCountdown, qrExpired, qrImageFallbackUrl, qrImageUrl, qrLifetimeMs, type QrTicket } from "./mentorship";

export default function PaymentQr({
  ticket,
  uri,
  alt,
  size = 224,
  onRegenerate,
  onExpire,
}: {
  ticket: QrTicket;
  uri: string;
  alt: string;
  size?: number;
  onRegenerate: () => void;
  onExpire?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [fallback, setFallback] = useState(false);
  const expired = qrExpired(ticket, now);
  const raster = size * 2;

  useEffect(() => {
    setNow(Date.now());
    setFallback(false);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [ticket.reference, ticket.issuedAt]);

  useEffect(() => { if (expired) onExpire?.(); }, [expired]);

  return (
    <div className={`payqr${expired ? " payqr-dead" : ""}`}>
      {expired ? (
        <div className="payqr-dead-panel" role="status">
          <TriangleAlert size={18} />
          <strong>Code expired</strong>
          <span>
            {ticket.reference} is older than the {Math.round(qrLifetimeMs / 60000)} minute window, so it is retired.
            Generate a fresh code and pay against that one.
          </span>
          <button className="payqr-refresh" type="button" onClick={onRegenerate}>
            <RefreshCw size={14} /> Generate a new QR
          </button>
        </div>
      ) : (
        <img
          className="payqr-img"
          src={fallback ? qrImageFallbackUrl(uri, raster) : qrImageUrl(uri, raster)}
          alt={alt}
          width={size}
          height={size}
          onError={() => setFallback(true)}
        />
      )}
      <p className="payqr-meter">
        <Clock size={12} />
        <span>{expired ? "Expired" : `Live for ${qrCountdown(ticket, now)}`}</span>
        {fallback && !expired && <em>drawn by the backup encoder</em>}
      </p>
    </div>
  );
}
