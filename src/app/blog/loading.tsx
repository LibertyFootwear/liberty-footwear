export default function BlogLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero */}
      <div className="bg-navy py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <div className="h-4 w-24 bg-white/20 rounded mx-auto" />
          <div className="h-8 w-64 bg-white/20 rounded mx-auto" />
          <div className="h-4 w-96 bg-white/10 rounded mx-auto" />
        </div>
      </div>

      {/* Cards */}
      <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-[16/9] bg-gray-100" />
              <div className="p-6 space-y-3">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-5 w-full bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
