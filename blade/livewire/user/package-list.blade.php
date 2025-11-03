<div class="min-h-screen bg-gray-50">
    {{-- Page Header --}}
    <section class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button onclick="window.history.back()"
                    class="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back
            </button>

            <div>
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
                    @if ($partner)
                        {{ $partner->name }}'s Properties
                    @else
                        Property Listings
                    @endif
                </h1>
                @if ($partner)
                    <p class="text-sm text-gray-600 mt-1">
                        Showing all properties by {{ $partner->name }}
                    </p>
                @endif
            </div>
        </div>
    </section>
    {{-- Main Content --}}
    <section class="py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {{-- Sidebar Filters --}}
                <aside class="lg:col-span-1">
                    <div class="bg-white rounded-lg shadow-sm p-4 sticky top-4">
                        <h2 class="text-base font-semibold text-gray-900 mb-4">Filter Properties</h2>

                        <form wire:submit.prevent="search" class="space-y-4">
                            <div>
                                <label for="city" class="block text-xs font-medium text-gray-700 mb-1">City</label>
                                <select wire:model.live="selectedCity" id="city"
                                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">All Cities</option>
                                    @foreach ($cities as $city)
                                        <option value="{{ $city->id }}">{{ $city->name }}</option>
                                    @endforeach
                                </select>
                            </div>

                            <div>
                                <label for="area" class="block text-xs font-medium text-gray-700 mb-1">Area</label>
                                <select wire:model.live="selectedArea" id="area"
                                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">All Areas</option>
                                    @foreach ($areas as $area)
                                        <option value="{{ $area->id }}">{{ $area->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </form>
                    </div>
                </aside>

                {{-- Property List --}}
                <div class="lg:col-span-3">
                    @if ($packages)
                        {{-- Results Header --}}
                        <div class="mb-6">
                            <p class="text-sm text-gray-600">
                                Found <span class="font-semibold text-gray-900">{{ $packages->total() }}</span> properties
                            </p>
                        </div>

                        {{-- Property Grid --}}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            @forelse($packages as $package)
                                <a href="{{ $package->getShowUrl() }}"
                                   wire:key="package-{{ $package->id }}"
                                   class="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                                    {{-- Image --}}
                                    <div class="relative h-48 overflow-hidden bg-gray-200">
                                        @if ($package->photos->isNotEmpty())
                                            <img src="{{ asset('storage/' . $package->photos->first()->url) }}"
                                                 alt="{{ $package->name }}"
                                                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                                        @else
                                            <div class="w-full h-full flex items-center justify-center bg-gray-300">
                                                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                                </svg>
                                            </div>
                                        @endif

                                        @if($package->status)
                                            <div class="absolute top-3 left-3">
                                                <span class="inline-block px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded">
                                                    {{ $package->status }}
                                                </span>
                                            </div>
                                        @endif
                                    </div>

                                    {{-- Content --}}
                                    <div class="p-4">
                                        <h3 class="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                                            {{ $package->name }}
                                        </h3>
                                        <p class="text-xs text-gray-600 mb-3 line-clamp-1">
                                            {{ $package->address }}
                                        </p>

                                        @php
                                            $roomPrices = $package->rooms->flatMap(fn($room) => $room->prices);
                                            $roomPriceData = $this->getFirstAvailablePrice($roomPrices);
                                            $propertyPriceData = $this->getFirstAvailablePrice($package->entireProperty->prices ?? collect());
                                        @endphp

                                        {{-- Price --}}
                                        <div class="mb-3">
                                            @if ($propertyPriceData)
                                                <div class="flex items-baseline gap-2">
                                                    @if ($propertyPriceData['price']->discount_price)
                                                        <span class="text-xs text-gray-400 line-through">£{{ $propertyPriceData['price']->fixed_price }}</span>
                                                        <span class="text-lg font-bold text-gray-900">£{{ $propertyPriceData['price']->discount_price }}</span>
                                                    @else
                                                        <span class="text-lg font-bold text-gray-900">£{{ $propertyPriceData['price']->fixed_price }}</span>
                                                    @endif
                                                    <span class="text-xs text-gray-500">{{ $this->getPropertyPriceIndicator($propertyPriceData['type']) }}</span>
                                                </div>
                                            @elseif($roomPriceData)
                                                <div class="flex items-baseline gap-2">
                                                    @if ($roomPriceData['price']->discount_price)
                                                        <span class="text-xs text-gray-400 line-through">£{{ $roomPriceData['price']->fixed_price }}</span>
                                                        <span class="text-lg font-bold text-gray-900">£{{ $roomPriceData['price']->discount_price }}</span>
                                                    @else
                                                        <span class="text-lg font-bold text-gray-900">£{{ $roomPriceData['price']->fixed_price }}</span>
                                                    @endif
                                                    <span class="text-xs text-gray-500">{{ $this->getPriceIndicator($roomPriceData['type']) }}</span>
                                                </div>
                                            @endif
                                        </div>

                                        {{-- Features --}}
                                        <div class="flex items-center gap-4 text-xs text-gray-600 pt-3 border-t border-gray-100">
                                            <span class="flex items-center gap-1">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                                </svg>
                                                {{ $package->rooms->count() }} Rooms
                                            </span>
                                            <span class="flex items-center gap-1">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
                                                </svg>
                                                {{ $package->common_bathrooms }} Baths
                                            </span>
                                            @if ($package->seating)
                                                <span class="flex items-center gap-1">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                                    </svg>
                                                    {{ $package->seating }}
                                                </span>
                                            @endif
                                        </div>
                                    </div>
                                </a>
                            @empty
                                <div class="col-span-2">
                                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                                        <svg class="w-12 h-12 text-blue-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                                        </svg>
                                        <p class="text-sm font-medium text-blue-800">No properties found</p>
                                        <p class="text-xs text-blue-600 mt-1">Try adjusting your filters</p>
                                    </div>
                                </div>
                            @endforelse
                        </div>

                        {{-- Pagination --}}
                        @if($packages->hasPages())
                            <div class="mt-8 flex justify-center">
                                <nav class="flex items-center gap-1">
                                    {{-- Previous --}}
                                    @if ($packages->previousPageUrl())
                                        <a href="{{ $packages->previousPageUrl() }}"
                                           class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                            </svg>
                                        </a>
                                    @endif

                                    {{-- Pages --}}
                                    @foreach (range(1, $packages->lastPage()) as $page)
                                        @if ($page == $packages->currentPage())
                                            <span class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md">
                                                {{ $page }}
                                            </span>
                                        @else
                                            <a href="{{ $packages->url($page) }}"
                                               class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                                {{ $page }}
                                            </a>
                                        @endif
                                    @endforeach

                                    {{-- Next --}}
                                    @if ($packages->nextPageUrl())
                                        <a href="{{ $packages->nextPageUrl() }}"
                                           class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                            </svg>
                                        </a>
                                    @endif
                                </nav>
                            </div>
                        @endif
                    @else
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                            <p class="text-sm font-medium text-yellow-800">No properties available</p>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </section>
</div>
