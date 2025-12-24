<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Models\Area;
use App\Models\Booking;
use App\Models\City;
use App\Models\Country;
use App\Models\Maintain;
use App\Models\Package;
use App\Models\Property;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PackageController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name');
        $isSuperAdmin = $userRoles->contains('Super Admin');
        $isAdmin = $userRoles->contains('Admin');
        $isPartner = $userRoles->contains('Partner');

        $query = Package::with(['creator', 'assignedPartner', 'assignedAdmin', 'assignedBy', 'franchise', 'country', 'city', 'area', 'property'])
            ->when($isPartner, function ($q) use ($user) {
                // Partner can only see packages where they are assigned AND admin is also assigned
                $q->where('assigned_to', $user->id)
                  ->whereNotNull('admin_id');
            })
            ->when($isAdmin && !$isSuperAdmin, function ($q) use ($user) {
                // Admin (Franchise) can see packages they created OR packages in their franchise OR packages where they are assigned as admin
                $q->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->orWhere('franchise_id', $user->id)
                          ->orWhere('assigned_by', $user->id)
                          ->orWhere('admin_id', $user->id);
                });
            });
            // Super Admin sees everything - no filter needed

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'expired') {
                $query->where('expiration_date', '<', now());
            } elseif ($request->status === 'active') {
                $query->where('expiration_date', '>=', now());
            }
        }

        $packages = $query->latest()->get()->map(function ($package) {
            $package->is_expired = $package->expiration_date < now();

            // Load bookings with user information
            $bookingsData = Booking::where('package_id', $package->id)
                ->with('user')
                ->whereIn('payment_status', ['pending', 'partially_paid', 'paid'])
                ->latest()
                ->get();

            $package->bookings_data = $bookingsData;
            $package->current_bookings = $bookingsData->count();

            // Explicitly load assignedPartner if assigned_to exists
            if ($package->assigned_to && !$package->relationLoaded('assignedPartner')) {
                $package->load('assignedPartner');
            }

            return $package;
        });

        // Fetch both Partners and Admins for assignment
        $availablePartners = User::role('Partner')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ];
        });

        $availableAdmins = User::role('Admin')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ];
        });

        return Inertia::render('Admin/Package/Index', [
            'packages' => $packages->map(function ($pkg) {
                return [
                    'id' => $pkg->id,
                    'name' => $pkg->name,
                    'address' => $pkg->address,
                    'expiration_date' => $pkg->expiration_date,
                    'number_of_rooms' => $pkg->number_of_rooms,
                    'assigned_to' => $pkg->assigned_to,
                    'admin_id' => $pkg->admin_id,
                    'is_expired' => $pkg->is_expired,
                    'current_bookings' => $pkg->current_bookings,
                    'bookings' => $pkg->bookings_data->map(function ($booking) {
                        return [
                            'id' => $booking->id,
                            'user' => $booking->user ? [
                                'id' => $booking->user->id,
                                'name' => $booking->user->name,
                                'email' => $booking->user->email,
                            ] : null,
                            'total_amount' => $booking->total_amount,
                            'payment_status' => $booking->payment_status,
                            'from_date' => $booking->from_date,
                            'to_date' => $booking->to_date,
                        ];
                    }),
                    'creator' => $pkg->creator ? [
                        'id' => $pkg->creator->id,
                        'name' => $pkg->creator->name,
                        'email' => $pkg->creator->email,
                    ] : null,
                    'assignedPartner' => $pkg->assignedPartner ? [
                        'id' => $pkg->assignedPartner->id,
                        'name' => $pkg->assignedPartner->name,
                        'email' => $pkg->assignedPartner->email,
                    ] : null,
                    'assignedAdmin' => $pkg->assignedAdmin ? [
                        'id' => $pkg->assignedAdmin->id,
                        'name' => $pkg->assignedAdmin->name,
                        'email' => $pkg->assignedAdmin->email,
                    ] : null,
                    'assignedBy' => $pkg->assignedBy ? [
                        'id' => $pkg->assignedBy->id,
                        'name' => $pkg->assignedBy->name,
                    ] : null,
                    'franchise' => $pkg->franchise ? [
                        'id' => $pkg->franchise->id,
                        'name' => $pkg->franchise->name,
                    ] : null,
                ];
            })->values(),
            'availablePartners' => $availablePartners,
            'availableAdmins' => $availableAdmins,
            'userRole' => [
                'isPartner' => $isPartner,
                'isAdmin' => $isAdmin,
                'isSuperAdmin' => $isSuperAdmin,
            ],
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
        ]);
    }

    public function show(Package $package)
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name');
        $isPartner = $userRoles->contains('Partner');
        $isAdmin = $userRoles->contains('Admin');
        $isSuperAdmin = $userRoles->contains('Super Admin');

        $package->load([
            'creator',
            'assignedPartner',
            'assignedAdmin',
            'assignedBy',
            'franchise',
            'country',
            'city',
            'area',
            'property',
            'packageMaintains.maintain',
            'packageAmenities.amenity',
            'photos',
            'rooms.prices',
            'instructions' => function ($query) {
                $query->orderBy('order');
            }
        ]);

        // Load bookings with user information
        $bookings = Booking::where('package_id', $package->id)
            ->with(['user', 'bookingRoomPrices.room'])
            ->latest()
            ->get();

        return Inertia::render('Admin/Package/Show', [
            'package' => [
                'id' => $package->id,
                'name' => $package->name,
                'address' => $package->address,
                'map_link' => $package->map_link,
                'video_link' => $package->video_link,
                'details' => $package->details,
                'expiration_date' => $package->expiration_date,
                'number_of_kitchens' => $package->number_of_kitchens,
                'number_of_rooms' => $package->number_of_rooms,
                'common_bathrooms' => $package->common_bathrooms,
                'seating' => $package->seating,
                'creator' => $package->creator ? [
                    'id' => $package->creator->id,
                    'name' => $package->creator->name,
                    'email' => $package->creator->email,
                ] : null,
                'assignedPartner' => $package->assignedPartner ? [
                    'id' => $package->assignedPartner->id,
                    'name' => $package->assignedPartner->name,
                    'email' => $package->assignedPartner->email,
                ] : null,
                'assignedBy' => $package->assignedBy ? [
                    'id' => $package->assignedBy->id,
                    'name' => $package->assignedBy->name,
                ] : null,
                'country' => $package->country ? [
                    'id' => $package->country->id,
                    'name' => $package->country->name,
                ] : null,
                'city' => $package->city ? [
                    'id' => $package->city->id,
                    'name' => $package->city->name,
                ] : null,
                'area' => $package->area ? [
                    'id' => $package->area->id,
                    'name' => $package->area->name,
                ] : null,
                'property' => $package->property ? [
                    'id' => $package->property->id,
                    'name' => $package->property->name,
                ] : null,
                'rooms' => $package->rooms->map(function ($room) {
                    return [
                        'id' => $room->id,
                        'name' => $room->name,
                        'number_of_beds' => $room->number_of_beds,
                        'number_of_bathrooms' => $room->number_of_bathrooms,
                        'prices' => $room->prices->map(function ($price) {
                            return [
                                'id' => $price->id,
                                'type' => $price->type,
                                'fixed_price' => $price->fixed_price,
                                'discount_price' => $price->discount_price,
                                'booking_price' => $price->booking_price,
                                'rent_advance_price' => $price->rent_advance_price,
                            ];
                        }),
                    ];
                }),
                'packageAmenities' => $package->packageAmenities->map(function ($pa) {
                    return [
                        'id' => $pa->id,
                        'is_paid' => $pa->is_paid,
                        'price' => $pa->price,
                        'amenity' => $pa->amenity ? [
                            'id' => $pa->amenity->id,
                            'name' => $pa->amenity->name,
                        ] : null,
                    ];
                }),
                'packageMaintains' => $package->packageMaintains->map(function ($pm) {
                    return [
                        'id' => $pm->id,
                        'is_paid' => $pm->is_paid,
                        'price' => $pm->price,
                        'maintain' => $pm->maintain ? [
                            'id' => $pm->maintain->id,
                            'name' => $pm->maintain->name,
                        ] : null,
                    ];
                }),
                'instructions' => $package->instructions->map(function ($inst) {
                    return [
                        'id' => $inst->id,
                        'title' => $inst->title,
                        'description' => $inst->description,
                        'order' => $inst->order,
                    ];
                }),
                'photos' => $package->photos->map(function ($photo) {
                    return [
                        'id' => $photo->id,
                        'photo_path' => $photo->photo_path,
                    ];
                }),
            ],
            'bookings' => $bookings->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'from_date' => $booking->from_date,
                    'to_date' => $booking->to_date,
                    'price' => $booking->price,
                    'booking_price' => $booking->booking_price,
                    'total_amount' => $booking->total_amount,
                    'number_of_days' => $booking->number_of_days,
                    'price_type' => $booking->price_type,
                    'auto_renewal' => $booking->auto_renewal,
                    'payment_status' => $booking->payment_status,
                    'status' => $booking->status,
                    'user' => $booking->user ? [
                        'id' => $booking->user->id,
                        'name' => $booking->user->name,
                        'email' => $booking->user->email,
                    ] : null,
                    'bookingRoomPrices' => $booking->bookingRoomPrices->map(function ($brp) {
                        return [
                            'id' => $brp->id,
                            'price' => $brp->price,
                            'room' => $brp->room ? [
                                'id' => $brp->room->id,
                                'name' => $brp->room->name,
                            ] : null,
                        ];
                    }),
                ];
            }),
            'userRole' => [
                'isPartner' => $isPartner,
                'isAdmin' => $isAdmin,
                'isSuperAdmin' => $isSuperAdmin,
            ],
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name');
        $isSuperAdmin = $userRoles->contains('Super Admin');
        $isAdmin = $userRoles->contains('Admin');
        $isPartner = $userRoles->contains('Partner');

        // Check if user is Admin or Super Admin
        $canAccessAll = $isSuperAdmin || $isAdmin;

        // Partners cannot create packages
        if ($isPartner) {
            return redirect()->route('admin.packages.index')
                ->with('error', 'Partners do not have permission to create packages.');
        }

        $documentError = null;
        $missingDocuments = [];
        $expiredDocuments = [];

        // Check Partner documents if user is Partner
        if ($isPartner) {
            $partnerDocuments = $user->partnerDocuments;
            $today = now()->toDateString();

            // Check HMO Licence
            if (!$partnerDocuments || !$partnerDocuments->hmo_licence) {
                $missingDocuments[] = 'HMO Licence';
            } elseif ($partnerDocuments->hmo_licence_expiry && $partnerDocuments->hmo_licence_expiry < $today) {
                $expiredDocuments[] = 'HMO Licence (Expired: ' . $partnerDocuments->hmo_licence_expiry . ')';
            }

            // Check Gas Certificate
            if (!$partnerDocuments || !$partnerDocuments->gas_certificate) {
                $missingDocuments[] = 'Gas Certificate';
            } elseif ($partnerDocuments->gas_certificate_expiry && $partnerDocuments->gas_certificate_expiry < $today) {
                $expiredDocuments[] = 'Gas Certificate (Expired: ' . $partnerDocuments->gas_certificate_expiry . ')';
            }

            // Check EICR Certificate
            if (!$partnerDocuments || !$partnerDocuments->eicr_certificate) {
                $missingDocuments[] = 'EICR Certificate';
            } elseif ($partnerDocuments->eicr_certificate_expiry && $partnerDocuments->eicr_certificate_expiry < $today) {
                $expiredDocuments[] = 'EICR Certificate (Expired: ' . $partnerDocuments->eicr_certificate_expiry . ')';
            }

            // Check EPC Certificate
            if (!$partnerDocuments || !$partnerDocuments->epc_certificate) {
                $missingDocuments[] = 'EPC Certificate';
            } elseif ($partnerDocuments->epc_certificate_expiry && $partnerDocuments->epc_certificate_expiry < $today) {
                $expiredDocuments[] = 'EPC Certificate (Expired: ' . $partnerDocuments->epc_certificate_expiry . ')';
            }

            // Check Smoke & Fire Certificate
            if (!$partnerDocuments || !$partnerDocuments->smoke_fire_certificate) {
                $missingDocuments[] = 'Smoke & Fire Certificate';
            } elseif ($partnerDocuments->smoke_fire_certificate_expiry && $partnerDocuments->smoke_fire_certificate_expiry < $today) {
                $expiredDocuments[] = 'Smoke & Fire Certificate (Expired: ' . $partnerDocuments->smoke_fire_certificate_expiry . ')';
            }

            // Build error message if there are issues
            if (!empty($missingDocuments) || !empty($expiredDocuments)) {
                $documentError = 'You must upload all required valid certificates before creating a package.';

                if (!empty($missingDocuments)) {
                    $documentError .= ' Missing: ' . implode(', ', $missingDocuments) . '.';
                }

                if (!empty($expiredDocuments)) {
                    $documentError .= ' Expired: ' . implode(', ', $expiredDocuments) . '.';
                }
            }
        }

        return Inertia::render('Admin/Package/Create', [
            'countries' => Country::all(),
            'cities' => City::all(),
            'areas' => Area::all(),
            'properties' => $canAccessAll ? Property::all() : Property::where('user_id', $user->id)->get(),
            'maintains' => $canAccessAll ? Maintain::all() : Maintain::where('user_id', $user->id)->get(),
            'amenities' => $canAccessAll ? Amenity::all() : Amenity::where('user_id', $user->id)->get(),
            'documentError' => $documentError,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'is_entire_property' => 'required|boolean',
            'country_id' => 'required|exists:countries,id',
            'city_id' => 'required|exists:cities,id',
            'area_id' => 'required|exists:areas,id',
            'property_id' => 'required|exists:properties,id',
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'map_link' => 'nullable|url|max:1000',
            'expiration_date' => 'required|date|after:today',
            'number_of_kitchens' => 'required|integer|min:0',
            'number_of_rooms' => 'required|integer|min:1',
            'common_bathrooms' => 'required|integer|min:0',
            'seating' => 'required|integer|min:0',
            'details' => 'nullable|string',
            'video_link' => 'nullable|url',
            'entire_property_prices' => 'exclude_if:is_entire_property,false|required|array|min:1',
            'entire_property_prices.*.type' => 'exclude_if:is_entire_property,false|required|in:Day,Week,Month',
            'entire_property_prices.*.fixed_price' => 'exclude_if:is_entire_property,false|required|numeric|min:0',
            'entire_property_prices.*.discount_price' => 'exclude_if:is_entire_property,false|nullable|numeric|min:0',
            'entire_property_prices.*.booking_price' => 'exclude_if:is_entire_property,false|required|numeric|min:0',
            'entire_property_prices.*.rent_advance_price' => 'exclude_if:is_entire_property,false|required|numeric|min:0',
            'rooms' => 'exclude_if:is_entire_property,true|required|array|min:1',
            'rooms.*.name' => 'exclude_if:is_entire_property,true|required|string|max:255',
            'rooms.*.number_of_beds' => 'exclude_if:is_entire_property,true|required|integer|min:1',
            'rooms.*.number_of_bathrooms' => 'exclude_if:is_entire_property,true|required|integer|min:0',
            'rooms.*.prices' => 'exclude_if:is_entire_property,true|required|array|min:1',
            'rooms.*.prices.*.type' => 'exclude_if:is_entire_property,true|required|in:Day,Week,Month',
            'rooms.*.prices.*.fixed_price' => 'exclude_if:is_entire_property,true|required|numeric|min:0',
            'rooms.*.prices.*.discount_price' => 'exclude_if:is_entire_property,true|nullable|numeric|min:0',
            'rooms.*.prices.*.booking_price' => 'exclude_if:is_entire_property,true|required|numeric|min:0',
            'rooms.*.prices.*.rent_advance_price' => 'exclude_if:is_entire_property,true|required|numeric|min:0',
            'freeMaintains' => 'nullable|array',
            'freeMaintains.*' => 'exists:maintains,id',
            'freeAmenities' => 'nullable|array',
            'freeAmenities.*' => 'exists:amenities,id',
            'paidMaintains' => 'nullable|array',
            'paidMaintains.*.maintain_id' => 'nullable|exists:maintains,id',
            'paidMaintains.*.price' => 'nullable|numeric|min:0',
            'paidAmenities' => 'nullable|array',
            'paidAmenities.*.amenity_id' => 'nullable|exists:amenities,id',
            'paidAmenities.*.price' => 'nullable|numeric|min:0',
            'instructions' => 'nullable|array',
            'instructions.*.title' => 'required|string|max:255',
            'instructions.*.description' => 'required|string',
            'instructions.*.order' => 'required|integer|min:0',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:5120',
        ]);

        // Check Partner documents before creating package
        $user = Auth::user();
        $isPartner = $user->roles->pluck('name')->contains('Partner');

        if ($isPartner) {
            $partnerDocuments = $user->partnerDocuments;
            $today = now()->toDateString();

            $missingDocuments = [];
            $expiredDocuments = [];

            // Check all required documents
            if (!$partnerDocuments || !$partnerDocuments->hmo_licence) {
                $missingDocuments[] = 'HMO Licence';
            } elseif ($partnerDocuments->hmo_licence_expiry && $partnerDocuments->hmo_licence_expiry < $today) {
                $expiredDocuments[] = 'HMO Licence';
            }

            if (!$partnerDocuments || !$partnerDocuments->gas_certificate) {
                $missingDocuments[] = 'Gas Certificate';
            } elseif ($partnerDocuments->gas_certificate_expiry && $partnerDocuments->gas_certificate_expiry < $today) {
                $expiredDocuments[] = 'Gas Certificate';
            }

            if (!$partnerDocuments || !$partnerDocuments->eicr_certificate) {
                $missingDocuments[] = 'EICR Certificate';
            } elseif ($partnerDocuments->eicr_certificate_expiry && $partnerDocuments->eicr_certificate_expiry < $today) {
                $expiredDocuments[] = 'EICR Certificate';
            }

            if (!$partnerDocuments || !$partnerDocuments->epc_certificate) {
                $missingDocuments[] = 'EPC Certificate';
            } elseif ($partnerDocuments->epc_certificate_expiry && $partnerDocuments->epc_certificate_expiry < $today) {
                $expiredDocuments[] = 'EPC Certificate';
            }

            if (!$partnerDocuments || !$partnerDocuments->smoke_fire_certificate) {
                $missingDocuments[] = 'Smoke & Fire Certificate';
            } elseif ($partnerDocuments->smoke_fire_certificate_expiry && $partnerDocuments->smoke_fire_certificate_expiry < $today) {
                $expiredDocuments[] = 'Smoke & Fire Certificate';
            }

            // If there are missing or expired documents, return error
            if (!empty($missingDocuments) || !empty($expiredDocuments)) {
                $errorMessage = 'You must upload all required valid certificates before creating a package.';

                if (!empty($missingDocuments)) {
                    $errorMessage .= ' Missing: ' . implode(', ', $missingDocuments) . '.';
                }

                if (!empty($expiredDocuments)) {
                    $errorMessage .= ' Expired: ' . implode(', ', $expiredDocuments) . '.';
                }

                return redirect()->back()->withErrors([
                    'documents' => $errorMessage . ' Please update your documents in your profile page.'
                ])->withInput();
            }
        }

        try {
            DB::beginTransaction();

            $package = Package::create([
                'country_id' => $validated['country_id'],
                'city_id' => $validated['city_id'],
                'area_id' => $validated['area_id'],
                'property_id' => $validated['property_id'],
                'name' => $validated['name'],
                'address' => $validated['address'],
                'map_link' => $validated['map_link'] ?? null,
                'number_of_kitchens' => $validated['number_of_kitchens'],
                'number_of_rooms' => $validated['number_of_rooms'],
                'common_bathrooms' => $validated['common_bathrooms'],
                'seating' => $validated['seating'],
                'details' => $validated['details'] ?? null,
                'video_link' => $validated['video_link'] ?? null,
                'expiration_date' => $validated['expiration_date'],
                'status' => strtotime($validated['expiration_date']) <= strtotime(now()) ? 'expired' : 'active',
                'user_id' => Auth::id(),
            ]);

            // Create EntireProperty record if entire property is selected
            if ($validated['is_entire_property']) {
                $entireProperty = $package->entireProperty()->create([
                    'user_id' => Auth::id(),
                ]);

                // Save entire property prices
                if (!empty($validated['entire_property_prices'])) {
                    foreach ($validated['entire_property_prices'] as $priceData) {
                        $entireProperty->roomPrices()->create([
                            'type' => $priceData['type'],
                            'fixed_price' => $priceData['fixed_price'],
                            'discount_price' => $priceData['discount_price'] ?? null,
                            'booking_price' => $priceData['booking_price'],
                            'rent_advance_price' => $priceData['rent_advance_price'] ?? 0,
                            'user_id' => Auth::id(),
                        ]);
                    }
                }
            }

            // Save rooms and prices (only if not entire property)
            if (!empty($validated['rooms'])) {
                foreach ($validated['rooms'] as $roomData) {
                $room = $package->rooms()->create([
                    'name' => $roomData['name'],
                    'number_of_beds' => $roomData['number_of_beds'],
                    'number_of_bathrooms' => $roomData['number_of_bathrooms'],
                    'user_id' => Auth::id(),
                ]);

                foreach ($roomData['prices'] as $priceData) {
                    $room->prices()->create([
                        'type' => $priceData['type'],
                        'fixed_price' => $priceData['fixed_price'],
                        'discount_price' => $priceData['discount_price'] ?? null,
                        'booking_price' => $priceData['booking_price'],
                        'rent_advance_price' => $priceData['rent_advance_price'] ?? 0,
                        'user_id' => Auth::id(),
                    ]);
                }
            }
            }

            // Save free maintains and amenities
            if (!empty($validated['freeMaintains'])) {
                foreach ($validated['freeMaintains'] as $maintainId) {
                    $package->packageMaintains()->create([
                        'maintain_id' => $maintainId,
                        'is_paid' => false,
                        'price' => 0,
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            if (!empty($validated['freeAmenities'])) {
                foreach ($validated['freeAmenities'] as $amenityId) {
                    $package->packageAmenities()->create([
                        'amenity_id' => $amenityId,
                        'is_paid' => false,
                        'price' => 0,
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            // Save paid maintains and amenities
            if (!empty($validated['paidMaintains'])) {
                foreach ($validated['paidMaintains'] as $maintainData) {
                    $package->packageMaintains()->create([
                        'maintain_id' => $maintainData['maintain_id'],
                        'is_paid' => true,
                        'price' => $maintainData['price'],
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            if (!empty($validated['paidAmenities'])) {
                foreach ($validated['paidAmenities'] as $amenityData) {
                    $package->packageAmenities()->create([
                        'amenity_id' => $amenityData['amenity_id'],
                        'is_paid' => true,
                        'price' => $amenityData['price'],
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            // Save instructions
            if (!empty($validated['instructions'])) {
                foreach ($validated['instructions'] as $instructionData) {
                    $package->instructions()->create([
                        'title' => $instructionData['title'],
                        'description' => $instructionData['description'],
                        'order' => $instructionData['order'],
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            // Save photos
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photo) {
                    $path = $photo->store('package_photos', 'public');
                    $package->photos()->create([
                        'url' => $path,
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('admin.packages.index')
                ->with('success', 'Package created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withInput()
                ->with('error', 'Error creating package: ' . $e->getMessage());
        }
    }

    public function edit(Package $package)
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name');
        $isSuperAdmin = $userRoles->contains('Super Admin');
        $isAdmin = $userRoles->contains('Admin');
        $isPartner = $userRoles->contains('Partner');

        // Check if user is Admin or Super Admin
        $canAccessAll = $isSuperAdmin || $isAdmin;

        // Partners cannot edit packages
        if ($isPartner) {
            return redirect()->route('admin.packages.index')
                ->with('error', 'Partners do not have permission to edit packages.');
        }

        $package->load([
            'packageMaintains.maintain',
            'packageAmenities.amenity',
            'entireProperty.roomPrices',
            'rooms.prices',
            'photos',
            'instructions' => function ($query) {
                $query->orderBy('order');
            }
        ]);

        // Separate maintains and amenities into free and paid
        $freeMaintains = $package->packageMaintains->where('is_paid', false)->pluck('maintain_id')->toArray();
        $freeAmenities = $package->packageAmenities->where('is_paid', false)->pluck('amenity_id')->toArray();
        $paidMaintains = $package->packageMaintains->where('is_paid', true)->map(function ($pm) {
            return ['maintain_id' => $pm->maintain_id, 'price' => $pm->price];
        })->toArray();
        $paidAmenities = $package->packageAmenities->where('is_paid', true)->map(function ($pa) {
            return ['amenity_id' => $pa->amenity_id, 'price' => $pa->price];
        })->toArray();

        // Get entire property prices if exists
        $entirePropertyPrices = [];
        if ($package->entireProperty && $package->entireProperty->roomPrices) {
            $entirePropertyPrices = $package->entireProperty->roomPrices->map(function ($price) {
                return [
                    'id' => $price->id,
                    'type' => $price->type,
                    'fixed_price' => $price->fixed_price,
                    'discount_price' => $price->discount_price,
                    'booking_price' => $price->booking_price,
                ];
            })->toArray();
        }

        return Inertia::render('Admin/Package/Edit', [
            'package' => $package,
            'isEntireProperty' => $package->entireProperty ? true : false,
            'entirePropertyPrices' => $entirePropertyPrices,
            'freeMaintains' => $freeMaintains,
            'freeAmenities' => $freeAmenities,
            'paidMaintains' => $paidMaintains,
            'paidAmenities' => $paidAmenities,
            'countries' => Country::all(),
            'cities' => City::all(),
            'areas' => Area::all(),
            'properties' => $canAccessAll ? Property::all() : Property::where('user_id', $user->id)->get(),
            'maintains' => $canAccessAll ? Maintain::all() : Maintain::where('user_id', $user->id)->get(),
            'amenities' => $canAccessAll ? Amenity::all() : Amenity::where('user_id', $user->id)->get(),
        ]);
    }

    public function update(Request $request, Package $package)
    {
        $validated = $request->validate([
            'is_entire_property' => 'required|boolean',
            'country_id' => 'required|exists:countries,id',
            'city_id' => 'required|exists:cities,id',
            'area_id' => 'required|exists:areas,id',
            'property_id' => 'required|exists:properties,id',
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'map_link' => 'nullable|url|max:1000',
            'expiration_date' => 'required|date|after_or_equal:today',
            'number_of_kitchens' => 'required|integer|min:0',
            'number_of_rooms' => 'required|integer|min:1',
            'common_bathrooms' => 'required|integer|min:0',
            'seating' => 'required|integer|min:0',
            'details' => 'nullable|string',
            'video_link' => 'nullable|url',
            'entire_property_prices' => 'exclude_if:is_entire_property,false|required|array|min:1',
            'entire_property_prices.*.id' => 'exclude_if:is_entire_property,false|nullable|exists:room_prices,id',
            'entire_property_prices.*.type' => 'exclude_if:is_entire_property,false|required|in:Day,Week,Month',
            'entire_property_prices.*.fixed_price' => 'exclude_if:is_entire_property,false|required|numeric|min:0',
            'entire_property_prices.*.discount_price' => 'exclude_if:is_entire_property,false|nullable|numeric|min:0',
            'entire_property_prices.*.booking_price' => 'exclude_if:is_entire_property,false|required|numeric|min:0',
            'entire_property_prices.*.rent_advance_price' => 'exclude_if:is_entire_property,false|required|numeric|min:0',
            'rooms' => 'exclude_if:is_entire_property,true|required|array|min:1',
            'rooms.*.id' => 'exclude_if:is_entire_property,true|nullable|exists:rooms,id',
            'rooms.*.name' => 'exclude_if:is_entire_property,true|required|string|max:255',
            'rooms.*.number_of_beds' => 'exclude_if:is_entire_property,true|required|integer|min:1',
            'rooms.*.number_of_bathrooms' => 'exclude_if:is_entire_property,true|required|integer|min:0',
            'rooms.*.prices' => 'exclude_if:is_entire_property,true|required|array|min:1',
            'rooms.*.prices.*.id' => 'exclude_if:is_entire_property,true|nullable|exists:room_prices,id',
            'rooms.*.prices.*.type' => 'exclude_if:is_entire_property,true|required|in:Day,Week,Month',
            'rooms.*.prices.*.fixed_price' => 'exclude_if:is_entire_property,true|required|numeric|min:0',
            'rooms.*.prices.*.discount_price' => 'exclude_if:is_entire_property,true|nullable|numeric|min:0',
            'rooms.*.prices.*.booking_price' => 'exclude_if:is_entire_property,true|required|numeric|min:0',
            'rooms.*.prices.*.rent_advance_price' => 'exclude_if:is_entire_property,true|required|numeric|min:0',
            'freeMaintains' => 'nullable|array',
            'freeMaintains.*' => 'exists:maintains,id',
            'freeAmenities' => 'nullable|array',
            'freeAmenities.*' => 'exists:amenities,id',
            'paidMaintains' => 'nullable|array',
            'paidMaintains.*.maintain_id' => 'nullable|exists:maintains,id',
            'paidMaintains.*.price' => 'nullable|numeric|min:0',
            'paidAmenities' => 'nullable|array',
            'paidAmenities.*.amenity_id' => 'nullable|exists:amenities,id',
            'paidAmenities.*.price' => 'nullable|numeric|min:0',
            'instructions' => 'nullable|array',
            'instructions.*.id' => 'nullable|exists:package_instructions,id',
            'instructions.*.title' => 'required|string|max:255',
            'instructions.*.description' => 'required|string',
            'instructions.*.order' => 'required|integer|min:0',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:5120',
            'deletedPhotos' => 'nullable|array',
            'deletedPhotos.*' => 'exists:package_photos,id',
        ]);

        try {
            DB::beginTransaction();

            $package->update([
                'country_id' => $validated['country_id'],
                'city_id' => $validated['city_id'],
                'area_id' => $validated['area_id'],
                'property_id' => $validated['property_id'],
                'name' => $validated['name'],
                'address' => $validated['address'],
                'map_link' => $validated['map_link'] ?? null,
                'number_of_kitchens' => $validated['number_of_kitchens'],
                'number_of_rooms' => $validated['number_of_rooms'],
                'common_bathrooms' => $validated['common_bathrooms'],
                'seating' => $validated['seating'],
                'details' => $validated['details'] ?? null,
                'video_link' => $validated['video_link'] ?? null,
                'expiration_date' => $validated['expiration_date'],
                'status' => strtotime($validated['expiration_date']) <= strtotime(now()) ? 'expired' : 'active',
            ]);

            // Handle Entire Property
            if ($validated['is_entire_property']) {
                // Create EntireProperty if doesn't exist
                if (!$package->entireProperty) {
                    $entireProperty = $package->entireProperty()->create([
                        'user_id' => Auth::id(),
                    ]);
                } else {
                    $entireProperty = $package->entireProperty;
                }

                // Update entire property prices
                $existingPriceIds = [];
                if (!empty($validated['entire_property_prices'])) {
                    foreach ($validated['entire_property_prices'] as $priceData) {
                        if (!empty($priceData['id'])) {
                            // Update existing price
                            $price = $entireProperty->roomPrices()->find($priceData['id']);
                            if ($price) {
                                $price->update([
                                    'type' => $priceData['type'],
                                    'fixed_price' => $priceData['fixed_price'],
                                    'discount_price' => $priceData['discount_price'] ?? null,
                                    'booking_price' => $priceData['booking_price'],
                                    'rent_advance_price' => $priceData['rent_advance_price'] ?? 0,
                                ]);
                                $existingPriceIds[] = $price->id;
                            }
                        } else {
                            // Create new price
                            $price = $entireProperty->roomPrices()->create([
                                'type' => $priceData['type'],
                                'fixed_price' => $priceData['fixed_price'],
                                'discount_price' => $priceData['discount_price'] ?? null,
                                'booking_price' => $priceData['booking_price'],
                                'rent_advance_price' => $priceData['rent_advance_price'] ?? 0,
                                'user_id' => Auth::id(),
                            ]);
                            $existingPriceIds[] = $price->id;
                        }
                    }
                }

                // Delete removed prices
                $entireProperty->roomPrices()->whereNotIn('id', $existingPriceIds)->delete();

                // Delete all rooms when switching to entire property
                $package->rooms()->delete();
            } else {
                // Delete EntireProperty if switching to room-wise
                if ($package->entireProperty) {
                    $package->entireProperty()->delete();
                }
            }

            // Update rooms and prices (only if not entire property)
            $existingRoomIds = [];
            if (!$validated['is_entire_property'] && !empty($validated['rooms'])) {
            foreach ($validated['rooms'] as $roomData) {
                if (!empty($roomData['id'])) {
                    // Update existing room
                    $room = Room::find($roomData['id']);
                    $room->update([
                        'name' => $roomData['name'],
                        'number_of_beds' => $roomData['number_of_beds'],
                        'number_of_bathrooms' => $roomData['number_of_bathrooms'],
                    ]);
                    $existingRoomIds[] = $room->id;
                } else {
                    // Create new room
                    $room = $package->rooms()->create([
                        'name' => $roomData['name'],
                        'number_of_beds' => $roomData['number_of_beds'],
                        'number_of_bathrooms' => $roomData['number_of_bathrooms'],
                        'user_id' => Auth::id(),
                    ]);
                    $existingRoomIds[] = $room->id;
                }

                // Update room prices
                $existingPriceIds = [];
                foreach ($roomData['prices'] as $priceData) {
                    if (!empty($priceData['id'])) {
                        // Update existing price
                        $price = $room->prices()->find($priceData['id']);
                        $price->update([
                            'type' => $priceData['type'],
                            'fixed_price' => $priceData['fixed_price'],
                            'discount_price' => $priceData['discount_price'] ?? null,
                            'booking_price' => $priceData['booking_price'],
                            'rent_advance_price' => $priceData['rent_advance_price'] ?? 0,
                        ]);
                        $existingPriceIds[] = $price->id;
                    } else {
                        // Create new price
                        $price = $room->prices()->create([
                            'type' => $priceData['type'],
                            'fixed_price' => $priceData['fixed_price'],
                            'discount_price' => $priceData['discount_price'] ?? null,
                            'booking_price' => $priceData['booking_price'],
                            'rent_advance_price' => $priceData['rent_advance_price'] ?? 0,
                            'user_id' => Auth::id(),
                        ]);
                        $existingPriceIds[] = $price->id;
                    }
                }

                // Delete removed prices
                $room->prices()->whereNotIn('id', $existingPriceIds)->delete();
            }

                // Delete removed rooms
                $package->rooms()->whereNotIn('id', $existingRoomIds)->delete();
            }

            // Update maintains and amenities
            $package->packageMaintains()->delete();
            $package->packageAmenities()->delete();

            // Save free maintains and amenities
            if (!empty($validated['freeMaintains'])) {
                foreach ($validated['freeMaintains'] as $maintainId) {
                    $package->packageMaintains()->create([
                        'maintain_id' => $maintainId,
                        'is_paid' => false,
                        'price' => 0,
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            if (!empty($validated['freeAmenities'])) {
                foreach ($validated['freeAmenities'] as $amenityId) {
                    $package->packageAmenities()->create([
                        'amenity_id' => $amenityId,
                        'is_paid' => false,
                        'price' => 0,
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            // Save paid maintains and amenities
            if (!empty($validated['paidMaintains'])) {
                foreach ($validated['paidMaintains'] as $maintainData) {
                    $package->packageMaintains()->create([
                        'maintain_id' => $maintainData['maintain_id'],
                        'is_paid' => true,
                        'price' => $maintainData['price'],
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            if (!empty($validated['paidAmenities'])) {
                foreach ($validated['paidAmenities'] as $amenityData) {
                    $package->packageAmenities()->create([
                        'amenity_id' => $amenityData['amenity_id'],
                        'is_paid' => true,
                        'price' => $amenityData['price'],
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            // Update instructions
            $existingInstructionIds = [];
            if (!empty($validated['instructions'])) {
                foreach ($validated['instructions'] as $instructionData) {
                    if (!empty($instructionData['id'])) {
                        // Update existing instruction
                        $instruction = $package->instructions()->find($instructionData['id']);
                        $instruction->update([
                            'title' => $instructionData['title'],
                            'description' => $instructionData['description'],
                            'order' => $instructionData['order'],
                        ]);
                        $existingInstructionIds[] = $instruction->id;
                    } else {
                        // Create new instruction
                        $instruction = $package->instructions()->create([
                            'title' => $instructionData['title'],
                            'description' => $instructionData['description'],
                            'order' => $instructionData['order'],
                            'user_id' => Auth::id(),
                        ]);
                        $existingInstructionIds[] = $instruction->id;
                    }
                }
            }

            // Delete removed instructions
            $package->instructions()->whereNotIn('id', $existingInstructionIds)->delete();

            // Delete photos if requested
            if (!empty($validated['deletedPhotos'])) {
                foreach ($validated['deletedPhotos'] as $photoId) {
                    $photo = $package->photos()->find($photoId);
                    if ($photo) {
                        Storage::disk('public')->delete($photo->url);
                        $photo->delete();
                    }
                }
            }

            // Save new photos
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photo) {
                    $path = $photo->store('package_photos', 'public');
                    $package->photos()->create([
                        'url' => $path,
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('admin.packages.index')
                ->with('success', 'Package updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withInput()
                ->with('error', 'Error updating package: ' . $e->getMessage());
        }
    }

    public function destroy(Package $package)
    {
        $user = Auth::user();
        $isPartner = $user->roles->pluck('name')->contains('Partner');

        // Partners cannot delete packages
        if ($isPartner) {
            return redirect()->route('admin.packages.index')
                ->with('error', 'Partners do not have permission to delete packages.');
        }

        try {
            // Delete associated photos
            foreach ($package->photos as $photo) {
                Storage::disk('public')->delete($photo->url);
            }

            $package->delete();

            return redirect()->route('admin.packages.index')
                ->with('success', 'Package deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Error deleting package: ' . $e->getMessage());
        }
    }

    public function assign(Request $request, Package $package)
    {
        $validated = $request->validate([
            'partner_id' => 'nullable|exists:users,id',
            'admin_id' => 'nullable|exists:users,id',
        ]);

        $user = Auth::user();
        $userRoles = $user->roles->pluck('name');
        $isSuperAdmin = $userRoles->contains('Super Admin');
        $isAdmin = $userRoles->contains('Admin');
        $isPartner = $userRoles->contains('Partner');

        // Check if user has permission to assign packages
        if (!$isSuperAdmin && !$isAdmin) {
            return redirect()->back()->with('error', 'You do not have permission to assign packages.');
        }

        // Determine franchise_id based on who is assigning
        $franchiseId = null;
        if ($isAdmin && !$isSuperAdmin) {
            // If Admin (Franchise) is assigning, set franchise_id to their user_id
            $franchiseId = $user->id;
        } elseif ($isSuperAdmin) {
            // If Super Admin is assigning, keep existing franchise_id or set to null
            $franchiseId = $package->franchise_id;
        }

        $package->update([
            'assigned_to' => $validated['partner_id'] ?? null,
            'admin_id' => $validated['admin_id'] ?? null,
            'assigned_by' => Auth::id(),
            'franchise_id' => $franchiseId,
            'assigned_at' => now(),
        ]);

        // Refresh package with relationships
        $package->load(['creator', 'assignedPartner', 'assignedAdmin', 'assignedBy', 'franchise']);

        return redirect()->back()->with('success', 'Package assigned successfully.');
    }

    public function getCitiesByCountry(Request $request)
    {
        $cities = City::where('country_id', $request->country_id)->get();
        return response()->json($cities);
    }

    public function getAreasByCity(Request $request)
    {
        $areas = Area::where('city_id', $request->city_id)->get();
        return response()->json($areas);
    }

    public function getPropertiesByArea(Request $request)
    {
        $properties = Property::where('area_id', $request->area_id)->get();
        return response()->json($properties);
    }

    public function updateDocuments(Request $request, Package $package)
    {
        $validated = $request->validate([
            'document_types' => 'required|array',
            'documents' => 'required|array',
            'documents.*' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048',
        ]);

        foreach ($validated['document_types'] as $index => $type) {
            if ($request->hasFile("documents.{$type}")) {
                $file = $request->file("documents.{$type}");
                $path = $file->store('package_documents', 'public');

                // Check if document already exists
                $document = $package->documents()->where('type', $type)->first();

                if ($document) {
                    // Delete old file
                    if ($document->path && Storage::disk('public')->exists($document->path)) {
                        Storage::disk('public')->delete($document->path);
                    }
                    // Update with new file
                    $document->update(['path' => $path, 'updated_at' => now()]);
                } else {
                    // Create new document
                    $package->documents()->create([
                        'type' => $type,
                        'path' => $path,
                        'expires_at' => now()->addYear(), // Default 1 year expiry
                    ]);
                }
            }
        }

        return redirect()->back()->with('success', 'Package documents updated successfully.');
    }
}
