import { Pub } from '@/types/pub';

interface PubCardProps {
  pub: Pub;
  isHappyHour: boolean;
}

export function PubCard({ pub, isHappyHour }: PubCardProps) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all hover:shadow-md ${
      isHappyHour ? 'border-green-400 bg-green-50' : 'border-amber-100'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-800">{pub.name}</h3>
        <div className="text-2xl font-bold text-amber-600">${pub.price}</div>
      </div>
      
      <p className="text-gray-600 text-sm mb-2">{pub.address}</p>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
          {pub.suburb}
        </span>
        {isHappyHour && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full animate-pulse">
            🍻 Happy Hour NOW!
          </span>
        )}
      </div>
      
      <div className="text-sm text-gray-500">
        <span className="font-medium">When:</span> {pub.times}
      </div>
      
      {pub.notes && (
        <div className="text-sm text-gray-500 mt-1">
          <span className="font-medium">Notes:</span> {pub.notes}
        </div>
      )}
    </div>
  );
}
