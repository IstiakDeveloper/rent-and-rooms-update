<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PartnerDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        // Partner Documents
        'photo_id',
        'photo_id_expiry',
        'authorised_letter',
        'authorised_letter_expiry',
        'management_agreement',
        'management_agreement_expiry',
        'management_maintain_agreement',
        'management_maintain_agreement_expiry',
        'franchise_agreement',
        'franchise_agreement_expiry',
        'investor_agreement',
        'investor_agreement_expiry',
        // Package Documents
        'hmo_licence',
        'hmo_licence_expiry',
        'gas_certificate',
        'gas_certificate_expiry',
        'eicr_certificate',
        'eicr_certificate_expiry',
        'epc_certificate',
        'epc_certificate_expiry',
        'smoke_fire_certificate',
        'smoke_fire_certificate_expiry',
        'building_insurance',
        'building_insurance_expiry',
        'maintain_report',
        'maintain_report_expiry',
        'package_floor_plan',
        'package_floor_plan_expiry',
    ];

    protected $casts = [
        // Partner Documents
        'photo_id_expiry' => 'datetime:Y-m-d',
        'authorised_letter_expiry' => 'datetime:Y-m-d',
        'management_agreement_expiry' => 'datetime:Y-m-d',
        'management_maintain_agreement_expiry' => 'datetime:Y-m-d',
        'franchise_agreement_expiry' => 'datetime:Y-m-d',
        'investor_agreement_expiry' => 'datetime:Y-m-d',
        // Package Documents
        'hmo_licence_expiry' => 'datetime:Y-m-d',
        'gas_certificate_expiry' => 'datetime:Y-m-d',
        'eicr_certificate_expiry' => 'datetime:Y-m-d',
        'epc_certificate_expiry' => 'datetime:Y-m-d',
        'smoke_fire_certificate_expiry' => 'datetime:Y-m-d',
        'building_insurance_expiry' => 'datetime:Y-m-d',
        'maintain_report_expiry' => 'datetime:Y-m-d',
        'package_floor_plan_expiry' => 'datetime:Y-m-d',
    ];

    protected $appends = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
