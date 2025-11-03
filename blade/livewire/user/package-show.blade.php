<div class="min-h-screen bg-gray-50">
    {{-- Back Button --}}
    <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button onclick="window.history.back()"
                    class="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back
            </button>
        </div>
    </div>

    {{-- Image Gallery --}}
    <section class="bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            @if($package->photos && $package->photos->count() > 0)
                <div class="relative rounded-lg overflow-hidden bg-gray-200" style="height: 500px;">
                    <img id="mainImage"
                         src="{{ asset('storage/' . $package->photos[0]->url) }}"
                         alt="{{ $package->name }}"
                         class="w-full h-full object-cover cursor-pointer transition-opacity duration-300"
                         onclick="openLightbox()">

                    {{-- Navigation Controls --}}
                    <div class="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                        <button onclick="previousImage()"
                                class="pointer-events-auto bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-transform hover:scale-110">
                            <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <button onclick="nextImage()"
                                class="pointer-events-auto bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-transform hover:scale-110">
                            <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>

                    {{-- Image Counter --}}
                    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                        <span id="imageCounter" class="inline-block bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full">
                            1 / {{ $package->photos->count() }}
                        </span>
                    </div>
                </div>

                {{-- Lightbox --}}
                <div id="lightbox" class="hidden fixed inset-0 bg-black bg-opacity-90 z-50 items-center justify-center">
                    <div class="relative max-w-7xl max-h-screen p-4">
                        <img id="lightboxImage" src="" alt="" class="max-w-full max-h-screen object-contain">
                        <button onclick="closeLightbox()"
                                class="absolute top-4 right-4 text-white hover:text-gray-300">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <script>
                    const images = @json($package->photos->map(fn($photo) => asset('storage/' . $photo->url)));
                    let currentIndex = 0;

                    function updateImage() {
                        document.getElementById('mainImage').src = images[currentIndex];
                        document.getElementById('imageCounter').textContent = `${currentIndex + 1} / ${images.length}`;
                        document.getElementById('mainImage').style.opacity = '0';
                        setTimeout(() => document.getElementById('mainImage').style.opacity = '1', 50);
                    }

                    function previousImage() {
                        currentIndex = (currentIndex - 1 + images.length) % images.length;
                        updateImage();
                    }

                    function nextImage() {
                        currentIndex = (currentIndex + 1) % images.length;
                        updateImage();
                    }

                    function openLightbox() {
                        document.getElementById('lightbox').classList.remove('hidden');
                        document.getElementById('lightbox').classList.add('flex');
                        document.getElementById('lightboxImage').src = images[currentIndex];
                        document.body.style.overflow = 'hidden';
                    }

                    function closeLightbox() {
                        document.getElementById('lightbox').classList.add('hidden');
                        document.getElementById('lightbox').classList.remove('flex');
                        document.body.style.overflow = '';
                    }

                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'ArrowLeft') previousImage();
                        if (e.key === 'ArrowRight') nextImage();
                        if (e.key === 'Escape') closeLightbox();
                    });
                </script>
            @endif
        </div>
    </section>

    {{-- Video Section --}}
    @php
        $videoUrl = $package->video_link;
        $videoId = null;
        if (preg_match('/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i', $videoUrl, $matches)) {
            $videoId = $matches[1];
        }
    @endphp

    @if($videoId)
        <section class="bg-white py-6">
            <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="relative" style="padding-bottom: 56.25%;">
                    <iframe src="https://www.youtube.com/embed/{{ $videoId }}"
                            class="absolute inset-0 w-full h-full rounded-lg"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen>
                    </iframe>
                </div>
            </div>
        </section>
    @endif

    {{-- Main Content --}}
    <section class="py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {{-- Left Column - Property Details --}}
                <div class="lg:col-span-2 space-y-6">
                    {{-- Property Header --}}
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div class="flex-1">
                                <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ $package->name }}</h1>
                                <div class="flex items-start gap-2 text-sm text-gray-600">
                                    <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    <span>{{ $package->address }}</span>
                                </div>
                                @if($package->map_link)
                                    <a href="{{ $package->map_link }}" target="_blank"
                                       class="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2">
                                        View on Map
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                        </svg>
                                    </a>
                                @endif
                            </div>

                            {{-- Price Display --}}
                            <div class="flex-shrink-0">
                                @php
                                    $roomPrices = $package->rooms->flatMap(fn($room) =>
                                        $room->roomPrices->map(function($price) use ($room) {
                                            $price->room_name = $room->name;
                                            return $price;
                                        })
                                    );
                                    $firstPrice = $roomPrices->first();
                                @endphp

                                @if($firstPrice)
                                    <div class="text-right">
                                        <div class="text-2xl font-bold text-gray-900">
                                            @if($firstPrice->discount_price)
                                                £{{ number_format($firstPrice->discount_price, 2) }}
                                            @else
                                                £{{ number_format($firstPrice->fixed_price, 2) }}
                                            @endif
                                        </div>
                                        <div class="text-xs text-gray-600">
                                            per {{ strtolower($firstPrice->type) }}
                                        </div>
                                        @if($firstPrice->discount_price)
                                            <div class="text-xs text-gray-400 line-through">
                                                £{{ number_format($firstPrice->fixed_price, 2) }}
                                            </div>
                                        @endif
                                    </div>
                                @endif
                            </div>
                        </div>

                        {{-- Partner Info --}}
                        @if($package->assignedPartner)
                            <div class="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
                                    @if($package->assignedPartner->profile_photo_path)
                                        <img src="{{ Storage::url($package->assignedPartner->profile_photo_path) }}"
                                             alt="{{ $package->assignedPartner->name }}"
                                             class="w-full h-full object-cover">
                                    @else
                                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                    @endif
                                </div>
                                <div>
                                    <div class="text-xs text-gray-500">Hosted by</div>
                                    <a href="{{ route('partner.packages', ['partnerSlug' => str_replace(' ', '-', strtolower($package->assignedPartner->name))]) }}"
                                       class="text-sm font-medium text-green-600 hover:text-green-700">
                                        {{ $package->assignedPartner->name }}
                                    </a>
                                </div>
                            </div>
                        @endif
                    </div>

                    {{-- Description --}}
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                        <div class="text-sm text-gray-600 leading-relaxed">
                            @php
                                $words = explode(' ', $package->details);
                                $limitedWords = array_slice($words, 0, 100);
                            @endphp
                            <p>
                                {{ implode(' ', $viewMore ? $words : $limitedWords) }}
                                @if(count($words) > 100)
                                    <button wire:click="toggleViewMore" class="text-blue-600 hover:text-blue-700 font-medium ml-1">
                                        {{ $viewMore ? 'Show less' : 'Show more' }}
                                    </button>
                                @endif
                            </p>
                        </div>
                    </div>

                    {{-- Property Features --}}
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Property Features</h2>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div class="flex items-center gap-2 text-sm text-gray-600">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                                <span>{{ $package->number_of_rooms }} Rooms</span>
                            </div>
                            <div class="flex items-center gap-2 text-sm text-gray-600">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
                                </svg>
                                <span>{{ $package->common_bathrooms }} Bathrooms</span>
                            </div>
                            <div class="flex items-center gap-2 text-sm text-gray-600">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span>{{ $package->number_of_kitchens }} Kitchens</span>
                            </div>
                            <div class="flex items-center gap-2 text-sm text-gray-600">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                <span>{{ $package->seating }} Seating</span>
                            </div>
                        </div>
                    </div>

                    {{-- Available Rooms --}}
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Available Rooms</h2>
                        <div class="space-y-4">
                            @foreach($package->rooms as $room)
                                <div class="border border-gray-200 rounded-lg p-4">
                                    <h3 class="font-medium text-gray-900 mb-2">{{ $room->name }}</h3>
                                    <div class="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                                        <div class="flex items-center gap-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7M3 7l9-4 9 4M5 21V10.5"></path>
                                            </svg>
                                            {{ $room->number_of_beds }} Beds
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
                                            </svg>
                                            {{ $room->number_of_bathrooms }} Bathrooms
                                        </div>
                                    </div>
                                    <div class="flex flex-wrap gap-2">
                                        @foreach($room->roomPrices->groupBy('type') as $type => $prices)
                                            @php $price = $prices->first(); @endphp
                                            <div class="text-xs bg-gray-50 px-3 py-1 rounded-full">
                                                <span class="font-medium text-gray-900">
                                                    £{{ $price->discount_price ?? $price->fixed_price }}
                                                </span>
                                                <span class="text-gray-500">/ {{ strtolower($type) }}</span>
                                            </div>
                                        @endforeach
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                </div>

                {{-- Right Column - Booking Form --}}
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Book This Property</h2>

                        <form wire:submit.prevent="submit" class="space-y-4">
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Check-in Date</label>
                                <input type="date" wire:model="fromDate"
                                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       required>
                                @error('fromDate') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                            </div>

                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Check-out Date</label>
                                <input type="date" wire:model="toDate"
                                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       required>
                                @error('toDate') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                            </div>

                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Select Room</label>
                                <select wire:model="selectedRoom"
                                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required>
                                    <option value="">Choose a room</option>
                                    @foreach($package->rooms as $room)
                                        <option value="{{ $room->id }}">{{ $room->name }}</option>
                                    @endforeach
                                </select>
                                @error('selectedRoom') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                            </div>

                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                <input type="text" wire:model="name"
                                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       required>
                                @error('name') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                            </div>

                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" wire:model="email"
                                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       required>
                                @error('email') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                            </div>

                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                <input type="tel" wire:model="phone"
                                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       required>
                                @error('phone') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                            </div>

                            @if($this->getPriceBreakdown())
                                <div class="border-t border-gray-200 pt-4 mt-4">
                                    <h3 class="text-sm font-medium text-gray-900 mb-2">Price Breakdown</h3>
                                    <div class="space-y-1 text-xs">
                                        @foreach($this->getPriceBreakdown()['breakdown'] as $item)
                                            <div class="flex justify-between text-gray-600">
                                                <span>{{ $item['description'] }}</span>
                                                <span>£{{ number_format($item['total'], 2) }}</span>
                                            </div>
                                        @endforeach
                                        <div class="flex justify-between font-semibold text-gray-900 text-sm pt-2 border-t border-gray-200">
                                            <span>Total</span>
                                            <span>£{{ number_format($this->getPriceBreakdown()['total'], 2) }}</span>
                                        </div>
                                    </div>
                                </div>
                            @endif

                            <button type="submit"
                                    class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-3 px-4 rounded-md transition duration-150">
                                Continue to Checkout
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>
