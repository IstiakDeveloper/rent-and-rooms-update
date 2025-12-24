<?php

namespace App\Models;

use App\Notifications\CustomVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;
    use HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'address',
        'status',
        'proof_type_1',
        'proof_path_1',
        'proof_type_2',
        'proof_path_2',
        'proof_type_3',
        'proof_path_3',
        'proof_type_4',
        'proof_path_4',
    ];

    /**
     * The attributes that should be guarded from mass assignment.
     *
     * @var array<int, string>
     */
    protected $guarded = [
        'password',
        'remember_token',
        'email_verified_at',
        'partner_bank_details',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function countries()
    {
        return $this->hasMany(Country::class);
    }

    public function cities()
    {
        return $this->hasMany(City::class);
    }

    public function areas()
    {
        return $this->hasMany(Area::class);
    }

    public function propertyTypes()
    {
        return $this->hasMany(PropertyType::class);
    }

    public function properties()
    {
        return $this->hasMany(Property::class);
    }

    public function maintains()
    {
        return $this->hasMany(Maintain::class);
    }

    public function amenities()
    {
        return $this->hasMany(Amenity::class);
    }

    public function packages()
    {
        return $this->hasMany(Package::class);
    }

    // Packages assigned to user as partner
    public function assignedPackages()
    {
        return $this->hasMany(Package::class, 'assigned_to');
    }

    // Packages assigned to user as admin
    public function adminPackages()
    {
        return $this->hasMany(Package::class, 'admin_id');
    }

    public function isSuperAdmin()
    {
        return $this->role === 'Super Admin';
    }
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
    public function documents()
    {
        return $this->hasMany(UserDocument::class);
    }

    // Partner personal documents (fixed fields)
    public function partnerDocuments()
    {
        return $this->hasOne(PartnerDocument::class);
    }

    // Dynamic package-specific documents (unlimited)
    public function partnerDocumentItems()
    {
        return $this->hasMany(PartnerDocumentItem::class);
    }

    public function agreementDetail()
    {
        return $this->hasOne(AgreementDetail::class);
    }
    public function bankDetail()
    {
        return $this->hasOne(BankDetail::class);
    }
    public function userDetail()
    {
        return $this->hasOne(UserDetail::class);
    }

    public function package()
    {
        return $this->hasOne(Package::class, 'user_id');
    }

    public function packagePayments()
    {
        return $this->hasMany(PackagePayment::class);
    }

    /**
     * Send the email verification notification.
     *
     * @return void
     */
    public function sendEmailVerificationNotification()
    {
        $this->notify(new CustomVerifyEmail);
    }

    /**
     * Boot method to add model event listeners
     */
    protected static function boot()
    {
        parent::boot();

        // Prevent deletion if user has bookings
        static::deleting(function ($user) {
            if ($user->bookings()->count() > 0) {
                throw new \Exception('Cannot delete user with active bookings. Please delete all bookings first.');
            }
        });
    }

}
