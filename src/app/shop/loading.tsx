export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-48 bg-gray-200 rounded mb-8" />

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block w-52 flex-shrink-0 space-y-3">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 w-full bg-gray-100 rounded" />
          ))}
        </aside>

        {/* Grid skeleton */}
        <div className="flex-1">
          <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  <div className="h-4 w-1/4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
