<div class="min-h-screen bg-gray-50">
    {{-- Hero Section with Search --}}
    <section class="relative bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden">
        <div class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
             style="background-image: url('{{ asset('storage/' . $heroSection->background_image) }}');"></div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div class="text-center mb-8">
                <p class="text-blue-100 text-xs sm:text-sm font-medium tracking-wider uppercase mb-2">
                    {{ $heroSection->title_small }}
                </p>
                <h1 class="text-white text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                    {{ $heroSection->title_big }}
                </h1>
            </div>

            {{-- Search Form --}}
            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-lg shadow-xl p-4 sm:p-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">City</label>
                            <select wire:model.live="selectedCity"
                                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Select City</option>
                                @foreach($cities as $city)
                                    <option value="{{ $city->id }}">{{ $city->name }}</option>
                                @endforeach
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Area</label>
                            <select wire:model.live="selectedArea"
                                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Select Area</option>
                                @foreach($areas as $area)
                                    <option value="{{ $area->id }}">{{ $area->name }}</option>
                                @endforeach
                            </select>
                        </div>

                        <div class="sm:col-span-2 lg:col-span-1">
                            <label class="block text-xs font-medium text-gray-700 mb-1">&nbsp;</label>
                            <button wire:click="searchPackages"
                                    class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition duration-150">
                                Search Properties
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {{-- Search Results --}}
    @if($packages && $packages->count() > 0)
    <section id="filterPackage" class="py-8 sm:py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Search Results</h2>
                <p class="text-sm text-gray-600 mt-1">{{ $packages->count() }} properties found</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                @foreach($packages as $package)
                <a href="{{ $package->getShowUrl() }}"
                   class="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                    {{-- Image --}}
                    <div class="relative h-48 overflow-hidden bg-gray-200">
                        @if($package->photos->isNotEmpty())
                            <img src="{{ asset('storage/'.$package->photos->first()->url) }}"
                                 alt="{{ $package->name }}"
                                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                        @else
                            <div class="w-full h-full flex items-center justify-center bg-gray-300">
                                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
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
                            $roomPrice = $roomPriceData['price'] ?? null;
                            $roomPriceType = $roomPriceData['type'] ?? null;
                            $roomPriceIndicator = $roomPriceType ? $this->getPriceIndicator($roomPriceType) : '';

                            $propertyPrices = $package->entireProperty->prices ?? [];
                            $propertyPriceData = $this->getFirstAvailablePrice($propertyPrices);
                            $propertyPrice = $propertyPriceData['price'] ?? null;
                            $propertyPriceType = $propertyPriceData['type'] ?? null;
                            $propertyPriceIndicator = $propertyPriceType ? $this->getPropertyPriceIndicator($propertyPriceType) : '';
                        @endphp

                        {{-- Price --}}
                        <div class="mb-3">
                            @if($propertyPrice)
                                <div class="flex items-baseline gap-2">
                                    @if($propertyPrice->discount_price)
                                        <span class="text-xs text-gray-400 line-through">£{{ $propertyPrice->fixed_price }}</span>
                                        <span class="text-lg font-bold text-gray-900">£{{ $propertyPrice->discount_price }}</span>
                                    @else
                                        <span class="text-lg font-bold text-gray-900">£{{ $propertyPrice->fixed_price }}</span>
                                    @endif
                                    <span class="text-xs text-gray-500">{{ $propertyPriceIndicator }}</span>
                                </div>
                            @elseif($roomPrice)
                                <div class="flex items-baseline gap-2">
                                    @if($roomPrice->discount_price)
                                        <span class="text-xs text-gray-400 line-through">£{{ $roomPrice->fixed_price }}</span>
                                        <span class="text-lg font-bold text-gray-900">£{{ $roomPrice->discount_price }}</span>
                                    @else
                                        <span class="text-lg font-bold text-gray-900">£{{ $roomPrice->fixed_price }}</span>
                                    @endif
                                    <span class="text-xs text-gray-500">{{ $roomPriceIndicator }}</span>
                                </div>
                            @endif
                        </div>

                        {{-- Features --}}
                        <div class="flex items-center gap-4 text-xs text-gray-600">
                            @if (!$propertyPrice)
                                <div class="flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                    </svg>
                                    <span>{{ $package->rooms->count() }} Rooms</span>
                                </div>
                            @else
                                <div class="flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                    </svg>
                                    <span>{{ $package->number_of_rooms }} Rooms</span>
                                </div>
                            @endif
                            <div class="flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
                                </svg>
                                <span>{{ $package->common_bathrooms }} Bath</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                <span>{{ $package->seating }}</span>
                            </div>
                        </div>
                    </div>
                </a>
                @endforeach
            </div>
        </div>
    </section>
    @endif

    @if($noPackagesFound)
    <section id="filterPackage" class="py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <svg class="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <p class="text-sm font-medium text-yellow-800">No properties found matching your criteria.</p>
                <p class="text-xs text-yellow-600 mt-1">Try adjusting your search filters.</p>
            </div>
        </div>
    </section>
    @endif

    {{-- Featured Packages Section --}}
    <section class="py-12 sm:py-16 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                    <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Featured Properties</h2>
                    <p class="text-sm text-gray-600 mt-1">Discover our best rental options</p>
                </div>
                <a href="{{ route('package.list') }}"
                   class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                    View All
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </a>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                @foreach($featuredPackages as $package)
                <a href="{{ $package->getShowUrl() }}"
                   class="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
                    {{-- Image --}}
                    <div class="relative h-44 overflow-hidden bg-gray-200">
                        @if($package->photos->isNotEmpty())
                            <img src="{{ asset('storage/'.$package->photos->first()->url) }}"
                                 alt="{{ $package->name }}"
                                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                        @else
                            <div class="w-full h-full flex items-center justify-center bg-gray-300">
                                <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                            </div>
                        @endif
                    </div>

                    {{-- Content --}}
                    <div class="p-3">
                        <h3 class="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                            {{ $package->name }}
                        </h3>
                        <p class="text-xs text-gray-600 mb-2 line-clamp-1">
                            {{ $package->address }}
                        </p>

                        @php
                            $roomPrices = $package->rooms->flatMap(fn($room) => $room->prices);
                            $roomPriceData = $this->getFirstAvailablePrice($roomPrices);
                            $roomPrice = $roomPriceData['price'] ?? null;
                            $roomPriceType = $roomPriceData['type'] ?? null;
                            $roomPriceIndicator = $roomPriceType ? $this->getPriceIndicator($roomPriceType) : '';

                            $propertyPrices = $package->entireProperty->prices ?? [];
                            $propertyPriceData = $this->getFirstAvailablePrice($propertyPrices);
                            $propertyPrice = $propertyPriceData['price'] ?? null;
                            $propertyPriceType = $propertyPriceData['type'] ?? null;
                            $propertyPriceIndicator = $propertyPriceType ? $this->getPropertyPriceIndicator($propertyPriceType) : '';
                        @endphp

                        {{-- Price --}}
                        @if($propertyPrice)
                            <div class="mb-2">
                                @if($propertyPrice->discount_price)
                                    <div class="flex items-baseline gap-1">
                                        <span class="text-xs text-gray-400 line-through">£{{ $propertyPrice->fixed_price }}</span>
                                        <span class="text-base font-bold text-gray-900">£{{ $propertyPrice->discount_price }}</span>
                                    </div>
                                    <span class="text-xs text-gray-500">{{ $propertyPriceIndicator }}</span>
                                @else
                                    <div class="text-base font-bold text-gray-900">£{{ $propertyPrice->fixed_price }}</div>
                                    <span class="text-xs text-gray-500">{{ $propertyPriceIndicator }}</span>
                                @endif
                            </div>
                        @elseif($roomPrice)
                            <div class="mb-2">
                                @if($roomPrice->discount_price)
                                    <div class="flex items-baseline gap-1">
                                        <span class="text-xs text-gray-400 line-through">£{{ $roomPrice->fixed_price }}</span>
                                        <span class="text-base font-bold text-gray-900">£{{ $roomPrice->discount_price }}</span>
                                    </div>
                                    <span class="text-xs text-gray-500">{{ $roomPriceIndicator }}</span>
                                @else
                                    <div class="text-base font-bold text-gray-900">£{{ $roomPrice->fixed_price }}</div>
                                    <span class="text-xs text-gray-500">{{ $roomPriceIndicator }}</span>
                                @endif
                            </div>
                        @endif

                        {{-- Features --}}
                        <div class="flex items-center gap-3 text-xs text-gray-600 pt-2 border-t border-gray-100">
                            @if (!$propertyPrice)
                                <span class="flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                    </svg>
                                    {{ $package->rooms->count() }}
                                </span>
                            @else
                                <span class="flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                    </svg>
                                    {{ $package->number_of_rooms }}
                                </span>
                            @endif
                            <span class="flex items-center gap-1">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
                                </svg>
                                {{ $package->common_bathrooms }}
                            </span>
                            <span class="flex items-center gap-1">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                {{ $package->seating }}
                            </span>
                        </div>
                    </div>
                </a>
                @endforeach
            </div>
        </div>
    </section>

    {{-- Additional Home Content --}}
    @livewire('user.home-data-user')
</div>

<script>
    function scrollToFilterPackage() {
        const element = document.getElementById('filterPackage');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
</script>
