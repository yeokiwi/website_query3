import StatusBadge from './StatusBadge.jsx';

export default function ChangeCard({ text, type }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-base-lighter/50 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="mt-0.5">
        <StatusBadge type={type} />
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
