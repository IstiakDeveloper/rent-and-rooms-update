<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Package extends Model
{
    use HasFactory;
    protected $fillable = [
        'country_id',
        'user_id',
        'city_id',
        'area_id',
        'property_id',
        'name',
        'address',
        'map_link',
        'number_of_rooms',
        'number_of_kitchens',
        'seating',
        'details',
        'video_link',
        'common_bathrooms',
        'assigned_to',
        'admin_id',
        'assigned_by',
        'franchise_id',
        'assigned_at',
        'expiration_date',
        'status',
    ];

    /**
     * The attributes that should be guarded from mass assignment.
     *
     * @var array<int, string>
     */
    protected $guarded = [];

    protected $dates = ['assigned_at', 'expiration_date'];

    protected $casts = [
        'assigned_at' => 'datetime',
        'expiration_date' => 'date',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['slug'];

    /**
     * The relationships that should always be loaded.
     *
     * @var array
     */
    protected $with = [];


    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    public function maintains(): BelongsToMany
    {
        return $this->belongsToMany(Maintain::class, 'package_maintains')
            ->withPivot('is_paid', 'price');
    }

    public function packageMaintains()
    {
        return $this->hasMany(PackageMaintain::class);
    }

    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class, 'package_amenities')
            ->withPivot('is_paid', 'price');
    }

    public function packageAmenities()
    {
        return $this->hasMany(PackageAmenity::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function photos()
    {
        return $this->hasMany(Photo::class);
    }

    public function entireProperty()
    {
        return $this->hasOne(EntireProperty::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function userDetails()
    {
        return $this->hasMany(UserDetail::class);
    }

    public function users()
    {
        return $this->hasManyThrough(User::class, UserDetail::class, 'package_id', 'id', 'id', 'user_id');
    }


    public function instructions()
    {
        return $this->hasMany(PackageInstruction::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignedPartner()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignedAdmin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function franchise()
    {
        return $this->belongsTo(User::class, 'franchise_id');
    }

    public function getSlugAttribute()
    {
        return str_replace(' ', '-', strtolower($this->name));
    }

    public function getShowUrl()
    {
        // Check for assigned partner first
        if ($this->assignedPartner) {
            $partnerSlug = str_replace(' ', '-', strtolower($this->assignedPartner->name));
        }
        // If not assigned, use the creator's name
        elseif ($this->creator) {
            $partnerSlug = str_replace(' ', '-', strtolower($this->creator->name));
        }
        // If neither exists (shouldn't happen, but just in case)
        else {
            return '#';
        }

        // Include ID in the package slug for better identification
        $packageSlug = $this->id . '-' . str_replace(' ', '-', strtolower($this->name));

        return route('properties.show', [
            'partnerSlug' => $partnerSlug,
            'packageSlug' => $packageSlug
        ]);
    }

    public function documents()
    {
        return $this->hasMany(PackageDocument::class);
    }

    public function partnerDocumentItems()
    {
        return $this->hasMany(PartnerDocumentItem::class);
    }
}
