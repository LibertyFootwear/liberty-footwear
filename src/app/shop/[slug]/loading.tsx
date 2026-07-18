export default function ProductLoading() {
  return (
    <div className="bg-white animate-pulse">
      <div className="bg-cream border-b border-cream-dark py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <div className="aspect-square bg-gray-100 rounded-2xl" />

          {/* Details */}
          <div className="space-y-4">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-10 w-48 bg-gray-200 rounded" />
            <div className="h-8 w-20 bg-gray-200 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
